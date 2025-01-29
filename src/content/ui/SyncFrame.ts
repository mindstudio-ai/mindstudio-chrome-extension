import { ElementIds, RootUrl, StorageKeys } from '../../common/constants';
import { AppData } from '../../common/types';
import { frame } from '../../shared/messaging';
import { storage } from '../../shared/storage';

export class SyncFrame {
  private frame: HTMLIFrameElement | null = null;
  private isWaitingForToken = false;
  private unsubscribeLauncherLoaded: (() => void) | null = null;
  private unsubscribeAppsUpdated: (() => void) | null = null;

  constructor() {
    // Listen for storage changes to keep launcher in sync
    storage.onChange('AUTH_TOKEN', (token) => {
      if (token) {
        this.sendTokenToLauncher(token);
      }
    });
  }

  private sendTokenToLauncher(token: string): void {
    if (this.frame?.contentWindow && this.isWaitingForToken) {
      frame.send(ElementIds.LAUNCHER_SYNC, 'auth/token_changed', {
        authToken: token,
      });
      this.isWaitingForToken = false;
    }
  }

  public async inject(token: string): Promise<void> {
    if (document.getElementById(ElementIds.LAUNCHER_SYNC)) {
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.id = ElementIds.LAUNCHER_SYNC;
    iframe.style.cssText = `
      width: 0;
      height: 0;
      border: none;
      position: fixed;
      top: -9999px;
      left: -9999px;
    `;

    iframe.src = `${RootUrl}/_extension/launcher?__displayContext=extension&__controlledAuth=1`;
    document.body.appendChild(iframe);
    this.frame = iframe;
    this.isWaitingForToken = true;

    // Set up message handlers
    this.setupMessageHandlers(token);
  }

  private setupMessageHandlers(token: string): void {
    // Wait for launcher to be ready before sending token
    this.unsubscribeLauncherLoaded = frame.listen('launcher/loaded', () => {
      if (this.isWaitingForToken) {
        this.sendTokenToLauncher(token);
      }
    });

    // Set up message handler for app data updates
    this.unsubscribeAppsUpdated = frame.listen(
      'launcher/apps_updated',
      ({ apps }: { apps: AppData[] }) => {
        if (!apps || !Array.isArray(apps)) {
          console.error('[MindStudio Extension] Invalid apps data received');
          return;
        }

        storage.set('LAUNCHER_APPS', apps).catch((error) => {
          console.error('[MindStudio Extension] Error saving apps:', error);
        });
      },
    );
  }

  public remove(): void {
    if (this.unsubscribeLauncherLoaded) {
      this.unsubscribeLauncherLoaded();
      this.unsubscribeLauncherLoaded = null;
    }
    if (this.unsubscribeAppsUpdated) {
      this.unsubscribeAppsUpdated();
      this.unsubscribeAppsUpdated = null;
    }
    if (this.frame) {
      this.frame.remove();
      this.frame = null;
    }
    this.isWaitingForToken = false;
  }

  public async reinject(token: string): Promise<void> {
    this.remove();
    await this.inject(token);
  }
}
