import { AuthService } from './services/auth.service';
import { MessagingService } from './services/messaging.service';
import { LauncherService } from './services/launcher.service';
import { RootUrl } from './constants';

class ContentScript {
  private messagingService = MessagingService.getInstance();
  private authService = AuthService.getInstance();
  private launcherService = LauncherService.getInstance();

  private setupEventHandlers(): void {
    this.messagingService.subscribe(
      'auth/login_completed',
      async ({ authToken }) => {
        await this.authService.setToken(authToken);
        await this.launcherService.reinjectSyncFrame(authToken);
        await this.launcherService.expand();
      },
    );
  }

  async initialize(): Promise<void> {
    if (window.self !== window.top) {
      return;
    }

    // Don't initialize on MindStudio app pages
    if (window.location.origin === RootUrl) {
      return;
    }

    this.setupEventHandlers();

    // Check initial auth state
    const token = await this.authService.getToken();
    const isAuthenticated = await this.authService.isAuthenticated();

    if (!isAuthenticated || !token) {
      await this.launcherService.collapse();
    } else {
      await this.launcherService.expand();
    }
  }
}

const contentScript = new ContentScript();
contentScript.initialize().catch(console.error);
