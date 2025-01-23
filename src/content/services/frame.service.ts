import { ElementIds, FrameDimensions, RootUrl, ZIndexes } from '../constants';
import { AuthService } from './auth.service';
import { LauncherStateService } from './launcher-state.service';
import { FloatingButtonService } from './floating-button.service';

export class FrameService {
  private static instance: FrameService;
  private authService: AuthService;
  private launcherState: LauncherStateService;

  private constructor() {
    this.authService = AuthService.getInstance();
    this.launcherState = LauncherStateService.getInstance();
  }

  static getInstance(): FrameService {
    if (!FrameService.instance) {
      FrameService.instance = new FrameService();
    }
    return FrameService.instance;
  }

  async injectFrames(): Promise<void> {
    // Add width transition to body
    document.body.style.transition = 'width 0.3s ease';

    this.injectAuth();
    this.injectLauncher();
    this.injectPlayer();

    // Check initial state
    const isAuthenticated = await this.authService.isAuthenticated();
    const isCollapsed = await this.launcherState.isCollapsed();

    console.log('isAuthenticated', isAuthenticated);
    console.log('isCollapsed', isCollapsed);

    if (isAuthenticated && !isCollapsed) {
      this.showLauncher();
    } else if (isAuthenticated && isCollapsed) {
      const floatingButton = FloatingButtonService.getInstance();
      floatingButton.showButton();
    }
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
      right: ${FrameDimensions.LAUNCHER.WIDTH}px;
      width: ${FrameDimensions.PLAYER.WIDTH}px;
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
      launcher.style.width = '0';
      launcher.style.display = 'none';
      auth.style.width = '400px';
      auth.style.borderLeft = '1px solid #E6E7E8';
      auth.style.display = 'block';
      document.body.style.width = `calc(100% - ${FrameDimensions.AUTH.WIDTH}px)`;
    }
  }

  async showLauncher(): Promise<void> {
    const isCollapsed = await this.launcherState.isCollapsed();
    if (isCollapsed) {
      const floatingButton = FloatingButtonService.getInstance();
      floatingButton.showButton();
      return;
    }

    const auth = document.getElementById(ElementIds.AUTH) as HTMLIFrameElement;
    const launcher = document.getElementById(
      ElementIds.LAUNCHER,
    ) as HTMLIFrameElement;

    if (auth && launcher) {
      const token = await this.authService.getToken();
      launcher.src = `${RootUrl}/_extension/launcher?__displayContext=extension&__controlledAuth=1&token=${token}`;

      auth.style.width = '0';
      auth.style.display = 'none';
      launcher.style.display = 'block';
      launcher.style.width = `${FrameDimensions.LAUNCHER.WIDTH}px`;
      launcher.style.borderLeft = '1px solid #12121340';

      document.body.style.width = `calc(100% - ${FrameDimensions.LAUNCHER.WIDTH}px)`;
    }
  }

  async collapseLauncher(): Promise<void> {
    await this.launcherState.setCollapsed(true);
    const launcher = document.getElementById(
      ElementIds.LAUNCHER,
    ) as HTMLIFrameElement;

    if (launcher) {
      launcher.style.width = '0';
      launcher.style.display = 'none';
      document.body.style.width = '100%';
    }
    const floatingButton = FloatingButtonService.getInstance();
    floatingButton.showButton();
  }

  hideLauncher(): void {
    const launcher = document.getElementById(
      ElementIds.LAUNCHER,
    ) as HTMLIFrameElement;

    if (launcher) {
      launcher.style.width = '0';
      document.body.style.width = '100%';
    }
  }

  hideAuth(): void {
    const auth = document.getElementById(ElementIds.AUTH) as HTMLIFrameElement;

    if (auth) {
      auth.style.width = '0';
      document.body.style.width = '100%';
    }
  }

  updateLauncherSize(width: number): void {
    const launcher = document.getElementById(
      ElementIds.LAUNCHER,
    ) as HTMLIFrameElement;

    if (launcher) {
      launcher.style.width = `${width}px`;
      document.body.style.width = `calc(100% - ${width}px)`;
    }
  }

  public showPlayer(): void {
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
    launcher.style.width = `${FrameDimensions.LAUNCHER.WIDTH}px`;

    // Place the player immediately to the left of launcher
    player.style.display = 'block';
    player.style.opacity = '1';
    player.style.width = `${FrameDimensions.PLAYER.WIDTH}px`;
    player.style.right = `${FrameDimensions.LAUNCHER.WIDTH}px`;
    player.style.borderLeft = '1px solid #E6E7E8';

    // Shift the entire page content
    const totalWidth =
      FrameDimensions.PLAYER.WIDTH + FrameDimensions.LAUNCHER.WIDTH;
    document.body.style.width = `calc(100% - ${totalWidth}px)`;
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

    document.body.style.width = `calc(100% - ${FrameDimensions.LAUNCHER.WIDTH}px)`;
  }
}
