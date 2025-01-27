import { MessagingService } from './messaging.service';
import { WorkerLaunchPayload } from '../types';

export class SidePanelService {
  private static instance: SidePanelService;
  private messagingService: MessagingService;

  private constructor() {
    this.messagingService = MessagingService.getInstance();
  }

  public static getInstance(): SidePanelService {
    if (!SidePanelService.instance) {
      SidePanelService.instance = new SidePanelService();
    }
    return SidePanelService.instance;
  }

  public async openSidePanel(): Promise<void> {
    if (!chrome?.sidePanel) {
      console.warn('Side panel API not available');
      return;
    }

    await chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
  }

  public async setVisible(visible: boolean): Promise<void> {
    if (!chrome?.sidePanel) {
      console.warn('Side panel API not available');
      return;
    }

    if (visible) {
      await this.openSidePanel();
    } else {
      await chrome.sidePanel.setOptions({ enabled: false });
    }
  }

  public async launchWorker(payload: WorkerLaunchPayload): Promise<void> {
    // First ensure side panel is open
    await this.openSidePanel();

    // Send launch message to side panel
    this.messagingService.sendToSidePanel('player/launch_worker', payload);
  }

  public async closeWorker(): Promise<void> {
    this.messagingService.sendToSidePanel('player/close_worker');
  }
}
