import { AuthService } from './services/auth.service';
import { FrameService } from './services/frame.service';
import { MessagingService } from './services/messaging.service';
import { PlayerService } from './services/player.service';
import { FloatingButtonService } from './services/floating-button.service';
import { URLService } from './services/url.service';
import { LauncherDockService } from './services/launcher-dock.service';
import { LauncherStateService } from './services/launcher-state.service';
import { LauncherSyncService } from './services/frames/launcher-sync.service';

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

        // Reinject launcher sync frame with new token
        const launcherSync = LauncherSyncService.getInstance();
        await launcherSync.reinjectFrame(authToken);

        this.messagingService.sendToPlayer('auth/token_changed', { authToken });
        this.floatingButtonService.hideButton();
      },
    );

    this.messagingService.subscribe('player/loaded', async () => {
      const token = await this.authService.getToken();
      if (token) {
        this.messagingService.sendToPlayer('auth/token_changed', {
          authToken: token,
        });
      }
    });

    this.messagingService.subscribe('player/launch_worker', (payload) => {
      this.playerService.launchWorker(payload);
    });

    this.messagingService.subscribe('player/close_worker', () => {
      this.frameService.hidePlayer();
    });
  }

  async initialize(): Promise<void> {
    if (window.self !== window.top) {
      return;
    }

    const launcherDock = LauncherDockService.getInstance();
    const launcherState = LauncherStateService.getInstance();
    const authService = AuthService.getInstance();

    // Check auth first
    const token = await authService.getToken();

    launcherDock.injectDock();
    await this.frameService.injectFrames();

    // Check initial state
    const isAuthenticated = await authService.isAuthenticated();
    const isCollapsed = await launcherState.isCollapsed();

    if (isAuthenticated && !isCollapsed) {
      launcherDock.showDock();
    }

    this.setupEventHandlers();
    this.floatingButtonService.injectButton();
    this.urlService.startTracking();
  }
}

const contentScript = new ContentScript();
contentScript.initialize();
