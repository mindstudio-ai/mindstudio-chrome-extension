import { AppButton } from './app-button';
import { LauncherContainer } from './container';
import { Logo } from './logo';
import { CollapseCaret } from './collapse-caret';
import { ContextMenu } from './context-menu';
import { AppData } from '../../../shared/types/app';
import { runtime } from '../../../shared/services/messaging';
import { storage } from '../../../shared/services/storage';
import { TooltipGuide } from './tooltip-guide';
import { tooltipGuideStorage } from '../../../shared/services/tooltipGuideStorage';
import { DragHandle } from './drag-handle';

export class LauncherUI {
  private container: LauncherContainer;
  private logo: Logo;
  private collapseCaret: CollapseCaret;
  private dragHandle: DragHandle | undefined;
  private contextMenu: ContextMenu;
  private appButtons: Map<string, AppButton> = new Map();
  private handleCollapse: () => void;
  private handleExpand: () => void;
  private tooltipGuides: Map<string, TooltipGuide> = new Map();

  constructor(
    private onAppClick: (app: AppData) => void,
    private onCollapse: () => void,
    private onExpand: () => void,
  ) {
    this.collapseCaret = new CollapseCaret();

    this.container = new LauncherContainer(this.collapseCaret);
    this.logo = new Logo();

    this.logo.addEventHandler('contextmenu', (e) => {
      e.preventDefault();
      this.onSettingsClick();
    });

    this.logo.addEventHandler('mousedown', (e: Event) => {
      // Return if not primary click
      if ((e as MouseEvent).button !== 0) {
        return;
      }

      this.contextMenu.hide();
      runtime.send('sidepanel/toggle', undefined);
      tooltipGuideStorage.set('OPEN_SIDE_PANEL', true);

      if (this.tooltipGuides.get('OPEN_SIDE_PANEL')) {
        this.tooltipGuides.get('OPEN_SIDE_PANEL')?.hide();
      }
    });

    this.logo.addEventHandler('mouseenter', () => {
      this.logo.updateHoverStyle(true);
    });

    this.logo.addEventHandler('mouseleave', () => {
      this.logo.updateHoverStyle(false);
    });

    this.handleCollapse = () => {
      this.onCollapse();
      this.collapseCaret.updateStyleBasedOnCollapsedState(true);
    };

    this.handleExpand = () => {
      this.onExpand();
      this.collapseCaret.updateStyleBasedOnCollapsedState(false);
    };

    this.collapseCaret.addEventHandler('mousedown', () => {
      if (this.container.isCollapsed()) {
        this.handleExpand();
      } else {
        this.handleCollapse();
      }
    });

    this.contextMenu = new ContextMenu(
      [
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

    this.dragHandle = new DragHandle();
    this.container.setDragHandle(this.dragHandle);
    this.container.setDragHandleElement(this.dragHandle.getElement());
    this.container.addComponent(this.dragHandle.getElement());

    // Setup logo click handling
    const logoElement = this.logo.getElement();
    logoElement.addEventListener('click', (e) => {
      e.stopPropagation();
      this.container.getDragHandler().resetDragState();
    });

    // Initialize the container
    await this.container.initialize();

    this.resolveLeftoverTooltipGuides();
    const isCollapsed = await storage.get('LAUNCHER_COLLAPSED');
    this.collapseCaret.updateStyleBasedOnCollapsedState(isCollapsed);
    this.collapseCaret.updateVisibility(!isCollapsed);
    this.dragHandle.updateVisibility(!isCollapsed);
  }

  async updateApps(apps: AppData[]): Promise<void> {
    if (apps.length === 0) {
      this.collapseCaret.updateVisibility(false);
      this.collapseCaret.disable();
    } else {
      this.collapseCaret.updateVisibility(true);
      this.collapseCaret.enable();
    }

    // Quick equality check - if apps are the same, no need to update DOM
    const currentAppIds = Array.from(this.appButtons.keys());
    const newAppIds = apps.map((app) => app.id);
    if (
      currentAppIds.length === newAppIds.length &&
      currentAppIds.every((id, i) => id === newAppIds[i])
    ) {
      // Just update the app data in case it changed
      apps.forEach((app) => {
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
    apps.forEach(async (app) => {
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

    const hasShownOpenSidePanel =
      await tooltipGuideStorage.get('OPEN_SIDE_PANEL');

    if (!hasShownOpenSidePanel) {
      this.addTooltipGuideOpenSidePanel(this.logo.getElement());
      return;
    }
  }

  private async addTooltipGuideOpenSidePanel(
    targetElement: HTMLElement,
  ): Promise<void> {
    setTimeout(() => {
      const tooltip = new TooltipGuide({
        title: 'Run AI Agents on the Web',
        text: 'Open the side panel to get started.',
        triangleSide: 'right',
        triangleOffset: 28,
        rightOffset: 60,
        topOffset: -16,
        anchorElement: targetElement,
        observeElement: this.container.getElement(),
        onCloseAction: async () => {
          await tooltipGuideStorage.set('OPEN_SIDE_PANEL', true);

          this.addTooltipGuideUseWorkers();
        },
      });

      tooltip.show();

      document.body.appendChild(tooltip.getElement());
      this.tooltipGuides.set('OPEN_SIDE_PANEL', tooltip);
    }, 100);
  }

  private async addTooltipGuideUseWorkers(): Promise<void> {
    const hasShown = await tooltipGuideStorage.get('USE_WORKERS');

    if (hasShown) {
      return;
    }

    setTimeout(() => {
      const tooltip = new TooltipGuide({
        title: 'Click on any AI Agent to run it',
        text: 'Or find out more information about the Agent by navigating to the details page.',
        triangleSide: 'right',
        triangleOffset: 42,
        rightOffset: 16,
        topOffset: 100,
        nextActionLabel: 'Finish',
        onNextAction: async () => {
          await tooltipGuideStorage.set('USE_WORKERS', true);
        },
        onCloseAction: async () => {
          await tooltipGuideStorage.set('USE_WORKERS', true);
        },
      });

      tooltip.show();

      document.body.appendChild(tooltip.getElement());
      this.tooltipGuides.set('USE_WORKERS', tooltip);
      tooltipGuideStorage.set('USE_WORKERS', true);
    }, 100);
  }
}
