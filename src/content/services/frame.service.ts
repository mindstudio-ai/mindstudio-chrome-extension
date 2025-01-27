import { AuthFrameService } from './frames/auth-frame.service';
import { PlayerFrameService } from './frames/player-frame.service';
import { LauncherSyncService } from './frames/launcher-sync.service';

export class FrameService {
  private static instance: FrameService;
  private authFrame: AuthFrameService;
  private playerFrame: PlayerFrameService;
  private launcherSync: LauncherSyncService;

  private constructor() {
    this.authFrame = AuthFrameService.getInstance();
    this.playerFrame = PlayerFrameService.getInstance();
    this.launcherSync = LauncherSyncService.getInstance();
  }

  static getInstance(): FrameService {
    if (!FrameService.instance) {
      FrameService.instance = new FrameService();
    }
    return FrameService.instance;
  }

  async injectFrames(): Promise<void> {
    this.authFrame.injectFrame();
    this.playerFrame.injectFrame();
    await this.launcherSync.injectFrame();
  }

  showAuth(): void {
    this.authFrame.show();
  }

  hideAuth(): void {
    this.authFrame.hide();
  }

  showPlayer(): void {
    this.playerFrame.show();
  }

  hidePlayer(): void {
    this.playerFrame.hide();
  }
}
