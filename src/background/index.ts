import { THANK_YOU_PAGE } from '../shared/constants';
import { runtime } from '../shared/services/messaging';
import { storage } from '../shared/services/storage';
import { api } from '../shared/services/api';
import { WorkerLaunchPayload } from '../shared/types/events';

class BackgroundService {
  private static instance: BackgroundService;
  private pendingWorkers = new Map<number, WorkerLaunchPayload>();
  private tabsWithOpenSidePanels = new Map<
    number,
    { type: 'worker' | 'history'; runId?: string }
  >();

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

  private setupMessageListeners(): void {
    // Handle settings/open event
    runtime.listen('settings/open', () => {
      chrome.runtime.openOptionsPage();
    });

    // Handle open history event
    runtime.listen('history/open', async (_, sender) => {
      const tabId = sender?.tab?.id;
      if (!tabId) {
        console.info('[MindStudio][Background] History open failed: No tab ID');
        return;
      }

      try {
        this.tabsWithOpenSidePanels.set(tabId, { type: 'history' });
        chrome.sidePanel.setOptions({
          tabId,
          path: 'history-panel.html',
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
        const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        // Store pending worker and update panel state
        this.pendingWorkers.set(tabId, {
          ...payload,
          tabId,
        });
        this.tabsWithOpenSidePanels.set(tabId, { type: 'worker', runId });

        console.info('[MindStudio][Background] Launching worker:', {
          tabId,
          appId: payload.appId,
          appName: payload.appName,
          runId,
        });

        // Configure and open the panel with the run ID
        chrome.sidePanel.setOptions({
          tabId,
          path: `worker-panel.html?tabId=${tabId}&runId=${runId}`,
          enabled: true,
        });
        await chrome.sidePanel.open({ tabId });
      } catch (error) {
        console.error('[MindStudio][Background] Launch failed:', error);
      }
    });

    // Handle sidepanel ready event
    runtime.listen(
      'sidepanel/ready',
      (payload: { tabId: number; runId?: string }) => {
        const tabId = payload.tabId;
        const pendingWorker = this.pendingWorkers.get(tabId);
        const panelInfo = this.tabsWithOpenSidePanels.get(tabId);

        // Only initialize if runIds match (or it's a history panel)
        if (
          pendingWorker &&
          (!payload.runId || payload.runId === panelInfo?.runId)
        ) {
          console.info('[MindStudio][Background] Initializing worker:', {
            tabId,
            appId: pendingWorker.appId,
            appName: pendingWorker.appName,
            runId: payload.runId,
          });
          runtime.send('player/init', pendingWorker);
          this.pendingWorkers.delete(tabId);
        }
      },
    );
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

      const panelInfo = this.tabsWithOpenSidePanels.get(tabId);
      if (panelInfo) {
        console.info(
          '[MindStudio][Background] Switched to tab with active panel, restoring side panel',
          { tabId, type: panelInfo.type, runId: panelInfo.runId },
        );
        await chrome.sidePanel.setOptions({
          enabled: true,
          tabId,
          path:
            panelInfo.type === 'worker'
              ? `worker-panel.html?tabId=${tabId}${panelInfo.runId ? `&runId=${panelInfo.runId}` : ''}`
              : 'history-panel.html',
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
      this.pendingWorkers.delete(tabId);
      this.tabsWithOpenSidePanels.delete(tabId);
    });

    // Handle tab updates (e.g. navigation)
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
      if (changeInfo.status === 'loading') {
        const panelInfo = this.tabsWithOpenSidePanels.get(tabId);
        if (panelInfo) {
          await chrome.sidePanel.setOptions({
            enabled: true,
            tabId,
            path:
              panelInfo.type === 'worker'
                ? `worker-panel.html?tabId=${tabId}`
                : 'history-panel.html',
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
          this.tabsWithOpenSidePanels.set(tab.id, { type: 'history' });
          chrome.sidePanel.setOptions({
            tabId: tab.id,
            path: 'history-panel.html',
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
