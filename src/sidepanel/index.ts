import { PlayerFrame } from './player-frame';

class SidePanel {
  private player?: PlayerFrame;
  private port?: chrome.runtime.Port;

  constructor() {
    const params = new URLSearchParams(window.location.search);
    const tabId = params.get('tabId');

    if (tabId) {
      // Connect to background service first
      this.port = chrome.runtime.connect({ name: 'sidepanel' });

      const container = document.getElementById('player-container');
      if (!container) {
        console.error('[MindStudio][Sidepanel] Player container not found');
        throw new Error('Player container not found');
      }

      this.player = new PlayerFrame(container, parseInt(tabId, 10));
    }
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
