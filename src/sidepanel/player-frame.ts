import { RootUrl } from '../shared/constants';
import { WorkerLaunchPayload } from '../shared/types/events';
import { Frame } from '../shared/services/frame';
import { frame, runtime } from '../shared/services/messaging';
import { storage } from '../shared/services/storage';

export class PlayerFrame extends Frame {
  private pendingWorker: WorkerLaunchPayload | null = null;
  private isFirstLoad = true;

  constructor(container: HTMLElement) {
    super({
      id: 'player-frame',
      src: `${RootUrl}/_extension/player?__displayContext=extension&__controlledAuth=1`,
      container,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for player loaded event
    frame.listen('player/loaded', async () => {
      this.setLoaded(true);

      // Send auth token if available
      const token = await storage.get('AUTH_TOKEN');
      const organizationId = await storage.get('SELECTED_ORGANIZATION');
      if (token && organizationId) {
        frame.send('player-frame', 'auth/token_changed', {
          authToken: token,
          organizationId,
        });
      }

      // Notify background we're ready for workers
      await runtime.send('sidepanel/ready', undefined);

      // Send any pending worker
      if (this.pendingWorker) {
        this.loadWorker(this.pendingWorker);
        this.pendingWorker = null;
      }

      // No longer first load
      this.isFirstLoad = false;
    });

    // Listen for auth token changes
    storage.onChange('AUTH_TOKEN', async (token) => {
      const organizationId = await storage.get('SELECTED_ORGANIZATION');
      if (organizationId && token && this.isReady()) {
        frame.send('player-frame', 'auth/token_changed', {
          authToken: token,
          organizationId,
        });
      }
    });

    // Listen for worker launch requests
    runtime.listen('player/init', (payload: WorkerLaunchPayload) => {
      if (this.isFirstLoad) {
        // On first load, just store the worker to be loaded after frame is ready
        this.pendingWorker = payload;
      } else {
        // For subsequent workers, store and reload frame
        this.pendingWorker = payload;
        this.reset();
      }
    });
  }

  private loadWorker(payload: WorkerLaunchPayload): void {
    if (!this.isReady()) {
      this.pendingWorker = payload;
      return;
    }

    frame.send('player-frame', 'player/load_worker', {
      id: payload.appId,
      name: payload.appName,
      iconUrl: payload.appIcon,
      launchVariables: payload.launchVariables,
    });
  }

  protected onFrameLoad(): void {}

  reset(): void {
    this.setLoaded(false);
    this.element.src = this.element.src;
  }
}
