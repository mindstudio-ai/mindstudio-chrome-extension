import { FrameDimensions } from '../../../shared/constants';
import { Tooltip } from './tooltip';
import { DEFAULT_DIMENSIONS } from './modules/types';

export class AddNewAppButton {
  private container: HTMLElement;
  private tooltip: Tooltip;

  constructor(onClickHandler: () => void) {
    this.container = this.createContainer(onClickHandler);
    this.tooltip = new Tooltip({
      text: 'Add Workers',
      rightOffset: FrameDimensions.LAUNCHER.VISUAL_WIDTH + 5,
    });
  }

  private createContainer(onClickHandler: () => void): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: ${DEFAULT_DIMENSIONS.BASE_WIDTH}px;
      height: ${DEFAULT_DIMENSIONS.COLLAPSED_HEIGHT}px;
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

    const icon = document.createElement('div');
    icon.innerHTML = `
     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 4C0 1.79086 1.79086 0 4 0H20C22.2091 0 24 1.79086 24 4V20C24 22.2091 22.2091 24 20 24H4C1.79086 24 0 22.2091 0 20V4Z" fill="#121213" fill-opacity="0.5"/>
      <path d="M12 5.5V18.5M5.5 12H18.5" stroke="#99999A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    icon.style.cssText = `
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease-in-out;
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
      onClickHandler();
    });

    iconContainer.appendChild(icon);
    container.appendChild(iconContainer);

    return container;
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public getTooltip(): HTMLElement {
    return this.tooltip.getElement();
  }
}
