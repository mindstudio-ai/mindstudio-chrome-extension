import { isEventOfType, MindStudioEvent } from '../common/types';
import { StorageKeys, RootUrl } from '../common/constants';

// Set iframe src using RootUrl
document.addEventListener('DOMContentLoaded', () => {
  const player = document.getElementById('player-frame') as HTMLIFrameElement;
  if (player) {
    player.src = `${RootUrl}/_extension/player?__displayContext=extension&__controlledAuth=1`;
  }
});

let isPlayerLoaded = false;

// Connect to background service to detect sidepanel close
chrome.runtime.connect({ name: 'sidepanel' });

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
