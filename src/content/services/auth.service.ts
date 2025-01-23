import { Environment, StorageKeys } from '../constants';

export class AuthService {
  private static instance: AuthService;

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
}
