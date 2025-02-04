import { PositionManager } from './position-manager';
import { EVENTS } from './types';

export class DragHandler {
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private initialPositionY: number = 0;
  private wasDragged: boolean = false;
  private positionManager: PositionManager;
  private enabled: boolean = true;

  constructor(
    private readonly containerElement: HTMLElement,
    private readonly dragHandleElement: HTMLElement,
    positionManager: PositionManager,
  ) {
    this.positionManager = positionManager;
    this.initializeDragHandling();
  }

  public enable(): void {
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
    if (this.isDragging) {
      this.isDragging = false;
      this.containerElement.style.transition = '';
    }
  }

  public wasElementDragged(): boolean {
    return this.wasDragged;
  }

  public resetDragState(): void {
    this.wasDragged = false;
  }

  public getDragHandleElement(): HTMLElement {
    return this.dragHandleElement;
  }

  public updatePositionManager(positionManager: PositionManager): void {
    this.positionManager = positionManager;
  }

  private initializeDragHandling(): void {
    const handleDragStart = (e: MouseEvent) => {
      if (!this.enabled) {
        return;
      }

      this.isDragging = true;
      this.wasDragged = false;
      this.dragStartY = e.clientY;

      // Get current position for dragging
      const currentTop =
        this.containerElement.style.top !== 'auto'
          ? parseInt(this.containerElement.style.top)
          : window.innerHeight -
            parseInt(this.containerElement.style.bottom) -
            this.containerElement.offsetHeight;

      this.initialPositionY = currentTop;
      this.containerElement.style.transition = 'none';

      // Dispatch drag start event
      const event = new CustomEvent(EVENTS.DRAG_START);
      this.containerElement.dispatchEvent(event);

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
      this.containerElement.style.transition = '';

      // Calculate and save final position
      const currentTop =
        this.containerElement.style.top !== 'auto'
          ? parseInt(this.containerElement.style.top)
          : window.innerHeight -
            parseInt(this.containerElement.style.bottom) -
            this.containerElement.offsetHeight;

      const anchor = this.positionManager.determineAnchor(currentTop);
      const distance = this.positionManager.calculateDistance(
        currentTop,
        anchor,
      );

      await this.positionManager.savePosition({ anchor, distance });

      // Dispatch drag end event
      const event = new CustomEvent(EVENTS.DRAG_END);
      this.containerElement.dispatchEvent(event);
    };

    // Add event listeners to the drag handle element instead of the inner container
    this.dragHandleElement.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
  }
}
