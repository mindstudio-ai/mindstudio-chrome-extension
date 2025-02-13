import { DefaultIcons } from '../shared/constants';
import { auth } from '../shared/services/auth';
import { storage } from '../shared/services/storage';
import { AppData } from '../shared/types/app';
import { sortApps } from '../shared/utils/sortApps';

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
    if (this.workspaceSelect) {
      this.workspaceSelect.addEventListener('change', () =>
        this.handleWorkspaceChange(),
      );
    }

    // Listen for storage changes that affect the UI
    storage.onChange('LAUNCHER_APPS', () => {
      this.updateAppsList();
    });

    storage.onChange('ORGANIZATIONS', () => {
      this.loadWorkspaces();
    });

    storage.onChange('SELECTED_ORGANIZATION', () => {
      this.loadWorkspaces();
      this.updateAppsList();
    });

    storage.onChange('LAUNCHER_APPS_SETTINGS', () => {
      this.updateAppsList();
    });

    storage.onChange('AUTH_TOKEN', () => {
      this.checkAuthState();
    });
  }

  private async checkAuthState(): Promise<void> {
    const isAuthenticated = await auth.isAuthenticated();
    this.updateAuthUI(isAuthenticated);
    if (isAuthenticated) {
      await this.loadWorkspaces();
      this.updateAppsList();
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
        const appsSection = document.getElementById('apps-section');

        if (appsSection) {
          appsSection.style.display = 'block';
        }

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

    if (apps.length === 0) {
      this.generateAppsEmptyState();
      return;
    }

    const appsHeader = document.getElementById('apps-header');
    if (appsHeader) {
      appsHeader.style.display = 'flex';
    }

    if (appsContainer && apps) {
      // Clear existing apps
      appsContainer.innerHTML = '';
      // Add draggable container
      appsContainer.setAttribute('data-draggable-container', '');

      sortApps(apps, appsSettings).forEach((app: AppData) => {
        const appElement = document.createElement('div');
        appElement.className = 'app';
        appElement.setAttribute('draggable', 'true');
        appElement.setAttribute('data-app-id', app.id);

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

        // Add drag and drop event listeners
        appElement.addEventListener('dragstart', (e) =>
          this.handleDragStart(e),
        );
        appElement.addEventListener('dragend', (e) => this.handleDragEnd(e));
        appElement.addEventListener('dragover', (e) => this.handleDragOver(e));
        appElement.addEventListener('drop', (e) => this.handleDrop(e));

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

  private generateAppsEmptyState = () => {
    const appsContainer = document.getElementById('apps-container');
    if (!appsContainer) {
      return;
    }

    appsContainer.innerHTML =
      '<div class="apps-empty-state">No AI Agents found for this workspace.</div>';

    const appsHeader = document.getElementById('apps-header');
    if (appsHeader) {
      appsHeader.style.display = 'none';
    }
  };

  private handleDragStart(e: DragEvent): void {
    const target = e.target as HTMLElement;
    const appElement = target.closest('.app');
    if (!appElement) {
      return;
    }

    appElement.classList.add('dragging');
    e.dataTransfer?.setData(
      'text/plain',
      appElement.getAttribute('data-app-id') || '',
    );
    // Set effectAllowed to ensure drop is allowed
    e.dataTransfer!.effectAllowed = 'move';
  }

  private handleDragEnd(e: DragEvent): void {
    const target = e.target as HTMLElement;
    const appElement = target.closest('.app');
    if (!appElement) {
      return;
    }

    appElement.classList.remove('dragging');
    // Trigger drop handling if it wasn't already triggered
    this.handleReorder();
  }

  private handleDragOver(e: DragEvent): void {
    e.preventDefault();
    // Set dropEffect to show it's a valid drop target
    e.dataTransfer!.dropEffect = 'move';

    const target = e.target as HTMLElement;
    const appElement = target.closest('.app');
    if (!appElement) {
      return;
    }

    const container = appElement.parentElement;
    if (!container) {
      return;
    }

    const draggingElement = container.querySelector('.dragging');
    if (!draggingElement || draggingElement === appElement) {
      return;
    }

    const rect = appElement.getBoundingClientRect();
    const offset = e.clientY - rect.top - rect.height / 2;

    if (offset < 0 && appElement.previousElementSibling === draggingElement) {
      return;
    }
    if (offset > 0 && appElement.nextElementSibling === draggingElement) {
      return;
    }

    if (offset < 0) {
      appElement.before(draggingElement);
    } else {
      appElement.after(draggingElement);
    }
  }

  private handleDrop(e: DragEvent): void {
    e.preventDefault();
    this.handleReorder();
  }

  private async handleReorder(): Promise<void> {
    const container = document.getElementById('apps-container');
    if (!container) {
      return;
    }

    const apps = Array.from(container.children);
    const appsSettings = (await storage.get('LAUNCHER_APPS_SETTINGS')) || {};

    // Update sort orders
    apps.forEach((app, index) => {
      const appId = app.getAttribute('data-app-id');
      if (!appId) {
        return;
      }

      appsSettings[appId] = {
        ...(appsSettings[appId] || { isVisible: true }),
        sortOrder: apps.length - index, // Reverse order so higher numbers appear first
      };
    });

    try {
      await storage.set('LAUNCHER_APPS_SETTINGS', appsSettings);
    } catch (error) {
      console.error('Failed to update app order:', error);
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
