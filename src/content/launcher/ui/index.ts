import { AppButton } from './app-button';
import { AppsButton } from './apps-button';
import { LauncherContainer } from './container';
import { Logo } from './logo';
import { AppData } from '../../../shared/types/app';

export class LauncherUI {
  private container: LauncherContainer;
  private logo: Logo;
  private appsButton: AppsButton;
  private appButtons: Map<string, AppButton> = new Map();

  constructor(
    private onAppClick: (app: AppData) => void,
    private onCollapse: () => void,
    private onExpand: () => void,
  ) {
    this.container = new LauncherContainer();
    this.logo = new Logo();
    this.appsButton = new AppsButton();
    this.setupUI();
  }

  private async setupUI(): Promise<void> {
    // Add components to container
    this.container.addComponent(this.appsButton.getElement());
    this.container.addComponent(this.logo.getElement());

    // Add tooltips
    this.container.addTooltip(this.appsButton.getTooltip());

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

  updateApps(apps: AppData[]): void {
    const appsContainer = this.container.getAppsContainer();
    const existingButtons = new Map(this.appButtons);
    this.appButtons.clear();

    apps.forEach((app) => {
      const existingButton = existingButtons.get(app.id);
      if (existingButton) {
        existingButtons.delete(app.id);
        existingButton.updateApp(app);
        this.appButtons.set(app.id, existingButton);
      } else {
        const newButton = new AppButton(app, this.onAppClick);
        appsContainer.appendChild(newButton.getElement());
        this.container.addTooltip(newButton.getTooltip());
        this.appButtons.set(app.id, newButton);
      }
    });

    existingButtons.forEach((button) => {
      button.getElement().remove();
      button.getTooltip().remove();
    });

    // Recalculate container height after updating apps
    requestAnimationFrame(() => {
      this.container.recalculateHeight();
    });
  }

  setCollapsed(collapsed: boolean, isInitial: boolean = false): void {
    this.container.setCollapsedState(collapsed, isInitial);
    this.appsButton.setVisibility(!collapsed);
  }
}
