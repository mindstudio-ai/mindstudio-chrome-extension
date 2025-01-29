import { DefaultIcons } from '../shared/constants';
import { auth } from '../shared/services/auth';
import { storage } from '../shared/services/storage';

class SettingsManager {
  private static instance: SettingsManager;
  private status: HTMLElement | null;
  private authButton: HTMLElement | null;
  private authStatus: HTMLElement | null;
  private workspaceSelect: HTMLSelectElement | null;

  private constructor() {
    this.status = document.getElementById('status');
    this.authButton = document.getElementById('authButton');
    this.authStatus = document.getElementById('authStatus');
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
    if (this.workspaceSelect) {
      this.workspaceSelect.addEventListener('change', () =>
        this.handleWorkspaceChange(),
      );
    }
  }

  private async checkAuthState(): Promise<void> {
    const isAuthenticated = await auth.isAuthenticated();
    this.updateAuthUI(isAuthenticated);
    if (isAuthenticated) {
      await this.loadWorkspaces();
    }
  }

  private async loadWorkspaces(): Promise<void> {
    if (!this.workspaceSelect) {
      return;
    }

    try {
      const organizations = (await storage.get('ORGANIZATIONS')) || [];
      const selectedOrg = await storage.get('SELECTED_ORGANIZATION');

      // Clear existing options
      this.workspaceSelect.innerHTML = '';

      if (organizations.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No workspaces available';
        this.workspaceSelect.appendChild(option);
        this.workspaceSelect.disabled = true;
        return;
      }

      // Enable select and add options
      this.workspaceSelect.disabled = false;
      organizations.forEach(
        (org: { id: string; name: string; logoUrl?: string }) => {
          const option = document.createElement('option');
          option.value = org.id;
          option.textContent = org.name;
          option.style.backgroundImage = `url(${org.logoUrl || DefaultIcons.WORKSPACE})`;
          this.workspaceSelect?.appendChild(option);
        },
      );

      // Set selected organization
      if (selectedOrg) {
        this.workspaceSelect.value = selectedOrg;
      }
    } catch (error) {
      this.showError('Failed to load workspaces');
      console.error('Failed to load workspaces:', error);
    }
  }

  private async handleWorkspaceChange(): Promise<void> {
    if (!this.workspaceSelect) {
      return;
    }

    const selectedId = this.workspaceSelect.value;
    try {
      console.info('[MindStudio][Settings] Changing workspace:', {
        selectedId,
      });
      await storage.set('SELECTED_ORGANIZATION', selectedId);
      this.showSuccess('Workspace updated successfully');
    } catch (error) {
      this.showError('Failed to update workspace');
      console.error('[MindStudio][Settings] Workspace change failed:', error);
    }
  }

  private updateAuthUI(isAuthenticated: boolean): void {
    if (this.authButton && this.authStatus) {
      if (isAuthenticated) {
        this.authButton.textContent = 'Logout';
        this.authButton.className = 'auth-button logout';
        this.authStatus.textContent = 'You are logged in';
        if (this.workspaceSelect) {
          this.workspaceSelect.disabled = false;
        }
      } else {
        this.authButton.textContent = 'Login';
        this.authButton.className = 'auth-button';
        this.authStatus.textContent = 'You are not logged in';
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
        this.updateAuthUI(false);
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
