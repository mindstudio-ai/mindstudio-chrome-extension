import { RootUrl } from '../../shared/constants';
import { Frame } from '../../shared/services/frame';
import { frame } from '../../shared/services/messaging';
import { storage } from '../../shared/services/storage';
import { createElementId } from '../../shared/utils/dom';

export class SyncFrame extends Frame {
  static readonly ElementId = {
    FRAME: createElementId('LauncherSync'),
  };

  constructor() {
    super({
      id: SyncFrame.ElementId.FRAME,
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
      const organizationId = await storage.get('SELECTED_ORGANIZATION');

      if (token && organizationId) {
        console.info('[MindStudio][Launcher] Authenticating sync frame');
        frame.send(SyncFrame.ElementId.FRAME, 'auth/token_changed', {
          authToken: token,
          organizationId,
        });
      }
    });

    // Listen for apps updates from launcher
    frame.listen('launcher/apps_updated', async ({ apps }) => {
      const selectedOrg = await storage.get('SELECTED_ORGANIZATION');
      if (!selectedOrg) {
        console.info(
          '[MindStudio][Launcher] No organization selected, skipping apps update',
        );
        return;
      }

      const existingApps = (await storage.get('LAUNCHER_APPS')) ?? {};
      await storage.set('LAUNCHER_APPS', {
        ...existingApps,
        [selectedOrg]: apps,
      });
      console.info('[MindStudio][Launcher] Updated apps list:', {
        organizationId: selectedOrg,
        count: apps.length,
      });
    });

    // Listen for auth token changes
    storage.onChange('AUTH_TOKEN', this.sendAuthToken.bind(this));

    // Listen for organization selection changes
    storage.onChange('SELECTED_ORGANIZATION', this.sendAuthToken.bind(this));
  }

  private async sendAuthToken(): Promise<void> {
    const token = await storage.get('AUTH_TOKEN');
    const organizationId = await storage.get('SELECTED_ORGANIZATION');

    if (token && organizationId && this.isReady()) {
      console.info('[MindStudio][Launcher] Updating auth token');
      frame.send(SyncFrame.ElementId.FRAME, 'auth/token_changed', {
        authToken: token,
        organizationId,
      });
    }
  }

  protected onFrameLoad(): void {
    console.info('[MindStudio][Launcher] Sync frame loaded');
  }
}
