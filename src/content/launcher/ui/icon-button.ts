import { Tooltip } from './tooltip';

export interface IconButtonOptions {
  icon: string;
  tooltipText: string;
  onClick?: () => void;
}

export class IconButton {
  private element: HTMLButtonElement;
  private tooltip: Tooltip;

  constructor(options: IconButtonOptions) {
    this.element = document.createElement('button');
    this.element.className = 'icon-button';
    this.element.innerHTML = options.icon;

    if (options.onClick) {
      this.element.addEventListener('click', (e) => {
        e.stopPropagation();
        if (options.onClick) {
          options.onClick();
        }
      });
    }

    // Create tooltip
    this.tooltip = new Tooltip({
      text: options.tooltipText,
    });

    // Setup tooltip behavior
    this.element.addEventListener('mouseenter', () => {
      this.tooltip.show(this.element);
    });

    this.element.addEventListener('mouseleave', () => {
      this.tooltip.hide();
    });

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .icon-button {
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .icon-button svg {
        width: 20px;
        height: 20px;
      }

      .icon-button svg path {
        transition: stroke 0.2s ease-in-out;
      }

      .icon-button:hover svg path {
        stroke: #FEFEFF;
      }
    `;
    document.head.appendChild(style);
  }

  getElement(): HTMLButtonElement {
    return this.element;
  }

  getTooltip(): HTMLElement {
    return this.tooltip.getElement();
  }

  setVisibility(visible: boolean): void {
    this.element.style.display = visible ? 'flex' : 'none';
  }
}
