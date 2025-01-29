import { AppButton } from './app-button';
import { CollapseButton } from './collapse';
import { LauncherContainer } from './container';
import { Logo } from './logo';
import { AppData } from '../../../shared/types/app';

export class LauncherUI {
  private container: LauncherContainer;
  private collapseButton: CollapseButton;
  private logo: Logo;
  private appButtons: Map<string, AppButton> = new Map();

  constructor(
    private onAppClick: (app: AppData) => void,
    private onCollapse: () => void,
    private onExpand: () => void,
  ) {
    this.container = new LauncherContainer();
    this.collapseButton = new CollapseButton(onCollapse);
    this.logo = new Logo();
    this.setupUI();
  }

  private setupUI(): void {
    const inner = this.container.getInnerElement();
    inner.appendChild(this.collapseButton.getElement());
    inner.appendChild(this.logo.getElement());
    document.body.appendChild(this.container.getElement());

    this.container.setExpandClickHandler(this.onExpand);
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

  setCollapsed(collapsed: boolean): void {
    this.container.setCollapsedState(collapsed);
    this.collapseButton.setVisibility(!collapsed);
  }
}
