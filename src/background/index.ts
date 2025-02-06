import { THANK_YOU_PAGE } from '../shared/constants';
import { runtime } from '../shared/services/messaging';
import { storage } from '../shared/services/storage';
import { api } from '../shared/services/api';
import { WorkerLaunchPayload } from '../shared/types/events';

class BackgroundService {
  private static instance: BackgroundService;
  private readyPanels = new Map<number, boolean>();
  private pendingWorkers = new Map<number, WorkerLaunchPayload>();
  private tabsWithOpenSidePanels = new Map<
    number,
    { type: 'worker' | 'history' }
  >();

  private constructor() {
    chrome.sidePanel.setOptions({
      enabled: false,
    });
    chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: false,
    });
    this.setupHeaderRules();
    this.setupMessageListeners();
    this.setupSidePanelListeners();
    this.setupInstallationHandler();
    this.setupActionButtonListener();
    this.setupAuthListeners();
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

    // Handle worker launch directly from content script click
    runtime.listen('player/launch_worker', async (payload, sender) => {
      const tabId = sender?.tab?.id;
      if (!tabId) {
        console.info(
          '[MindStudio][Background] Worker launch failed: No tab ID',
        );
        return;
      }
      this.tabsWithOpenSidePanels.set(tabId, { type: 'worker' });

      try {
        // Store pending worker for this tab
        this.pendingWorkers.set(tabId, {
          ...payload,
          tabId,
        });
        console.info('[MindStudio][Background] Launching worker:', {
          tabId,
          appId: payload.appId,
          appName: payload.appName,
        });

        // don't await this - doing so will break sidePanel.open()
        chrome.sidePanel.setOptions({
          tabId,
          path: `worker-panel.html?tabId=${tabId}`,
          enabled: true,
        });

        await chrome.sidePanel.open({ tabId });

        // If panel is ready, send init event immediately
        if (this.readyPanels.get(tabId)) {
          const worker = this.pendingWorkers.get(tabId);
          if (worker) {
            console.info('[MindStudio][Background] Initializing worker:', {
              tabId,
              appId: worker.appId,
              appName: worker.appName,
            });
            runtime.send('player/init', worker);
            this.pendingWorkers.delete(tabId);
          }
        } else {
          console.info(
            '[MindStudio][Background] Worker not ready, will initialize on sidepanel ready',
            { tabId },
          );
        }
      } catch (error) {
        console.error('[MindStudio][Background] Launch failed:', error);
      }
    });

    // Handle sidepanel ready event
    runtime.listen('sidepanel/ready', (payload: { tabId: number }) => {
      const tabId = payload.tabId;
      this.readyPanels.set(tabId, true);

      // Check for pending worker for this tab
      const pendingWorker = this.pendingWorkers.get(tabId);
      if (pendingWorker) {
        console.info('[MindStudio][Background] Initializing worker:', {
          tabId,
          appId: pendingWorker.appId,
          appName: pendingWorker.appName,
        });
        runtime.send('player/init', pendingWorker);
        this.pendingWorkers.delete(tabId);
      }
    });
  }

  private setupHeaderRules(): void {
    chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [
        {
          id: 1,
          priority: 1,
          action: {
            type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
            responseHeaders: [
              {
                header: 'X-Frame-Options',
                operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
              },
              {
                header: 'Content-Security-Policy',
                operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
              },
            ],
          },
          condition: {
            urlFilter: '*',
            resourceTypes: [
              chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
            ],
          },
        },
      ],
      removeRuleIds: [1],
    });
  }

  private setupSidePanelListeners(): void {
    // Track sidepanel lifecycle
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'sidepanel') {
        const url = new URL(port.sender?.url || '');
        const isWorkerPanel = url.pathname.endsWith('worker-panel.html');
        const searchParams = new URLSearchParams(url.search);
        const tabId = parseInt(searchParams.get('tabId') || '-1', 10);

        // Only track readiness for worker panels
        if (isWorkerPanel && tabId > 0) {
          // When this specific tab's panel disconnects
          port.onDisconnect.addListener(async () => {
            console.info('[MindStudio][Background] Closed side panel for tab', {
              tabId,
            });

            // Mark tab's panel as not ready
            this.readyPanels.delete(tabId);
            this.tabsWithOpenSidePanels.delete(tabId);

            // Close the side panel for this specific tab
            await chrome.sidePanel.setOptions({
              enabled: false,
              tabId,
            });
          });
        }
      }
    });

    // Listen for tab change and show/hide the side panel depending on whether
    // or not we have an active worker
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      const tabId = activeInfo.tabId;
      if (!tabId) {
        return;
      }

      const panelInfo = this.tabsWithOpenSidePanels.get(tabId);
      if (panelInfo) {
        console.info(
          '[MindStudio][Background] Switched to tab with active panel, restoring side panel',
          { tabId, type: panelInfo.type },
        );
        await chrome.sidePanel.setOptions({
          enabled: true,
          tabId,
          path:
            panelInfo.type === 'worker'
              ? `worker-panel.html?tabId=${tabId}`
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
      this.readyPanels.delete(tabId);
      this.tabsWithOpenSidePanels.delete(tabId);
      this.pendingWorkers.delete(tabId);
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
          await storage.set('LAUNCHER_COLLAPSED', false);
        } catch (error) {
          console.error('[MindStudio][Background] Toggle failed:', error);
        }
      }
    });
  }

  private setupAuthListeners(): void {
    // Listen for auth token changes
    storage.onChange('AUTH_TOKEN', this.handleAuthChange.bind(this));

    // Listen for organization selection changes
    storage.onChange('SELECTED_ORGANIZATION', this.handleAuthChange.bind(this));
  }

  private async handleAuthChange(): Promise<void> {
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
