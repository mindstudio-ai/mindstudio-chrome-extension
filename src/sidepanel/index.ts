import { HistoryFrame } from './history-frame';
import { PlayerFrame } from './player-frame';

type PanelType = 'worker' | 'history';

class SidePanel {
  private frame?: PlayerFrame | HistoryFrame;
  private type: PanelType;

  constructor() {
    const params = new URLSearchParams(window.location.search);
    const tabId = params.get('tabId');
    const runId = params.get('runId');

    // Determine panel type from URL
    this.type = window.location.pathname.includes('worker-panel')
      ? 'worker'
      : 'history';

    const container = document.getElementById('player-container');
    if (!container) {
      console.error('[MindStudio][Sidepanel] Container not found');
      throw new Error('Container not found');
    }

    // Initialize the appropriate frame based on type
    if (this.type === 'worker' && tabId) {
      const parsedTabId = parseInt(tabId, 10);
      this.frame = new PlayerFrame(container, parsedTabId, runId);
    } else {
      // In history mode, use a dummy tabId of -1 since it's not used
      this.frame = new HistoryFrame(container, -1);
    }

    console.info('[MindStudio][Sidepanel] Initialized panel:', {
      type: this.type,
      tabId: tabId || -1,
      runId,
    });
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
