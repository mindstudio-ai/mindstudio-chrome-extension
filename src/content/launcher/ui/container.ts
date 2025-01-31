import { FrameDimensions, ZIndexes } from '../../../shared/constants';
import { createElementId } from '../../../shared/utils/dom';
import { storage } from '../../../shared/services/storage';
import { Tooltip } from './tooltip';

export class LauncherContainer {
  static readonly ElementId = {
    CONTAINER: createElementId('Launcher'),
    INNER: createElementId('LauncherInner'),
    APPS_CONTAINER: createElementId('LauncherAppsContainer'),
  };

  private static readonly DEFAULT_BOTTOM_POSITION = 128;

  private element: HTMLElement;
  private appsContainer: HTMLElement;
  private settingsTooltip: Tooltip;
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private initialPositionY: number = 0;
  private wasDragged: boolean = false; // Track if actual dragging occurred

  constructor() {
    this.element = this.createLauncherElement();
    this.appsContainer = this.createAppsContainer();
    this.settingsTooltip = new Tooltip({ text: 'Settings' });

    this.getInnerElement().appendChild(this.appsContainer);
    this.element.appendChild(this.settingsTooltip.getElement());

    // Initialize with visibility hidden to prevent flash
    this.element.style.visibility = 'hidden';

    this.initializeDragHandling();
    this.initializePosition();
  }

  private async initializePosition(): Promise<void> {
    // Get saved position or convert default bottom position to top position
    const savedPosition = await storage.get('LAUNCHER_POSITION_Y');
    const defaultTopPosition =
      window.innerHeight - (LauncherContainer.DEFAULT_BOTTOM_POSITION + 40); // 40 is collapsed height

    // Set initial position
    this.setVerticalPosition(savedPosition ?? defaultTopPosition);

    // Now add to DOM and show
    document.body.appendChild(this.element);
    this.element.style.visibility = 'visible';

    // Enable transitions after initial render
    requestAnimationFrame(() => {
      this.element.style.transition = 'bottom 0.2s ease-out';
    });
  }

  private async loadSavedPosition(): Promise<void> {
    const savedPosition = await storage.get('LAUNCHER_POSITION_Y');
    if (savedPosition !== null) {
      this.setVerticalPosition(savedPosition);
    }
  }

  private setVerticalPosition(y: number): void {
    // Convert top position to bottom position
    const bottomPosition = window.innerHeight - y - this.element.offsetHeight;
    // Constrain the position to keep the launcher fully visible
    const maxBottom = window.innerHeight - this.element.offsetHeight;
    const constrainedBottom = Math.max(0, Math.min(bottomPosition, maxBottom));
    this.element.style.bottom = `${constrainedBottom}px`;
    this.element.style.top = 'auto';
  }

  private initializeDragHandling(): void {
    const inner = this.getInnerElement();

    const handleDragStart = (e: MouseEvent) => {
      if (inner.style.width !== '48px') {
        return;
      }

      this.isDragging = true;
      this.wasDragged = false; // Reset drag state
      this.dragStartY = e.clientY;
      // Convert bottom position to top position for dragging
      this.initialPositionY =
        window.innerHeight -
        (parseInt(this.element.style.bottom) + this.element.offsetHeight);

      // Prevent transitions during drag
      this.element.style.transition = 'none';

      // Prevent text selection during drag
      e.preventDefault();
    };

    const handleDrag = (e: MouseEvent) => {
      if (!this.isDragging) {
        return;
      }

      const deltaY = e.clientY - this.dragStartY;
      // Only consider it a drag if moved more than 5px
      if (Math.abs(deltaY) > 5) {
        this.wasDragged = true;
      }

      const newPosition = this.initialPositionY + deltaY;
      this.setVerticalPosition(newPosition);
    };

    const handleDragEnd = async () => {
      if (!this.isDragging) {
        return;
      }

      this.isDragging = false;

      // Re-enable transitions
      this.element.style.transition = '';

      // Save the new position (convert from bottom to top position for storage)
      const topPosition =
        window.innerHeight -
        (parseInt(this.element.style.bottom) + this.element.offsetHeight);
      await storage.set('LAUNCHER_POSITION_Y', topPosition);
    };

    // Add event listeners
    inner.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
  }

  private createLauncherElement(): HTMLElement {
    const launcher = document.createElement('div');
    launcher.id = LauncherContainer.ElementId.CONTAINER;
    launcher.style.cssText = `
      position: fixed;
      right: 0;
      width: ${FrameDimensions.LAUNCHER.TOTAL_WIDTH}px;
      z-index: ${ZIndexes.LAUNCHER};
      background: transparent;
      pointer-events: none;
    `;

    const inner = document.createElement('div');
    inner.id = LauncherContainer.ElementId.INNER;
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
      height: 40px;
      cursor: pointer;
      user-select: none;
    `;

    launcher.appendChild(inner);
    return launcher;
  }

  private createAppsContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = LauncherContainer.ElementId.APPS_CONTAINER;
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
      inner.style.height = 'auto';
      const targetHeight = Math.min(
        inner.offsetHeight,
        window.innerHeight - 256,
      );
      inner.style.height = `${targetHeight}px`;
      this.appsContainer.style.opacity = '1';
    }

    // Enable transitions only after initial state is set
    requestAnimationFrame(() => this.enableTransitions());
  }

  public setCollapsedState(collapsed: boolean): void {
    const inner = this.getInnerElement();

    // Ensure transitions are enabled
    this.enableTransitions();

    if (collapsed) {
      inner.style.height = '40px';
      inner.style.width = '48px';
      inner.style.cursor = 'pointer';
      this.appsContainer.style.opacity = '0';
    } else {
      inner.style.cursor = 'default';
      inner.style.width = '40px';

      // First calculate the target height
      inner.style.height = 'auto';
      const targetHeight = Math.min(
        inner.offsetHeight,
        window.innerHeight - 256,
      );

      // Reset to collapsed height
      inner.style.height = '40px';

      // Force a reflow
      inner.offsetHeight;

      // Animate to target height
      inner.style.height = `${targetHeight}px`;
      this.appsContainer.style.opacity = '1';
    }
  }

  public setExpandClickHandler(handler: (e: MouseEvent) => void): void {
    const inner = this.getInnerElement();

    // Handle click on the entire inner element when collapsed
    inner.addEventListener('click', (e) => {
      if (inner.style.width === '48px' && !this.wasDragged) {
        e.stopPropagation();
        handler(e);
      }
      this.wasDragged = false; // Reset for next interaction
    });
  }

  public addTooltip(tooltip: HTMLElement): void {
    this.element.appendChild(tooltip);
  }

  public getSettingsTooltip(): Tooltip {
    return this.settingsTooltip;
  }

  public recalculateHeight(): void {
    const inner = this.getInnerElement();
    if (inner.style.width === '48px') {
      return; // Don't recalculate if collapsed
    }

    // Temporarily set height to auto to get natural height
    inner.style.height = 'auto';
    const height = inner.offsetHeight;

    // Set the final height with max height constraint
    inner.style.height = `${Math.min(height, window.innerHeight - 256)}px`;
  }
}
