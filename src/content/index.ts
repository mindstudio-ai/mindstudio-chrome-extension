import { AuthService } from '../common/auth.service';
import { MessagingService } from '../common/messaging.service';
import { LauncherService } from './launcher.service';
import { RootUrl, StorageKeys, THANK_YOU_PAGE } from '../common/constants';

class ContentScript {
  private messagingService = MessagingService.getInstance();
  private authService = AuthService.getInstance();
  private launcherService = LauncherService.getInstance();

  private setupEventHandlers(): void {
    // Register handler for login completion
    this.authService.onLoginComplete(async (token) => {
      try {
        // Create a promise that resolves when apps are updated
        const appsLoadedPromise = new Promise<void>((resolve) => {
          const unsubscribe = this.messagingService.subscribe(
            'launcher/apps_updated',
            () => {
              unsubscribe.unsubscribe();
              resolve();
            },
          );
        });

        // Reinject the sync frame with the new token
        await this.launcherService.reinjectSyncFrame(token);

        // Wait for apps to be loaded
        await appsLoadedPromise;

        // Update collapsed state first
        await chrome.storage.local.set({
          [StorageKeys.LAUNCHER_COLLAPSED]: false,
        });

        // Finally expand the launcher
        await this.launcherService.expand();
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

    this.setupEventHandlers();
    await this.launcherService.initialize();

    // If we're on the thank you page, trigger authentication
    if (window.location.href === THANK_YOU_PAGE) {
      try {
        await this.authService.ensureAuthenticated();
      } catch (error) {
        console.error('[ContentScript] Authentication error:', error);
      }
    }
  }
}

const contentScript = new ContentScript();
contentScript.initialize().catch(console.error);
