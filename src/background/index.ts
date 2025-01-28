import { StorageKeys } from '../content/constants';

class BackgroundService {
  private static instance: BackgroundService;

  private constructor() {
    this.setupStorageListeners();
    this.setupHeaderRules();
    this.setupMessageListeners();
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
            // Open side panel synchronously in response to user click
            chrome.sidePanel.open({ tabId: sender.tab.id }).then(() => {
              // Send init event to side panel with worker details
              chrome.runtime.sendMessage({
                _MindStudioEvent: '@@mindstudio/player/init',
                payload: message.payload,
              });
            });

            return; // Don't continue with broadcast
          } catch (error) {
            console.error('Failed to handle worker launch:', error);
          }
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
}

// Initialize background service
BackgroundService.getInstance();
