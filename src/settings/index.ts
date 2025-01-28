import { AuthService } from '../common/auth.service';
import { DefaultIcons, StorageKeys } from '../common/constants';
import { OrganizationService } from '../common/organization.service';
import { OrganizationData } from '../common/types';

class SettingsManager {
  private static instance: SettingsManager;
  private status: HTMLElement | null;
  private authButton: HTMLElement | null;
  private authStatus: HTMLElement | null;
  private workspaceSelect: HTMLSelectElement | null;
  private authService: AuthService;
  private organizationService: OrganizationService;

  private constructor() {
    this.status = document.getElementById('status');
    this.authButton = document.getElementById('authButton');
    this.authStatus = document.getElementById('authStatus');
    this.workspaceSelect = document.getElementById(
      'workspaceSelect',
    ) as HTMLSelectElement;
    this.authService = AuthService.getInstance();
    this.organizationService = OrganizationService.getInstance();
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

    // Listen for storage changes to update UI
    chrome.storage.onChanged.addListener((changes) => {
      if (changes[StorageKeys.ORGANIZATIONS]) {
        this.updateWorkspaceOptions();
      }
    });
  }

  private async checkAuthState(): Promise<void> {
    const isAuthenticated = await this.authService.isAuthenticated();
    this.updateAuthUI(isAuthenticated);

    if (isAuthenticated) {
      await this.updateWorkspaceOptions();
    }
  }

  private updateAuthUI(isAuthenticated: boolean): void {
    if (this.authButton && this.authStatus && this.workspaceSelect) {
      if (isAuthenticated) {
        this.authButton.textContent = 'Logout';
        this.authButton.className = 'auth-button logout';
        this.authStatus.textContent = 'You are logged in';
        this.workspaceSelect.disabled = false;
      } else {
        this.authButton.textContent = 'Login';
        this.authButton.className = 'auth-button';
        this.authStatus.textContent = 'You are not logged in';
        this.workspaceSelect.disabled = true;
        this.workspaceSelect.innerHTML =
          '<option value="">Please login first</option>';
      }
    }
  }

  private async handleAuthClick(): Promise<void> {
    const isAuthenticated = await this.authService.isAuthenticated();

    try {
      if (isAuthenticated) {
        await this.authService.logout();
        this.updateAuthUI(false);
        this.showSuccess('Successfully logged out');
      } else {
        await this.authService.login();
      }
    } catch (error: unknown) {
      this.showError(
        'Error: ' + (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  private async updateWorkspaceOptions(): Promise<void> {
    if (!this.workspaceSelect) {
      return;
    }

    const organizations = await this.organizationService.getOrganizations();
    const selectedOrganizationId =
      await this.organizationService.getSelectedOrganization();

    if (organizations.length === 0) {
      this.workspaceSelect.innerHTML =
        '<option value="">No workspaces available</option>';
      return;
    }

    const options = organizations
      .filter((org: OrganizationData) => org.requestingUserStatus === 'active')
      .map((org: OrganizationData) => {
        const option = document.createElement('option');
        option.value = org.id;
        option.selected = org.id === selectedOrganizationId;
        option.textContent = org.name;
        option.style.backgroundImage = `url('${org.logoUrl || DefaultIcons.WORKSPACE}')`;
        return option;
      });

    // Clear and append new options
    this.workspaceSelect.innerHTML = '';
    options.forEach((option: HTMLOptionElement) => {
      if (this.workspaceSelect) {
        this.workspaceSelect.appendChild(option);
      }
    });

    // Set the background image for the select element based on selected option
    const selectedOrg = organizations.find(
      (org) => org.id === selectedOrganizationId,
    );
    if (selectedOrg) {
      this.workspaceSelect.style.backgroundImage = `url('${selectedOrg.logoUrl || DefaultIcons.WORKSPACE}')`;
    }
  }

  private async handleWorkspaceChange(): Promise<void> {
    if (!this.workspaceSelect) {
      return;
    }

    const organizationId = this.workspaceSelect.value;
    if (!organizationId) {
      return;
    }

    try {
      await this.organizationService.setSelectedOrganization(organizationId);

      // Update the select background image
      const selectedOption = this.workspaceSelect
        .selectedOptions[0] as HTMLOptionElement;
      if (selectedOption) {
        this.workspaceSelect.style.backgroundImage =
          selectedOption.style.backgroundImage;
      }

      this.showSuccess('Workspace selection saved');
    } catch (error) {
      this.showError(`Failed to save workspace selection: ${error}`);
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
