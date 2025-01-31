import { PlayerFrame } from './player-frame';
import { HistoryFrame } from './history-frame';

class SidePanel {
  private frame?: PlayerFrame | HistoryFrame;
  private port?: chrome.runtime.Port;

  constructor() {
    const params = new URLSearchParams(window.location.search);
    const tabId = params.get('tabId');

    // Connect to background service first
    this.port = chrome.runtime.connect({ name: 'sidepanel' });

    const container = document.getElementById('player-container');
    if (!container) {
      console.error('[MindStudio][Sidepanel] Container not found');
      throw new Error('Container not found');
    }

    // If we have a tabId, we're in worker mode, otherwise we're in history mode
    if (tabId) {
      const parsedTabId = parseInt(tabId, 10);
      this.frame = new PlayerFrame(container, parsedTabId);
    } else {
      // In history mode, use a dummy tabId of -1 since it's not used
      this.frame = new HistoryFrame(container, -1);
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
