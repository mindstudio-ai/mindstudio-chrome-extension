import { auth } from '../../shared/services/auth';
import { AppData } from '../../shared/types/app';
import { runtime } from '../../shared/services/messaging';
import { storage } from '../../shared/services/storage';
import { pageUtils } from '../page-utils';
import { LauncherUI } from './ui';
import { SyncFrame } from './sync-frame';
import { filterAppsByUrl } from './url-filter';

export class LauncherService {
  private static instance: LauncherService;
  private apps: AppData[] = [];
  private currentHostUrl: string = window.location.href;

  private ui!: LauncherUI;
  private syncFrame!: SyncFrame;
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
      this.ui.setCollapsed(isCollapsed ?? true);
    });

    // Set initial state from storage
    const initialCollapsed = (await storage.get('LAUNCHER_COLLAPSED')) ?? true;
    this.ui.setCollapsed(initialCollapsed);
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
      const userSelection = pageUtils.getSelectedContent();
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

  updateApps(apps: AppData[]): void {
    this.apps = filterAppsByUrl(apps, this.currentHostUrl);
    this.ui.updateApps(this.apps);
  }

  private async loadAppsFromStorage(): Promise<void> {
    const apps = (await storage.get('LAUNCHER_APPS')) || [];
    this.updateApps(apps);
  }

  private async handleExpand(): Promise<void> {
    await auth.ensureAuthenticated();
    await storage.set('LAUNCHER_COLLAPSED', false);
  }

  private async handleCollapse(): Promise<void> {
    await storage.set('LAUNCHER_COLLAPSED', true);
  }
}
