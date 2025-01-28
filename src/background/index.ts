import { StorageKeys } from '../content/constants';

class BackgroundService {
  private static instance: BackgroundService;
  private isSidePanelReady = false;
  private pendingWorker: any = null;

  private constructor() {
    this.setupHeaderRules();
    this.setupMessageListeners();
    this.setupSidePanelListeners();
    this.setupStorageListeners();
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
        console.error('[Background] Error sending message to tab:', error);
      }
    }
  }

  private setupStorageListeners(): void {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes[StorageKeys.AUTH_TOKEN]) {
        const newToken = changes[StorageKeys.AUTH_TOKEN].newValue;

        // Notify all tabs about the token change
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id) {
              this.sendMessageToTab(tab.id, {
                _MindStudioEvent: '@@mindstudio/auth/token_generated',
                payload: { token: newToken },
              });
            }
          });
        });
      }
    });
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
          } catch (error) {
            console.error(
              '[Background] Failed to handle worker launch:',
              error,
            );
          }
          return;
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
          console.log('Sidepanel disconnected, resetting ready state');
          this.isSidePanelReady = false;
        });
      }
    });
  }
}

// Initialize background service
BackgroundService.getInstance();
