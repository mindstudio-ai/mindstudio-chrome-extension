import { RootUrl } from '../../shared/constants';
import { Frame } from '../../shared/services/frame';
import { frame } from '../../shared/services/messaging';
import { storage } from '../../shared/services/storage';

export class SyncFrame extends Frame {
  constructor() {
    super({
      id: 'sync-frame',
      src: `${RootUrl}/_extension/launcher?__displayContext=extension`,
      hidden: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for launcher loaded event
    frame.listen('launcher/loaded', async () => {
      // Send auth token if available
      const token = await storage.get('AUTH_TOKEN');
      if (token) {
        frame.send('sync-frame', 'auth/token_changed', { authToken: token });
      }
    });

    // Listen for apps updates from launcher
    frame.listen('launcher/apps_updated', async ({ apps }) => {
      await storage.set('LAUNCHER_APPS', apps);
    });

    // Listen for auth token changes
    storage.onChange('AUTH_TOKEN', async (token) => {
      if (token && this.isReady()) {
        frame.send('sync-frame', 'auth/token_changed', { authToken: token });
      }
    });
  }

  protected onFrameLoad(): void {}
}
