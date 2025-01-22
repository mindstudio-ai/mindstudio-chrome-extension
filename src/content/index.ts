// src/content/index.ts
import { AuthService } from './services/auth.service';
import { FrameService } from './services/frame.service';
import { MessagingService } from './services/messaging.service';
import { PlayerService } from './services/player.service';
import { URLService } from './services/url.service';
import { isEventOfType, isMindStudioEvent } from './types';
import { FloatingButtonService } from './services/floating-button.service';

class ContentScript {
  private frameService = FrameService.getInstance();
  private messagingService = MessagingService.getInstance();
  private authService = AuthService.getInstance();
  private playerService = PlayerService.getInstance();
  private urlService = URLService.getInstance();
  private floatingButtonService = FloatingButtonService.getInstance();

  private async handleMessage({ data }: MessageEvent) {
    if (!isMindStudioEvent(data)) {
      return;
    }

    try {
      if (isEventOfType(data, 'loaded')) {
        const { isLoggedIn } = data.payload;
        if (!isLoggedIn) {
          const token = await this.authService.getToken();
          if (token) {
            this.messagingService.sendToLauncher('auth_token_changed', {
              authToken: token,
            });
          } else {
            this.messagingService.sendToLauncher('login_required');
          }
        }
      } else if (isEventOfType(data, 'authenticated')) {
        const { authToken } = data.payload;
        if (authToken) {
          await this.authService.setToken(authToken);
        }
      } else if (isEventOfType(data, 'size_updated')) {
        const { width, height } = data.payload;
        this.frameService.updateLauncherSize(width, height);
      } else if (isEventOfType(data, 'launch_worker')) {
        this.playerService.launchWorker(data.payload);
      } else if (isEventOfType(data, 'player/loaded')) {
        const { isLoggedIn } = data.payload;
        if (!isLoggedIn) {
          const token = await this.authService.getToken();
          if (token) {
            this.messagingService.sendToPlayer('auth_token_changed', {
              authToken: token,
            });
          } else {
            this.messagingService.sendToPlayer('login_required');
          }
        }
      } else if (isEventOfType(data, 'player/close_worker')) {
        this.playerService.hidePlayer();
      }
    } catch (err) {
      console.error('[MindStudio Extension] Error handling message:', err);
    }
  }

  initialize(): void {
    if (window.self !== window.top) {
      return;
    }
    this.frameService.injectFrames();
    window.addEventListener('message', this.handleMessage.bind(this));

    this.urlService.startTracking();
    this.floatingButtonService.injectButton();
  }
}

const contentScript = new ContentScript();
contentScript.initialize();
