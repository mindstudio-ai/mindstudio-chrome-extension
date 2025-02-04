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
    const canScrollDown = maxScroll > 0 && scrollTop < maxScroll - 2;

    this.container.showScrollFade('top', canScrollUp);
    this.container.showScrollFade('bottom', canScrollDown);
  }

  public async initialize(): Promise<void> {
    const isCollapsed = (await storage.get('LAUNCHER_COLLAPSED')) ?? true;
    await this.setInitialState(isCollapsed);
  }

  public async setInitialState(collapsed: boolean): Promise<void> {
    this.isCollapsed = collapsed;

    if (collapsed) {
      this.inner.style.cursor = 'pointer';
      this.inner.style.padding = '4px 0';
      this.appsWrapper.style.height = '0';
      this.appsWrapper.style.opacity = '0';
    } else {
      this.inner.style.cursor = 'default';
      this.inner.style.padding = '0 0 4px';
      this.appsWrapper.style.height = 'auto';
      this.appsWrapper.style.opacity = '1';
      this.updateScrollClasses();
    }

    this.dispatchExpansionChange();
  }

  public async setCollapsedState(collapsed: boolean): Promise<void> {
    if (this.isTransitioning) {
      return;
    }
    this.isCollapsed = collapsed;
    this.isTransitioning = true;

    if (collapsed) {
      this.inner.style.cursor = 'pointer';
      this.inner.style.padding = '4px 0';
      // Get current height before collapsing
      const currentHeight = this.appsWrapper.offsetHeight;
      this.appsWrapper.style.height = `${currentHeight}px`;
      // Force a reflow
      this.appsWrapper.offsetHeight;
      // Start transition to 0
      requestAnimationFrame(() => {
        this.appsWrapper.style.height = '0';
        this.appsWrapper.style.opacity = '0';
      });
      // Reset scroll position when collapsing
      this.appsContainer.scrollTop = 0;
    } else {
      this.inner.style.cursor = 'default';
      this.inner.style.padding = '0 0 4px';
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
      // Start transition to target height
      requestAnimationFrame(() => {
        this.appsWrapper.style.height = `${targetHeight}px`;
      });

      // Update scroll state after expanding
      requestAnimationFrame(() => {
        this.updateScrollClasses();
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
