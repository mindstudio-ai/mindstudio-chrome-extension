import { auth } from '../shared/auth';

class SettingsManager {
  private static instance: SettingsManager;
  private status: HTMLElement | null;
  private authButton: HTMLElement | null;
  private authStatus: HTMLElement | null;

  private constructor() {
    this.status = document.getElementById('status');
    this.authButton = document.getElementById('authButton');
    this.authStatus = document.getElementById('authStatus');
    this.setupEventListeners();
    this.checkAuthState();
  }

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  private setupEventListeners(): void {
    if (this.authButton) {
      this.authButton.addEventListener('click', () => this.handleAuthClick());
    }
  }

  private async checkAuthState(): Promise<void> {
    const isAuthenticated = await auth.isAuthenticated();
    this.updateAuthUI(isAuthenticated);
  }

  private updateAuthUI(isAuthenticated: boolean): void {
    if (this.authButton && this.authStatus) {
      if (isAuthenticated) {
        this.authButton.textContent = 'Logout';
        this.authButton.className = 'auth-button logout';
        this.authStatus.textContent = 'You are logged in';
      } else {
        this.authButton.textContent = 'Login';
        this.authButton.className = 'auth-button';
        this.authStatus.textContent = 'You are not logged in';
      }
    }
  }

  private async handleAuthClick(): Promise<void> {
    const isAuthenticated = await auth.isAuthenticated();

    try {
      if (isAuthenticated) {
        await auth.logout();
        this.updateAuthUI(false);
        this.showSuccess('Successfully logged out');
      } else {
        await auth.login();
      }
    } catch (error: unknown) {
      this.showError(
        'Error: ' + (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  private showSuccess(message: string): void {
    const statusElement = this.status;
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = 'success';
      setTimeout(() => {
        statusElement.className = '';
        statusElement.textContent = '';
      }, 2000);
    }
  }

  private showError(message: string): void {
    const statusElement = this.status;
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = 'error';
      setTimeout(() => {
        statusElement.className = '';
        statusElement.textContent = '';
      }, 2000);
    }
  }
}

// Initialize the settings manager
document.addEventListener('DOMContentLoaded', () => {
  SettingsManager.getInstance();
});
