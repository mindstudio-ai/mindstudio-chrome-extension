import { PlayerFrame } from './player-frame';

class SidePanel {
  private player: PlayerFrame;

  constructor() {
    const container = document.getElementById('player-container');
    if (!container) {
      throw new Error('Player container not found');
    }

    this.player = new PlayerFrame(container);
    this.setupConnectionHandling();
  }

  private setupConnectionHandling(): void {
    // Connect to background service to detect sidepanel close
    const port = chrome.runtime.connect({ name: 'sidepanel' });

    // Reset frame when connection is lost (sidepanel closed)
    port.onDisconnect.addListener(() => {
      this.player.reset();
    });
  }
}

// Initialize the panel
document.addEventListener('DOMContentLoaded', () => {
  new SidePanel();
});
