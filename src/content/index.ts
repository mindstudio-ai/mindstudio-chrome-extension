import { AuthService } from './services/auth.service';
import { FrameService } from './services/frame.service';
import { MessagingService } from './services/messaging.service';
import { FloatingButtonService } from './services/ui/floating-button.service';
import { LauncherDockService } from './services/ui/launcher-dock.service';
import { LauncherStateService } from './services/launcher-state.service';
import { LauncherSyncService } from './services/frames/launcher-sync.service';
import { SidePanelService } from './services/side-panel.service';
import { RootUrl } from './constants';

class ContentScript {
  private frameService = FrameService.getInstance();
  private messagingService = MessagingService.getInstance();
  private authService = AuthService.getInstance();
  private floatingButtonService = FloatingButtonService.getInstance();
  private launcherStateService = LauncherStateService.getInstance();
  private sidePanelService = SidePanelService.getInstance();

  private setupEventHandlers(): void {
    this.messagingService.subscribe(
      'auth/login_completed',
      async ({ authToken }) => {
        await this.authService.setToken(authToken);

        // Reinject launcher sync frame with new token
        const launcherSync = LauncherSyncService.getInstance();
        await launcherSync.reinjectFrame(authToken);

        await this.launcherStateService.setCollapsed(false);
        const launcherDock = LauncherDockService.getInstance();
        launcherDock.showDock();

        this.floatingButtonService.hideButton();
      },
    );

    this.messagingService.subscribe('player/launch_worker', (payload) => {
      this.sidePanelService.launchWorker(payload);
    });

    this.messagingService.subscribe('player/close_worker', () => {
      this.sidePanelService.closeWorker();
    });
  }

  async initialize(): Promise<void> {
    if (window.self !== window.top) {
      return;
    }

    // Don't initialize on MindStudio app pages
    if (window.location.origin === RootUrl) {
      return;
    }

    const launcherDock = LauncherDockService.getInstance();
    const launcherState = LauncherStateService.getInstance();
    const authService = AuthService.getInstance();

    // Set initial collapsed state if no token exists
    const token = await authService.getToken();
    if (!token) {
      await launcherState.setCollapsed(true);
    }

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
  }
}

const contentScript = new ContentScript();
contentScript.initialize();
