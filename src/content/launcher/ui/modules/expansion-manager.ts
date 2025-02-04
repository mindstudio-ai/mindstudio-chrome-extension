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
      this.appsWrapper.style.height = '0';
      this.appsWrapper.style.opacity = '0';
    } else {
      this.inner.style.cursor = 'default';
      this.appsWrapper.style.height = 'auto';
      this.appsWrapper.style.opacity = '1';
      this.updateScrollClasses();
    }

    this.dispatchExpansionChange();
  }

  public async setCollapsedState(collapsed: boolean): Promise<void> {
    this.isCollapsed = collapsed;

    if (collapsed) {
      this.inner.style.cursor = 'pointer';
      this.appsWrapper.style.height = '0';
      this.appsWrapper.style.opacity = '0';
      // Reset scroll position when collapsing
      this.appsContainer.scrollTop = 0;
    } else {
      this.inner.style.cursor = 'default';
      this.appsWrapper.style.height = 'auto';
      this.appsWrapper.style.opacity = '1';

      // Update scroll state after expanding
      requestAnimationFrame(() => {
        this.updateScrollClasses();
      });
    }

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
