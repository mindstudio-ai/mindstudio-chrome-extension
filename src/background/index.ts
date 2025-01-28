import { StorageKeys } from '../content/constants';

class BackgroundService {
  private static instance: BackgroundService;
  private isSidePanelReady = false;
  private pendingWorker: any = null;

  private constructor() {
    this.setupStorageListeners();
    this.setupHeaderRules();
    this.setupMessageListeners();
    this.setupSidePanelListeners();
  }

  static getInstance(): BackgroundService {
    if (!BackgroundService.instance) {
      BackgroundService.instance = new BackgroundService();
    }
    return BackgroundService.instance;
  }

  private async sendMessageToTab(tabId: number, message: any): Promise<void> {
    try {
      await chrome.tabs.sendMessage(tabId, message);
    } catch (error: unknown) {
      // Ignore errors about receiving end not existing
      const errorString =
        error instanceof Error ? error.message : String(error);
      if (!errorString.includes('Receiving end does not exist')) {
        console.error('Error sending message to tab:', error);
      }
    }
  }

  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message, sender) => {
      if (message._MindStudioEvent?.startsWith('@@mindstudio/')) {
        const eventType = message._MindStudioEvent.replace('@@mindstudio/', '');

        // Handle worker launch directly from content script click
        if (eventType === 'player/launch_worker' && sender.tab?.id) {
          try {
            // Store worker details
            this.pendingWorker = message.payload;

            // Open side panel
            chrome.sidePanel.open({ tabId: sender.tab.id }).then(() => {
              // If sidepanel is ready, send init event immediately
              if (this.isSidePanelReady) {
                chrome.runtime.sendMessage({
                  _MindStudioEvent: '@@mindstudio/player/init',
                  payload: this.pendingWorker,
                });
                this.pendingWorker = null;
              }
            });

            return; // Don't continue with broadcast
          } catch (error) {
            console.error('Failed to handle worker launch:', error);
          }
        }

        // Handle sidepanel ready event
        if (eventType === 'sidepanel/ready') {
          this.isSidePanelReady = true;
          if (this.pendingWorker) {
            chrome.runtime.sendMessage({
              _MindStudioEvent: '@@mindstudio/player/init',
              payload: this.pendingWorker,
            });
            this.pendingWorker = null;
          }
          return;
        }

        // Handle other events asynchronously
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id && sender.tab?.id !== tab.id) {
              this.sendMessageToTab(tab.id, message);
            }
          });
        });
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

  private setupStorageListeners(): void {
    // Listen for auth token changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes[StorageKeys.AUTH_TOKEN]) {
        // Notify all tabs that auth state has changed
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id) {
              this.sendMessageToTab(tab.id, {
                _MindStudioEvent: '@@mindstudio/auth/state_changed',
                payload: undefined,
              });
            }
          });
        });
      }
    });
  }

  private setupSidePanelListeners(): void {
    // Reset ready state when sidepanel is closed
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'sidepanel') {
        // Reset state when sidepanel disconnects
        port.onDisconnect.addListener(() => {
          console.log('Sidepanel disconnected, resetting ready state');
          this.isSidePanelReady = false;
        });
      }
    });
  }
}

// Initialize background service
BackgroundService.getInstance();
