import { ElementIds, RootUrl } from '../../constants';
import { MessagingService } from '../../services/messaging.service';

export class SyncFrame {
  private frame: HTMLIFrameElement | null = null;
  private messagingService: MessagingService;

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

    // Wait for launcher to be ready before sending token
    this.messagingService.subscribe('launcher/loaded', () => {
      this.messagingService.sendToLauncherSync('auth/token_changed', {
        authToken: token,
      });
    });

    // Set up message handler for app data updates
    this.messagingService.subscribe('launcher/apps_updated', ({ apps }) => {
      chrome.storage.local.set({ 'launcher:apps': apps }, () => {});
    });
  }

  public remove(): void {
    if (this.frame) {
      this.frame.remove();
      this.frame = null;
    }
  }

  public async reinject(token: string): Promise<void> {
    this.remove();
    await this.inject(token);
  }
}
