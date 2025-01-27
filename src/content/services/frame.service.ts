import { PlayerFrameService } from './frames/player-frame.service';
import { LauncherSyncService } from './frames/launcher-sync.service';

export class FrameService {
  private static instance: FrameService;
  private playerFrame: PlayerFrameService;
  private launcherSync: LauncherSyncService;

  private constructor() {
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
    this.playerFrame.injectFrame();
    await this.launcherSync.injectFrame();
  }

  showPlayer(): void {
    this.playerFrame.show();
  }

  hidePlayer(): void {
    this.playerFrame.hide();
  }
}
