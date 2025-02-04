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
    this.isCollapsed = collapsed;

    // Disable all transitions temporarily
    const containerElement = this.container.getElement();
    containerElement.style.transition = 'none';
    this.appsWrapper.style.transition = 'none';

    if (collapsed) {
      this.inner.style.cursor = 'pointer';
      this.appsWrapper.style.height = '0';
      this.appsWrapper.style.opacity = '0';
    } else {
      this.inner.style.cursor = 'default';
      this.appsWrapper.style.height = 'auto';
      this.appsWrapper.style.opacity = '1';

      // Get the logo's position (saved position is already normalized to collapsed state)
      const currentPosition = this.container
        .getPositionManager()
        .getCurrentPosition();
      const isTopAnchored = currentPosition?.anchor === 'top';

      // Apply the offset from normalized position immediately
      if (isTopAnchored) {
        containerElement.style.top = `${currentPosition?.distance! - this.dimensions.COLLAPSED_HEIGHT}px`;
      } else {
        containerElement.style.bottom = `${currentPosition?.distance! - this.dimensions.COLLAPSED_HEIGHT}px`;
      }

      this.updateScrollClasses();
    }

    // Force a reflow to ensure styles are applied
    containerElement.offsetHeight;

    // Restore transitions for future animations
    requestAnimationFrame(() => {
      containerElement.style.transition =
        'top 0.3s cubic-bezier(0.4, 0, 0.2, 1), bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      this.appsWrapper.style.transition =
        'height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease-in-out';
    });

    this.dispatchExpansionChange();
  }

  public async setCollapsedState(collapsed: boolean): Promise<void> {
    if (this.isTransitioning) {
      return;
    }
    this.isCollapsed = collapsed;
    this.isTransitioning = true;

    const containerElement = this.container.getElement();
    const positionManager = this.container.getPositionManager();
    // Use saved position (normalized to collapsed state) when collapsing
    // Use current position when expanding since we need to calculate offset from current position
    const position = collapsed
      ? positionManager.getSavedPosition()
      : positionManager.getCurrentPosition();
    const isTopAnchored = position?.anchor === 'top';

    // Set specific transitions for visual properties only
    containerElement.style.transition = isTopAnchored
      ? 'top 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      : 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

    if (collapsed) {
      this.inner.style.cursor = 'pointer';

      // Get current height before collapsing
      const currentHeight = this.appsWrapper.offsetHeight;
      this.appsWrapper.style.height = `${currentHeight}px`;

      // Force a reflow
      this.appsWrapper.offsetHeight;

      // Start all transitions together
      requestAnimationFrame(() => {
        // Move to the normalized (collapsed) position
        if (isTopAnchored) {
          containerElement.style.top = `${position?.distance!}px`;
        } else {
          containerElement.style.bottom = `${position?.distance!}px`;
        }
        this.appsWrapper.style.height = '0';
        this.appsWrapper.style.opacity = '0';
      });

      // Reset scroll position when collapsing
      this.appsContainer.scrollTop = 0;
    } else {
      this.inner.style.cursor = 'default';

      // First set opacity to make content visible for height calculation
      this.appsWrapper.style.opacity = '1';
      // Calculate target height
      const targetHeight = Math.min(
        this.appsContainer.scrollHeight,
        this.dimensions.MAX_APPS_CONTAINER_HEIGHT,
      );
      // Set initial height
      this.appsWrapper.style.height = '0';

      // Force a reflow
      this.appsWrapper.offsetHeight;

      // Start all transitions together
      requestAnimationFrame(() => {
        // Offset from the normalized position
        if (isTopAnchored) {
          containerElement.style.top = `${position?.distance! - this.dimensions.COLLAPSED_HEIGHT}px`;
        } else {
          containerElement.style.bottom = `${position?.distance! - this.dimensions.COLLAPSED_HEIGHT}px`;
        }
        this.appsWrapper.style.height = `${targetHeight}px`;
      });
    }

    // Wait for transition to complete
    await new Promise((resolve) => {
      const onTransitionEnd = (e: TransitionEvent) => {
        if (e.propertyName === 'height') {
          this.appsWrapper.removeEventListener(
            'transitionend',
            onTransitionEnd,
          );
          // If expanded, switch to auto height after animation
          if (!collapsed) {
            this.appsWrapper.style.height = 'auto';
            // Update scroll state after height is set to auto
            requestAnimationFrame(() => {
              this.updateScrollClasses();
            });
          }
          this.isTransitioning = false;
          resolve(undefined);
        }
      };
      this.appsWrapper.addEventListener('transitionend', onTransitionEnd);
    });

    this.dispatchExpansionChange();
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
