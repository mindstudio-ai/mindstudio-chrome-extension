import { auth } from '../shared/services/auth';
import { storage } from '../shared/services/storage';

class SettingsManager {
  private static instance: SettingsManager;
  private status: HTMLElement | null;
  private authButton: HTMLElement | null;
  private workspaceSelect: HTMLSelectElement | null;

  private constructor() {
    this.status = document.getElementById('status');
    this.authButton = document.getElementById('authButton');
    this.workspaceSelect = document.getElementById(
      'workspaceSelect',
    ) as HTMLSelectElement;

    console.info('[MindStudio][Settings] Initializing settings page');
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

    storage.onChange('AUTH_TOKEN', () => {
      this.checkAuthState();
    });
  }

  private async checkAuthState(): Promise<void> {
    const isAuthenticated = await auth.isAuthenticated();
    this.updateAuthUI(isAuthenticated);
    if (isAuthenticated) {
      this.setupUI();
    }
  }

  private async setupUI(): Promise<void> {
    const settingsContainer = document.getElementById('settings-container');

    if (settingsContainer) {
      settingsContainer.innerHTML = '';
    }

    const isDockHidden = await storage.get('LAUNCHER_HIDDEN');
    const toggleButton = this.generateToggleButton(
      'Show/Hide Floating Dock',
      !isDockHidden,
      async () => {
        await storage.set('LAUNCHER_HIDDEN', !isDockHidden);
        this.setupUI();
      },
    );

    if (settingsContainer) {
      settingsContainer.appendChild(toggleButton);
    }
  }

  private generateToggleButton(
    label: string,
    isOn: boolean,
    onClick: () => void,
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'toggle-button-container';
    const toggleButton = document.createElement('div');
    toggleButton.className = 'toggle-button';
    toggleButton.classList.add(isOn ? 'on' : 'off');
    const toggleButtonInner = document.createElement('div');
    toggleButtonInner.className = 'toggle-button-inner';
    toggleButton.onclick = onClick;
    toggleButton.appendChild(toggleButtonInner);

    const labelElement = document.createElement('div');
    labelElement.className = 'toggle-button-label';
    labelElement.textContent = label;
    container.appendChild(labelElement);
    container.appendChild(toggleButton);
    return container;
  }

  private updateAuthUI(isAuthenticated: boolean): void {
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const userAvatar = document.getElementById(
      'user-avatar',
    ) as HTMLImageElement;

    if (this.authButton) {
      if (isAuthenticated) {
        this.authButton.textContent = 'Logout';
        this.authButton.className = 'auth-button logout';
        if (userName) {
          userName.textContent = 'Luis Placeholder Chavez';
        }

        if (userEmail) {
          userEmail.textContent = 'luis@placeholder.ai';
        }

        if (userAvatar) {
          userAvatar.src =
            'https://images.mindstudio-cdn.com/images/a47f3f3a-a1fa-41ca-8de3-e415452b4611_1731693706328.png?w=120&fm=auto';
        }

        if (this.workspaceSelect) {
          this.workspaceSelect.disabled = false;
        }
      } else {
        this.authButton.textContent = 'Login';
        this.authButton.className = 'auth-button';

        if (this.workspaceSelect) {
          this.workspaceSelect.disabled = true;
          this.workspaceSelect.innerHTML =
            '<option value="">Please login to view workspaces</option>';
        }
      }
    }
  }

  private async handleAuthClick(): Promise<void> {
    const isAuthenticated = await auth.isAuthenticated();

    try {
      if (isAuthenticated) {
        console.info('[MindStudio][Settings] Logging out');
        await auth.logout();
        this.showSuccess('Successfully logged out');
      } else {
        console.info('[MindStudio][Settings] Initiating login');
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
