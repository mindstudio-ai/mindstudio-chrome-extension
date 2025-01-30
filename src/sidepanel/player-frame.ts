import { RootUrl, QueryParams } from '../shared/constants';
import { WorkerLaunchPayload } from '../shared/types/events';
import { Frame } from '../shared/services/frame';
import { frame, runtime } from '../shared/services/messaging';
import { storage } from '../shared/services/storage';
import { createElementId } from '../shared/utils/dom';
import { removeQueryParam } from '../shared/utils/url';

export class PlayerFrame extends Frame {
  static readonly ElementId = {
    FRAME: createElementId('PlayerFrame'),
  };

  private pendingWorker: WorkerLaunchPayload | null = null;
  private isFirstLoad = true;
  private hasLoadedFirstWorker = false;
  private tabId: number;

  constructor(container: HTMLElement, tabId: number) {
    super({
      id: PlayerFrame.ElementId.FRAME,
      src: `${RootUrl}/_extension/player?__displayContext=extension&__controlledAuth=1`,
      container,
    });

    this.tabId = tabId;

    // Add frame styles
    this.element.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      overflow: hidden;
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for player loaded event
    frame.listen('player/loaded', async () => {
      this.setLoaded(true);

      // Send auth token if available
      const token = await storage.get('AUTH_TOKEN');
      const organizationId = await storage.get('SELECTED_ORGANIZATION');

      if (token && organizationId) {
        frame.send(PlayerFrame.ElementId.FRAME, 'auth/token_changed', {
          authToken: token,
          organizationId,
        });
      }

      // Only send ready event on first load
      if (this.isFirstLoad) {
        await runtime.send('sidepanel/ready', { tabId: this.tabId });
      }

      // Send any pending worker
      if (this.pendingWorker) {
        console.info('[MindStudio][Player] Loading worker:', {
          tabId: this.tabId,
          appId: this.pendingWorker.appId,
          appName: this.pendingWorker.appName,
        });
        this.loadWorker(this.pendingWorker);
        this.pendingWorker = null;
      }

      // No longer first load
      this.isFirstLoad = false;
    });

    // Listen for auth token changes
    storage.onChange('AUTH_TOKEN', async (token) => {
      const organizationId = await storage.get('SELECTED_ORGANIZATION');
      if (organizationId && token && this.isReady()) {
        frame.send(PlayerFrame.ElementId.FRAME, 'auth/token_changed', {
          authToken: token,
          organizationId,
        });
      }
    });

    // Listen for worker init events
    runtime.listen('player/init', (payload: WorkerLaunchPayload) => {
      // Only handle init events for our tab
      if (payload.tabId === this.tabId) {
        if (this.isReady()) {
          this.loadWorker(payload);
        } else {
          this.pendingWorker = payload;
        }
      }
    });
  }

  private loadWorker(payload: WorkerLaunchPayload): void {
    if (!this.isReady()) {
      console.info('[MindStudio][Player] Frame not ready, queuing worker');
      this.pendingWorker = payload;
      return;
    }

    console.info('[MindStudio][Player] Loading worker:', {
      appId: payload.appId,
      appName: payload.appName,
    });

    frame.send(PlayerFrame.ElementId.FRAME, 'player/load_worker', {
      id: payload.appId,
      name: payload.appName,
      iconUrl: payload.appIcon,
      launchVariables: payload.launchVariables,
    });
  }

  protected onFrameLoad(): void {
    console.info('[MindStudio][Player] Frame loaded');
  }

  reset(): void {
    console.info('[MindStudio][Player] Resetting frame');
    this.setLoaded(false);
    const cleanedUrl = removeQueryParam(this.element.src, QueryParams.VERSION);
    this.element.src = this.appendVersionToUrl(cleanedUrl);
  }
}
