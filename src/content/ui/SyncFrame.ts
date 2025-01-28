import { ElementIds, RootUrl, StorageKeys } from '../../common/constants';
import { MessagingService } from '../../common/messaging.service';
import { OrganizationService } from '../../common/organization.service';

export class SyncFrame {
  private frame: HTMLIFrameElement | null = null;
  private messagingService: MessagingService;
  private organizationService: OrganizationService;
  private currentToken: string | null = null;
  private isWaitingForToken = false;

  constructor(messagingService: MessagingService) {
    this.messagingService = messagingService;
    this.organizationService = OrganizationService.getInstance();
  }

  public async inject(token: string): Promise<void> {
    if (document.getElementById(ElementIds.LAUNCHER_SYNC)) {
      return;
    }

    this.currentToken = token;
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
    this.messagingService.subscribe('launcher/loaded', async () => {
      if (this.isWaitingForToken) {
        // Send initial token without organization
        this.messagingService.sendToLauncherSync('auth/token_changed', {
          authToken: token,
          organizationId: '',
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
      async ({ organizations }) => {
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

        // After receiving organizations, ensure we have a selected one and update if needed
        const organizationId =
          await this.organizationService.ensureSelectedOrganization();
        if (organizationId && this.currentToken) {
          this.messagingService.sendToLauncherSync('auth/token_changed', {
            authToken: this.currentToken,
            organizationId,
          });
        }
      },
    );
  }

  public remove(): void {
    if (this.frame) {
      this.frame.remove();
      this.frame = null;
    }
    this.isWaitingForToken = false;
    this.currentToken = null;
  }

  public async reinject(token: string): Promise<void> {
    this.remove();
    await this.inject(token);
  }
}
