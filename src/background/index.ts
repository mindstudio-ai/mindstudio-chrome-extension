import { StorageKeys, THANK_YOU_PAGE } from '../common/constants';
import { storage } from '../shared/storage';
import { runtime } from '../shared/messaging';
import { WorkerLaunchPayload } from '../common/types';

class BackgroundService {
  private static instance: BackgroundService;
  private isSidePanelReady = false;
  private pendingWorker: WorkerLaunchPayload | null = null;

  private constructor() {
    this.setupHeaderRules();
    this.setupMessageListeners();
    this.setupSidePanelListeners();
    this.setupInstallationHandler();
    this.setupActionButtonListener();

    // Listen for auth token generation
    runtime.listen('auth/token_generated', async ({ token }) => {
      console.log('[Background] Received token generation event:', token);
      if (!token) {
        return;
      }
      // Store the token - components will listen to storage changes directly
      await storage.set('AUTH_TOKEN', token);
      console.log('[Background] Stored token in storage');
    });
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
    runtime.listen(
      'player/launch_worker',
      async (
        payload: WorkerLaunchPayload,
        sender?: chrome.runtime.MessageSender,
      ) => {
        if (!sender?.tab?.id) {
          return;
        }

        try {
          // Store worker details
          this.pendingWorker = payload;

          // Open side panel
          await chrome.sidePanel.open({ tabId: sender.tab.id });

          // If sidepanel is ready, send init event immediately
          if (this.isSidePanelReady) {
            runtime.send('player/init', this.pendingWorker);
            this.pendingWorker = null;
          }
        } catch (error) {
          console.error('[Background] Failed to handle worker launch:', error);
        }
      },
    );

    // Handle sidepanel ready event
    runtime.listen('sidepanel/ready', () => {
      this.isSidePanelReady = true;
      if (this.pendingWorker) {
        runtime.send('player/init', this.pendingWorker);
        this.pendingWorker = null;
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
    // Reset ready state when sidepanel is closed
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'sidepanel') {
        // Reset state when sidepanel disconnects
        port.onDisconnect.addListener(() => {
          this.isSidePanelReady = false;
        });
      }
    });
  }

  private setupInstallationHandler(): void {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        // Open thank you page after installation
        chrome.tabs.create({ url: THANK_YOU_PAGE });
      }
    });
  }

  private setupActionButtonListener(): void {
    chrome.action.onClicked.addListener(async (tab) => {
      if (tab.id) {
        try {
          // Get current state
          const isCollapsed = await storage.get('LAUNCHER_COLLAPSED');

          // Toggle state
          await storage.set('LAUNCHER_COLLAPSED', !isCollapsed);
        } catch (error) {
          console.error(
            '[Background] Failed to handle action button click:',
            error,
          );
        }
      }
    });
  }
}

// Initialize background service
BackgroundService.getInstance();
