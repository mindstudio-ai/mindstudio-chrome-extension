import { Events } from '../common/types';

type Handler<T> = (payload: T) => void | Promise<void>;

// Simple message bus for runtime messages
export const runtime = {
  send<K extends keyof Events>(type: K, payload: Events[K]): Promise<void> {
    return chrome.runtime.sendMessage({
      _MindStudioEvent: `@@mindstudio/${type}`,
      payload,
    });
  },

  listen<K extends keyof Events>(type: K, handler: Handler<Events[K]>) {
    const listener = (message: any) => {
      if (message._MindStudioEvent === `@@mindstudio/${type}`) {
        handler(message.payload);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  },
};

// Frame messaging
export const frame = {
  send<K extends keyof Events>(
    frameId: string,
    type: K,
    payload: Events[K],
  ): void {
    const frame = document.getElementById(frameId) as HTMLIFrameElement;
    frame?.contentWindow?.postMessage(
      {
        _MindStudioEvent: `@@mindstudio/${type}`,
        payload,
      },
      '*',
    );
  },

  listen<K extends keyof Events>(type: K, handler: Handler<Events[K]>) {
    const listener = (event: MessageEvent) => {
      const { data } = event;
      if (data._MindStudioEvent === `@@mindstudio/${type}`) {
        handler(data.payload);
      }
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  },
};
