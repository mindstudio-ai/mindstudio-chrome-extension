import {
  isEventOfType,
  MindStudioEvent,
  WorkerLaunchPayload,
} from '../common/types';
import { StorageKeys, RootUrl } from '../common/constants';
import { storage } from '../shared/storage';
import { runtime, frame } from '../shared/messaging';

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
    frame.listen('player/loaded', async () => {
      await this.handlePlayerLoaded();
    });

    // Listen for worker launch requests from background
    runtime.listen('player/init', (payload: WorkerLaunchPayload) => {
      this.handleWorkerInit(payload);
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
      const authToken = await storage.get('AUTH_TOKEN');
      if (!authToken) {
        console.error('No auth token available');
        return;
      }

      // Send auth token to player
      if (this.player?.contentWindow) {
        frame.send('player-frame', 'auth/token_changed', { authToken });

        // Notify background we're ready for workers
        await runtime.send('sidepanel/ready', undefined);
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
      frame.send('player-frame', 'player/load_worker', {
        id: payload.appId,
        name: payload.appName,
        iconUrl: payload.appIcon,
        launchVariables: payload.launchVariables,
      });
    }
  }
}

// Initialize the service
SidePanelService.getInstance();
