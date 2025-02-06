import { AppButton } from './app-button';
import { LauncherContainer } from './container';
import { Logo } from './logo';
import { IconButton } from './icon-button';
import { ContextMenu } from './context-menu';
import { AppData } from '../../../shared/types/app';
import { runtime } from '../../../shared/services/messaging';
import { storage } from '../../../shared/services/storage';
import { sortApps } from '../../../shared/utils/sortApps';
import { RootUrl } from '../../../shared/constants';

export class LauncherUI {
  private container: LauncherContainer;
  private logo: Logo;
  private menuButton: IconButton;
  private contextMenu: ContextMenu;
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
      onClick: () => {
        this.onSettingsClick();
      },
    });

    this.contextMenu = new ContextMenu(
      [
        {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
          <path d="M9.33464 5.16602H13.3346M11.3346 3.16602V7.16602M2.66797 3.83268C2.66797 3.65587 2.73821 3.4863 2.86323 3.36128C2.98826 3.23625 3.15782 3.16602 3.33464 3.16602H6.0013C6.17811 3.16602 6.34768 3.23625 6.47271 3.36128C6.59773 3.4863 6.66797 3.65587 6.66797 3.83268V6.49935C6.66797 6.67616 6.59773 6.84573 6.47271 6.97075C6.34768 7.09578 6.17811 7.16602 6.0013 7.16602H3.33464C3.15782 7.16602 2.98826 7.09578 2.86323 6.97075C2.73821 6.84573 2.66797 6.67616 2.66797 6.49935V3.83268ZM2.66797 10.4993C2.66797 10.3225 2.73821 10.153 2.86323 10.0279C2.98826 9.90292 3.15782 9.83268 3.33464 9.83268H6.0013C6.17811 9.83268 6.34768 9.90292 6.47271 10.0279C6.59773 10.153 6.66797 10.3225 6.66797 10.4993V13.166C6.66797 13.3428 6.59773 13.5124 6.47271 13.6374C6.34768 13.7624 6.17811 13.8327 6.0013 13.8327H3.33464C3.15782 13.8327 2.98826 13.7624 2.86323 13.6374C2.73821 13.5124 2.66797 13.3428 2.66797 13.166V10.4993ZM9.33464 10.4993C9.33464 10.3225 9.40487 10.153 9.5299 10.0279C9.65492 9.90292 9.82449 9.83268 10.0013 9.83268H12.668C12.8448 9.83268 13.0143 9.90292 13.1394 10.0279C13.2644 10.153 13.3346 10.3225 13.3346 10.4993V13.166C13.3346 13.3428 13.2644 13.5124 13.1394 13.6374C13.0143 13.7624 12.8448 13.8327 12.668 13.8327H10.0013C9.82449 13.8327 9.65492 13.7624 9.5299 13.6374C9.40487 13.5124 9.33464 13.3428 9.33464 13.166V10.4993Z" stroke="#F6F6F7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
          label: 'Add Workers',
          onClick: () => {
            window.open(`${RootUrl}/store`, '_blank');
          },
        },
        {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
          <path d="M8.00182 5.83338V8.50005L9.33516 9.83338M2.03516 7.83338C2.18455 6.36675 2.86867 5.00645 3.95698 4.01202C5.04529 3.01759 6.46162 2.45864 7.93574 2.4418C9.40986 2.42496 10.8386 2.95142 11.9493 3.92074C13.0601 4.89005 13.7751 6.23436 13.9579 7.6972C14.1408 9.16003 13.7787 10.639 12.9407 11.8519C12.1028 13.0648 10.8476 13.9267 9.41468 14.2733C7.98177 14.6198 6.47143 14.4267 5.17182 13.7308C3.87221 13.0348 2.8743 11.8848 2.36849 10.5M2.03516 13.8334V10.5H5.36849" stroke="#F6F6F7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
          label: 'Open History',
          onClick: () => {
            runtime.send('history/open', undefined);
          },
          useMouseDown: true,
        },
        {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
          <path d="M6.88333 3.378C7.16733 2.20733 8.83267 2.20733 9.11667 3.378C9.15928 3.55387 9.24281 3.71719 9.36047 3.85467C9.47813 3.99215 9.62659 4.0999 9.79377 4.16916C9.96094 4.23843 10.1421 4.26723 10.3225 4.25325C10.5029 4.23926 10.6775 4.18287 10.832 4.08867C11.8607 3.462 13.0387 4.63933 12.412 5.66867C12.3179 5.8231 12.2616 5.99756 12.2477 6.17785C12.2337 6.35814 12.2625 6.53918 12.3317 6.70625C12.4009 6.87333 12.5085 7.02172 12.6458 7.13937C12.7831 7.25702 12.9463 7.3406 13.122 7.38333C14.2927 7.66733 14.2927 9.33267 13.122 9.61667C12.9461 9.65928 12.7828 9.74281 12.6453 9.86047C12.5079 9.97813 12.4001 10.1266 12.3308 10.2938C12.2616 10.4609 12.2328 10.6421 12.2468 10.8225C12.2607 11.0029 12.3171 11.1775 12.4113 11.332C13.038 12.3607 11.8607 13.5387 10.8313 12.912C10.6769 12.8179 10.5024 12.7616 10.3222 12.7477C10.1419 12.7337 9.96082 12.7625 9.79375 12.8317C9.62667 12.9009 9.47828 13.0085 9.36063 13.1458C9.24298 13.2831 9.1594 13.4463 9.11667 13.622C8.83267 14.7927 7.16733 14.7927 6.88333 13.622C6.84072 13.4461 6.75719 13.2828 6.63953 13.1453C6.52187 13.0079 6.37341 12.9001 6.20623 12.8308C6.03906 12.7616 5.85789 12.7328 5.67748 12.7468C5.49706 12.7607 5.3225 12.8171 5.168 12.9113C4.13933 13.538 2.96133 12.3607 3.588 11.3313C3.68207 11.1769 3.73837 11.0024 3.75232 10.8222C3.76628 10.6419 3.7375 10.4608 3.66831 10.2937C3.59913 10.1267 3.49151 9.97828 3.35418 9.86063C3.21686 9.74298 3.05371 9.6594 2.878 9.61667C1.70733 9.33267 1.70733 7.66733 2.878 7.38333C3.05387 7.34072 3.21719 7.25719 3.35467 7.13953C3.49215 7.02187 3.5999 6.87341 3.66916 6.70623C3.73843 6.53906 3.76723 6.35789 3.75325 6.17748C3.73926 5.99706 3.68287 5.8225 3.58867 5.668C2.962 4.63933 4.13933 3.46133 5.16867 4.088C5.83533 4.49333 6.69933 4.13467 6.88333 3.378Z" stroke="#F6F6F7" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6 8.5C6 9.03043 6.21071 9.53914 6.58579 9.91421C6.96086 10.2893 7.46957 10.5 8 10.5C8.53043 10.5 9.03914 10.2893 9.41421 9.91421C9.78929 9.53914 10 9.03043 10 8.5C10 7.96957 9.78929 7.46086 9.41421 7.08579C9.03914 6.71071 8.53043 6.5 8 6.5C7.46957 6.5 6.96086 6.71071 6.58579 7.08579C6.21071 7.46086 6 7.96957 6 8.5Z" stroke="#F6F6F7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
          label: 'Settings',
          onClick: () => {
            runtime.send('settings/open', undefined);
          },
        },
        {
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
          <path d="M6 8.5H10M2 8.5C2 9.28793 2.15519 10.0681 2.45672 10.7961C2.75825 11.5241 3.20021 12.1855 3.75736 12.7426C4.31451 13.2998 4.97595 13.7417 5.7039 14.0433C6.43185 14.3448 7.21207 14.5 8 14.5C8.78793 14.5 9.56815 14.3448 10.2961 14.0433C11.0241 13.7417 11.6855 13.2998 12.2426 12.7426C12.7998 12.1855 13.2417 11.5241 13.5433 10.7961C13.8448 10.0681 14 9.28793 14 8.5C14 7.71207 13.8448 6.93185 13.5433 6.2039C13.2417 5.47595 12.7998 4.81451 12.2426 4.25736C11.6855 3.70021 11.0241 3.25825 10.2961 2.95672C9.56815 2.65519 8.78793 2.5 8 2.5C7.21207 2.5 6.43185 2.65519 5.7039 2.95672C4.97595 3.25825 4.31451 3.70021 3.75736 4.25736C3.20021 4.81451 2.75825 5.47595 2.45672 6.2039C2.15519 6.93185 2 7.71207 2 8.5Z" stroke="#F6F6F7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
          label: 'Hide dock',
          onClick: () => {
            // TODO: Implement hide functionality
            // console.log('Hide clicked');
          },
        },
      ],
      () => this.container.getPositionManager().getCurrentPosition(),
    );

    this.setupUI();
  }

  private async setupUI(): Promise<void> {
    // Add components to container in the desired order
    this.container.addComponent(this.logo.getElement());
    this.container.addComponent(this.menuButton.getElement());

    // Set up context menu
    this.contextMenu.setContainer(this.container.getElement());
    document.body.appendChild(this.contextMenu.getElement());

    const menuTooltip = this.menuButton.getTooltip();
    if (menuTooltip) {
      this.container.addTooltip(menuTooltip);
    }

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
    if (collapsed) {
      this.contextMenu.hide();
    }
  }

  private onSettingsClick(): void {
    this.contextMenu.toggle(this.menuButton.getElement());
  }
}
