import { ElementIds, RootUrl, StorageKeys } from '../../common/constants';
import { MessagingService } from '../../common/messaging.service';

export class SyncFrame {
  private frame: HTMLIFrameElement | null = null;
  private messagingService: MessagingService;
  private isWaitingForToken = false;

  constructor(messagingService: MessagingService) {
    this.messagingService = messagingService;
  }

  public async inject(token: string): Promise<void> {
    if (document.getElementById(ElementIds.LAUNCHER_SYNC)) {
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
    this.frame = frame;
    this.isWaitingForToken = true;

    // Wait for launcher to be ready before sending token
    this.messagingService.subscribe('launcher/loaded', () => {
      if (this.isWaitingForToken) {
        this.messagingService.sendToLauncherSync('auth/token_changed', {
          authToken: token,
        });
        this.isWaitingForToken = false;
      }
    });

    // Set up message handler for app data updates
    this.messagingService.subscribe('launcher/apps_updated', ({ apps }) => {
      if (!apps || !Array.isArray(apps)) {
        console.error('[MindStudio Extension] Invalid apps data received');
        return;
      }

      chrome.storage.local.set({ [StorageKeys.LAUNCHER_APPS]: apps }, () => {
        const error = chrome.runtime.lastError;
        if (error) {
          console.error('[MindStudio Extension] Error saving apps:', error);
        }
      });
    });

    // Set up message handler for organization data updates
    this.messagingService.subscribe(
      'organization/list_updated',
      ({ organizations }) => {
        if (!organizations || !Array.isArray(organizations)) {
          console.error(
            '[MindStudio Extension] Invalid organizations data received',
          );
          return;
        }

        chrome.storage.local.set(
          { [StorageKeys.ORGANIZATIONS]: organizations },
          () => {
            const error = chrome.runtime.lastError;
            if (error) {
              console.error(
                '[MindStudio Extension] Error saving organizations:',
                error,
              );
            }
          },
        );
      },
    );
  }

  public remove(): void {
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
