import { RootUrl } from '../constants';
import { AuthService } from './auth.service';

export class FrameService {
  private static instance: FrameService;
  private readonly launcherId = '__MindStudioLauncher';
  private readonly playerId = '__MindStudioPlayer';
  private readonly authId = '__MindStudioAuth';
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
    if (document.getElementById(this.authId)) {
      return;
    }

    const frame = document.createElement('iframe');
    frame.id = this.authId;
    frame.src = `${RootUrl}/_extension/login?__displayContext=extension`;
    frame.style.cssText = `
      position: fixed;
      top: 0;
      right: 1px;
      width: 0;
      height: 100vh;
      border: none;
      z-index: 999999;
      background: #FEFEFF;
      transition: width 0.3s ease;
    `;

    document.body.appendChild(frame);
  }

  private async injectLauncher(): Promise<void> {
    if (document.getElementById(this.launcherId)) {
      return;
    }

    const token = await this.authService.getToken();
    const frame = document.createElement('iframe');
    frame.id = this.launcherId;
    frame.src = `${RootUrl}/_extension/launcher?__displayContext=extension&__controlledAuth=1&token=${token}`;
    frame.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 0;
      height: 100vh;
      border: none;
      z-index: 999999;
      background: #F6F6F7;
      transition: width 0.3s ease;
    `;

    if (this.isMindStudioPage()) {
      frame.style.display = 'none';
    }

    document.body.appendChild(frame);
  }

  private injectPlayer(): void {
    if (document.getElementById(this.playerId)) {
      return;
    }

    const frame = document.createElement('iframe');
    frame.id = this.playerId;
    frame.src = `${RootUrl}/_extension/player?__displayContext=extension&__controlledAuth=1`;
    frame.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      border: none;
      z-index: 999999;
      background: transparent;
      display: none;
      opacity: 0;
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
    const auth = document.getElementById(this.authId) as HTMLIFrameElement;
    const launcher = document.getElementById(
      this.launcherId,
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
    const auth = document.getElementById(this.authId) as HTMLIFrameElement;
    const launcher = document.getElementById(
      this.launcherId,
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
      this.launcherId,
    ) as HTMLIFrameElement;
    if (launcher) {
      launcher.style.width = '0';
      document.body.style.marginRight = '0';
    }
  }

  hideAuth(): void {
    const auth = document.getElementById(this.authId) as HTMLIFrameElement;
    if (auth) {
      auth.style.width = '0';
      document.body.style.marginRight = '0';
    }
  }

  updateLauncherSize(width: number, height: number): void {
    const launcher = document.getElementById(
      this.launcherId,
    ) as HTMLIFrameElement;
    if (launcher) {
      launcher.style.width = `${width}px`;
      document.body.style.marginRight = `${width}px`;
    }
  }
}
