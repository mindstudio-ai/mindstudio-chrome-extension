import { FrameDimensions, ZIndexes } from '../../../shared/constants';
import { debounce } from '../../../shared/utils/debounce';
import { createElementId } from '../../../shared/utils/dom';
import { DragHandler } from './modules/drag-handler';
import { ExpansionManager } from './modules/expansion-manager';
import { PositionManager } from './modules/position-manager';
import { DEFAULT_DIMENSIONS, EVENTS } from './modules/types';

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
      background: linear-gradient(180deg, rgba(18, 18, 19, 1) 0%, rgba(18, 18, 19, 0) 100%);
    `,
    scrollFadeBottom: `
      bottom: 0;
      background: linear-gradient(0deg, rgba(18, 18, 19, 1) 0%, rgba(18, 18, 19, 0) 100%);
    `,
  };

  private readonly element: HTMLElement;
  private readonly inner: HTMLElement;
  private readonly appsWrapper: HTMLElement;
  private readonly appsContainer: HTMLElement;
  private readonly topFade: HTMLElement;
  private readonly bottomFade: HTMLElement;
  private readonly resizeObserver: ResizeObserver;

  private readonly positionManager: PositionManager;
  private readonly dragHandler: DragHandler;
  private readonly expansionManager: ExpansionManager;

  constructor() {
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
      if (this.expansionManager?.getCollapsedState()) {
        this.inner.style.width = `${DEFAULT_DIMENSIONS.HOVER_WIDTH}px`;
      }
    });

    this.inner.addEventListener('mouseleave', () => {
      if (this.expansionManager?.getCollapsedState()) {
        this.inner.style.width = `${DEFAULT_DIMENSIONS.BASE_WIDTH}px`;
      }
    });

    // Initialize with visibility hidden to prevent flash
    this.element.style.visibility = 'hidden';

    // Initialize managers
    this.positionManager = new PositionManager(this.element);
    this.dragHandler = new DragHandler(
      this.element,
      this.inner,
      this.positionManager,
    );
    this.expansionManager = new ExpansionManager(
      this,
      this.inner,
      this.appsContainer,
      this.appsWrapper,
    );

    // Listen for expansion changes
    this.element.addEventListener(EVENTS.EXPANSION_CHANGE, () => {
      // Always reset to base width when expansion state changes
      this.inner.style.width = `${DEFAULT_DIMENSIONS.BASE_WIDTH}px`;
      // Dragging is now always enabled
    });

    // Initialize resize observer
    this.resizeObserver = this.createResizeObserver();
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
    return new ResizeObserver(
      debounce(() => {
        this.element.style.transition = 'none';
        this.expansionManager.recalculateHeight();
        requestAnimationFrame(() => {
          this.element.style.transition = 'all 0.2s ease-out';
        });
      }, 100),
    );
  }

  public async initialize(): Promise<void> {
    // Initialize position first
    await this.positionManager.initialize();

    // Add to DOM
    document.body.appendChild(this.element);

    // Make visible after a frame to ensure position is applied
    requestAnimationFrame(() => {
      this.element.style.visibility = 'visible';
    });

    // Initialize expansion state
    await this.expansionManager.initialize();

    // Start observing resize
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

  public showScrollFade(position: 'top' | 'bottom', show: boolean): void {
    const fade = position === 'top' ? this.topFade : this.bottomFade;
    fade.style.opacity = show ? '1' : '0';
  }
}
