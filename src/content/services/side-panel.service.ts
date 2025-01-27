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

  public launchWorker(payload: WorkerLaunchPayload): void {
    setTimeout(() => {
      this.messagingService.sendToSidePanel('player/launch_worker', payload);
    }, 0);
  }

  public closeWorker(): void {
    this.messagingService.sendToSidePanel('player/close_worker');
  }
}
