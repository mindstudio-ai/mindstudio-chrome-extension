import { Environment } from '../constants';

export class AuthService {
  private static instance: AuthService;
  private readonly storageKey = `AuthToken_${Environment}`;

  private constructor() {}

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
      chrome.storage.local.get(this.storageKey, (result) => {
        resolve(result[this.storageKey] || null);
      });
    });
  }

  async setToken(token: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.storageKey]: token }, () => {
        resolve();
      });
    });
  }
}
