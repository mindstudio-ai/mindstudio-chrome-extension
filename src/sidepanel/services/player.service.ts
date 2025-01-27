import { MessagingService } from '../../content/services/messaging.service';
import { WorkerLaunchPayload } from '../../content/types';
import { RootUrl } from '../../content/constants';

export class PlayerService {
  private static instance: PlayerService;
  private playerContainer: HTMLElement;
  private messagingService: MessagingService;
  private isPlayerLoaded = false;
  private pendingWorkerLaunch: WorkerLaunchPayload | null = null;
  private playerFrame: HTMLIFrameElement | null = null;

  private constructor() {
    this.playerContainer = document.getElementById(
      'player-container',
    ) as HTMLElement;
    this.messagingService = MessagingService.getInstance();
    this.setupEventHandlers();
    this.initializePlayer();
  }

  public static getInstance(): PlayerService {
    if (!PlayerService.instance) {
      PlayerService.instance = new PlayerService();
    }
    return PlayerService.instance;
  }

  private setupEventHandlers(): void {
    // Listen for player loaded event
    this.messagingService.subscribe('player/loaded', async () => {
      this.isPlayerLoaded = true;

      // Process any pending worker launch
      if (this.pendingWorkerLaunch) {
        await this.launchWorkerInternal(this.pendingWorkerLaunch);
        this.pendingWorkerLaunch = null;
      }
    });
  }

  private initializePlayer(): void {
    // Clear existing content
    this.playerContainer.innerHTML = '';

    // Create iframe for player
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    iframe.src = `${RootUrl}/_extension/player?__displayContext=extension&__controlledAuth=1`;

    this.playerContainer.appendChild(iframe);
    this.playerFrame = iframe;
  }

  private async launchWorkerInternal(
    payload: WorkerLaunchPayload,
  ): Promise<void> {
    if (!this.playerFrame?.contentWindow) {
      console.warn('Player frame not available');
      return;
    }

    this.playerFrame.contentWindow.postMessage(
      {
        _MindStudioEvent: '@@mindstudio/player/load_worker',
        payload,
      },
      '*',
    );
  }

  public async launchWorker(payload: WorkerLaunchPayload): Promise<void> {
    if (!this.isPlayerLoaded) {
      // Queue the launch for when the player loads
      this.pendingWorkerLaunch = payload;
      return;
    }

    await this.launchWorkerInternal(payload);
  }

  public closeWorker(): void {
    if (this.playerFrame?.contentWindow) {
      this.playerFrame.contentWindow.postMessage(
        {
          _MindStudioEvent: '@@mindstudio/player/close_worker',
          payload: undefined,
        },
        '*',
      );
    }
  }
}
