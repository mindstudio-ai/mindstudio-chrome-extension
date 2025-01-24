import { MessagingService } from './messaging.service';
import { FrameService } from './frame.service';
import { DOMService } from './dom.service';
import { AuthService } from './auth.service';

export class PlayerService {
  private static instance: PlayerService;
  private isPlayerLoaded = false;
  private pendingWorkerLaunch: {
    id: string;
    name: string;
    iconUrl: string;
  } | null = null;

  private messaging = MessagingService.getInstance();
  private frameService = FrameService.getInstance();
  private domService = DOMService.getInstance();
  private authService = AuthService.getInstance();

  private constructor() {
    // Set up player/loaded handler
    this.messaging.subscribe('player/loaded', async ({ isLoggedIn }) => {
      this.isPlayerLoaded = true;

      if (!isLoggedIn) {
        const token = await this.authService.getToken();
        if (token) {
          this.messaging.sendToPlayer('auth/token_changed', {
            authToken: token,
          });
        }
      }

      // Process any pending worker launch
      if (this.pendingWorkerLaunch) {
        await this.launchWorkerInternal(this.pendingWorkerLaunch);
        this.pendingWorkerLaunch = null;
      }
    });
  }

  static getInstance(): PlayerService {
    if (!PlayerService.instance) {
      PlayerService.instance = new PlayerService();
    }
    return PlayerService.instance;
  }

  private async launchWorkerInternal(workerPayload: {
    id: string;
    name: string;
    iconUrl: string;
  }): Promise<void> {
    // Gather context
    const url = window.location.href;
    const rawHtml = this.domService.cleanDOM();
    const fullText = document.body.innerText;
    const userSelection = this.domService.getSelectedContent();

    // Send to player
    this.messaging.sendToPlayer('player/load_worker', {
      id: workerPayload.id,
      name: workerPayload.name,
      iconUrl: workerPayload.iconUrl,
      launchVariables: {
        url,
        rawHtml,
        fullText,
        userSelection,
      },
    });
  }

  async launchWorker(workerPayload: {
    id: string;
    name: string;
    iconUrl: string;
  }): Promise<void> {
    // First show the frame
    this.frameService.showPlayer();

    if (!this.isPlayerLoaded) {
      // Queue the launch for when the player loads
      this.pendingWorkerLaunch = workerPayload;
      return;
    }

    await this.launchWorkerInternal(workerPayload);
  }

  closePlayer(): void {
    this.isPlayerLoaded = false;
    this.pendingWorkerLaunch = null;
    this.frameService.hidePlayer();
  }
}
