import { RootUrl } from '../../../shared/constants';
import { createElementId } from '../../../shared/utils/dom';
import { Tooltip } from './tooltip';

export class AppsButton {
  static readonly ElementId = {
    BUTTON: createElementId('LauncherAppsButton'),
  };

  private element: HTMLElement;
  private tooltip: Tooltip;

  constructor() {
    this.tooltip = new Tooltip({ text: 'Add Workers' });
    this.element = this.createButton();
  }

  private createButton(): HTMLElement {
    const button = document.createElement('div');
    button.id = AppsButton.ElementId.BUTTON;
    button.style.cssText = `
      padding: 8px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s ease-in-out;
      flex-shrink: 0;
      color: #99999A;
      pointer-events: auto;
      cursor: pointer;
      opacity: 0;
    `;

    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M14 7H20M17 4V10M4 5C4 4.73478 4.10536 4.48043 4.29289 4.29289C4.48043 4.10536 4.73478 4 5 4H9C9.26522 4 9.51957 4.10536 9.70711 4.29289C9.89464 4.48043 10 4.73478 10 5V9C10 9.26522 9.89464 9.51957 9.70711 9.70711C9.51957 9.89464 9.26522 10 9 10H5C4.73478 10 4.48043 9.89464 4.29289 9.70711C4.10536 9.51957 4 9.26522 4 9V5ZM4 15C4 14.7348 4.10536 14.4804 4.29289 14.2929C4.48043 14.1054 4.73478 14 5 14H9C9.26522 14 9.51957 14.1054 9.70711 14.2929C9.89464 14.4804 10 14.7348 10 15V19C10 19.2652 9.89464 19.5196 9.70711 19.7071C9.51957 19.8946 9.26522 20 9 20H5C4.73478 20 4.48043 19.8946 4.29289 19.7071C4.10536 19.5196 4 19.2652 4 19V15ZM14 15C14 14.7348 14.1054 14.4804 14.2929 14.2929C14.4804 14.1054 14.7348 14 15 14H19C19.2652 14 19.5196 14.1054 19.7071 14.2929C19.8946 14.4804 20 14.7348 20 15V19C20 19.2652 19.8946 19.5196 19.7071 19.7071C19.5196 19.8946 19.2652 20 19 20H15C14.7348 20 14.4804 19.8946 14.2929 19.7071C14.1054 19.5196 14 19.2652 14 19V15Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    button.addEventListener('mouseenter', () => {
      this.tooltip.show(button);
      button.style.color = '#FEFEFE';
    });

    button.addEventListener('mouseleave', () => {
      this.tooltip.hide();
      button.style.color = '#99999A';
    });

    button.addEventListener('click', () => {
      window.open(RootUrl, '_blank');
    });

    return button;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public getTooltip(): HTMLElement {
    return this.tooltip.getElement();
  }

  public setVisibility(visible: boolean): void {
    this.element.style.opacity = visible ? '1' : '0';
    this.element.style.pointerEvents = visible ? 'auto' : 'none';
  }
}
