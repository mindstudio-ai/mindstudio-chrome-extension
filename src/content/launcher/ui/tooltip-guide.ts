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
  onSkipAction?: () => void;
  onNextAction?: () => void;
  nextActionLabel?: string;
  anchorElement?: HTMLElement;
  observeElement?: HTMLElement;
}

export class TooltipGuide {
  static readonly ElementId = {
    TOOLTIP_GUIDE: createElementId('LauncherTooltipGuide'),
  };

  private element: HTMLElement;
  private onCloseAction: (() => void) | undefined;
  private onSkipAction: (() => void) | undefined;
  private onNextAction: (() => void) | undefined;
  private anchorElement: HTMLElement | undefined;
  private topOffset: number = 0;
  private resizeObserver: ResizeObserver | undefined;
  private mutationObserver: MutationObserver | undefined;
  private observeElement: HTMLElement | undefined;

  constructor(options: TooltipOptions) {
    this.anchorElement = options.anchorElement;
    this.observeElement = options.observeElement || options.anchorElement;
    this.topOffset = options.topOffset ?? 0;
    this.element = this.createTooltip(options);

    if (this.anchorElement) {
      this.setupPositionObservers();
    }
  }

  private setupPositionObservers(): void {
    if (!this.observeElement) {
      return;
    }

    // Watch for size changes
    this.resizeObserver = new ResizeObserver(() => {
      this.updatePosition();
    });
    this.resizeObserver.observe(this.observeElement);

    // Watch for DOM changes that might affect position
    this.mutationObserver = new MutationObserver(() => {
      this.updatePosition();
    });
    this.mutationObserver.observe(this.observeElement, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    // Also update on scroll and resize
    window.addEventListener('resize', this.updatePosition.bind(this));
  }

  private updatePosition(): void {
    const y = this.getAnchorElementY();

    this.element.style.top = `${y}px`;
  }

  private getAnchorElementY(): number {
    if (!this.anchorElement) {
      return this.topOffset;
    }

    return this.anchorElement.getBoundingClientRect().top + this.topOffset;
  }

  private createTooltip({
    title = '',
    text = '',
    rightOffset = 48,
    triangleOffset = 0,
    triangleSide,
    onCloseAction,
    onSkipAction,
    onNextAction,
    nextActionLabel = 'Next',
  }: TooltipOptions): HTMLElement {
    this.onCloseAction = onCloseAction;
    this.onSkipAction = onSkipAction;
    this.onNextAction = onNextAction;

    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      opacity: 0;
      padding: 8px 12px;
      gap: 8px;
      max-width: 310px;
      min-width: 310px;
      
      position: fixed;
      right: ${rightOffset}px;
      top: ${this.getAnchorElementY()}px;

      border-radius: 8px;
      background: #121213;
      box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.04), 0px 4px 12px 0px rgba(0, 0, 0, 0.15);
      
      color: #FEFEFF;
      font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 12px;
      font-weight: 400;
      line-height: 120%;
      text-align: left;
      
      z-index: ${ZIndexes.LAUNCHER + 1};
      transition: opacity 0.2s ease-in-out;

      ${this.onCloseAction && `cursor: pointer;`}
    `;

    if (this.onCloseAction) {
      tooltip.addEventListener('click', () => {
        this.hide();
      });
    }

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

    if (this.onSkipAction || this.onNextAction) {
      const buttonsContainer = document.createElement('div');
      buttonsContainer.style.cssText = `
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin-top: 12px;
      `;
      tooltip.appendChild(buttonsContainer);

      if (this.onSkipAction) {
        const skipButton = document.createElement('button');
        skipButton.textContent = 'Skip';
        skipButton.style.cssText = `
          all:unset;
          background: transparent;
          font-size: 12px;
          font-weight: 600;
          line-height: 120%;
          padding: 6px 2px;
          color: #99999A;
          cursor: pointer;
        `;

        skipButton.addEventListener('click', () => {
          this.onSkipAction?.();

          this.hide();
        });

        buttonsContainer.appendChild(skipButton);
      }

      if (this.onNextAction) {
        const nextButton = document.createElement('button');
        nextButton.textContent = nextActionLabel;
        nextButton.style.cssText = `
          all:unset;
          background: #FEFEFF;
          font-size: 12px;
          font-weight: 600;
          line-height: 120%;
          height: 24px;
          min-width: 64px;
          color: #121213;
          cursor: pointer;
          border-radius: 4px;
          text-align: center;
          display: flex;
          justify-content: center;
          align-items: center;
        `;

        nextButton.addEventListener('click', () => {
          this.onNextAction?.();

          this.hide();
        });

        buttonsContainer.appendChild(nextButton);
      }

      tooltip.appendChild(buttonsContainer);
    }

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

    if (this.onCloseAction) {
      this.onCloseAction();
    }

    // Cleanup observers
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    window.removeEventListener('scroll', this.updatePosition.bind(this));
    window.removeEventListener('resize', this.updatePosition.bind(this));
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public setText(text: string): void {
    this.element.textContent = text;
  }

  public getNextAction(): () => void {
    return () => {
      if (this.onNextAction) {
        this.onNextAction();
        this.hide();
      }
    };
  }
}
