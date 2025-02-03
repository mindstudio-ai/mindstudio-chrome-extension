import { SyncFrame } from '../content/launcher/sync-frame';
import { DefaultIcons } from '../shared/constants';
import { auth } from '../shared/services/auth';
import { frame } from '../shared/services/messaging';
import { storage } from '../shared/services/storage';
import { AppData } from '../shared/types/app';

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
        this.updateAppsList();
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
      this.updateAppsList();
    } catch (error) {
      this.showError('Failed to update workspace');
      console.error('[MindStudio][Settings] Workspace change failed:', error);
    }
  }

  private async updateAppsList(): Promise<void> {
    const selectedOrg = (await storage.get('SELECTED_ORGANIZATION')) || '';
    const apps = (await storage.get('LAUNCHER_APPS'))?.[selectedOrg] || [];
    const appsContainer = document.getElementById('apps-container');
    const appsSettings = (await storage.get('LAUNCHER_APPS_SETTINGS')) || {};

    if (appsContainer && apps) {
      // Clear existing apps
      appsContainer.innerHTML = '';

      apps
        .sort((a, b) => {
          const aSettings = appsSettings[a.id] || {
            sortOrder: 0,
            isVisible: true,
          };
          const bSettings = appsSettings[b.id] || {
            sortOrder: 0,
            isVisible: true,
          };

          const aSortOrder = aSettings.sortOrder;
          const bSortOrder = bSettings.sortOrder;

          if (aSortOrder === 0 && bSortOrder === 0) {
            return a.name.localeCompare(b.name);
          }
          return bSortOrder - aSortOrder;
        })
        .forEach((app: AppData) => {
          const appElement = document.createElement('div');
          appElement.className = 'app';
          const appInner = document.createElement('div');
          appInner.className = 'app-inner';
          const appReorderButton = document.createElement('div');
          appReorderButton.className = 'app-reorder-button';
          appReorderButton.innerHTML = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-grip-vertical"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M9 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M9 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M15 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M15 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M15 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>`;

          const appInfo = document.createElement('div');
          appInfo.className = 'app-info';
          const appIcon = document.createElement('img');
          appIcon.src = `${app.iconUrl}?w=64`;
          appIcon.className = 'app-icon';
          appInfo.appendChild(appIcon);
          appInfo.appendChild(document.createTextNode(app.name));
          appInner.appendChild(appReorderButton);
          appInner.appendChild(appInfo);
          appElement.appendChild(appInner);

          const appSettings = appsSettings[app.id] || {
            sortOrder: 0,
            isVisible: true,
          };

          appElement.appendChild(
            this.generateToggleButton(app.id, appSettings.isVisible),
          );
          appsContainer.appendChild(appElement);
        });
    }
  }

  private async toggleAppVisibility(appId: string): Promise<void> {
    const appsSettings = (await storage.get('LAUNCHER_APPS_SETTINGS')) || {};
    const newSettings = {
      ...appsSettings,
      [appId]: {
        ...(appsSettings[appId] || { sortOrder: 0, isVisible: true }),
        isVisible: !(appsSettings[appId]?.isVisible ?? true),
      },
    };
    await storage.set('LAUNCHER_APPS_SETTINGS', newSettings);
    this.updateAppsList();
  }

  private generateToggleButton(appId: string, isOn: boolean): HTMLElement {
    const toggleButton = document.createElement('div');
    toggleButton.className = 'toggle-button';
    toggleButton.classList.add(isOn ? 'on' : 'off');
    const toggleButtonInner = document.createElement('div');
    toggleButtonInner.className = 'toggle-button-inner';
    toggleButton.appendChild(toggleButtonInner);
    toggleButton.onclick = () => this.toggleAppVisibility(appId);
    return toggleButton;
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
