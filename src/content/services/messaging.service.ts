// Action types for outgoing messages
interface Actions {
  auth_token_changed: {
    authToken: string;
  };
  login_required: undefined;
  url_changed: {
    url: string;
  };
  load_worker: {
    id: string;
    name: string;
    iconUrl: string;
    launchVariables: {
      url: string;
      rawHtml: string;
      fullText: string;
      userSelection: string | null;
    };
  };
}

export class MessagingService {
  private static instance: MessagingService;
  private readonly launcherId = '__MindStudioLauncher';
  private readonly playerId = '__MindStudioPlayer';

  private constructor() {}

  static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  sendToLauncher<T extends keyof Actions>(
    action: T,
    payload?: Actions[T] extends undefined ? never : Actions[T],
  ): void {
    try {
      const launcher = document.getElementById(this.launcherId);
      if (!launcher) {
        return;
      }

      (launcher as HTMLIFrameElement).contentWindow?.postMessage(
        {
          _MindStudioEvent: `@@mindstudio/${action}`,
          payload: payload || {},
        },
        '*',
      );
    } catch (err) {
      console.error('[MindStudio Extension] Error sending to launcher:', err);
    }
  }

  sendToPlayer<T extends keyof Actions>(
    action: T,
    payload?: Actions[T] extends undefined ? never : Actions[T],
  ): void {
    try {
      const player = document.getElementById(this.playerId);
      if (!player) {
        return;
      }

      (player as HTMLIFrameElement).contentWindow?.postMessage(
        {
          _MindStudioEvent: `@@mindstudio/player/${action}`,
          payload: payload || {},
        },
        '*',
      );
    } catch (err) {
      console.error('[MindStudio Extension] Error sending to player:', err);
    }
  }
}
