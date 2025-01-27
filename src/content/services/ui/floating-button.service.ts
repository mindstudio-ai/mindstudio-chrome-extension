import { AuthService } from '../auth.service';
import { LauncherDockService } from './launcher-dock.service';
import { LauncherStateService } from '../launcher-state.service';
import { ElementIds, ZIndexes } from '../../constants';

export class FloatingButtonService {
  private static instance: FloatingButtonService;
  private authService: AuthService;
  private launcherState: LauncherStateService;

  private constructor() {
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
      background: transparent;
      display: none;
      align-items: center;
      justify-content: center;
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    button.addEventListener('click', this.handleButtonClick.bind(this));
    document.body.appendChild(button);

    // Check if we should show the button
    const isCollapsed = await this.launcherState.isCollapsed();
    if (isCollapsed) {
      this.showButton();
    }
  }

  private async handleButtonClick(): Promise<void> {
    try {
      // This will throw and open auth page if not authenticated
      await this.authService.ensureAuthenticated();

      const launcherDock = LauncherDockService.getInstance();
      await launcherDock.expand();
      this.hideButton();
    } catch (error) {
      console.error('Failed to handle button click:', error);
      this.hideButton();
    }
  }

  hideButton(): void {
    const button = document.getElementById(ElementIds.FLOATING_BUTTON);
    if (button) {
      button.style.transform = 'translateX(100%)';
      button.style.opacity = '0';
      setTimeout(() => {
        button.style.display = 'none';
      }, 300);
    }
  }

  showButton(): void {
    const button = document.getElementById(ElementIds.FLOATING_BUTTON);
    if (button) {
      button.style.display = 'flex';
      requestAnimationFrame(() => {
        button.style.transform = 'translateX(0)';
        button.style.opacity = '1';
      });
    }
  }
}
