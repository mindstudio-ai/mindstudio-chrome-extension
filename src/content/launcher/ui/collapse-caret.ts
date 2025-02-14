import { defaultTransitionDuration } from '../../../shared/constants';
import { createElementId } from '../../../shared/utils/dom';

export class CollapseCaret {
  static readonly ElementId = {
    CARET: createElementId('LauncherCaret'),
  };

  private element: HTMLElement;

  constructor() {
    this.element = this.createElement();
  }

  private iconSvg(): string {
    return `
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 3L8 7L12 3" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  private createElement(): HTMLElement {
    const element = document.createElement('div');
    element.id = CollapseCaret.ElementId.CARET;

    element.style.cssText = `
      padding: 0px;
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
      visibility: hidden;
      transition: height ${defaultTransitionDuration} ease;
    `;

    element.innerHTML = this.iconSvg();
    return element;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public addEventHandler(type: string, handler: (e: Event) => void): void {
    this.element.addEventListener(type, handler);
  }

  public updateStyleBasedOnCollapsedState(collapsed: boolean): void {
    if (!this.element) {
      return;
    }

    if (collapsed) {
      this.element.style.transform = 'rotate(180deg)';
    } else {
      this.element.style.transform = 'rotate(0deg)';
    }
  }

  public updateVisibility(visible: boolean): void {
    const resolvedHeight = visible ? '20px' : '0px';
    this.element.style.height = resolvedHeight;
  }

  public enable(): void {
    this.element.style.display = 'flex';
    this.element.style.visibility = 'visible';
  }

  public disable(): void {
    this.element.style.display = 'none';
  }
}
