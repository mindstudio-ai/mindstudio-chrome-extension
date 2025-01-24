import { ElementIds } from '../../constants';

export class LayoutService {
  private static instance: LayoutService;
  private contentWrapper: HTMLElement | null = null;

  private constructor() {
    // Keep the body's transitions minimal or remove them entirely
    document.body.style.transition = 'none';
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

        // Provide a stable base style
        // - Let the wrapper flow normally
        // - We'll control the margin on the right to make room for the dock
        // - Animate margin changes smoothly
        wrapper.style.cssText = `
          position: static;
          width: auto;
          height: auto;
          margin-right: 0;
          transition: margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
        `;
      }
      this.contentWrapper = wrapper;
    }

    return this.contentWrapper;
  }

  /**
   * Shift the wrapper to the left by assigning space on the right (for the dock).
   */
  public shiftContent(px: number): void {
    const wrapper = this.ensureContentWrapper();
    // If px is zero, we remove extra margin to restore normal positioning
    wrapper.style.marginRight = px > 0 ? `${px}px` : '0';
  }
}
