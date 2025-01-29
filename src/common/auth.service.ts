import { storage } from '../shared/storage';
import { runtime } from '../shared/messaging';
import { RootUrl } from './constants';

export class AuthService {
  private static instance: AuthService;
  private loginCompletionHandlers: Array<
    (token: string) => void | Promise<void>
  > = [];

  private constructor() {
    // Listen for token generation
    runtime.listen('auth/token_generated', async ({ token }) => {
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

      // Otherwise, notify completion handlers
      for (const handler of this.loginCompletionHandlers) {
        try {
          await handler(token);
        } catch (error) {
          console.error('[AuthService] Error in completion handler:', error);
        }
      }
    });
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
    return storage.get('AUTH_TOKEN');
  }

  async setToken(token: string): Promise<void> {
    return storage.set('AUTH_TOKEN', token);
  }

  async login(): Promise<void> {
    window.open(
      `${RootUrl}/_extension/login?__displayContext=extension`,
      '_blank',
    );
  }

  async logout(): Promise<void> {
    // Set launcher to collapsed state first
    await storage.set('LAUNCHER_COLLAPSED', true);

    // Clear auth items
    await storage.remove(['AUTH_TOKEN', 'LAUNCHER_APPS']);

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
