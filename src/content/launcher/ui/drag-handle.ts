import { createElementId } from '../../../shared/utils/dom';

export class DragHandle {
  static readonly ElementId = {
    CARET: createElementId('LauncherCaret'),
  };

  private element: HTMLElement;
  private transformDiv: HTMLElement | undefined;

  constructor() {
    this.element = this.createElement();
  }

  private iconSvg(): string {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" stroke-width="2">
        <path d="M5 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
        <path d="M5 15m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
        <path d="M12 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
        <path d="M12 15m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
        <path d="M19 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
        <path d="M19 15m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
      </svg>
      `;
  }

  private createElement(): HTMLElement {
    const element = document.createElement('div');
    element.id = DragHandle.ElementId.CARET;
    element.style.cssText = `
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #99999A;
      pointer-events: auto;
      cursor: pointer;
      border-radius: 6px;
      width: 100%;
      height: 0;
      overflow: hidden;

      transition: height 0.2s ease, padding 0.2s ease;
    `;

    element.innerHTML = this.iconSvg();

    return element;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public updateVisibility(visible: boolean): void {
    const resolvedHeight = visible ? '16px' : '0px';
    const resolvedPadding = visible ? '3px 0' : '0px';
    this.element.style.height = resolvedHeight;
    this.element.style.maxHeight = resolvedHeight;
    this.element.style.padding = resolvedPadding;
  }
}
