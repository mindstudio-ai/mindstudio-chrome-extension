import { AuthService } from './auth.service';
import { FrameService } from './frame.service';
import { LauncherStateService } from './launcher-state.service';
import { ElementIds, ZIndexes } from '../constants';

export class FloatingButtonService {
  private static instance: FloatingButtonService;
  private frameService: FrameService;
  private authService: AuthService;
  private launcherState: LauncherStateService;

  private constructor() {
    this.frameService = FrameService.getInstance();
    this.authService = AuthService.getInstance();
    this.launcherState = LauncherStateService.getInstance();
  }

  static getInstance(): FloatingButtonService {
    if (!FloatingButtonService.instance) {
      FloatingButtonService.instance = new FloatingButtonService();
    }
    return FloatingButtonService.instance;
  }

  async injectButton(): Promise<void> {
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
      display: none;
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

    // Check if we should show the button
    const isCollapsed = await this.launcherState.isCollapsed();
    if (isCollapsed) {
      this.showButton();
    }
  }

  private async handleButtonClick(): Promise<void> {
    const isAuthenticated = await this.authService.isAuthenticated();

    if (isAuthenticated) {
      await this.launcherState.setCollapsed(false);
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
