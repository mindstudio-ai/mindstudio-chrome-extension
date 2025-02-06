import { Tooltip } from './tooltip';

export interface IconButtonOptions {
  icon: string;
  tooltipText?: string;
  onClick?: () => void;
}

export class IconButton {
  private element: HTMLButtonElement;
  private tooltip?: Tooltip;

  constructor(options: IconButtonOptions) {
    this.element = document.createElement('button');
    this.element.className = 'icon-button';
    this.element.innerHTML = options.icon;
    this.element.style.cssText = `
      height: 0;
      opacity: 0;
      margin: 0;
      padding: 0;
      overflow: hidden;
    `;

    if (options.onClick) {
      this.element.addEventListener('click', (e) => {
        e.stopPropagation();
        if (options.onClick) {
          options.onClick();
        }
      });
    }

    // Create tooltip only if text is provided
    if (options.tooltipText) {
      this.tooltip = new Tooltip({
        text: options.tooltipText,
      });

      // Setup tooltip behavior
      this.element.addEventListener('mouseenter', () => {
        this.tooltip?.show(this.element);
      });

      this.element.addEventListener('mouseleave', () => {
        this.tooltip?.hide();
      });
    }

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .icon-button {
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
      }

      .icon-button svg {
        width: 20px;
        height: 20px;
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

  getTooltip(): HTMLElement | undefined {
    return this.tooltip?.getElement();
  }

  public setVisibility(visible: boolean, animate: boolean = true): void {
    if (animate) {
      this.element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    } else {
      this.element.style.transition = 'none';
    }

    requestAnimationFrame(() => {
      if (visible) {
        this.element.style.height = '40px';
        this.element.style.opacity = '1';
        this.element.style.padding = '8px';
        this.element.style.margin = '0';
      } else {
        this.element.style.height = '0';
        this.element.style.opacity = '0';
        this.element.style.padding = '0';
        this.element.style.margin = '0';
      }

      // If not animating, restore transitions after the next frame
      if (!animate) {
        requestAnimationFrame(() => {
          this.element.style.transition =
            'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });
      }
    });
  }
}
