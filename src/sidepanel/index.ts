import { PlayerFrame } from './player-frame';

class SidePanel {
  private player?: PlayerFrame;

  constructor() {
    console.info('[MindStudio][Sidepanel] Initializing sidepanel');

    // Check if this is a worker panel via URL parameter
    const isWorkerPanel =
      new URLSearchParams(window.location.search).get('type') === 'worker';

    if (isWorkerPanel) {
      const container = document.getElementById('player-container');
      if (!container) {
        console.error('[MindStudio][Sidepanel] Player container not found');
        throw new Error('Player container not found');
      }

      this.player = new PlayerFrame(container);
    }

    this.setupConnection();
  }

  private setupConnection(): void {
    // Connect to background service to enable messaging
    chrome.runtime.connect({ name: 'sidepanel' });
  }
}

// Initialize the panel
document.addEventListener('DOMContentLoaded', () => {
  try {
    new SidePanel();
  } catch (error) {
    console.error('[MindStudio][Sidepanel] Initialization failed:', error);
  }
});
