export interface Position {
  anchor: 'top' | 'bottom';
  distance: number;
}

export interface LauncherDimensions {
  readonly BASE_WIDTH: number;
  readonly HOVER_WIDTH: number;
  readonly COLLAPSED_HEIGHT: number;
  readonly MIN_EXPANDED_HEIGHT: number;
  readonly MIN_EDGE_DISTANCE: number;
  readonly SCREEN_CENTER_THRESHOLD: number;
  readonly MAX_APPS_CONTAINER_HEIGHT: number;
}

export const DEFAULT_DIMENSIONS: LauncherDimensions = {
  BASE_WIDTH: 40,
  HOVER_WIDTH: 48,
  COLLAPSED_HEIGHT: 40,
  MIN_EXPANDED_HEIGHT: 96,
  MIN_EDGE_DISTANCE: 64,
  SCREEN_CENTER_THRESHOLD: 0.5,
  MAX_APPS_CONTAINER_HEIGHT: 420,
};

export interface LauncherElements {
  container: HTMLElement;
  inner: HTMLElement;
  appsContainer: HTMLElement;
}

export interface PositionChangeEvent {
  position: Position;
  isFromDrag: boolean;
}

export interface ExpansionState {
  isCollapsed: boolean;
  height: number;
  isTransitioning: boolean;
}

// Event names for custom events
export const EVENTS = {
  POSITION_CHANGE: 'launcher:position-change',
  EXPANSION_CHANGE: 'launcher:expansion-change',
  DRAG_START: 'launcher:drag-start',
  DRAG_END: 'launcher:drag-end',
} as const;
