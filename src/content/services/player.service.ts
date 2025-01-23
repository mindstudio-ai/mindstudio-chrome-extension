import { MessagingService } from './messaging.service';
import { FrameService } from './frame.service';
import { DOMService } from './dom.service';

export class PlayerService {
  private static instance: PlayerService;

  private messaging = MessagingService.getInstance();
  private frameService = FrameService.getInstance();
  private domService = DOMService.getInstance();

  private readonly playerId = '__MindStudioPlayer';

  private constructor() {}

  static getInstance(): PlayerService {
    if (!PlayerService.instance) {
      PlayerService.instance = new PlayerService();
    }
    return PlayerService.instance;
  }

  launchWorker(workerPayload: {
    id: string;
    name: string;
    iconUrl: string;
  }): void {
    // Gather context
    const url = window.location.href;
    const rawHtml = this.domService.cleanDOM();
    const fullText = document.body.innerText;
    const userSelection = this.domService.getSelectedContent();

    // Send to player
    this.messaging.sendToPlayer('load_worker', {
      id: workerPayload.id,
      name: workerPayload.name,
      iconUrl: workerPayload.iconUrl,
      launchVariables: {
        url,
        rawHtml,
        fullText,
        userSelection,
      },
    });

    // Show player to the left of launcher
    this.frameService.showPlayer(400, 40);
  }
}
