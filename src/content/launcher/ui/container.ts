import { FrameDimensions, ZIndexes } from '../../../shared/constants';
import { debounce } from '../../../shared/utils/debounce';
import { createElementId } from '../../../shared/utils/dom';
import { AppData } from '../../../shared/types/app';
import { DragHandler } from './modules/drag-handler';
import { ExpansionManager } from './modules/expansion-manager';
import { PositionManager } from './modules/position-manager';
import { DEFAULT_DIMENSIONS, EVENTS, ExpansionState } from './modules/types';

export class LauncherContainer {
  private static readonly ElementId = {
    CONTAINER: createElementId('Launcher'),
    INNER: createElementId('LauncherInner'),
    APPS_CONTAINER: createElementId('LauncherAppsContainer'),
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
      justify-content: flex-end;
      position: relative;
      background: rgba(18, 18, 19, 0.85);
      padding: 4px 0;
      border-radius: 8px 0 0 8px;
      box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.04), 0px 8px 16px 0px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      pointer-events: all;
      box-sizing: border-box;
      height: ${DEFAULT_DIMENSIONS.COLLAPSED_HEIGHT}px;
      cursor: pointer;
      user-select: none;
      transition: width 0.2s ease-out;
    `,
    appsContainer: `
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0;
      flex: 1;
      width: 100%;
      overflow-y: auto;
      opacity: 0;
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    `,
  };

  private readonly element: HTMLElement;
  private readonly inner: HTMLElement;
  private readonly appsContainer: HTMLElement;
  private readonly resizeObserver: ResizeObserver;

  private readonly positionManager: PositionManager;
  private readonly dragHandler: DragHandler;
  private readonly expansionManager: ExpansionManager;

  constructor(
    private readonly callbacks: {
      onLogoClick?: () => void;
      onAppClick?: (app: AppData) => void;
    } = {},
  ) {
    this.element = this.createContainerElement();
    this.inner = this.createInnerElement();
    this.appsContainer = this.createAppsContainerElement();

    // Setup DOM structure
    this.inner.appendChild(this.appsContainer);
    this.element.appendChild(this.inner);

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
      this.element,
      this.inner,
      this.appsContainer,
      this.positionManager,
    );

    // Listen for expansion changes
    this.element.addEventListener(EVENTS.EXPANSION_CHANGE, (e: Event) => {
      const event = e as CustomEvent<ExpansionState>;
      // Always reset to base width when expansion state changes
      this.inner.style.width = `${DEFAULT_DIMENSIONS.BASE_WIDTH}px`;
      // Only allow dragging when collapsed
      this.dragHandler.setDraggingEnabled(event.detail.isCollapsed);
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

  private createAppsContainerElement(): HTMLElement {
    const container = document.createElement('div');
    container.id = LauncherContainer.ElementId.APPS_CONTAINER;
    container.style.cssText = LauncherContainer.Styles.appsContainer;
    return container;
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
}
