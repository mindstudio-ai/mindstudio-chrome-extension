import { AppButton } from './app-button';
import { AppsButton } from './apps-button';
import { CollapseButton } from './collapse';
import { LauncherContainer } from './container';
import { Logo } from './logo';
import { AppData } from '../../../shared/types/app';

export class LauncherUI {
  private container: LauncherContainer;
  private collapseButton: CollapseButton;
  private logo: Logo;
  private appsButton: AppsButton;
  private appButtons: Map<string, AppButton> = new Map();

  constructor(
    private onAppClick: (app: AppData) => void,
    private onCollapse: () => void,
    private onExpand: () => void,
  ) {
    this.container = new LauncherContainer();
    this.collapseButton = new CollapseButton(onCollapse);
    this.logo = new Logo();
    this.appsButton = new AppsButton();
    this.setupUI();
  }

  private setupUI(): void {
    const inner = this.container.getInnerElement();
    inner.appendChild(this.collapseButton.getElement());
    inner.appendChild(this.appsButton.getElement());
    inner.appendChild(this.logo.getElement());
    document.body.appendChild(this.container.getElement());
    this.container.addTooltip(this.appsButton.getTooltip());

    // Setup logo settings functionality
    const logoElement = this.logo.getElement();
    logoElement.addEventListener('mouseenter', () => {
      if (inner.style.width !== '48px') {
        this.container.getSettingsTooltip().show(logoElement);
      }
    });

    logoElement.addEventListener('mouseleave', () => {
      this.container.getSettingsTooltip().hide();
    });

    logoElement.addEventListener('click', (e) => {
      if (inner.style.width !== '48px') {
        e.stopPropagation();
        chrome.runtime.sendMessage({
          _MindStudioEvent: '@@mindstudio/settings/open',
          payload: undefined,
        });
      }
    });

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

  setCollapsed(collapsed: boolean, isInitial: boolean = false): void {
    if (isInitial) {
      this.container.setInitialState(collapsed);
    } else {
      this.container.setCollapsedState(collapsed);
    }
    this.collapseButton.setVisibility(!collapsed);
    this.appsButton.setVisibility(!collapsed);
  }
}
