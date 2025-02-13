import { FrameDimensions, ZIndexes } from '../../../shared/constants';
import { createElementId } from '../../../shared/utils/dom';
import { DragHandler } from './modules/drag-handler';
import { ExpansionManager } from './modules/expansion-manager';
import { PositionManager } from './modules/position-manager';
import { storage } from '../../../shared/services/storage';
import { DEFAULT_DIMENSIONS, EVENTS } from './modules/types';
import { CollapseCaret } from './collapse-caret';
import { DragHandle } from './drag-handle';

export class LauncherContainer {
  private static readonly ElementId = {
    CONTAINER: createElementId('Launcher'),
    INNER: createElementId('LauncherInner'),
    APPS_WRAPPER: createElementId('LauncherAppsWrapper'),
    APPS_CONTAINER: createElementId('LauncherAppsContainer'),
    APPS_SCROLL_TOP_FADE: createElementId('LauncherAppsScrollTopFade'),
    APPS_SCROLL_BOTTOM_FADE: createElementId('LauncherAppsScrollBottomFade'),
  };

  private static readonly Styles = {
    container: `
      position: fixed;
      bottom: 128px;
      right: 0;
      background: transparent;
      pointer-events: none;
    `,
    inner: `
      margin-left: auto;
      width: ${DEFAULT_DIMENSIONS.BASE_WIDTH}px;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      background: rgba(18, 18, 19, 0.85);
      padding: 4px 0;
      border-radius: 8px 0 0 8px;
      box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.04), 0px 8px 16px 0px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      pointer-events: all;
      box-sizing: border-box;
      cursor: pointer;
      user-select: none;
      transition: width 0.2s ease-out;
    `,
    appsWrapper: `
      position: relative;
      width: 100%;
      display: flex;
      flex-direction: column;
      max-height: ${DEFAULT_DIMENSIONS.MAX_APPS_CONTAINER_HEIGHT}px;
      overflow: hidden;
    `,
    appsContainer: `
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0;
      width: 100%;
      overflow-y: auto;
      scrollbar-width: none;
    `,
    scrollFade: `
      position: absolute;
      left: 0;
      right: 0;
      height: 32px;
      pointer-events: none;
      z-index: 1;
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
    `,
    scrollFadeTop: `
      top: 0;
      background: linear-gradient(180deg, rgba(18, 18, 19, 0.85) 0%, rgba(54, 54, 54, 0) 100%);
    `,
    scrollFadeBottom: `
      bottom: 0;
      background: linear-gradient(0deg, rgba(18, 18, 19, 0.85) 0%, rgba(54, 54, 54, 0) 100%);
    `,
  };

  private readonly element: HTMLElement;
  private readonly inner: HTMLElement;
  private readonly appsWrapper: HTMLElement;
  private readonly appsContainer: HTMLElement;
  private readonly topFade: HTMLElement;
  private readonly bottomFade: HTMLElement;
  private positionManager!: PositionManager;
  private resizeObserver!: ResizeObserver;
  private dragHandler!: DragHandler;
  private expansionManager!: ExpansionManager;
  private isHovered: boolean = false;
  private collapseCaret!: CollapseCaret;
  private dragHandle!: DragHandle;
  private isDragging: boolean = false;

  constructor(collapseCaret: CollapseCaret) {
    this.collapseCaret = collapseCaret;

    this.element = this.createContainerElement();
    this.inner = this.createInnerElement();
    this.appsWrapper = this.createAppsWrapperElement();
    this.appsContainer = this.createAppsContainerElement();
    this.topFade = this.createScrollFadeElement('top');
    this.bottomFade = this.createScrollFadeElement('bottom');

    // Setup DOM structure
    this.appsWrapper.appendChild(this.appsContainer);
    this.appsWrapper.appendChild(this.topFade);
    this.appsWrapper.appendChild(this.bottomFade);
    this.inner.appendChild(this.collapseCaret.getElement());
    this.inner.appendChild(this.appsWrapper);
    this.element.appendChild(this.inner);

    // Set initial collapsed state
    this.appsWrapper.style.height = '0';
    this.appsWrapper.style.opacity = '0';
    this.appsWrapper.style.transition =
      'height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease-in-out';
    this.appsContainer.style.scrollbarWidth = 'none';

    // Add hover handler
    this.inner.addEventListener('mouseenter', () => {
      this.isHovered = true;
      if (this.expansionManager?.getCollapsedState()) {
        this.inner.style.width = `${DEFAULT_DIMENSIONS.HOVER_WIDTH}px`;
        this.dragHandle.updateVisibility(true);
        this.collapseCaret.updateVisibility(true);
      }
    });

    this.inner.addEventListener('mouseleave', () => {
      this.isHovered = false;
      const isCollapsed = this.expansionManager?.getCollapsedState();
      if (isCollapsed && !this.dragHandler?.wasElementDragged()) {
        this.inner.style.width = `${DEFAULT_DIMENSIONS.BASE_WIDTH}px`;
      }

      if (isCollapsed && !this.isDragging) {
        this.collapseCaret.updateVisibility(false);
        this.dragHandle.updateVisibility(false);
      } else {
        this.dragHandle.updateVisibility(true);
        this.collapseCaret.updateVisibility(true);
      }
    });

    // Listen for drag events to maintain hover state
    this.element.addEventListener(EVENTS.DRAG_START, () => {
      if (this.expansionManager?.getCollapsedState()) {
        this.inner.style.width = `${DEFAULT_DIMENSIONS.HOVER_WIDTH}px`;
      }
      this.isDragging = true;
    });

    this.element.addEventListener(EVENTS.DRAG_END, () => {
      if (this.expansionManager?.getCollapsedState() && !this.isHovered) {
        this.inner.style.width = `${DEFAULT_DIMENSIONS.BASE_WIDTH}px`;
        this.collapseCaret.updateVisibility(false);
        this.dragHandle.updateVisibility(false);
      }
      this.isDragging = false;
    });

    // Initialize with visibility hidden to prevent flash
    this.element.style.visibility = 'hidden';
  }

  public setDragHandle(dragHandle: DragHandle): void {
    this.dragHandle = dragHandle;
  }

  public setDragHandleElement(dragHandleElement: HTMLElement): void {
    this.dragHandler = new DragHandler(
      this.element,
      dragHandleElement,
      this.positionManager,
    );
  }

  private createContainerElement(): HTMLElement {
    const container = document.createElement('div');
    container.id = LauncherContainer.ElementId.CONTAINER;
    container.style.cssText = LauncherContainer.Styles.container;
    container.style.width = `${FrameDimensions.LAUNCHER.TOTAL_WIDTH}px`;
    container.style.zIndex = ZIndexes.LAUNCHER.toString();
    return container;
  }

  private createInnerElement(): HTMLElement {
    const inner = document.createElement('div');
    inner.id = LauncherContainer.ElementId.INNER;
    inner.style.cssText = LauncherContainer.Styles.inner;
    return inner;
  }

  private createAppsWrapperElement(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.id = LauncherContainer.ElementId.APPS_WRAPPER;
    wrapper.style.cssText = LauncherContainer.Styles.appsWrapper;
    return wrapper;
  }

  private createAppsContainerElement(): HTMLElement {
    const container = document.createElement('div');
    container.id = LauncherContainer.ElementId.APPS_CONTAINER;
    container.style.cssText = LauncherContainer.Styles.appsContainer;
    return container;
  }

  private createScrollFadeElement(position: 'top' | 'bottom'): HTMLElement {
    const fade = document.createElement('div');
    fade.id =
      position === 'top'
        ? LauncherContainer.ElementId.APPS_SCROLL_TOP_FADE
        : LauncherContainer.ElementId.APPS_SCROLL_BOTTOM_FADE;
    fade.style.cssText = `
      ${LauncherContainer.Styles.scrollFade}
      ${position === 'top' ? LauncherContainer.Styles.scrollFadeTop : LauncherContainer.Styles.scrollFadeBottom}
    `;
    // Initially hide the fades
    fade.style.opacity = '0';
    return fade;
  }

  private createResizeObserver(): ResizeObserver {
    return new ResizeObserver(async () => {
      // Disable transitions only for position changes during resize
      this.element.style.transition = 'none';

      await this.positionManager.recalculatePosition();

      // Keep transitions for height changes since they look better with animation
      this.expansionManager.recalculateHeight();
    });
  }

  public async initialize(): Promise<void> {
    if (!this.dragHandler) {
      throw new Error('Drag handle must be set before initialization');
    }

    // Initialize managers after all components are added
    this.positionManager = new PositionManager(this.element);
    await this.positionManager.initialize();

    // Update existing drag handler with initialized position manager
    this.dragHandler.updatePositionManager(this.positionManager);

    this.expansionManager = new ExpansionManager(
      this,
      this.inner,
      this.appsContainer,
      this.appsWrapper,
    );

    // Add to DOM first so height calculations are accurate
    document.body.appendChild(this.element);

    // Check if we're starting expanded
    const isExpanded = !((await storage.get('LAUNCHER_COLLAPSED')) ?? true);

    // Initialize position first, with offset if expanded
    const savedPosition = await storage.get('LAUNCHER_POSITION');

    console.log('INIT SAVED POSITION', savedPosition);

    const defaultPosition = {
      distance: DEFAULT_DIMENSIONS.MIN_EDGE_DISTANCE * 2,
    };
    const position = savedPosition ?? defaultPosition;

    // If starting expanded, offset the initial position
    if (isExpanded) {
      const offsetPosition = {
        ...position,
        distance: position.distance,
      };
      this.positionManager.applyPosition(offsetPosition);
    } else {
      this.positionManager.applyPosition(position);
    }

    setTimeout(() => {
      this.collapseCaret.updateStyleBasedOnCollapsedState(!isExpanded);
    }, 100);

    // Initialize expansion state
    await this.expansionManager.initialize();

    // Make visible after initialization
    requestAnimationFrame(() => {
      this.element.style.visibility = 'visible';
    });

    // Start observing resize
    this.resizeObserver = this.createResizeObserver();
    this.resizeObserver.observe(document.body);
  }

  public isCollapsed(): boolean {
    return this.expansionManager.getCollapsedState();
  }

  public async setCollapsedState(
    collapsed: boolean,
    isInitial: boolean = false,
  ): Promise<void> {
    // Hide fades immediately when collapsing
    if (collapsed) {
      this.showScrollFade('top', false);
      this.showScrollFade('bottom', false);
      this.dragHandler.enable();
      // Reset width when collapsing if not hovered/dragging
      if (!this.isHovered) {
        this.inner.style.width = `${DEFAULT_DIMENSIONS.BASE_WIDTH}px`;
      } else {
        this.inner.style.width = `${DEFAULT_DIMENSIONS.HOVER_WIDTH}px`;
      }
    } else {
      // this.dragHandler.disable();
      // Always reset width when expanding
      this.inner.style.width = `${DEFAULT_DIMENSIONS.BASE_WIDTH}px`;
    }

    if (isInitial) {
      await this.expansionManager.setInitialState(collapsed);
    } else {
      await this.expansionManager.setCollapsedState(collapsed);
    }
  }

  public addComponent(element: HTMLElement): void {
    this.inner.appendChild(element);
  }

  public addTooltip(tooltip: HTMLElement): void {
    this.element.appendChild(tooltip);
  }

  public getAppsContainer(): HTMLElement {
    return this.appsContainer;
  }

  public getDragHandler(): DragHandler {
    return this.dragHandler;
  }

  public recalculateHeight(): void {
    this.expansionManager.recalculateHeight();
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public getPositionManager(): PositionManager {
    return this.positionManager;
  }

  public showScrollFade(position: 'top' | 'bottom', show: boolean): void {
    const fade = position === 'top' ? this.topFade : this.bottomFade;
    fade.style.opacity = show ? '1' : '0';
  }

  public setCollapseCaret(collapseCaret: CollapseCaret): void {
    this.collapseCaret = collapseCaret;
  }
}
