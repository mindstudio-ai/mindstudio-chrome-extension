import { ElementIds } from '../constants';
import { Events } from '../types';

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

  private constructor() {}

  static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  sendToFrame<T extends keyof Events>(
    frameId: string,
    eventType: T,
    payload?: Events[T] extends undefined ? never : Events[T],
  ): void {
    try {
      const frame = document.getElementById(frameId);
      if (!frame) {
        return;
      }

      (frame as HTMLIFrameElement).contentWindow?.postMessage(
        {
          _MindStudioEvent: `@@mindstudio/${eventType}`,
          payload: payload || {},
        },
        '*',
      );
    } catch (err) {
      console.error('[MindStudio Extension] Error sending to frame:', err);
    }
  }

  sendToLauncher<T extends keyof Events>(
    eventType: T,
    payload?: Events[T] extends undefined ? never : Events[T],
  ): void {
    this.sendToFrame(ElementIds.LAUNCHER, eventType, payload);
  }

  sendToPlayer<T extends keyof Events>(
    eventType: T,
    payload?: Events[T] extends undefined ? never : Events[T],
  ): void {
    this.sendToFrame(ElementIds.PLAYER, eventType, payload);
  }

  sendToAuth<T extends keyof Events>(
    eventType: T,
    payload?: Events[T] extends undefined ? never : Events[T],
  ): void {
    this.sendToFrame(ElementIds.AUTH, eventType, payload);
  }
}
