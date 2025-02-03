import { THANK_YOU_PAGE } from '../shared/constants';
import { runtime } from '../shared/services/messaging';
import { storage } from '../shared/services/storage';
import { WorkerLaunchPayload } from '../shared/types/events';

class BackgroundService {
  private static instance: BackgroundService;
  private readyPanels = new Map<number, boolean>();
  private pendingWorkers = new Map<number, WorkerLaunchPayload>();
  private tabsWithOpenSidePanels = new Map<number, boolean>();

  private constructor() {
    this.setupHeaderRules();
    this.setupMessageListeners();
    this.setupSidePanelListeners();
    this.setupInstallationHandler();
    this.setupActionButtonListener();
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
      this.tabsWithOpenSidePanels.set(tabId, true);

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
            runtime.send('player/init', worker);
            this.pendingWorkers.delete(tabId);
          }
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

        // Only track readiness for worker panels
        if (isWorkerPanel) {
          // Get current tab when port connects
          chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            const tabId = tab?.id;
            if (!tabId) {
              return;
            }

            // When this specific tab's panel disconnects
            port.onDisconnect.addListener(async () => {
              console.info(
                '[MindStudio][Background] Closed side panel for tab',
                { tabId },
              );

              // Mark tab's panel as not ready
              this.readyPanels.delete(tabId);
              this.tabsWithOpenSidePanels.delete(tabId);

              // Close the side panel
              await chrome.sidePanel.setOptions({ enabled: false });
            });
          });
        }
      }
    });

    // Listen for tab change and show/hide the side panel depending on whether
    // or not we have an active worker
    chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
      if (!tab.url) {
        return;
      }

      const shouldRestoreTab = this.tabsWithOpenSidePanels.get(tabId);
      if (shouldRestoreTab) {
        console.info(
          '[MindStudio][Background] Switched to tab with active worker, restoring side panel',
          { tabId },
        );
        await chrome.sidePanel.setOptions({ enabled: true });
      } else {
        console.info(
          '[MindStudio][Background] Switched to tab with no active worker, closing side panel',
          { tabId },
        );
        await chrome.sidePanel.setOptions({ enabled: false });
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
}

// Initialize background service
BackgroundService.getInstance();
