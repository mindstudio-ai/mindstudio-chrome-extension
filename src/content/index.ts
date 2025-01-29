import { auth } from '../shared/auth';
import { RootUrl, THANK_YOU_PAGE } from '../common/constants';
import { runtime } from '../shared/messaging';
import { storage } from '../shared/storage';
import { LauncherService } from './launcher.service';

class ContentScript {
  private launcherService = LauncherService.getInstance();

  private setupEventHandlers(): void {
    // Listen for app updates
    storage.onChange('LAUNCHER_APPS', (apps) => {
      console.log('[ContentScript] Apps updated from storage');
      this.launcherService.updateApps(apps || []);
    });

    // Register handler for login completion
    auth.onLoginComplete(async (token) => {
      console.log('[ContentScript] Login completed, handling UI updates');
      try {
        // Create a promise that resolves when apps are updated
        const appsLoadedPromise = new Promise<void>((resolve) => {
          const unsubscribe = runtime.listen('launcher/apps_updated', () => {
            console.log('[ContentScript] Apps updated, resolving promise');
            unsubscribe();
            resolve();
          });
        });

        // Reinject the sync frame with the new token
        console.log('[ContentScript] Reinjecting sync frame');
        await this.launcherService.reinjectSyncFrame(token);

        // Wait for apps to be loaded
        await appsLoadedPromise;
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
