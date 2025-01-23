import { ElementIds, RootUrl, ZIndexes } from '../constants';
import { AuthService } from './auth.service';

export class FrameService {
  private static instance: FrameService;
  private authService: AuthService;

  private constructor() {
    this.authService = AuthService.getInstance();
  }

  static getInstance(): FrameService {
    if (!FrameService.instance) {
      FrameService.instance = new FrameService();
    }
    return FrameService.instance;
  }

  injectFrames(): void {
    this.injectAuth();
    this.injectLauncher();
    this.injectPlayer();
  }

  private injectAuth(): void {
    if (document.getElementById(ElementIds.AUTH)) {
      return;
    }

    const frame = document.createElement('iframe');
    frame.id = ElementIds.AUTH;
    frame.src = `${RootUrl}/_extension/login?__displayContext=extension`;
    frame.style.cssText = `
      position: fixed;
      top: 0;
      right: 1px;
      width: 0;
      height: 100vh;
      border: none;
      z-index: ${ZIndexes.AUTH};
      background: #FEFEFF;
      transition: width 0.3s ease;
    `;

    document.body.appendChild(frame);
  }

  private async injectLauncher(): Promise<void> {
    if (document.getElementById(ElementIds.LAUNCHER)) {
      return;
    }

    const token = await this.authService.getToken();
    const frame = document.createElement('iframe');
    frame.id = ElementIds.LAUNCHER;
    frame.src = `${RootUrl}/_extension/launcher?__displayContext=extension&__controlledAuth=1`;
    frame.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 0;
      height: 100vh;
      border: none;
      z-index: ${ZIndexes.LAUNCHER};
      background: #F6F6F7;
      transition: width 0.3s ease;
    `;

    if (this.isMindStudioPage()) {
      frame.style.display = 'none';
    }

    document.body.appendChild(frame);
  }

  private injectPlayer(): void {
    if (document.getElementById(ElementIds.PLAYER)) {
      return;
    }

    const frame = document.createElement('iframe');
    frame.id = ElementIds.PLAYER;
    frame.src = `${RootUrl}/_extension/player?__displayContext=extension&__controlledAuth=1`;
    frame.style.cssText = `
      position: fixed;
      top: 0;
      right: 40px;
      width: 400px;
      height: 100vh;
      border: none;
      z-index: ${ZIndexes.PLAYER};
      background: #FFFFFF;
      display: none;
      opacity: 0;
      transition: all 0.3s ease;
    `;

    document.body.appendChild(frame);
  }

  private isMindStudioPage(): boolean {
    return (
      window.top?.location.host === 'app.mindstudio.ai' ||
      window.top?.location.host === 'localhost:3000'
    );
  }

  showAuth(): void {
    const auth = document.getElementById(ElementIds.AUTH) as HTMLIFrameElement;
    const launcher = document.getElementById(
      ElementIds.LAUNCHER,
    ) as HTMLIFrameElement;

    if (auth && launcher) {
      // Hide launcher if it's showing
      launcher.style.width = '0';
      launcher.style.display = 'none';
      // Show auth iframe
      auth.style.width = '400px';
      auth.style.borderLeft = '1px solid #E6E7E8';
      auth.style.display = 'block';
      // Shift the page content
      document.body.style.marginRight = '400px';
    }
  }

  async showLauncher(width: number = 40): Promise<void> {
    const auth = document.getElementById(ElementIds.AUTH) as HTMLIFrameElement;
    const launcher = document.getElementById(
      ElementIds.LAUNCHER,
    ) as HTMLIFrameElement;

    if (auth && launcher) {
      // Update launcher src with current token
      const token = await this.authService.getToken();
      launcher.src = `${RootUrl}/_extension/launcher?__displayContext=extension&__controlledAuth=1&token=${token}`;

      // Hide auth if it's showing
      auth.style.width = '0';
      auth.style.display = 'none';
      // Show launcher iframe
      launcher.style.display = 'block';
      launcher.style.width = `${width}px`;
      // Shift the page content
      document.body.style.marginRight = `${width}px`;
    }
  }

  hideLauncher(): void {
    const launcher = document.getElementById(
      ElementIds.LAUNCHER,
    ) as HTMLIFrameElement;
    if (launcher) {
      launcher.style.width = '0';
      document.body.style.marginRight = '0';
    }
  }

  hideAuth(): void {
    const auth = document.getElementById(ElementIds.AUTH) as HTMLIFrameElement;
    if (auth) {
      auth.style.width = '0';
      document.body.style.marginRight = '0';
    }
  }

  updateLauncherSize(width: number, height: number): void {
    const launcher = document.getElementById(
      ElementIds.LAUNCHER,
    ) as HTMLIFrameElement;
    if (launcher) {
      launcher.style.width = `${width}px`;
      document.body.style.marginRight = `${width}px`;
    }
  }

  public showPlayer(width = 400, offset = 40): void {
    const launcher = document.getElementById(
      ElementIds.LAUNCHER,
    ) as HTMLIFrameElement;
    const player = document.getElementById(
      ElementIds.PLAYER,
    ) as HTMLIFrameElement;

    if (!launcher || !player) {
      return;
    }

    // Keep launcher pinned at the far right
    launcher.style.display = 'block';
    launcher.style.width = `${offset}px`;

    // Place the player immediately to the left of launcher
    player.style.display = 'block';
    player.style.opacity = '1';
    player.style.width = `${width}px`;
    player.style.right = `${offset}px`;
    player.style.borderLeft = '1px solid #E6E7E8';

    // Shift the entire page content
    document.body.style.marginRight = `${width + offset}px`;
  }

  public hidePlayer(): void {
    const player = document.getElementById(
      ElementIds.PLAYER,
    ) as HTMLIFrameElement;
    if (!player) {
      return;
    }
    player.style.display = 'none';
    player.style.opacity = '0';
    // Reset margin to account for launcher only
    document.body.style.marginRight = '40px';
  }
}
