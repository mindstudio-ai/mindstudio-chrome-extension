import { createElementId } from '../../../shared/utils/dom';

export class Logo {
  static readonly ElementId = {
    LOGO: createElementId('LauncherLogo'),
  };

  private element: HTMLElement;

  constructor() {
    this.element = this.createLogoElement();
  }

  private createLogoSvg(): string {
    return `
      <svg width="28" height="16" viewBox="0 0 28 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M11.9957 3.75733C11.8085 4.32707 11.694 4.93386 11.422 5.46033C9.97282 8.26551 8.49953 11.0587 7.00408 13.8399C5.93552 15.8271 3.73318 16.5345 1.87822 15.5336C0.0734324 14.5597 -0.52834 12.3779 0.502818 10.404C1.99299 7.55167 3.48286 4.69841 5.02979 1.87636C5.87947 0.326252 7.58533 -0.304487 9.2649 0.17678C10.8346 0.62658 11.9069 2.07437 11.9957 3.75733Z" fill="currentColor"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M22.0606 3.73975C21.8734 4.30949 21.7589 4.91628 21.4869 5.44275C20.0378 8.24793 18.5645 11.0411 17.069 13.8223C16.0005 15.8096 13.7981 16.5169 11.9432 15.516C10.1384 14.5421 9.53658 12.3603 10.5678 10.3865C12.0579 7.53409 13.5478 4.68084 15.0947 1.85878C15.9444 0.308675 17.6503 -0.322065 19.3298 0.159202C20.8995 0.609001 21.9719 2.0568 22.0606 3.73975Z" fill="currentColor"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M23.6046 4.7959C24.6423 6.61697 25.6657 8.37485 26.6522 10.1555C27.609 11.8824 27.302 13.878 25.9349 15.0884C24.5834 16.285 22.5927 16.2838 21.2605 15.0855C19.9032 13.8645 19.6076 11.8589 20.5637 10.144C21.5543 8.36745 22.5726 6.60805 23.6046 4.7959Z" fill="currentColor"/>
      </svg>
    `;
  }

  private createLogoElement(): HTMLElement {
    const logo = document.createElement('div');
    logo.id = Logo.ElementId.LOGO;
    logo.innerHTML = this.createLogoSvg();
    logo.style.cssText = `
      padding: 8px 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #FEFEFE;
      pointer-events: auto;
      cursor: pointer;
      border-radius: 6px;
      width: 32px;
      height: 32px;

      transition: background-color 0.2s ease;
    `;
    return logo;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public addEventHandler(type: string, handler: (e: Event) => void): void {
    this.element.addEventListener(type, handler);
  }

  public updateStyleBasedOnCollapsedState(collapsed: boolean): void {
    if (collapsed) {
      this.element.style.background = 'transparent';
    } else {
      this.element.style.background = '#121213';
    }
  }
}
