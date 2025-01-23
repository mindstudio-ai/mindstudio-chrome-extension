// src/content/index.ts
import { AuthService } from './services/auth.service';
import { FrameService } from './services/frame.service';
import { MessagingService } from './services/messaging.service';
import { PlayerService } from './services/player.service';
import { FloatingButtonService } from './services/floating-button.service';
import { URLService } from './services/url.service';
import { isEventOfType, isMindStudioEvent } from './types';

class ContentScript {
  private frameService = FrameService.getInstance();
  private messagingService = MessagingService.getInstance();
  private authService = AuthService.getInstance();
  private playerService = PlayerService.getInstance();
  private floatingButtonService = FloatingButtonService.getInstance();
  private urlService = URLService.getInstance();

  private async handleMessage({ data }: MessageEvent) {
    if (!isMindStudioEvent(data)) {
      return;
    }

    try {
      if (isEventOfType(data, 'auth/login_completed')) {
        const { authToken } = data.payload;
        await this.authService.setToken(authToken);
        this.messagingService.sendToLauncher('auth/token_changed', {
          authToken,
        });
        this.messagingService.sendToPlayer('auth/token_changed', { authToken });
        this.frameService.showLauncher();
        this.floatingButtonService.hideButton();
      } else if (isEventOfType(data, 'launcher/loaded')) {
        const token = await this.authService.getToken();
        if (token) {
          this.messagingService.sendToLauncher('auth/token_changed', {
            authToken: token,
          });
        } else {
          this.frameService.showAuth();
        }
        this.messagingService.sendToLauncher('url/changed', {
          url: window.location.href,
        });
      } else if (isEventOfType(data, 'player/loaded')) {
        const token = await this.authService.getToken();
        if (token) {
          this.messagingService.sendToPlayer('auth/token_changed', {
            authToken: token,
          });
        }
      } else if (isEventOfType(data, 'launcher/size_updated')) {
        const { width, height } = data.payload;
        this.frameService.updateLauncherSize(width, height);
      } else if (isEventOfType(data, 'player/launch_worker')) {
        this.playerService.launchWorker(data.payload);
      } else if (isEventOfType(data, 'player/close_worker')) {
        this.frameService.hidePlayer();
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
    this.floatingButtonService.injectButton();
    this.urlService.startTracking();
  }
}

const contentScript = new ContentScript();
contentScript.initialize();
