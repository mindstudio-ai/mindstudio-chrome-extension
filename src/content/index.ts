import { AuthService } from './services/auth.service';
import { FrameService } from './services/frame.service';
import { MessagingService } from './services/messaging.service';
import { PlayerService } from './services/player.service';
import { FloatingButtonService } from './services/floating-button.service';
import { URLService } from './services/url.service';

class ContentScript {
  private frameService = FrameService.getInstance();
  private messagingService = MessagingService.getInstance();
  private authService = AuthService.getInstance();
  private playerService = PlayerService.getInstance();
  private floatingButtonService = FloatingButtonService.getInstance();
  private urlService = URLService.getInstance();

  private setupEventHandlers(): void {
    this.messagingService.subscribe(
      'auth/login_completed',
      async ({ authToken }) => {
        await this.authService.setToken(authToken);
        this.messagingService.sendToLauncher('auth/token_changed', {
          authToken,
        });
        this.messagingService.sendToPlayer('auth/token_changed', { authToken });
        this.frameService.showLauncher();
        this.floatingButtonService.hideButton();
      },
    );

    this.messagingService.subscribe('launcher/loaded', async () => {
      const token = await this.authService.getToken();
      if (token) {
        this.messagingService.sendToLauncher('auth/token_changed', {
          authToken: token,
        });
      } else {
        this.frameService.showAuth();
      }
      this.messagingService.sendToLauncher('url/changed', {
        url: window.location.href,
      });
    });

    this.messagingService.subscribe('player/loaded', async () => {
      const token = await this.authService.getToken();
      if (token) {
        this.messagingService.sendToPlayer('auth/token_changed', {
          authToken: token,
        });
      }
    });

    this.messagingService.subscribe(
      'launcher/size_updated',
      ({ width, height }) => {
        this.frameService.updateLauncherSize(width, height);
      },
    );

    this.messagingService.subscribe('player/launch_worker', (payload) => {
      this.playerService.launchWorker(payload);
    });

    this.messagingService.subscribe('player/close_worker', () => {
      this.frameService.hidePlayer();
    });
  }

  initialize(): void {
    if (window.self !== window.top) {
      return;
    }
    this.frameService.injectFrames();
    this.setupEventHandlers();
    this.floatingButtonService.injectButton();
    this.urlService.startTracking();
  }
}

const contentScript = new ContentScript();
contentScript.initialize();
