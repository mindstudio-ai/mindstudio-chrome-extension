import { QueryParams } from '../constants';
import { appendQueryParam } from '../utils/url';

export interface FrameOptions {
  id: string;
  src: string;
  container?: HTMLElement;
  hidden?: boolean;
}

export abstract class Frame {
  protected element: HTMLIFrameElement;
  protected isLoaded = false;

  constructor(options: FrameOptions) {
    this.element = this.createFrame(options);
    this.setupLoadListener();
  }

  protected createFrame({
    id,
    src,
    container,
    hidden,
  }: FrameOptions): HTMLIFrameElement {
    const frame = document.createElement('iframe');
    frame.id = id;
    frame.src = this.appendVersionToUrl(src);

    if (hidden) {
      frame.style.cssText = `
        position: absolute;
        width: 0;
        height: 0;
        border: 0;
        visibility: hidden;
      `;
    }

    if (container) {
      container.appendChild(frame);
    } else {
      document.body.appendChild(frame);
    }

    return frame;
  }

  protected appendVersionToUrl(url: string): string {
    return appendQueryParam(
      url,
      QueryParams.VERSION,
      process.env.VERSION || 'unknown',
    );
  }

  private setupLoadListener(): void {
    this.element.addEventListener('load', () => {
      this.isLoaded = true;
      this.onFrameLoad();
    });
  }

  protected onFrameLoad(): void {
    // Override in subclasses if needed
  }

  getElement(): HTMLIFrameElement {
    return this.element;
  }

  isReady(): boolean {
    return this.isLoaded;
  }

  protected setLoaded(loaded: boolean): void {
    this.isLoaded = loaded;
  }

  protected async waitForLoad(): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    return new Promise<void>((resolve) => {
      const check = () => {
        if (this.isLoaded) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  setSrc(src: string): void {
    this.element.src = src;
  }
}
