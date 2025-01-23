import { AuthService } from './auth.service';
import { FrameService } from './frame.service';
import { ElementIds, ZIndexes } from '../constants';

export class FloatingButtonService {
  private static instance: FloatingButtonService;
  private frameService: FrameService;
  private authService: AuthService;

  private constructor() {
    this.frameService = FrameService.getInstance();
    this.authService = AuthService.getInstance();
  }

  static getInstance(): FloatingButtonService {
    if (!FloatingButtonService.instance) {
      FloatingButtonService.instance = new FloatingButtonService();
    }
    return FloatingButtonService.instance;
  }

  injectButton(): void {
    if (document.getElementById(ElementIds.FLOATING_BUTTON)) {
      return;
    }

    const button = document.createElement('div');
    button.id = ElementIds.FLOATING_BUTTON;
    button.innerHTML = `<img src="${chrome.runtime.getURL(
      'images/floating-button.png',
    )}" alt="MindStudio" style="width: 100%; height: 100%; object-fit: contain;" />`;

    button.style.cssText = `
      position: fixed;
      bottom: 128px;
      right: 0px;
      width: 48px;
      height: 40px;
      cursor: pointer;
      z-index: ${ZIndexes.FLOATING_BUTTON};
      transition: transform 0.2s ease;
      border-radius: 50%;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    button.addEventListener('mouseover', () => {
      button.style.transform = 'scale(1.1)';
    });

    button.addEventListener('mouseout', () => {
      button.style.transform = 'scale(1)';
    });

    button.addEventListener('click', this.handleButtonClick.bind(this));

    document.body.appendChild(button);
  }

  private async handleButtonClick(): Promise<void> {
    const isAuthenticated = await this.authService.isAuthenticated();

    if (isAuthenticated) {
      this.frameService.showLauncher();
      this.hideButton();
    } else {
      this.frameService.showAuth();
      this.hideButton();
    }
  }

  hideButton(): void {
    const button = document.getElementById(ElementIds.FLOATING_BUTTON);
    if (button) {
      button.style.display = 'none';
    }
  }

  showButton(): void {
    const button = document.getElementById(ElementIds.FLOATING_BUTTON);
    if (button) {
      button.style.display = 'flex';
    }
  }
}
