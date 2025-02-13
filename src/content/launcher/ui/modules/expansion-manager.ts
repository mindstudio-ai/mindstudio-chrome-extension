import { storage } from '../../../../shared/services/storage';
import { LauncherContainer } from '../container';
import {
  DEFAULT_DIMENSIONS,
  EVENTS,
  ExpansionState,
  LauncherDimensions,
} from './types';

export class ExpansionManager {
  private readonly dimensions: LauncherDimensions;
  private isCollapsed: boolean = true;
  private isTransitioning: boolean = false;
  private pendingState: boolean | null = null;
  private currentTransitionCleanup: { (): void } | null = null;
  private scrollHandler: () => void;

  constructor(
    private readonly container: LauncherContainer,
    private readonly inner: HTMLElement,
    private readonly appsContainer: HTMLElement,
    private readonly appsWrapper: HTMLElement,
    dimensions: Partial<LauncherDimensions> = {},
  ) {
    this.dimensions = { ...DEFAULT_DIMENSIONS, ...dimensions };

    // Setup scroll handler
    this.scrollHandler = () => {
      this.updateScrollClasses();
    };

    // Add scroll listener
    this.appsContainer.addEventListener('scroll', this.scrollHandler);

    // Initial scroll state
    this.updateScrollClasses();
  }

  private updateScrollClasses(): void {
    const container = this.appsContainer;

    // Only show scroll indicators when expanded
    if (this.isCollapsed) {
      this.container.showScrollFade('top', false);
      this.container.showScrollFade('bottom', false);
      return;
    }

    // Check if scrolling is possible
    const scrollTop = Math.round(container.scrollTop);
    const maxScroll = container.scrollHeight - container.clientHeight;

    const canScrollUp = scrollTop > 2; // Add small threshold to avoid edge cases
    const canScrollDown = maxScroll > 2 && scrollTop < maxScroll - 2; // Only show if meaningful scroll space exists

    this.container.showScrollFade('top', canScrollUp);
    this.container.showScrollFade('bottom', canScrollDown);
  }

  public async initialize(): Promise<void> {
    const isCollapsed = (await storage.get('LAUNCHER_COLLAPSED')) ?? true;
    await this.setInitialState(isCollapsed);
  }

  public async setInitialState(collapsed: boolean): Promise<void> {
    // For initial state, just set everything immediately without transitions
    this.isCollapsed = collapsed;

    const containerElement = this.container.getElement();
    containerElement.style.transition = 'none';
    this.appsWrapper.style.transition = 'none';

    // Update handlers for initial state
    if (collapsed) {
      this.container.getDragHandler().enable();
      this.container.showScrollFade('top', false);
      this.container.showScrollFade('bottom', false);
      this.inner.style.cursor = 'pointer';
      this.appsWrapper.style.height = '0';
      this.appsWrapper.style.opacity = '0';
    } else {
      this.inner.style.cursor = 'default';
      this.appsWrapper.style.height = 'auto';
      this.appsWrapper.style.opacity = '1';

      const currentPosition = this.container
        .getPositionManager()
        .getCurrentPosition();
      const isTopAnchored = currentPosition?.anchor === 'top';

      if (isTopAnchored) {
        containerElement.style.top = `${currentPosition?.distance! - this.dimensions.COLLAPSED_HEIGHT}px`;
      } else {
        containerElement.style.bottom = `${currentPosition?.distance! - this.dimensions.COLLAPSED_HEIGHT}px`;
      }

      this.updateScrollClasses();
    }

    containerElement.offsetHeight; // Force reflow

    // Restore transitions for future updates
    requestAnimationFrame(() => {
      containerElement.style.transition =
        'top 0.3s cubic-bezier(0.4, 0, 0.2, 1), bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      this.appsWrapper.style.transition =
        'height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease-in-out';
    });

    this.dispatchExpansionChange();
  }

  public async setCollapsedState(collapsed: boolean): Promise<void> {
    // If we're already in that state and not transitioning, nothing to do
    if (collapsed === this.isCollapsed && !this.isTransitioning) {
      return;
    }

    // If we're transitioning, store this as the pending state
    if (this.isTransitioning) {
      this.pendingState = collapsed;
      return;
    }

    // Start the transition to the new state
    await this.transitionToState(collapsed);
  }

  private async transitionToState(collapsed: boolean): Promise<void> {
    // Cancel any ongoing transition
    if (this.currentTransitionCleanup) {
      this.currentTransitionCleanup();
      this.currentTransitionCleanup = null;
    }

    // Update state immediately
    this.isCollapsed = collapsed;
    this.isTransitioning = true;

    const containerElement = this.container.getElement();
    const positionManager = this.container.getPositionManager();
    const position = collapsed
      ? positionManager.getSavedPosition()
      : positionManager.getCurrentPosition();
    const isTopAnchored = position?.anchor === 'top';

    // Update handlers immediately for new state
    if (collapsed) {
      this.container.getDragHandler().enable();
      this.container.showScrollFade('top', false);
      this.container.showScrollFade('bottom', false);
      this.inner.style.cursor = 'pointer';
    } else {
      this.inner.style.cursor = 'default';
    }

    // Set up transitions
    containerElement.style.transition = isTopAnchored
      ? 'top 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      : 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    this.appsWrapper.style.transition =
      'height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease-in-out';

    if (collapsed) {
      // Capture current height before collapse
      const currentHeight = this.appsWrapper.offsetHeight;
      this.appsWrapper.style.height = `${currentHeight}px`;
      this.appsWrapper.offsetHeight; // Force reflow

      // Start collapse transition
      if (isTopAnchored) {
        containerElement.style.top = `${position?.distance!}px`;
      } else {
        containerElement.style.bottom = `${position?.distance!}px`;
      }
      this.appsWrapper.style.height = '0';
      this.appsWrapper.style.opacity = '0';
      this.appsContainer.scrollTop = 0;
    } else {
      // Start expand transition
      this.appsWrapper.style.opacity = '1';
      const targetHeight = Math.min(
        this.appsContainer.scrollHeight,
        this.dimensions.MAX_APPS_CONTAINER_HEIGHT,
      );
      this.appsWrapper.style.height = '0';
      this.appsWrapper.offsetHeight; // Force reflow

      if (isTopAnchored) {
        containerElement.style.top = `${position?.distance! - this.dimensions.COLLAPSED_HEIGHT}px`;
      } else {
        containerElement.style.bottom = `${position?.distance! - this.dimensions.COLLAPSED_HEIGHT}px`;
      }
      this.appsWrapper.style.height = `${targetHeight}px`;
    }

    try {
      await this.waitForTransition();
    } finally {
      // Always clean up the current transition
      if (this.currentTransitionCleanup) {
        (this.currentTransitionCleanup as () => void)();
        this.currentTransitionCleanup = null;
      }

      // Handle any pending state change
      const nextState = this.pendingState;
      this.pendingState = null;
      this.isTransitioning = false;

      // Set final state for current transition
      if (!this.isCollapsed) {
        this.appsWrapper.style.height = 'auto';
        this.updateScrollClasses();
      }

      this.dispatchExpansionChange();

      // If we have a pending state that's different from our current state,
      // start a new transition
      if (nextState !== null && nextState !== this.isCollapsed) {
        await this.transitionToState(nextState);
      }
    }
  }

  private waitForTransition(): Promise<void> {
    return new Promise<void>((resolve) => {
      let isDone = false;

      const cleanup = (): void => {
        if (isDone) {
          return;
        }
        isDone = true;
        this.appsWrapper.removeEventListener('transitionend', onTransitionEnd);
        resolve();
      };

      const onTransitionEnd = (e: TransitionEvent): void => {
        if (e.propertyName === 'height') {
          cleanup();
        }
      };

      this.appsWrapper.addEventListener('transitionend', onTransitionEnd);
      this.currentTransitionCleanup = cleanup;

      // Safety timeout in case transition doesn't complete
      setTimeout(cleanup, 350);
    });
  }

  public recalculateHeight(): void {
    if (!this.isCollapsed) {
      this.updateScrollClasses();
    }
  }

  private dispatchExpansionChange(): void {
    const event = new CustomEvent(EVENTS.EXPANSION_CHANGE, {
      detail: {
        isCollapsed: this.isCollapsed,
        height: this.inner.offsetHeight,
        isTransitioning: this.isTransitioning,
      } as ExpansionState,
    });
    this.container.getElement().dispatchEvent(event);
  }

  public getCollapsedState(): boolean {
    return this.isCollapsed;
  }
}
