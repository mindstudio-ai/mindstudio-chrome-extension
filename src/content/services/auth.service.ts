import { StorageKeys, RootUrl } from '../constants';
import { MessagingService } from './messaging.service';

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

  async ensureAuthenticated(): Promise<string> {
    const token = await this.getToken();
    if (!token) {
      // Open auth in new tab
      window.open(
        `${RootUrl}/_extension/login?__displayContext=extension`,
        '_blank',
      );
      throw new Error('Authentication required');
    }
    return token;
  }
}
