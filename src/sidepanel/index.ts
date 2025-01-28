import {
  isEventOfType,
  MindStudioEvent,
  WorkerLaunchPayload,
} from '../common/types';
import { StorageKeys, RootUrl } from '../common/constants';

class SidePanelService {
  private static instance: SidePanelService;
  private isPlayerLoaded = false;
  private player: HTMLIFrameElement | null = null;

  private constructor() {
    this.setupEventListeners();
    this.initialize();
  }

  static getInstance(): SidePanelService {
    if (!SidePanelService.instance) {
      SidePanelService.instance = new SidePanelService();
    }
    return SidePanelService.instance;
  }

  private initialize(): void {
    // Set iframe src using RootUrl when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
      this.setupPlayer();
    });

    // Connect to background service to detect sidepanel close
    chrome.runtime.connect({ name: 'sidepanel' });
  }

  private setupPlayer(): void {
    this.player = document.getElementById('player-frame') as HTMLIFrameElement;
    if (this.player) {
      this.player.src = `${RootUrl}/_extension/player?__displayContext=extension&__controlledAuth=1`;
    }
  }

  private async reinitializePlayer(): Promise<void> {
    // Reset state
    this.isPlayerLoaded = false;

    // Refresh the iframe
    if (this.player) {
      this.player.src = this.player.src;
    }
  }

  private setupEventListeners(): void {
    // Listen for player loaded event
    window.addEventListener('message', async (event) => {
      if (event.data?._MindStudioEvent === '@@mindstudio/player/loaded') {
        await this.handlePlayerLoaded();
      }
    });

    // Listen for worker launch requests from background
    chrome.runtime.onMessage.addListener((message: MindStudioEvent) => {
      if (isEventOfType(message, 'player/init')) {
        this.handleWorkerInit(message.payload);
      }
    });
  }

  private async handlePlayerLoaded(): Promise<void> {
    // Prevent duplicate handling
    if (this.isPlayerLoaded) {
      return;
    }
    this.isPlayerLoaded = true;

    try {
      // Get auth token from storage
      const { [StorageKeys.AUTH_TOKEN]: authToken } =
        await chrome.storage.local.get(StorageKeys.AUTH_TOKEN);
      if (!authToken) {
        console.error('No auth token available');
        return;
      }

      // Send auth token to player
      if (this.player?.contentWindow) {
        this.player.contentWindow.postMessage(
          {
            _MindStudioEvent: '@@mindstudio/auth/token_changed',
            payload: { authToken },
          },
          '*',
        );

        // Notify background we're ready for workers
        chrome.runtime.sendMessage({
          _MindStudioEvent: '@@mindstudio/sidepanel/ready',
          payload: undefined,
        });
      }
    } catch (error) {
      console.error('Failed to handle player loaded:', error);
    }
  }

  private async handleWorkerInit(payload: WorkerLaunchPayload): Promise<void> {
    // First reinitialize the player
    await this.reinitializePlayer();

    // Wait for the player to load before sending the worker init
    const waitForLoad = new Promise<void>((resolve) => {
      const checkLoaded = () => {
        if (this.isPlayerLoaded) {
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    });

    await waitForLoad;

    // Now send the worker init message
    if (this.player?.contentWindow) {
      this.player.contentWindow.postMessage(
        {
          _MindStudioEvent: '@@mindstudio/player/load_worker',
          payload: {
            id: payload.appId,
            name: payload.appName,
            iconUrl: payload.appIcon,
            launchVariables: payload.launchVariables,
          },
        },
        '*',
      );
    }
  }
}

// Initialize the service
SidePanelService.getInstance();
