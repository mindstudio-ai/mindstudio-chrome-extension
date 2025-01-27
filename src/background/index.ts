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

  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message._MindStudioEvent?.startsWith('@@mindstudio/')) {
        // Handle messages from content scripts
        const eventType = message._MindStudioEvent.replace('@@mindstudio/', '');

        // Broadcast message to all tabs except sender
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id && sender.tab?.id !== tab.id) {
              chrome.tabs.sendMessage(tab.id, message);
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
              chrome.tabs.sendMessage(tab.id, {
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
