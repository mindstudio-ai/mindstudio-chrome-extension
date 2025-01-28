import { ElementIds, FrameDimensions, ZIndexes } from '../../constants';
import { AppData } from '../../types';

export class AppButton {
  private container: HTMLElement;
  private tooltip: HTMLElement;
  private app: AppData;

  constructor(app: AppData, onClickHandler: (app: AppData) => void) {
    this.app = app;
    this.container = this.createContainer(onClickHandler);
    this.tooltip = this.createTooltip();
  }

  private createContainer(onClickHandler: (app: AppData) => void): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 40px;
      height: 40px;
      pointer-events: auto;
      flex-shrink: 0;
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
    `;

    const icon = document.createElement('img');
    icon.src = this.app.iconUrl;
    icon.alt = `${this.app.name} icon`;
    icon.style.cssText = `
      width: 24px;
      height: 24px;
      border-radius: 4px;
      object-fit: cover;
      transition: all 0.2s ease-in-out;
    `;

    // Add hover effects
    container.addEventListener('mouseenter', () => {
      this.tooltip.style.opacity = '1';
      // Position the tooltip at the center of the container
      const rect = container.getBoundingClientRect();
      this.tooltip.style.top = `${rect.top + rect.height / 2}px`;

      icon.style.width = '30px';
      icon.style.height = '30px';
      iconContainer.style.width = '30px';
      iconContainer.style.height = '30px';
    });

    container.addEventListener('mouseleave', () => {
      this.tooltip.style.opacity = '0';
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

  private createTooltip(): HTMLElement {
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      opacity: 0;
      display: flex;
      max-width: 200px;
      padding: 8px 12px;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      
      position: fixed;
      right: ${FrameDimensions.LAUNCHER.VISUAL_WIDTH + 5}px;
      transform: translateY(-50%);
      
      border-radius: 8px;
      background: #121213;
      box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.04), 0px 4px 12px 0px rgba(0, 0, 0, 0.15);
      
      color: #FEFEFF;
      font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 12px;
      font-weight: 400;
      line-height: 120%;
      text-align: right;
      
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      
      pointer-events: none;
      z-index: ${ZIndexes.LAUNCHER + 1};
      transition: opacity 0.2s ease-in-out;
    `;
    tooltip.textContent = this.app.name;
    return tooltip;
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public getTooltip(): HTMLElement {
    return this.tooltip;
  }

  public updateApp(app: AppData): void {
    this.app = app;
    const icon = this.container.querySelector('img');
    if (icon && icon.src !== app.iconUrl) {
      icon.src = app.iconUrl;
    }
    this.tooltip.textContent = app.name;
  }
}
