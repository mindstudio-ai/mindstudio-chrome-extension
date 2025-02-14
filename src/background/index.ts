import { THANK_YOU_PAGE } from '../shared/constants';
import { runtime } from '../shared/services/messaging';
import { storage } from '../shared/services/storage';
import { api } from '../shared/services/api';

class BackgroundService {
  private static instance: BackgroundService;
  private tabsWithOpenSidePanels = new Map<number, string>();

  private constructor() {
    chrome.sidePanel.setOptions({
      enabled: false,
    });
    chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: false,
    });
    this.setupMessageListeners();
    this.setupSidePanelListeners();
    this.setupInstallationHandler();
    this.setupActionButtonListener();
    this.setupAuthListeners();
    this.updateApps();
  }

  static getInstance(): BackgroundService {
    if (!BackgroundService.instance) {
      BackgroundService.instance = new BackgroundService();
    }
    return BackgroundService.instance;
  }

  private getPanelPath(tabId: number, appId?: string): string {
    return `panel.html?tabId=${tabId}#${appId ? `/agents/${appId}/run` : '/'}`;
  }

  private setupMessageListeners(): void {
    // Handle open history event
    runtime.listen('sidepanel/toggle', async (_, sender) => {
      const tabId = sender?.tab?.id;
      if (!tabId) {
        console.info('[MindStudio][Background] History open failed: No tab ID');
        return;
      }

      try {
        // If a panel exists, remove it from our list. The panel will handle its
        // own close event using window.close() (there is no chrome.sidePanel.close
        // event), and setting setOptions({ enabled: false }) closes it without
        // any animation
        if (this.tabsWithOpenSidePanels.get(tabId)) {
          this.tabsWithOpenSidePanels.delete(tabId);
          return;
        }

        const path = this.getPanelPath(tabId);
        this.tabsWithOpenSidePanels.set(tabId, path);
        chrome.sidePanel.setOptions({
          tabId,
          path,
          enabled: true,
        });
        await chrome.sidePanel.open({ tabId });
      } catch (error) {
        console.error('[MindStudio][Background] History open failed:', error);
      }
    });

    // Handle worker launch directly from content script click
    runtime.listen('player/launch_worker', async (payload, sender) => {
      const tabId = sender?.tab?.id;
      if (!tabId) {
        console.info(
          '[MindStudio][Background] Worker launch failed: No tab ID',
        );
        return;
      }

      try {
        // Generate a new run ID for this worker instance
        const path = this.getPanelPath(tabId, payload.appId);
        this.tabsWithOpenSidePanels.set(tabId, path);

        console.info('[MindStudio][Background] Launching worker:', {
          tabId,
          appId: payload.appId,
        });

        // Configure and open the panel with the run ID
        chrome.sidePanel.setOptions({
          tabId,
          path,
          enabled: true,
        });
        await chrome.sidePanel.open({ tabId });
      } catch (error) {
        console.error('[MindStudio][Background] Launch failed:', error);
      }
    });
  }

  private setupSidePanelListeners(): void {
    // Listen for tab change and show/hide the side panel depending on whether
    // or not we have an active worker
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      const tabId = activeInfo.tabId;
      if (!tabId) {
        return;
      }

      // Update apps on every tab switch
      this.updateApps();

      const path = this.tabsWithOpenSidePanels.get(tabId);
      if (path) {
        console.info(
          '[MindStudio][Background] Switched to tab with active panel, restoring side panel',
          { tabId, path },
        );
        await chrome.sidePanel.setOptions({
          enabled: true,
          tabId,
          path,
        });
      } else {
        console.info(
          '[MindStudio][Background] Switched to tab with no active panel, closing side panel',
          { tabId },
        );
        await chrome.sidePanel.setOptions({
          enabled: false,
          tabId,
        });
      }
    });

    // Handle tab removal
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.tabsWithOpenSidePanels.delete(tabId);
    });

    // Handle tab updates (e.g. navigation)
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
      if (changeInfo.status === 'loading') {
        const path = this.tabsWithOpenSidePanels.get(tabId);
        if (path) {
          await chrome.sidePanel.setOptions({
            enabled: true,
            tabId,
            path,
          });
        }
      }
    });
  }

  private setupInstallationHandler(): void {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        console.info('[MindStudio][Background] Extension installed');
        chrome.tabs.create({ url: THANK_YOU_PAGE });
      }
    });
  }

  private setupActionButtonListener(): void {
    chrome.action.onClicked.addListener(async (tab) => {
      if (tab.id) {
        try {
          const path = this.getPanelPath(tab.id);
          this.tabsWithOpenSidePanels.set(tab.id, path);
          chrome.sidePanel.setOptions({
            tabId: tab.id,
            path,
            enabled: true,
          });
          await chrome.sidePanel.open({ tabId: tab.id });
          await storage.set('LAUNCHER_HIDDEN', false);
          await storage.set('LAUNCHER_COLLAPSED', false);
        } catch (error) {
          console.error('[MindStudio][Background] Toggle failed:', error);
        }
      }
    });
  }

  private setupAuthListeners(): void {
    // Listen for auth token changes
    storage.onChange('AUTH_TOKEN', this.updateApps.bind(this));

    // Listen for organization selection changes
    storage.onChange('SELECTED_ORGANIZATION', this.updateApps.bind(this));
  }

  private async updateApps(): Promise<void> {
    const token = await storage.get('AUTH_TOKEN');
    const organizationId = await storage.get('SELECTED_ORGANIZATION');

    if (token && organizationId) {
      console.info('[MindStudio][Background] Fetching apps');
      try {
        const apps = await api.getApps(organizationId);
        const existingApps = (await storage.get('LAUNCHER_APPS')) ?? {};
        await storage.set('LAUNCHER_APPS', {
          ...existingApps,
          [organizationId]: apps,
        });

        if (apps.length === 0) {
          await storage.set('LAUNCHER_COLLAPSED', true);
        }
        console.info('[MindStudio][Background] Updated apps list:', {
          organizationId,
          count: apps.length,
        });
      } catch (error) {
        console.error('[MindStudio][Background] Failed to fetch apps:', error);
      }
    }
  }
}

// Initialize background service
BackgroundService.getInstance();
