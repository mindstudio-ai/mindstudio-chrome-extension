import { ZIndexes } from '../../../shared/constants';
import { createElementId } from '../../../shared/utils/dom';

type TriangleSide = 'left' | 'right' | 'top' | 'bottom';

export interface TooltipOptions {
  title?: string;
  text: string;
  rightOffset?: number;
  topOffset?: number;
  triangleSide?: TriangleSide;
  triangleOffset?: number;
  onCloseAction?: () => void;
}

export class TooltipGuide {
  static readonly ElementId = {
    TOOLTIP_GUIDE: createElementId('LauncherTooltipGuide'),
  };

  private element: HTMLElement;
  private onCloseAction: (() => void) | undefined;

  constructor(options: TooltipOptions) {
    this.element = this.createTooltip(options);
  }

  private createTooltip({
    title = '',
    text = '',
    rightOffset = 48,
    topOffset = 0,
    triangleOffset = 0,
    triangleSide,
    onCloseAction,
  }: TooltipOptions): HTMLElement {
    this.onCloseAction = onCloseAction ?? (() => {});

    const tooltip = document.createElement('div');
    tooltip.id = TooltipGuide.ElementId.TOOLTIP_GUIDE;
    tooltip.style.cssText = `
      opacity: 0;
      padding: 8px 12px;
      gap: 8px;
      max-width: 310px;
      
      position: fixed;
      right: ${rightOffset}px;
      top: ${topOffset}px;
      
      border-radius: 8px;
      background: #121213;
      box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.04), 0px 4px 12px 0px rgba(0, 0, 0, 0.15);
      
      color: #FEFEFF;
      font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 12px;
      font-weight: 400;
      line-height: 120%;
      text-align: left;
      
      cursor: pointer;
      z-index: ${ZIndexes.LAUNCHER + 1};
      transition: opacity 0.2s ease-in-out;
    `;

    tooltip.addEventListener('click', () => {
      this.hide();
    });

    const titleDiv = document.createElement('div');
    titleDiv.textContent = title;
    titleDiv.style.cssText = `
      font-size: 16px;
      font-weight: 600;
      line-height: 120%;
      margin-bottom: 8px;
    `;

    const textDiv = document.createElement('div');
    textDiv.textContent = text;
    textDiv.style.cssText = `
      font-size: 14px;
      font-weight: 400;
      line-height: 150%;
      color: #99999A;
    `;

    tooltip.appendChild(titleDiv);
    tooltip.appendChild(textDiv);

    if (triangleSide) {
      const triangleDiv = document.createElement('div');
      triangleDiv.style.cssText = this.getTriangleCss(
        triangleSide,
        triangleOffset,
      );
      tooltip.appendChild(triangleDiv);
    }
    return tooltip;
  }

  private getTriangleCss(
    triangleSide: TriangleSide,
    triangleOffset: number,
  ): string {
    const baseTriangleCSS = `
      content: '';
      position: absolute;
      width: 0;
      height: 0;
      border-style: solid;
    `;

    const triangleSize = '6px';

    switch (triangleSide) {
      case 'left':
        return `
                ${baseTriangleCSS}
                left: -${triangleSize};
                top: ${triangleOffset}px;
                border-width: ${triangleSize} ${triangleSize} ${triangleSize} 0;
                border-color: transparent #121213 transparent transparent;
            `;
      case 'right':
        return `
                ${baseTriangleCSS}
                right: -${triangleSize};
                top: ${triangleOffset}px;
                border-width: ${triangleSize} 0 ${triangleSize} ${triangleSize};
                border-color: transparent transparent transparent #121213;
            `;
      case 'top':
        return `
                ${baseTriangleCSS}
                top: -${triangleSize};
                right: ${triangleOffset}px;
                border-width: 0 ${triangleSize} ${triangleSize} ${triangleSize};
                border-color: transparent transparent #121213 transparent;
            `;
      case 'bottom':
        return `
                ${baseTriangleCSS}
                bottom: -${triangleSize};
                right: ${triangleOffset}px;
                border-width: ${triangleSize} ${triangleSize} 0 ${triangleSize};
                border-color: #121213 transparent transparent transparent;
            `;
      default:
        return '';
    }
  }

  public show(): void {
    this.element.style.opacity = '1';
  }

  public hide(): void {
    this.element.style.opacity = '0';
    this.element.style.pointerEvents = 'none';

    console.log('hey');

    if (this.onCloseAction) {
      this.onCloseAction();
    }
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public setText(text: string): void {
    this.element.textContent = text;
  }
}
