import { LauncherSyncService } from './frames/launcher-sync.service';

export class FrameService {
  private static instance: FrameService;
  private launcherSync: LauncherSyncService;

  private constructor() {
    this.launcherSync = LauncherSyncService.getInstance();
  }

  static getInstance(): FrameService {
    if (!FrameService.instance) {
      FrameService.instance = new FrameService();
    }
    return FrameService.instance;
  }

  async injectFrames(): Promise<void> {
    await this.launcherSync.injectFrame();
  }
}
