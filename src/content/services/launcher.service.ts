import { StorageKeys } from '../constants';
import { AppData } from '../types';
import { AppButton } from '../ui/components/AppButton';
import { CollapseButton } from '../ui/components/CollapseButton';
import { LauncherContainer } from '../ui/components/LauncherContainer';
import { Logo } from '../ui/components/Logo';
import { SyncFrame } from '../ui/components/SyncFrame';
import { AuthService } from './auth.service';
import { DOMService } from './dom.service';
import { MessagingService } from './messaging.service';

export class LauncherService {
  private static instance: LauncherService;
  private domService = DOMService.getInstance();
  private authService = AuthService.getInstance();
  private messagingService = MessagingService.getInstance();
  private apps: AppData[] = [];
  private currentHostUrl: string = window.location.href;

  // UI Components
  private container!: LauncherContainer;
  private collapseButton!: CollapseButton;
  private logo!: Logo;
  private syncFrame!: SyncFrame;
  private appButtons: Map<string, AppButton> = new Map();

  private constructor() {
    this.setupComponents();
    this.setupStorageListeners();
    this.initializeState().catch(console.error);
  }

  static getInstance(): LauncherService {
    if (!LauncherService.instance) {
      LauncherService.instance = new LauncherService();
    }
    return LauncherService.instance;
  }

  private async setupComponents(): Promise<void> {
    // Create UI components
    this.container = new LauncherContainer();
    this.collapseButton = new CollapseButton(() => this.collapse());
    this.logo = new Logo();
    this.syncFrame = new SyncFrame(this.messagingService);

    // Add components to container
    const inner = this.container.getInnerElement();
    inner.appendChild(this.collapseButton.getElement());
    inner.appendChild(this.logo.getElement());

    // Add container to document
    document.body.appendChild(this.container.getElement());

    // Set up expand click handler
    this.container.setExpandClickHandler(async () => {
      await this.authService.ensureAuthenticated();
      await this.expand();
    });
  }

  private setupStorageListeners(): void {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local') {
        // Handle app data updates
        if (changes[StorageKeys.LAUNCHER_APPS]) {
          const apps = changes[StorageKeys.LAUNCHER_APPS].newValue || [];
          this.updateApps(apps);
        }

        // Handle collapsed state changes from other contexts
        if (changes[StorageKeys.LAUNCHER_COLLAPSED]) {
          const newValue = changes[StorageKeys.LAUNCHER_COLLAPSED].newValue;
          if (newValue) {
            this.collapse();
          } else {
            this.expand();
          }
        }
      }
    });
  }

  private async initializeState(): Promise<void> {
    // Initialize sync frame if authenticated
    const token = await this.authService.getToken();
    if (token) {
      await this.syncFrame.inject(token);
    }

    // Load initial apps
    await this.loadAppsFromStorage();

    // Set initial collapsed state
    const isCollapsed = await this.isCollapsed();
    if (isCollapsed) {
      this.container.setCollapsedState(true);
      this.collapseButton.setVisibility(false);
    } else {
      this.container.setCollapsedState(false);
      this.collapseButton.setVisibility(true);
    }
  }

  private async handleAppClick(app: AppData): Promise<void> {
    try {
      const userSelection = this.domService.getSelectedContent();
      const rawHtml = document.documentElement.outerHTML;
      const fullText = document.body.innerText;

      chrome.runtime.sendMessage({
        _MindStudioEvent: '@@mindstudio/player/launch_worker',
        payload: {
          appId: app.id,
          appName: app.name,
          appIcon: app.iconUrl,
          launchVariables: {
            url: window.location.href,
            rawHtml,
            fullText,
            userSelection,
          },
        },
      });
    } catch (error) {
      console.error('Failed to launch worker:', error);
    }
  }

  private filterAppsByUrl(apps: AppData[]): AppData[] {
    return apps.filter(({ extensionSupportedSites }) => {
      if (extensionSupportedSites.length === 0 || !this.currentHostUrl) {
        return true;
      }

      for (let i = 0; i < extensionSupportedSites.length; i += 1) {
        const escapedPattern = extensionSupportedSites[i].replace(
          /[-/\\^$+?.()|[\]{}]/g,
          '\\$&',
        );

        const regexPattern = new RegExp(
          `^${escapedPattern.replace(/\*/g, '.*')}$`,
        );

        const isValid = regexPattern.test(this.currentHostUrl);
        if (!isValid) {
          return false;
        }
      }
      return true;
    });
  }

  private updateApps(apps: AppData[]): void {
    this.apps = this.filterAppsByUrl(apps);
    this.updateAppButtons();
  }

  private updateAppButtons(): void {
    const appsContainer = this.container.getAppsContainer();

    // Create a map of existing app buttons by app ID
    const existingButtons = new Map(this.appButtons);
    this.appButtons.clear();

    // Update or create app buttons
    this.apps.forEach((app) => {
      const existingButton = existingButtons.get(app.id);
      if (existingButton) {
        existingButtons.delete(app.id);
        existingButton.updateApp(app);
        this.appButtons.set(app.id, existingButton);
      } else {
        const newButton = new AppButton(app, (app) => this.handleAppClick(app));
        appsContainer.appendChild(newButton.getElement());
        this.container.addTooltip(newButton.getTooltip());
        this.appButtons.set(app.id, newButton);
      }
    });

    // Remove any remaining buttons that are no longer needed
    existingButtons.forEach((button) => {
      button.getElement().remove();
      button.getTooltip().remove();
    });
  }

  private async loadAppsFromStorage(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get(StorageKeys.LAUNCHER_APPS, (result) => {
        const apps = result[StorageKeys.LAUNCHER_APPS] || [];
        this.updateApps(apps);
        resolve();
      });
    });
  }

  private async setCollapsed(collapsed: boolean): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set(
        { [StorageKeys.LAUNCHER_COLLAPSED]: collapsed },
        () => {
          resolve();
        },
      );
    });
  }

  private async isCollapsed(): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.storage.local.get(StorageKeys.LAUNCHER_COLLAPSED, (result) => {
        resolve(result[StorageKeys.LAUNCHER_COLLAPSED] || false);
      });
    });
  }

  async collapse(): Promise<void> {
    await this.setCollapsed(true);
    this.container.setCollapsedState(true);
    this.collapseButton.setVisibility(false);
  }

  async expand(): Promise<void> {
    await this.setCollapsed(false);
    this.container.setCollapsedState(false);
    this.collapseButton.setVisibility(true);
  }

  async reinjectSyncFrame(token: string): Promise<void> {
    await this.syncFrame.reinject(token);
  }
}
