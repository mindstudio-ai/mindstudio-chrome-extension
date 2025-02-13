import { SidepanelFrame } from './frame';

class SidePanel {
  private frame?: SidepanelFrame;

  constructor() {
    const container = document.getElementById('player-container');
    if (!container) {
      console.error('[MindStudio][Sidepanel] Container not found');
      throw new Error('Container not found');
    }

    // Initialize the appropriate frame based on type
    const searchParams = new URLSearchParams(window.location.search);
    const tabId = searchParams.get('tabId');
    if (!tabId) {
      throw new Error('Invalid tab ID');
    }

    const initialPath = window.location.hash.replace('#', '');
    this.frame = new SidepanelFrame(container, Number(tabId), initialPath);

    console.info('[MindStudio][Sidepanel] Initialized panel:', {
      initialPath,
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
