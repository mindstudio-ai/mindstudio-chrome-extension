import { RootUrl } from '../common/constants';
import { WorkerLaunchPayload } from '../common/types';
import { Frame } from '../shared/frame';
import { frame, runtime } from '../shared/messaging';
import { storage } from '../shared/storage';

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
      console.log('[PlayerFrame] Player loaded');
      this.setLoaded(true);

      // Send auth token if available
      const token = await storage.get('AUTH_TOKEN');
      if (token) {
        frame.send('player-frame', 'auth/token_changed', { authToken: token });
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
      if (token && this.isReady()) {
        frame.send('player-frame', 'auth/token_changed', { authToken: token });
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

  protected onFrameLoad(): void {
    console.log('[PlayerFrame] Frame DOM loaded');
  }

  reset(): void {
    this.setLoaded(false);
    this.element.src = this.element.src;
  }
}
