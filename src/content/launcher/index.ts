import { auth } from '../../shared/services/auth';
import { AppData } from '../../shared/types/app';
import { runtime } from '../../shared/services/messaging';
import { storage } from '../../shared/services/storage';
import { page } from '../../shared/utils/page';
import { LauncherUI } from './ui';
import { SyncFrame } from './sync-frame';
import { filterAppsByUrl } from '../../shared/utils/url-filter';

export class LauncherService {
  private static instance: LauncherService;
  private apps: AppData[] = [];
  private currentHostUrl: string = window.location.href;

  private ui!: LauncherUI;
  private syncFrame!: SyncFrame;
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
    await this.initializeState();
  }

  private async initializeState(): Promise<void> {
    // Setup components first
    await this.setupComponents();

    // Set up storage listeners
    storage.onChange('LAUNCHER_COLLAPSED', (isCollapsed) => {
      this.ui.setCollapsed(isCollapsed ?? true);
    });

    storage.onChange('LAUNCHER_APPS', async () => {
      await this.updateAppsFromStorage();
    });

    storage.onChange('SELECTED_ORGANIZATION', async () => {
      await this.updateAppsFromStorage();
    });

    storage.onChange('LAUNCHER_APPS_SETTINGS', async () => {
      await this.updateAppsFromStorage();
    });

    // Set initial states from storage
    this.ui.setCollapsed(
      (await storage.get('LAUNCHER_COLLAPSED')) ?? true,
      true,
    );

    // Load initial state
    await this.updateAppsFromStorage();
  }

  private async updateAppsFromStorage(): Promise<void> {
    const apps = await storage.get('LAUNCHER_APPS');
    const orgId = await storage.get('SELECTED_ORGANIZATION');
    if (!apps || !orgId) {
      await this.updateApps([]);
      return;
    }

    const orgApps = apps[orgId] || [];
    await this.updateApps(orgApps);
  }

  private async setupComponents(): Promise<void> {
    // Create UI components
    this.ui = new LauncherUI(
      (app) => this.handleAppClick(app),
      async () => this.handleCollapse(),
      async () => this.handleExpand(),
    );

    this.syncFrame = new SyncFrame();
  }

  private async handleAppClick(app: AppData): Promise<void> {
    try {
      const userSelection = page.getSelectedContent();
      const rawHtml = page.cleanDOM();
      const fullText = page.getCleanTextContent();
      const metadata = page.getMetadataBundle();

      await runtime.send('player/launch_worker', {
        appId: app.id,
        appName: app.name,
        appIcon: app.iconUrl,
        launchVariables: {
          url: window.location.href,
          metadata,
          rawHtml,
          fullText,
          userSelection,
        },
      });
    } catch (error) {
      console.error('Failed to launch worker:', error);
    }
  }

  private async updateApps(apps: AppData[]): Promise<void> {
    this.apps = filterAppsByUrl(apps, this.currentHostUrl);
    await this.ui.updateApps(this.apps);
  }

  private async handleExpand(): Promise<void> {
    await auth.ensureAuthenticated();
    await storage.set('LAUNCHER_COLLAPSED', false);
  }

  private async handleCollapse(): Promise<void> {
    await storage.set('LAUNCHER_COLLAPSED', true);
  }
}
