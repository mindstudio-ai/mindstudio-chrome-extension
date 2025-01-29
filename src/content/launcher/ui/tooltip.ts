import { ZIndexes } from '../../../shared/constants';

export interface TooltipOptions {
  text: string;
  rightOffset?: number;
}

export class Tooltip {
  private element: HTMLElement;

  constructor(options: TooltipOptions) {
    this.element = this.createTooltip(options);
  }

  private createTooltip({
    text,
    rightOffset = 48,
  }: TooltipOptions): HTMLElement {
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      opacity: 0;
      display: flex;
      max-width: 200px;
      padding: 8px 12px;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      
      position: fixed;
      right: ${rightOffset}px;
      transform: translateY(-50%);
      
      border-radius: 8px;
      background: #121213;
      box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.04), 0px 4px 12px 0px rgba(0, 0, 0, 0.15);
      
      color: #FEFEFF;
      font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 12px;
      font-weight: 400;
      line-height: 120%;
      text-align: right;
      
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      
      pointer-events: none;
      z-index: ${ZIndexes.LAUNCHER + 1};
      transition: opacity 0.2s ease-in-out;
    `;
    tooltip.textContent = text;
    return tooltip;
  }

  public show(targetElement: HTMLElement): void {
    const rect = targetElement.getBoundingClientRect();
    this.element.style.top = `${rect.top + rect.height / 2}px`;
    this.element.style.opacity = '1';
  }

  public hide(): void {
    this.element.style.opacity = '0';
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public setText(text: string): void {
    this.element.textContent = text;
  }
}
