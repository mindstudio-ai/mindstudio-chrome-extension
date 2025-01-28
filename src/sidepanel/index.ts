import { isEventOfType, MindStudioEvent } from '../content/types';
import { StorageKeys } from '../content/constants';

let isPlayerLoaded = false;

// Connect to background service to detect sidepanel close
const port = chrome.runtime.connect({ name: 'sidepanel' });

// Listen for player loaded event
window.addEventListener('message', async (event) => {
  if (event.data?._MindStudioEvent === '@@mindstudio/player/loaded') {
    // Prevent duplicate handling
    if (isPlayerLoaded) {
      return;
    }
    isPlayerLoaded = true;

    try {
      // Get auth token from storage
      const { [StorageKeys.AUTH_TOKEN]: authToken } =
        await chrome.storage.local.get(StorageKeys.AUTH_TOKEN);
      if (!authToken) {
        console.error('No auth token available');
        return;
      }

      // Send auth token to player
      const player = document.getElementById(
        'player-frame',
      ) as HTMLIFrameElement;
      if (player?.contentWindow) {
        player.contentWindow.postMessage(
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
});

// Listen for worker launch requests from background
chrome.runtime.onMessage.addListener((message: MindStudioEvent) => {
  if (isEventOfType(message, 'player/init')) {
    const player = document.getElementById('player-frame') as HTMLIFrameElement;

    if (player?.contentWindow) {
      player.contentWindow.postMessage(
        {
          _MindStudioEvent: '@@mindstudio/player/load_worker',
          payload: {
            id: message.payload.appId,
            name: message.payload.appName,
            iconUrl: message.payload.appIcon,
            launchVariables: message.payload.launchVariables,
          },
        },
        '*',
      );
    }
  }
});
