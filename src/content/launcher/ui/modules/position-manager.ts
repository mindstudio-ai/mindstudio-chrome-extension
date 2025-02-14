import { storage } from '../../../../shared/services/storage';
import {
  DEFAULT_DIMENSIONS,
  EVENTS,
  LauncherDimensions,
  Position,
} from './types';

export class PositionManager {
  private readonly dimensions: LauncherDimensions;
  private currentPosition: Position | null = null;
  private savedPosition: Position | null = null;

  constructor(
    private readonly element: HTMLElement,
    dimensions: Partial<LauncherDimensions> = {},
  ) {
    this.dimensions = { ...DEFAULT_DIMENSIONS, ...dimensions };
  }

  public async initialize(): Promise<void> {
    const position = await storage.get('LAUNCHER_POSITION');
    const defaultPosition = {
      distance: this.dimensions.MIN_EDGE_DISTANCE * 2,
    };

    this.savedPosition = position ?? defaultPosition;
    this.applyPosition(this.savedPosition);
  }

  public applyPosition(position: Position | null): void {
    if (!position) {
      this.element.style.bottom = `${this.dimensions.MIN_EDGE_DISTANCE * 2}px`;
      this.element.style.top = 'auto';
      return;
    }

    const constrainedPosition = this.getConstrainedPosition(position);
    const { distance } = constrainedPosition;

    this.element.style.bottom = `${distance}px`;
    this.element.style.top = 'auto';

    this.currentPosition = constrainedPosition;
    this.dispatchPositionChange(false);
  }

  public getConstrainedPosition(
    position: Position,
    targetHeight?: number,
  ): Position {
    const { distance } = position;
    const minDistance = this.dimensions.MIN_EDGE_DISTANCE;
    const elementHeight =
      targetHeight ||
      this.element.offsetHeight ||
      this.dimensions.COLLAPSED_HEIGHT;

    const maxDistance = window.innerHeight - minDistance - elementHeight;

    // If maxDistance is negative or very small, default to minDistance
    if (maxDistance < minDistance) {
      return {
        distance: minDistance,
      };
    }

    const constrainedDistance = Math.max(
      minDistance,
      Math.min(distance, maxDistance),
    );

    return {
      distance: constrainedDistance,
    };
  }

  public calculateDistance(y: number): number {
    const minDistance = this.dimensions.MIN_EDGE_DISTANCE;
    const maxDistance =
      window.innerHeight - this.element.offsetHeight - minDistance;

    const bottomDistance = window.innerHeight - y - this.element.offsetHeight;
    return Math.max(minDistance, Math.min(bottomDistance, maxDistance));
  }

  public getCurrentPosition(): Position | null {
    return this.currentPosition;
  }

  public getSavedPosition(): Position | null {
    return this.savedPosition;
  }

  public async savePosition(position: Position): Promise<void> {
    // If we're saving while expanded, the position we get already includes the offset
    // So we need to subtract it to get the true logo position
    const normalizedPosition = {
      ...position,
      distance: position.distance,
    };

    await storage.set('LAUNCHER_POSITION', normalizedPosition);
    this.savedPosition = normalizedPosition;
    this.currentPosition = normalizedPosition;

    this.dispatchPositionChange(true);
  }

  public async recalculatePosition(): Promise<void> {
    if (!this.savedPosition) {
      return;
    }

    // Check if we're expanded to apply the correct offset
    const isExpanded = !((await storage.get('LAUNCHER_COLLAPSED')) ?? true);

    if (isExpanded) {
      const offsetPosition = {
        ...this.savedPosition,
        distance: this.savedPosition.distance,
      };
      this.applyPosition(offsetPosition);
    } else {
      this.applyPosition(this.savedPosition);
    }
  }

  private dispatchPositionChange(isFromDrag: boolean): void {
    if (!this.currentPosition) {
      return;
    }

    const event = new CustomEvent(EVENTS.POSITION_CHANGE, {
      bubbles: true,
      detail: {
        position: this.currentPosition,
        isFromDrag,
      },
    });

    this.element.dispatchEvent(event);
  }
}
