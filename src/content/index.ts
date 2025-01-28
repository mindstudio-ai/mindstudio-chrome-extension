import { AuthService } from '../services/auth.service';
import { MessagingService } from './services/messaging.service';
import { LauncherService } from './services/launcher.service';
import { RootUrl, StorageKeys } from './constants';

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
              console.log('[ContentScript] Received apps_updated event');
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

    // Don't initialize on MindStudio app pages
    if (window.location.origin === RootUrl) {
      return;
    }

    this.setupEventHandlers();
    await this.launcherService.initialize();
  }
}

const contentScript = new ContentScript();
contentScript.initialize().catch(console.error);
