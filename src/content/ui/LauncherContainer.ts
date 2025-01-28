import { ElementIds, FrameDimensions, ZIndexes } from '../../common/constants';
import { Tooltip } from './Tooltip';

export class LauncherContainer {
  private element: HTMLElement;
  private appsContainer: HTMLElement;
  private settingsTooltip: Tooltip;

  constructor() {
    this.element = this.createLauncherElement();
    this.appsContainer = this.createAppsContainer();
    this.settingsTooltip = new Tooltip({ text: 'Settings' });

    this.getInnerElement().appendChild(this.appsContainer);
    this.element.appendChild(this.settingsTooltip.getElement());
  }

  private createLauncherElement(): HTMLElement {
    const launcher = document.createElement('div');
    launcher.id = ElementIds.LAUNCHER;
    launcher.style.cssText = `
      position: fixed;
      bottom: 128px;
      right: 0;
      width: ${FrameDimensions.LAUNCHER.TOTAL_WIDTH}px;
      z-index: ${ZIndexes.LAUNCHER};
      background: transparent;
      pointer-events: none;
    `;

    const inner = document.createElement('div');
    inner.style.cssText = `
      margin-left: auto;
      width: 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      position: relative;
      background: rgba(18, 18, 19, 0.85);
      padding: 4px 0;
      border-radius: 8px 0 0 8px;
      box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.04), 0px 8px 16px 0px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      pointer-events: all;
      box-sizing: border-box;
      height: 40px; /* Initial collapsed height */
      cursor: pointer;
    `;

    launcher.appendChild(inner);
    return launcher;
  }

  private createAppsContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'apps-container';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 0 0;
      flex: 1;
      width: 100%;
      overflow-y: auto;
      opacity: 0;
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    `;
    return container;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public getInnerElement(): HTMLElement {
    return this.element.firstElementChild as HTMLElement;
  }

  public getAppsContainer(): HTMLElement {
    return this.appsContainer;
  }

  private enableTransitions(): void {
    const inner = this.getInnerElement();
    inner.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    this.appsContainer.style.transition = 'opacity 0.2s ease-in-out';
  }

  public setInitialState(collapsed: boolean): void {
    const inner = this.getInnerElement();
    if (collapsed) {
      inner.style.height = '40px';
      inner.style.width = '48px';
      inner.style.cursor = 'pointer';
      this.appsContainer.style.opacity = '0';
    } else {
      inner.style.cursor = 'default';
      inner.style.width = '40px';
      // First set height to auto to get the natural height
      inner.style.height = 'auto';
      // Get the natural height
      const height = inner.offsetHeight;
      // Set the final height
      inner.style.height = `${Math.min(height, window.innerHeight - 256)}px`;
      this.appsContainer.style.opacity = '1';
    }
    // Enable transitions after initial state is set
    setTimeout(() => this.enableTransitions(), 0);
  }

  public setCollapsedState(collapsed: boolean): void {
    const inner = this.getInnerElement();
    if (collapsed) {
      inner.style.height = '40px';
      inner.style.width = '48px';
      inner.style.cursor = 'pointer';
      this.appsContainer.style.opacity = '0';
    } else {
      inner.style.cursor = 'default';
      inner.style.width = '40px';
      inner.style.height = 'auto';
      const height = inner.offsetHeight;
      inner.style.height = '40px';

      // Force a reflow
      inner.offsetHeight;

      inner.style.height = `${Math.min(height, window.innerHeight - 256)}px`;
      this.appsContainer.style.opacity = '1';
    }
  }

  public setExpandClickHandler(handler: (e: MouseEvent) => void): void {
    const inner = this.getInnerElement();
    const logoElement = inner.querySelector('div:has(svg)') as HTMLElement; // Find the logo div containing SVG

    // Handle click on the entire inner element when collapsed
    inner.addEventListener('click', (e) => {
      if (inner.style.width === '48px') {
        e.stopPropagation();
        handler(e);
      }
    });

    // Handle settings click and tooltip only on logo when expanded
    if (logoElement) {
      logoElement.addEventListener('mouseenter', () => {
        if (inner.style.width !== '48px') {
          this.settingsTooltip.show(logoElement);
        }
      });

      logoElement.addEventListener('mouseleave', () => {
        this.settingsTooltip.hide();
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
    }
  }

  public addTooltip(tooltip: HTMLElement): void {
    this.element.appendChild(tooltip);
  }
}
