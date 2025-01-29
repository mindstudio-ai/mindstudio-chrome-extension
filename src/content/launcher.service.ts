import { auth } from '../shared/auth';
import { AppData } from '../common/types';
import { runtime } from '../shared/messaging';
import { storage } from '../shared/storage';
import { DOMService } from './dom.service';
import { AppButton } from './ui/AppButton';
import { CollapseButton } from './ui/CollapseButton';
import { LauncherContainer } from './ui/LauncherContainer';
import { Logo } from './ui/Logo';
import { SyncFrame } from './launcher/sync-frame';

export class LauncherService {
  private static instance: LauncherService;
  private domService = DOMService.getInstance();
  private apps: AppData[] = [];
  private currentHostUrl: string = window.location.href;

  // UI Components
  private container!: LauncherContainer;
  private collapseButton!: CollapseButton;
  private logo!: Logo;
  private syncFrame!: SyncFrame;
  private appButtons: Map<string, AppButton> = new Map();

  private isInitialized = false;

  static getInstance(): LauncherService {
    if (!LauncherService.instance) {
      LauncherService.instance = new LauncherService();
    }
    return LauncherService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    await this.initializeState();
  }

  private async initializeState(): Promise<void> {
    // Setup components first
    await this.setupComponents();

    // Load initial apps
    await this.loadAppsFromStorage();

    // Set up storage listeners
    storage.onChange('LAUNCHER_COLLAPSED', (isCollapsed) => {
      console.log('[LauncherService] Collapsed state changed:', isCollapsed);
      this.container.setCollapsedState(isCollapsed);
      this.collapseButton.setVisibility(!isCollapsed);
    });

    // Set initial state from storage
    const initialCollapsed = (await storage.get('LAUNCHER_COLLAPSED')) ?? true;
    this.container.setCollapsedState(initialCollapsed);
    this.collapseButton.setVisibility(!initialCollapsed);
  }

  private async setupComponents(): Promise<void> {
    // Create UI components
    this.container = new LauncherContainer();
    this.collapseButton = new CollapseButton(async () => {
      await storage.set('LAUNCHER_COLLAPSED', true);
    });
    this.logo = new Logo();
    this.syncFrame = new SyncFrame();

    // Add components to container
    const inner = this.container.getInnerElement();
    inner.appendChild(this.collapseButton.getElement());
    inner.appendChild(this.logo.getElement());

    // Add container to document
    document.body.appendChild(this.container.getElement());

    // Set up expand click handler
    this.container.setExpandClickHandler(async () => {
      await this.handleExpand();
    });
  }

  private async handleAppClick(app: AppData): Promise<void> {
    try {
      const userSelection = this.domService.getSelectedContent();
      const rawHtml = document.documentElement.outerHTML;
      const fullText = document.body.innerText;

      await runtime.send('player/launch_worker', {
        appId: app.id,
        appName: app.name,
        appIcon: app.iconUrl,
        launchVariables: {
          url: window.location.href,
          rawHtml,
          fullText,
          userSelection,
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

  updateApps(apps: AppData[]): void {
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
    const apps = (await storage.get('LAUNCHER_APPS')) || [];
    this.updateApps(apps);
  }

  private async handleExpand(): Promise<void> {
    await auth.ensureAuthenticated();
    await storage.set('LAUNCHER_COLLAPSED', false);
  }
}
