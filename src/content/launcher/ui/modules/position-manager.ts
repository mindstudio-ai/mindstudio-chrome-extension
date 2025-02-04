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
      anchor: 'bottom' as const,
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
    const { anchor, distance } = constrainedPosition;

    if (anchor === 'top') {
      this.element.style.top = `${distance}px`;
      this.element.style.bottom = 'auto';
    } else {
      this.element.style.bottom = `${distance}px`;
      this.element.style.top = 'auto';
    }

    this.currentPosition = constrainedPosition;
    this.dispatchPositionChange(false);
  }

  private getConstrainedPosition(position: Position): Position {
    const { anchor, distance } = position;
    const minDistance = this.dimensions.MIN_EDGE_DISTANCE;
    const elementHeight =
      this.element.offsetHeight || this.dimensions.COLLAPSED_HEIGHT;
    const maxDistance = window.innerHeight - minDistance - elementHeight;

    // If maxDistance is negative or very small, default to minDistance
    if (maxDistance < minDistance) {
      return {
        anchor: 'top',
        distance: minDistance,
      };
    }

    const constrainedDistance = Math.max(
      minDistance,
      Math.min(distance, maxDistance),
    );

    return {
      anchor,
      distance: constrainedDistance,
    };
  }

  public determineAnchor(y: number): 'top' | 'bottom' {
    const screenCenter =
      window.innerHeight * this.dimensions.SCREEN_CENTER_THRESHOLD;
    return y < screenCenter ? 'top' : 'bottom';
  }

  public calculateDistance(y: number, anchor: 'top' | 'bottom'): number {
    const minDistance = this.dimensions.MIN_EDGE_DISTANCE;
    const maxDistance =
      window.innerHeight - this.element.offsetHeight - minDistance;

    if (anchor === 'top') {
      return Math.max(minDistance, Math.min(y, maxDistance));
    } else {
      const bottomDistance = window.innerHeight - y - this.element.offsetHeight;
      return Math.max(minDistance, Math.min(bottomDistance, maxDistance));
    }
  }

  public getCurrentPosition(): Position | null {
    return this.currentPosition;
  }

  public getSavedPosition(): Position | null {
    return this.savedPosition;
  }

  public async savePosition(position: Position): Promise<void> {
    await storage.set('LAUNCHER_POSITION', position);
    this.savedPosition = position;
    this.currentPosition = position;
    this.dispatchPositionChange(true);
  }

  public recalculatePosition(): void {
    if (this.savedPosition) {
      this.applyPosition(this.savedPosition);
    }
  }

  private dispatchPositionChange(isFromDrag: boolean): void {
    if (!this.currentPosition) {
      return;
    }

    const event = new CustomEvent(EVENTS.POSITION_CHANGE, {
      detail: {
        position: this.currentPosition,
        isFromDrag,
      },
    });
    this.element.dispatchEvent(event);
  }
}
