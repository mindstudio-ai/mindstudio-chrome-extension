import { AppButton } from './app-button';
import { LauncherContainer } from './container';
import { Logo } from './logo';
import { IconButton } from './icon-button';
import { AppData } from '../../../shared/types/app';
import { runtime } from '../../../shared/services/messaging';
import { storage } from '../../../shared/services/storage';
import { sortApps } from '../../../shared/utils/sortApps';

export class LauncherUI {
  private container: LauncherContainer;
  private logo: Logo;
  private menuButton: IconButton;
  private appButtons: Map<string, AppButton> = new Map();

  constructor(
    private onAppClick: (app: AppData) => void,
    private onCollapse: () => void,
    private onExpand: () => void,
  ) {
    this.container = new LauncherContainer();
    this.logo = new Logo();

    const kebabIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M9.16602 10.0007C9.16602 10.2217 9.25381 10.4336 9.41009 10.5899C9.56637 10.7462 9.77834 10.834 9.99935 10.834C10.2204 10.834 10.4323 10.7462 10.5886 10.5899C10.7449 10.4336 10.8327 10.2217 10.8327 10.0007C10.8327 9.77964 10.7449 9.56768 10.5886 9.4114C10.4323 9.25512 10.2204 9.16732 9.99935 9.16732C9.77834 9.16732 9.56637 9.25512 9.41009 9.4114C9.25381 9.56768 9.16602 9.77964 9.16602 10.0007Z" stroke="#99999A" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9.16602 15.834C9.16602 16.055 9.25381 16.267 9.41009 16.4232C9.56637 16.5795 9.77834 16.6673 9.99935 16.6673C10.2204 16.6673 10.4323 16.5795 10.5886 16.4232C10.7449 16.267 10.8327 16.055 10.8327 15.834C10.8327 15.613 10.7449 15.401 10.5886 15.2447C10.4323 15.0884 10.2204 15.0007 9.99935 15.0007C9.77834 15.0007 9.56637 15.0884 9.41009 15.2447C9.25381 15.401 9.16602 15.613 9.16602 15.834Z" stroke="#99999A" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9.16602 4.16732C9.16602 4.38833 9.25381 4.60029 9.41009 4.75657C9.56637 4.91285 9.77834 5.00065 9.99935 5.00065C10.2204 5.00065 10.4323 4.91285 10.5886 4.75657C10.7449 4.60029 10.8327 4.38833 10.8327 4.16732C10.8327 3.9463 10.7449 3.73434 10.5886 3.57806C10.4323 3.42178 10.2204 3.33398 9.99935 3.33398C9.77834 3.33398 9.56637 3.42178 9.41009 3.57806C9.25381 3.73434 9.16602 3.9463 9.16602 4.16732Z" stroke="#99999A" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    this.menuButton = new IconButton({
      icon: kebabIcon,
      tooltipText: 'Settings',
      onClick: () => {
        this.onSettingsClick();
      },
    });

    this.setupUI();
  }

  private async setupUI(): Promise<void> {
    // Add components to container in the desired order
    this.container.addComponent(this.logo.getElement());
    this.container.addComponent(this.menuButton.getElement());

    // Add tooltips
    this.container.addTooltip(this.menuButton.getTooltip());

    // Set logo as drag handle
    this.container.setDragHandle(this.logo.getElement());

    // Setup logo click handling
    const logoElement = this.logo.getElement();
    logoElement.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.container.getDragHandler().wasElementDragged()) {
        if (this.container.isCollapsed()) {
          this.onExpand();
        } else {
          this.onCollapse();
        }
      }
      this.container.getDragHandler().resetDragState();
    });

    // Initialize the container
    await this.container.initialize();
  }

  async updateApps(apps: AppData[]): Promise<void> {
    // Always use latest apps data
    const appsSettings = (await storage.get('LAUNCHER_APPS_SETTINGS')) || {};
    const visibleApps = apps.filter((app) => {
      const appSettings = appsSettings[app.id];
      return !appSettings || appSettings.isVisible !== false;
    });
    const sortedApps = sortApps(visibleApps, appsSettings);

    // Quick equality check - if apps are the same, no need to update DOM
    const currentAppIds = Array.from(this.appButtons.keys());
    const newAppIds = sortedApps.map((app) => app.id);
    if (
      currentAppIds.length === newAppIds.length &&
      currentAppIds.every((id, i) => id === newAppIds[i])
    ) {
      // Just update the app data in case it changed
      sortedApps.forEach((app) => {
        const button = this.appButtons.get(app.id);
        if (button) {
          button.updateApp(app);
        }
      });
      return;
    }

    // Create fragment for batched DOM updates
    const fragment = document.createDocumentFragment();
    const appsContainer = this.container.getAppsContainer();
    const existingButtons = new Map(this.appButtons);
    const buttonsToRemove = new Set(existingButtons.values());

    // Clear map for new state
    this.appButtons.clear();

    // Update or create buttons
    sortedApps.forEach((app) => {
      const existingButton = existingButtons.get(app.id);
      if (existingButton) {
        // Update existing button
        buttonsToRemove.delete(existingButton);
        existingButton.updateApp(app);
        this.appButtons.set(app.id, existingButton);
        fragment.appendChild(existingButton.getElement());
      } else {
        // Create new button
        const newButton = new AppButton(app, this.onAppClick);
        fragment.appendChild(newButton.getElement());
        this.container.addTooltip(newButton.getTooltip());
        this.appButtons.set(app.id, newButton);
      }
    });

    // Remove old buttons first
    buttonsToRemove.forEach((button) => {
      button.getElement().remove();
      button.getTooltip().remove();
    });

    // Clear container and add new buttons
    appsContainer.innerHTML = '';
    appsContainer.appendChild(fragment);

    // Wait for next frame to ensure DOM is updated
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // Now recalculate height after DOM has settled
    this.container.recalculateHeight();
  }

  setCollapsed(collapsed: boolean, isInitial: boolean = false): void {
    this.container.setCollapsedState(collapsed, isInitial);
    this.menuButton.setVisibility(!collapsed, !isInitial);
  }

  private onSettingsClick(): void {
    runtime.send('settings/open', undefined);
  }
}
