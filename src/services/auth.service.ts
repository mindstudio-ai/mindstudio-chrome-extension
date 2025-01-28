import { StorageKeys, RootUrl } from '../content/constants';
import { MessagingService } from '../content/services/messaging.service';

export class AuthService {
  private static instance: AuthService;
  private messagingService: MessagingService;

  private constructor() {
    this.messagingService = MessagingService.getInstance();
    this.setupMessageHandlers();
  }

  private setupMessageHandlers(): void {
    this.messagingService.subscribe(
      'auth/token_generated',
      async ({ token }) => {
        if (token) {
          await this.setToken(token);
          window.close();
        }
      },
    );
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
    // Clear all storage items
    await chrome.storage.local.remove([
      StorageKeys.AUTH_TOKEN,
      StorageKeys.LAUNCHER_APPS,
      StorageKeys.LAUNCHER_COLLAPSED,
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
      await this.login();
      throw new Error('Authentication required');
    }
    return token;
  }
}
