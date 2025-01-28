import { ElementIds } from './constants';
import { Events } from './types';

type EventHandler<T extends keyof Events> = (
  payload: Events[T],
) => void | Promise<void>;

export class MessagingService {
  private static instance: MessagingService;
  private eventHandlers: Map<keyof Events, Set<EventHandler<any>>> = new Map();

  private constructor() {
    // Listen for window messages (from iframes)
    window.addEventListener('message', this.handleMessage.bind(this));

    // Listen for chrome runtime messages (from background)
    chrome.runtime.onMessage.addListener((message) => {
      if (message._MindStudioEvent?.startsWith('@@mindstudio/')) {
        this.handleMessage({ data: message } as MessageEvent);
      }
    });
  }

  static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  private async handleMessage({ data }: MessageEvent) {
    if (!data._MindStudioEvent?.startsWith('@@mindstudio/')) {
      return;
    }

    const eventType = data._MindStudioEvent.replace(
      '@@mindstudio/',
      '',
    ) as keyof Events;

    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      try {
        for (const handler of handlers) {
          await handler(data.payload);
        }
      } catch (err) {
        console.error('[MessagingService] Error handling message:', err);
      }
    }
  }

  subscribe<T extends keyof Events>(eventType: T, handler: EventHandler<T>) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }

    this.eventHandlers.get(eventType)!.add(handler);

    return {
      unsubscribe: () => {
        const handlers = this.eventHandlers.get(eventType);
        if (handlers) {
          handlers.delete(handler);
          if (handlers.size === 0) {
            this.eventHandlers.delete(eventType);
          }
        }
      },
    };
  }

  sendToLauncherSync<T extends keyof Events>(
    eventType: T,
    payload?: Events[T],
  ): void {
    const frame = document.getElementById(ElementIds.LAUNCHER_SYNC);
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
  }
}
