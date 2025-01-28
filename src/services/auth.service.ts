import { StorageKeys, RootUrl } from '../content/constants';
import { MessagingService } from '../content/services/messaging.service';

export class AuthService {
  private static instance: AuthService;
  private messagingService: MessagingService;
  private loginCompletionHandlers: Array<
    (token: string) => void | Promise<void>
  > = [];

  private constructor() {
    this.messagingService = MessagingService.getInstance();
    this.setupMessageHandlers();
  }

  private setupMessageHandlers(): void {
    this.messagingService.subscribe(
      'auth/token_generated',
      async ({ token }) => {
        if (!token) {
          return;
        }

        // Set the token first
        await this.setToken(token);

        // If we're in the login popup, just close
        if (window.opener) {
          window.close();
          return;
        }

        // Otherwise, we're in a content script receiving the token
        for (const handler of this.loginCompletionHandlers) {
          try {
            await handler(token);
          } catch (error) {
            console.error('[AuthService] Error in completion handler:', error);
          }
        }
      },
    );
  }

  public onLoginComplete(
    handler: (token: string) => void | Promise<void>,
  ): void {
    this.loginCompletionHandlers.push(handler);
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }

  async getToken(): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get(StorageKeys.AUTH_TOKEN, (result) => {
        resolve(result[StorageKeys.AUTH_TOKEN] || null);
      });
    });
  }

  async setToken(token: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [StorageKeys.AUTH_TOKEN]: token }, () => {
        resolve();
      });
    });
  }

  async login(): Promise<void> {
    window.open(
      `${RootUrl}/_extension/login?__displayContext=extension`,
      '_blank',
    );
  }

  async logout(): Promise<void> {
    // Set launcher to collapsed state first
    await chrome.storage.local.set({ [StorageKeys.LAUNCHER_COLLAPSED]: true });

    // Clear all storage items
    await chrome.storage.local.remove([
      StorageKeys.AUTH_TOKEN,
      StorageKeys.LAUNCHER_APPS,
    ]);

    // Reload all tabs where the extension is active
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.url?.startsWith('http')) {
        await chrome.tabs.reload(tab.id!);
      }
    }
  }

  async ensureAuthenticated(): Promise<string> {
    const token = await this.getToken();
    if (!token) {
      // Return a promise that resolves when login completes
      return new Promise((resolve) => {
        const handler = (newToken: string) => {
          // Remove this handler from the list
          const index = this.loginCompletionHandlers.indexOf(handler);
          if (index > -1) {
            this.loginCompletionHandlers.splice(index, 1);
          }
          resolve(newToken);
        };

        // Add the handler
        this.loginCompletionHandlers.push(handler);

        // Start the login process
        this.login();
      });
    }
    return token;
  }
}
