import { MessagingService } from '../content/services/messaging.service';
import { Events, isEventOfType, MindStudioEvent } from '../content/types';
import { PlayerService } from './services/player.service';

class SidePanel {
  private messagingService: MessagingService;
  private playerService: PlayerService;

  constructor() {
    this.messagingService = MessagingService.getInstance();
    this.playerService = PlayerService.getInstance();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message: MindStudioEvent) => {
      if (isEventOfType(message, 'player/launch_worker')) {
        this.playerService.launchWorker(message.payload);
      } else if (isEventOfType(message, 'player/close_worker')) {
        this.playerService.closeWorker();
      }
    });
  }

  public initialize(): void {
    console.log('Side panel initialized');
  }
}

const sidePanel = new SidePanel();
sidePanel.initialize();
