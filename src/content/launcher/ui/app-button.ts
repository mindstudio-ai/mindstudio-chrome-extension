import { FrameDimensions } from '../../../shared/constants';
import { AppData } from '../../../shared/types/app';
import { appendQueryParam } from '../../../shared/utils/url';
import { Tooltip } from './tooltip';
import { DEFAULT_DIMENSIONS } from './modules/types';

export class AppButton {
  private container: HTMLElement;
  private tooltip: Tooltip;
  private app: AppData;

  constructor(app: AppData, onClickHandler: (app: AppData) => void) {
    this.app = app;
    this.container = this.createContainer(onClickHandler);
    this.tooltip = new Tooltip({
      text: app.name,
      rightOffset: FrameDimensions.LAUNCHER.VISUAL_WIDTH + 5,
    });
  }

  private createContainer(onClickHandler: (app: AppData) => void): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: ${DEFAULT_DIMENSIONS.BASE_WIDTH}px;
      height: ${DEFAULT_DIMENSIONS.APP_ICON_HEIGHT}px;
      pointer-events: auto;
      flex-shrink: 0;
      box-sizing: border-box;
    `;

    // Create icon container
    const iconContainer = document.createElement('div');
    iconContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      transition: all 0.2s ease-in-out;
      box-sizing: border-box;
    `;

    const icon = document.createElement('img');
    icon.src = this.getScaledIconSrc(this.app.iconUrl);
    icon.alt = `${this.app.name} icon`;
    icon.style.cssText = `
      width: 24px;
      height: 24px;
      border-radius: 4px;
      object-fit: cover;
      transition: all 0.2s ease-in-out;
      box-sizing: border-box;
    `;

    // Add hover effects
    container.addEventListener('mouseenter', () => {
      this.tooltip.show(container);
      icon.style.width = '30px';
      icon.style.height = '30px';
      iconContainer.style.width = '30px';
      iconContainer.style.height = '30px';
    });

    container.addEventListener('mouseleave', () => {
      this.tooltip.hide();
      icon.style.width = '24px';
      icon.style.height = '24px';
      iconContainer.style.width = '24px';
      iconContainer.style.height = '24px';
    });

    container.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      onClickHandler(this.app);
    });

    iconContainer.appendChild(icon);
    container.appendChild(iconContainer);
    container.setAttribute('data-app-id', this.app.id);

    return container;
  }

  private getScaledIconSrc(url: string): string {
    return appendQueryParam(url, 'w', '96');
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public getTooltip(): HTMLElement {
    return this.tooltip.getElement();
  }

  public updateApp(app: AppData): void {
    this.app = app;
    const icon = this.container.querySelector('img');
    if (icon && icon.src !== this.getScaledIconSrc(app.iconUrl)) {
      icon.src = this.getScaledIconSrc(app.iconUrl);
    }
    this.tooltip.setText(app.name);
  }
}
