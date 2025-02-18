import { auth } from '../../shared/services/auth';
import { AppData } from '../../shared/types/app';
import { runtime } from '../../shared/services/messaging';
import { storage } from '../../shared/services/storage';
import { page } from '../../shared/utils/page';
import { LauncherUI } from './ui';
import { LaunchVariables } from '../../shared/types/events';

export class LauncherService {
  private static instance: LauncherService;
  private apps: AppData[] = [];

  private urlChangeInterval?: any;
  private currentHostUrl?: string;

  private ui: LauncherUI | null = null;
  private isInitialized = false;

  private constructor() {}

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
    await this.setupListeners();
    await this.initializeState();
    this.startUrlChangeWatcher();
  }

  private async setupListeners(): Promise<void> {
    // Set up storage listeners that should always be active
    storage.onChange('LAUNCHER_APPS', async () => {
      await this.updateAppsFromStorage();
    });

    storage.onChange('SELECTED_ORGANIZATION', async () => {
      await this.updateAppsFromStorage();
    });

    storage.onChange('SUGGESTED_APPS', async () => {
      await this.updateAppsFromStorage();
    });

    storage.onChange('SUGGESTED_APPS_HIDDEN', async () => {
      await this.updateAppsFromStorage();
    });

    storage.onChange('LAUNCHER_HIDDEN', async (isHidden) => {
      if (isHidden) {
        await this.destroyUI();
      } else {
        await this.initializeUI();
      }
    });

    storage.onChange('LAUNCHER_COLLAPSED', (isCollapsed) => {
      if (this.ui) {
        this.ui.setCollapsed(isCollapsed ?? true);
      }
    });

    // Listen for requests for page data launch variables and respond to them
    // (only used when invoking new runs)
    runtime.listen('remote/request_launch_variables', () => {
      console.info(
        '[MindStudio][Launcher] Side panel requested launch variables',
      );
      const userSelection = page.getSelectedContent();
      const rawHtml = page.cleanDOM();
      const fullText = page.getCleanTextContent();
      const metadata = page.getMetadataBundle();

      const launchVariables: LaunchVariables = {
        url: window.location.href,
        userSelection,
        rawHtml,
        fullText,
        metadata,
      };

      console.info(
        '[MindStudio][Launcher] Sending launch variables to side panel',
        launchVariables,
      );

      runtime.send('launcher/resolved_launch_variables', { launchVariables });
    });

    // Listen for requests for the current URL (used by the side panel to show
    // suggested agents based on the URL)
    runtime.listen('remote/request_current_url', () => {
      this.sendCurrentUrl();
    });
  }

  private async initializeState(): Promise<void> {
    // Always update apps first, regardless of UI state
    await this.updateAppsFromStorage();

    // Then check if we should show UI
    const isHidden = await storage.get('LAUNCHER_HIDDEN');
    if (!isHidden) {
      await this.initializeUI();
    }
  }

  private async initializeUI(): Promise<void> {
    if (this.ui) {
      return; // UI already exists
    }

    // Create UI components
    this.ui = new LauncherUI(
      (app) => this.handleAppClick(app),
      async () => this.handleCollapse(),
      async () => this.handleExpand(),
    );

    // Set initial collapsed state
    this.ui.setCollapsed(
      (await storage.get('LAUNCHER_COLLAPSED')) ?? true,
      true,
    );

    // Update UI with current apps
    await this.updateUI();
  }

  // We need to watch the current URL to see when it changes as event-based ways
  // of doing this are unreliable. Store the current URL and check every 500ms
  // to see if it has changed. If it has, notify the side panel (event will be
  // ignore if the side panel is not open, so we can just fire it off
  // regardless), and update the apps to see if we have any different
  // suggestions.
  private startUrlChangeWatcher() {
    const interval = 500; // every 500ms
    this.urlChangeInterval = setInterval(() => {
      if (window.location.href !== this.currentHostUrl) {
        this.currentHostUrl = window.location.href;
        this.sendCurrentUrl();
        this.updateAppsFromStorage();
      }
    }, interval);
  }

  private async destroyUI(): Promise<void> {
    if (this.ui) {
      this.ui.destroy();
      this.ui = null;
    }

    if (this.urlChangeInterval) {
      clearTimeout(this.urlChangeInterval);
    }
  }

  // Get the user's pinned apps from storage and merge them with any suggested
  // apps that work on the current page
  private async updateAppsFromStorage(): Promise<void> {
    const apps = await storage.get('LAUNCHER_APPS');
    const suggestedApps = await storage.get('SUGGESTED_APPS');
    const orgId = await storage.get('SELECTED_ORGANIZATION');

    if (!apps || !orgId) {
      this.apps = [];
    } else {
      this.apps = apps[orgId] || [];
    }

    const suggestedAppsHidden = await storage.get('SUGGESTED_APPS_HIDDEN');
    if (suggestedApps && orgId && !suggestedAppsHidden) {
      // Filter to only include apps that match the current URL
      const resolvedSuggestedApps = (suggestedApps[orgId] ?? []).filter(
        ({ enabledSites }) => {
          if (!enabledSites) {
            return false;
          }

          return enabledSites.some((pattern) => {
            if (!this.currentHostUrl) {
              return false;
            }

            const escapedPattern = pattern.replace(
              /[-/\\^$+?.()|[\]{}]/g,
              '\\$&',
            );

            const regexPattern = new RegExp(
              `^${escapedPattern.replace(/\*/g, '.*')}$`,
            );

            return regexPattern.test(this.currentHostUrl);
          });
        },
      );

      this.apps = [...this.apps, ...resolvedSuggestedApps];
    }

    await this.updateUI();
  }

  private async updateUI(): Promise<void> {
    // Only update UI if it exists
    if (this.ui) {
      await this.ui.updateApps(this.apps);
    }
  }

  private async handleAppClick(app: AppData): Promise<void> {
    try {
      await runtime.send('player/launch_worker', {
        appId: app.id,
      });
    } catch (error) {
      console.error('Failed to launch agent:', error);
    }
  }

  private async handleExpand(): Promise<void> {
    await auth.ensureAuthenticated();
    await storage.set('LAUNCHER_COLLAPSED', false);
  }

  private async handleCollapse(): Promise<void> {
    await storage.set('LAUNCHER_COLLAPSED', true);
  }

  private sendCurrentUrl() {
    if (!this.currentHostUrl) {
      return;
    }

    const { favicon } = JSON.parse(page.getMetadataBundle());

    runtime.send('launcher/current_url_updated', {
      url: this.currentHostUrl,
      faviconUrl: favicon,
    });
  }
}
