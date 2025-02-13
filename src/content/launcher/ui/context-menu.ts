import { Position } from './modules/types';

interface ContextMenuItem {
  icon: string;
  label: string;
  onClick: () => void;
  useMouseDown?: boolean;
}

export class ContextMenu {
  private element: HTMLDivElement;
  private isVisible = false;
  private container: HTMLElement | null = null;
  private onHideCallback: (() => void) | undefined;

  constructor(
    private items: ContextMenuItem[],
    private getPosition: () => Position | null,
  ) {
    this.element = document.createElement('div');
    this.element.className = 'mindstudio-context-menu';
    this.setupStyles();
    this.createMenuItems();

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target as Node)) {
        this.hide();
      }
    });
  }

  private setupStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .mindstudio-context-menu {
        position: fixed;
        display: flex;
        width: 160px;
        padding: 8px;
        flex-direction: column;
        align-items: flex-start;
        border-radius: 8px;
        border: 1px solid rgba(18, 18, 19, 0.10);
        background: rgba(18, 18, 19, 0.85);
        box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.15), 0px 0px 4px 0px rgba(0, 0, 0, 0.04);
        backdrop-filter: blur(3px);
        z-index: 10000;
        display: none;
      }

      .mindstudio-context-menu-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        width: 100%;
        box-sizing: border-box;
        color: #F6F6F7;
        cursor: pointer;
        border-radius: 4px;
        font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 12px;
        font-style: normal;
        font-weight: 400;
        line-height: 120%;
        transition: background-color 0.2s;
      }

      .mindstudio-context-menu-item:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      .mindstudio-context-menu-item svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      .mindstudio-context-menu-divider {
        height: 1px;
        background-color: rgba(255, 255, 255, 0.1);
        margin: 4px 0;
        width: 100%;
      }
    `;
    document.head.appendChild(style);
  }

  private createMenuItems() {
    this.items.forEach((item, index) => {
      if (index > 0 && index === this.items.length - 1) {
        // Add divider before last item
        const divider = document.createElement('div');
        divider.className = 'mindstudio-context-menu-divider';
        this.element.appendChild(divider);
      }

      const menuItem = document.createElement('div');
      menuItem.className = 'mindstudio-context-menu-item';
      menuItem.innerHTML = `
        ${item.icon}
        <span>${item.label}</span>
      `;

      const handleAction = () => {
        item.onClick();
        this.hide();
      };

      if (item.useMouseDown) {
        menuItem.addEventListener('mousedown', handleAction);
      } else {
        menuItem.addEventListener('click', handleAction);
      }

      this.element.appendChild(menuItem);
    });
  }

  setContainer(container: HTMLElement) {
    this.container = container;
    if (!document.body.contains(this.element)) {
      document.body.appendChild(this.element);
    }
  }

  show(anchorElement: HTMLElement) {
    if (!this.container) {
      console.error('Container not set for context menu');
      return;
    }

    this.element.style.display = 'flex';

    // Get current position to determine alignment
    const position = this.getPosition();
    const isTopAnchored = position?.anchor === 'top';

    // Get positions
    const anchorRect = anchorElement.getBoundingClientRect();

    // Calculate position relative to the anchor
    const menuRect = this.element.getBoundingClientRect();
    let left = anchorRect.right + 8;
    let top = isTopAnchored
      ? anchorRect.top
      : anchorRect.bottom - menuRect.height;

    // Adjust position if menu would go off screen
    if (left + menuRect.width > window.innerWidth) {
      left = anchorRect.left - menuRect.width - 16;
    }
    if (top < 0) {
      top = 0;
    }
    if (top + menuRect.height > window.innerHeight) {
      top = window.innerHeight - menuRect.height;
    }

    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;
    this.isVisible = true;
  }

  hide() {
    this.element.style.display = 'none';
    this.isVisible = false;

    if (this.onHideCallback) {
      this.onHideCallback();
    }
  }

  toggle(anchorElement: HTMLElement) {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show(anchorElement);
    }
  }

  getElement(): HTMLElement {
    return this.element;
  }

  setOnHideCallback(callback: () => void) {
    this.onHideCallback = callback;
  }
}
