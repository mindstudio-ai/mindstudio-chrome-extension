import { AppButton } from './app-button';
import { LauncherContainer } from './container';
import { Logo } from './logo';
import { ContextMenu } from './context-menu';
import { AppData } from '../../../shared/types/app';
import { runtime } from '../../../shared/services/messaging';
import { storage } from '../../../shared/services/storage';
import { sortApps } from '../../../shared/utils/sortApps';
import { RootUrl } from '../../../shared/constants';
import { AddNewAppButton } from './add-new-app-button';
import { TooltipGuide } from './tooltip-guide';
import { tooltipGuideStorage } from '../../../shared/services/tooltipGuideStorage';

export class LauncherUI {
  private container: LauncherContainer;
  private logo: Logo;
  private contextMenu: ContextMenu;
  private appButtons: Map<string, AppButton> = new Map();

  constructor(
    private onAppClick: (app: AppData) => void,
    private onCollapse: () => void,
    private onExpand: () => void,
  ) {
    this.container = new LauncherContainer();
    this.logo = new Logo();

    this.logo.addEventHandler('contextmenu', (e) => {
      e.preventDefault();
      this.onSettingsClick();
    });

    this.logo.addEventHandler('mousedown', () => {
      this.contextMenu.hide();
    });

    this.contextMenu = new ContextMenu(
      [
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
          onClick: async () => {
            // Hide the dock
            await storage.set('LAUNCHER_HIDDEN', true);
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

    // Set up context menu
    this.contextMenu.setContainer(this.container.getElement());
    document.body.appendChild(this.contextMenu.getElement());

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

    // Add Workers button
    if (sortedApps.length === 0) {
      const newButton = new AddNewAppButton(async () => {
        window.open(`${RootUrl}/store`, '_blank');
        await tooltipGuideStorage.set('ADD_WORKERS', true);
      });
      this.container.getAppsContainer().appendChild(newButton.getElement());
      this.container.addTooltip(newButton.getTooltip());

      const hasShownTooltipAddWorkers =
        await tooltipGuideStorage.get('ADD_WORKERS');

      if (newButton && !hasShownTooltipAddWorkers) {
        this.onExpand();
        this.addTooltipGuideAddWorkers(newButton.getElement());
      }
    }

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
    sortedApps.forEach(async (app, index) => {
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

        const hasShownTooltipFirstWorker =
          (await tooltipGuideStorage.get('FIRST_WORKER')) ||
          (await tooltipGuideStorage.get('SKIP_ALL'));

        if (newButton && !hasShownTooltipFirstWorker && index === 0) {
          this.onExpand();
          this.addTooltipGuideFirstWorker(newButton.getElement());
        }

        if (index === 0 && hasShownTooltipFirstWorker) {
          this.resolveLeftoverTooltipGuides();
        }
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

    if (collapsed) {
      this.contextMenu.hide();
    }
  }

  private onSettingsClick(): void {
    this.contextMenu.toggle(this.logo.getElement());
  }

  public destroy(): void {
    // Remove all elements from DOM
    this.container.getElement().remove();
    this.contextMenu.getElement().remove();

    // Clear app buttons
    this.appButtons.clear();
  }

  private async resolveLeftoverTooltipGuides(): Promise<void> {
    const hasSkipped = await tooltipGuideStorage.get('SKIP_ALL');

    if (hasSkipped) {
      return;
    }

    const hasShownTooltipContextMenuExpanded = await tooltipGuideStorage.get(
      'CONTEXT_MENU_EXPANDED',
    );

    if (!hasShownTooltipContextMenuExpanded) {
      this.addTooltipGuideContextMenuExpanded();
      return;
    }

    const hasShownTooltipMinimize = await tooltipGuideStorage.get('MINIMIZE');

    if (!hasShownTooltipMinimize) {
      this.addTooltipGuideMinimize();
      return;
    }

    const hasShownTooltipDrag = await tooltipGuideStorage.get('DRAG');

    if (!hasShownTooltipDrag) {
      this.addTooltipGuideDrag();
      return;
    }

    const hasShownTooltipPin = await tooltipGuideStorage.get('PIN');

    if (!hasShownTooltipPin) {
      this.addTooltipGuidePin();
      return;
    }
  }

  private async addTooltipGuideAddWorkers(
    targetButton: HTMLElement,
  ): Promise<void> {
    setTimeout(() => {
      const top = targetButton.getBoundingClientRect().top;

      if (top <= 0) {
        return;
      }

      const tooltip = new TooltipGuide({
        title: 'Add Workers',
        text: 'Go to Workers Store and add some of our featured AI Workers to start using them.',
        triangleSide: 'right',
        triangleOffset: 48,
        rightOffset: 54,
        topOffset: top - 34,
        onCloseAction: async () => {
          await tooltipGuideStorage.set('ADD_WORKERS', true);
          this.container.getAppsContainer().removeChild(tooltip.getElement());
        },
      });

      tooltip.show();

      this.container.getAppsContainer().appendChild(tooltip.getElement());
    }, 100);
  }

  private async addTooltipGuideFirstWorker(
    targetButton: HTMLElement,
  ): Promise<void> {
    setTimeout(() => {
      const tooltip = new TooltipGuide({
        title: 'Try AI Workers anywhere',
        text: 'Just open the dock on any page and click a Worker to run it.',
        triangleSide: 'right',
        triangleOffset: 48,
        rightOffset: 54,
        topOffset: -34,
        anchorElement: targetButton,
        observeElement: this.container.getElement(),
        onSkipAction: async () => {
          await tooltipGuideStorage.set('SKIP_ALL', true);
        },
        onNextAction: async () => {
          const hasSkipped = await tooltipGuideStorage.get('SKIP_ALL');
          if (!hasSkipped) {
            this.addTooltipGuideContextMenuExpanded();
          }
          await tooltipGuideStorage.set('FIRST_WORKER', true);
        },
        onCloseAction: () => {
          this.container.getAppsContainer().removeChild(tooltip.getElement());
        },
      });

      tooltip.show();

      this.container.getAppsContainer().appendChild(tooltip.getElement());
    }, 100);
  }

  private async addTooltipGuideContextMenuExpanded(): Promise<void> {
    this.contextMenu.show(this.logo.getElement());
    setTimeout(() => {
      const tooltip = new TooltipGuide({
        title: 'More options menu',
        text: 'Right click the MindStudio logo to access additional features and settings.',
        triangleSide: 'right',
        triangleOffset: 36,
        rightOffset: 224,
        topOffset: -48,
        anchorElement: this.logo.getElement(),
        observeElement: this.container.getElement(),
        onSkipAction: async () => {
          await tooltipGuideStorage.set('SKIP_ALL', true);
        },
        onNextAction: async () => {
          const hasSkipped = await tooltipGuideStorage.get('SKIP_ALL');

          if (!hasSkipped) {
            this.addTooltipGuideDrag();
            this.contextMenu.hide();
          }

          await tooltipGuideStorage.set('CONTEXT_MENU_EXPANDED', true);
        },
        onCloseAction: () => {
          this.container.getAppsContainer().removeChild(tooltip.getElement());
        },
      });

      this.contextMenu.setOnHideCallback(async () => {
        const hasSkipped = await tooltipGuideStorage.get('SKIP_ALL');
        if (!hasSkipped) {
          this.addTooltipGuideMinimize();
        }

        await tooltipGuideStorage.set('CONTEXT_MENU_EXPANDED', true);

        tooltip.hide();
      });

      tooltip.show();

      document.body.appendChild(tooltip.getElement());
    }, 100);
  }

  private async addTooltipGuideMinimize(): Promise<void> {
    setTimeout(() => {
      const tooltip = new TooltipGuide({
        title: 'Minimize your dock',
        text: 'Click the MindStudio icon to toggle between expanded and collapsed view.',
        triangleSide: 'right',
        triangleOffset: 48,
        rightOffset: 54,
        topOffset: -34,
        anchorElement: this.logo.getElement(),
        observeElement: this.container.getElement(),
        onSkipAction: async () => {
          await tooltipGuideStorage.set('SKIP_ALL', true);
        },
        onNextAction: async () => {
          const hasSkipped = await tooltipGuideStorage.get('SKIP_ALL');

          if (!hasSkipped) {
            this.onCollapse();
            this.addTooltipGuideDrag();
          }

          this.contextMenu.hide();
          await tooltipGuideStorage.set('MINIMIZE', true);
        },
        onCloseAction: () => {
          this.container.getAppsContainer().removeChild(tooltip.getElement());
        },
      });

      tooltip.show();

      this.container.getAppsContainer().appendChild(tooltip.getElement());
    }, 200);
  }

  private async addTooltipGuideDrag(): Promise<void> {
    this.onCollapse();
    const isSidePanelClosed =
      await tooltipGuideStorage.get('LAUNCHER_COLLAPSED');

    setTimeout(() => {
      const tooltip = new TooltipGuide({
        title: 'Reposition your dock',
        text: 'Drag the dock up or down to find the perfect spot on your screen.',
        triangleSide: 'right',
        triangleOffset: 44,
        rightOffset: 62,
        topOffset: -32,
        anchorElement: this.logo.getElement(),
        observeElement: this.container.getElement(),
        onSkipAction: !isSidePanelClosed
          ? undefined
          : async () => {
              await tooltipGuideStorage.set('SKIP_ALL', true);
            },
        onNextAction: async () => {
          const hasSkipped = await tooltipGuideStorage.get('SKIP_ALL');

          if (!hasSkipped) {
            this.addTooltipGuidePin();
          }

          if (!isSidePanelClosed) {
            await tooltipGuideStorage.set('SKIP_ALL', true);
          }
        },
        nextActionLabel: isSidePanelClosed ? undefined : 'Finish',
        onCloseAction: () => {
          this.container.getAppsContainer().removeChild(tooltip.getElement());
        },
      });

      tooltip.show();

      document.body.appendChild(tooltip.getElement());
    }, 200);
  }

  private async addTooltipGuidePin(): Promise<void> {
    setTimeout(() => {
      const tooltip = new TooltipGuide({
        title: 'Pin to Chrome toolbar',
        text: 'Pin MindStudio to your toolbar for quick access to the side panel.',
        rightOffset: 54,
        topOffset: 16,
        nextActionLabel: 'Finish',
        onNextAction: async () => {
          await tooltipGuideStorage.set('PIN', true);
          await tooltipGuideStorage.set('SKIP_ALL', true);
        },
      });

      tooltip.show();

      document.body.appendChild(tooltip.getElement());
    }, 200);
  }
}
