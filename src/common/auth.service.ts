import { storage } from '../shared/storage';
import { runtime, frame } from '../shared/messaging';
import { RootUrl } from './constants';

export class AuthService {
  private static instance: AuthService;
  private loginCompletionHandlers: Array<
    (token: string) => void | Promise<void>
  > = [];

  private constructor() {
    // Listen for token changes via storage
    storage.onChange('AUTH_TOKEN', async (token) => {
      if (!token) {
        return;
      }

      // Notify completion handlers
      for (const handler of this.loginCompletionHandlers) {
        try {
          await handler(token);
        } catch (error) {
          console.error('[AuthService] Error in completion handler:', error);
        }
      }
    });

    // Listen for auth token generation via window message
    frame.listen('auth/token_generated', async ({ token }) => {
      if (!token) {
        return;
      }

      // Forward token to background
      await runtime.send('auth/token_generated', { token });
      // Close this window after a delay
      setTimeout(() => window.close(), 3000);
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
