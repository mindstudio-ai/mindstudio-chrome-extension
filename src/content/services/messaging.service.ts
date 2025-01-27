import { ElementIds } from '../constants';
import { Events } from '../types';

type EventHandler<T extends keyof Events> = (
  payload: Events[T],
) => void | Promise<void>;
type EventSubscription = { unsubscribe: () => void };

export class MessagingService {
  private static instance: MessagingService;
  private eventHandlers: Map<keyof Events, Set<EventHandler<any>>> = new Map();

  private constructor() {
    window.addEventListener('message', this.handleMessage.bind(this));
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
        console.error('[MindStudio Extension] Error handling message:', err);
      }
    }
  }

  subscribe<T extends keyof Events>(
    eventType: T,
    handler: EventHandler<T>,
  ): EventSubscription {
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

  sendToLauncherSync<T extends keyof Events>(
    eventType: T,
    payload?: Events[T] extends undefined ? never : Events[T],
  ): void {
    this.sendToFrame(ElementIds.LAUNCHER_SYNC, eventType, payload);
  }

  sendToSidePanel<T extends keyof Events>(
    eventType: T,
    payload?: Events[T] extends undefined ? never : Events[T],
  ): void {
    if (!chrome?.runtime?.id) {
      console.warn('Chrome runtime not available');
      return;
    }

    chrome.runtime.sendMessage({
      _MindStudioEvent: `@@mindstudio/${eventType}`,
      payload: payload || {},
    });
  }
}
