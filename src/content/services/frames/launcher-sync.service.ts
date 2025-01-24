import { ElementIds, RootUrl, StorageKeys } from '../../constants';
import { AuthService } from '../auth.service';
import { MessagingService } from '../messaging.service';

export class LauncherSyncService {
  private static instance: LauncherSyncService;
  private authService: AuthService;
  private messagingService: MessagingService;

  private constructor() {
    this.authService = AuthService.getInstance();
    this.messagingService = MessagingService.getInstance();
  }

  static getInstance(): LauncherSyncService {
    if (!LauncherSyncService.instance) {
      LauncherSyncService.instance = new LauncherSyncService();
    }
    return LauncherSyncService.instance;
  }

  async injectFrame(): Promise<void> {
    if (document.getElementById(ElementIds.LAUNCHER_SYNC)) {
      return;
    }

    const token = await this.authService.getToken();

    if (!token) {
      return;
    }

    const frame = document.createElement('iframe');
    frame.id = ElementIds.LAUNCHER_SYNC;
    frame.style.cssText = `
      width: 0;
      height: 0;
      border: none;
      position: fixed;
      top: -9999px;
      left: -9999px;
    `;

    frame.src = `${RootUrl}/_extension/launcher?__displayContext=extension&__controlledAuth=1`;
    document.body.appendChild(frame);

    // Wait for launcher to be ready before sending token
    this.messagingService.subscribe('launcher/loaded', () => {
      this.messagingService.sendToLauncherSync('auth/token_changed', {
        authToken: token,
      });
    });

    // Set up message handler for app data updates
    this.messagingService.subscribe('launcher/apps_updated', ({ apps }) => {
      chrome.storage.local.set({ [StorageKeys.LAUNCHER_APPS]: apps }, () => {});
    });
  }

  // Add method to reinject frame with new token
  async reinjectFrame(token: string): Promise<void> {
    const frame = document.getElementById(ElementIds.LAUNCHER_SYNC);
    if (frame) {
      frame.remove();
    }
    await this.injectFrame();
  }
}
