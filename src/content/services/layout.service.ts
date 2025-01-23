import { ElementIds } from '../constants';

export class LayoutService {
  private static instance: LayoutService;
  private contentWrapper: HTMLElement | null = null;

  private constructor() {
    // Initialize body transition
    document.body.style.transition =
      'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  }

  public static getInstance(): LayoutService {
    if (!LayoutService.instance) {
      LayoutService.instance = new LayoutService();
    }
    return LayoutService.instance;
  }

  /**
   * Ensure that the content wrapper is created and wrapped around the body content.
   * Returns the wrapper element.
   */
  public ensureContentWrapper(): HTMLElement {
    if (!this.contentWrapper) {
      let wrapper = document.getElementById(ElementIds.CONTENT_WRAPPER);
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = ElementIds.CONTENT_WRAPPER;

        // Move everything from body into the wrapper
        while (document.body.firstChild) {
          wrapper.appendChild(document.body.firstChild);
        }

        document.body.appendChild(wrapper);

        // Optional: add a smooth transition for transforms
        wrapper.style.cssText = `
          position: relative;
          width: 100%;
          height: 100%;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        `;
      }
      this.contentWrapper = wrapper;
    }

    return this.contentWrapper;
  }

  /**
   * Shift the wrapper to the left by the specified number of pixels.
   */
  public shiftContent(px: number): void {
    const wrapper = this.ensureContentWrapper();
    if (px === 0) {
      wrapper.style.width = '100%';
    } else {
      wrapper.style.width = `calc(100% - ${px}px)`;
    }
  }
}
