import { PositionManager } from './position-manager';
import { EVENTS } from './types';

export class DragHandler {
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private initialPositionY: number = 0;
  private wasDragged: boolean = false;
  private isDraggingEnabled: boolean = true;

  constructor(
    private readonly element: HTMLElement,
    private readonly inner: HTMLElement,
    private readonly positionManager: PositionManager,
  ) {
    this.initializeDragHandling();
  }

  public wasElementDragged(): boolean {
    return this.wasDragged;
  }

  public resetDragState(): void {
    this.wasDragged = false;
  }

  public setDraggingEnabled(enabled: boolean): void {
    this.isDraggingEnabled = enabled;
  }

  private initializeDragHandling(): void {
    const handleDragStart = (e: MouseEvent) => {
      // Only allow dragging when enabled
      if (!this.isDraggingEnabled) {
        return;
      }

      this.isDragging = true;
      this.wasDragged = false;
      this.dragStartY = e.clientY;

      // Get current position for dragging
      const currentTop =
        this.element.style.top !== 'auto'
          ? parseInt(this.element.style.top)
          : window.innerHeight -
            parseInt(this.element.style.bottom) -
            this.element.offsetHeight;

      this.initialPositionY = currentTop;
      this.element.style.transition = 'none';

      // Dispatch drag start event
      const event = new CustomEvent(EVENTS.DRAG_START);
      this.element.dispatchEvent(event);

      e.preventDefault();
    };

    const handleDrag = (e: MouseEvent) => {
      if (!this.isDragging) {
        return;
      }

      const deltaY = e.clientY - this.dragStartY;
      if (Math.abs(deltaY) > 5) {
        this.wasDragged = true;
      }

      const newY = this.initialPositionY + deltaY;
      const anchor = this.positionManager.determineAnchor(newY);
      const distance = this.positionManager.calculateDistance(newY, anchor);

      this.positionManager.applyPosition({ anchor, distance });
    };

    const handleDragEnd = async () => {
      if (!this.isDragging) {
        return;
      }

      this.isDragging = false;
      this.element.style.transition = '';

      // Calculate and save final position
      const currentTop =
        this.element.style.top !== 'auto'
          ? parseInt(this.element.style.top)
          : window.innerHeight -
            parseInt(this.element.style.bottom) -
            this.element.offsetHeight;

      const anchor = this.positionManager.determineAnchor(currentTop);
      const distance = this.positionManager.calculateDistance(
        currentTop,
        anchor,
      );

      await this.positionManager.savePosition({ anchor, distance });

      // Dispatch drag end event
      const event = new CustomEvent(EVENTS.DRAG_END);
      this.element.dispatchEvent(event);
    };

    this.inner.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
  }
}
