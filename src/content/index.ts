import { RootUrl, THANK_YOU_PAGE } from '../shared/constants';
import { auth } from '../shared/services/auth';
import { LauncherService } from './launcher';

class ContentScript {
  private launcherService = LauncherService.getInstance();

  private setupEventHandlers(): void {
    // Register handler for login completion
    auth.onLoginComplete(async (token) => {
      console.log('[ContentScript] Login completed');
      try {
        await auth.ensureAuthenticated();
      } catch (error) {
        console.error('[ContentScript] Login completion error:', error);
      }
    });
  }

  async initialize(): Promise<void> {
    if (window.self !== window.top) {
      return;
    }

    // Don't initialize on MindStudio app pages except for the thank you page
    if (
      window.location.origin === RootUrl &&
      window.location.href !== THANK_YOU_PAGE
    ) {
      return;
    }

    console.log('[ContentScript] Initializing');
    this.setupEventHandlers();
    await this.launcherService.initialize();

    // If we're on the thank you page, trigger authentication
    if (window.location.href === THANK_YOU_PAGE) {
      try {
        await auth.ensureAuthenticated();
      } catch (error) {
        console.error('[ContentScript] Authentication error:', error);
      }
    }
  }
}

const contentScript = new ContentScript();
contentScript.initialize().catch(console.error);
