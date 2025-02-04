import { storage } from '../../../../shared/services/storage';
import { PositionManager } from './position-manager';
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

  constructor(
    private readonly element: HTMLElement,
    private readonly inner: HTMLElement,
    private readonly appsContainer: HTMLElement,
    private readonly positionManager: PositionManager,
    dimensions: Partial<LauncherDimensions> = {},
  ) {
    this.dimensions = { ...DEFAULT_DIMENSIONS, ...dimensions };
  }

  public async initialize(): Promise<void> {
    const isCollapsed = (await storage.get('LAUNCHER_COLLAPSED')) ?? true;
    await this.setInitialState(isCollapsed);
  }

  private enableTransitions(): void {
    this.inner.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    this.appsContainer.style.transition = 'opacity 0.2s ease-in-out';
  }

  private async calculateMaxExpandedHeight(): Promise<number> {
    const isTopAnchored = this.element.style.top !== 'auto';

    // Get saved position to try to restore it when possible
    const currentPosition = this.positionManager.getCurrentPosition();
    if (!currentPosition) {
      return this.dimensions.MIN_EXPANDED_HEIGHT;
    }

    if (isTopAnchored) {
      const topPosition = parseInt(this.element.style.top);
      const availableHeight =
        window.innerHeight - topPosition - this.dimensions.MIN_EDGE_DISTANCE;
      return Math.max(this.dimensions.MIN_EXPANDED_HEIGHT, availableHeight);
    } else {
      const bottomPosition = parseInt(this.element.style.bottom);
      const availableHeight =
        window.innerHeight - bottomPosition - this.dimensions.MIN_EDGE_DISTANCE;
      return Math.max(this.dimensions.MIN_EXPANDED_HEIGHT, availableHeight);
    }
  }

  private async updateExpandedHeight(): Promise<void> {
    const inner = this.inner;
    if (this.isCollapsed) {
      return;
    }

    // Temporarily disable transitions
    const prevTransition = inner.style.transition;
    inner.style.transition = 'none';
    this.appsContainer.style.transition = 'none';

    // Calculate maximum allowed height first
    const maxHeight = await this.calculateMaxExpandedHeight();

    // Then set to auto to get natural height
    inner.style.height = 'auto';
    const naturalHeight = Math.max(
      inner.offsetHeight,
      this.dimensions.MIN_EXPANDED_HEIGHT,
    );

    // Apply the constrained height
    const finalHeight = Math.min(naturalHeight, maxHeight);
    inner.style.height = `${finalHeight}px`;

    // Ensure the apps container scrolls if needed
    this.appsContainer.style.overflowY =
      finalHeight < naturalHeight ? 'auto' : 'hidden';

    // Re-enable transitions after a frame
    requestAnimationFrame(() => {
      inner.style.transition = prevTransition;
      this.appsContainer.style.transition = 'opacity 0.2s ease-in-out';
      this.dispatchExpansionChange();
    });
  }

  public async setInitialState(collapsed: boolean): Promise<void> {
    this.isCollapsed = collapsed;
    const inner = this.inner;

    // Disable transitions initially
    inner.style.transition = 'none';
    this.appsContainer.style.transition = 'none';

    if (collapsed) {
      inner.style.height = `${this.dimensions.COLLAPSED_HEIGHT}px`;
      inner.style.cursor = 'pointer';
      this.appsContainer.style.opacity = '0';
    } else {
      inner.style.cursor = 'default';

      // Calculate maximum allowed height first
      const maxHeight = await this.calculateMaxExpandedHeight();

      // Then get natural height
      inner.style.height = 'auto';
      const naturalHeight = Math.max(
        inner.offsetHeight,
        this.dimensions.MIN_EXPANDED_HEIGHT,
      );

      // Apply constrained height
      inner.style.height = `${Math.min(naturalHeight, maxHeight)}px`;
      this.appsContainer.style.opacity = '1';
    }

    // Enable transitions after initial render
    requestAnimationFrame(() => this.enableTransitions());
    this.dispatchExpansionChange();
  }

  public async setCollapsedState(collapsed: boolean): Promise<void> {
    this.isCollapsed = collapsed;
    const inner = this.inner;

    // Ensure transitions are enabled
    this.enableTransitions();

    if (collapsed) {
      inner.style.height = `${this.dimensions.COLLAPSED_HEIGHT}px`;
      inner.style.cursor = 'pointer';
      this.appsContainer.style.opacity = '0';
    } else {
      inner.style.cursor = 'default';

      // First calculate the target height
      inner.style.height = 'auto';
      const naturalHeight = inner.offsetHeight;
      const maxHeight = await this.calculateMaxExpandedHeight();
      const targetHeight = Math.min(naturalHeight, maxHeight);

      // Reset to collapsed height
      inner.style.height = `${this.dimensions.COLLAPSED_HEIGHT}px`;

      // Force a reflow
      inner.offsetHeight;

      // Animate to target height
      inner.style.height = `${targetHeight}px`;
      this.appsContainer.style.opacity = '1';
    }

    this.dispatchExpansionChange();
  }

  public recalculateHeight(): void {
    if (this.isCollapsed) {
      return;
    }

    this.updateExpandedHeight();
  }

  private dispatchExpansionChange(): void {
    const event = new CustomEvent(EVENTS.EXPANSION_CHANGE, {
      detail: {
        isCollapsed: this.isCollapsed,
        height: this.inner.offsetHeight,
        isTransitioning: this.isTransitioning,
      } as ExpansionState,
    });
    this.element.dispatchEvent(event);
  }

  public getCollapsedState(): boolean {
    return this.isCollapsed;
  }
}
