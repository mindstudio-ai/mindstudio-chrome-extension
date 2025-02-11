import { RootUrl } from '../shared/constants';
import { Frame } from '../shared/services/frame';
import { frame, runtime } from '../shared/services/messaging';
import { storage } from '../shared/services/storage';
import {
  getEmptyLaunchVariables,
  LaunchVariables,
} from '../shared/types/events';
import { createElementId } from '../shared/utils/dom';
import { removeQueryParam } from '../shared/utils/url';

export class HistoryFrame extends Frame {
  static readonly ElementId = {
    FRAME: createElementId('HistoryFrame'),
  };

  private isFirstLoad = true;
  private tabId: number;

  constructor(container: HTMLElement, tabId: number) {
    super({
      id: HistoryFrame.ElementId.FRAME,
      src: `${RootUrl}/_extension/dashboard?__displayContext=extension&__controlledAuth=1`,
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
    // Listen for history view loaded event
    frame.listen('history/loaded', async () => {
      this.setLoaded(true);

      // Send auth token if available
      const token = await storage.get('AUTH_TOKEN');
      const organizationId = await storage.get('SELECTED_ORGANIZATION');

      if (token && organizationId) {
        frame.send(HistoryFrame.ElementId.FRAME, 'auth/token_changed', {
          authToken: token,
          organizationId,
        });
      }

      // Only send ready event on first load
      if (this.isFirstLoad) {
        await runtime.send('sidepanel/ready', { tabId: this.tabId });
      }

      // No longer first load
      this.isFirstLoad = false;
    });

    frame.listen('history/request_launch_variables', async () => {
      // Because we need to get the launch variables from the page, we need to
      // ask the content script to get them for us and then send them back
      console.info(
        '[MindStudio][History] History frame requested launch variables for current page',
      );

      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs.length > 0 && tabs[0].id) {
          console.info(
            `[MindStudio][History] Sending launch variable request to content script on tab: ${tabs[0].id}`,
          );
          try {
            await chrome.tabs.sendMessage(tabs[0].id, {
              type: '@@mindstudio/history/request_launch_variables',
              _MindStudioEvent: '@@mindstudio/history/request_launch_variables',
            });
          } catch (err) {
            console.info(
              '[MindStudio][History] Failed to get launch variables from tab, sending default',
              err,
            );

            frame.send(
              HistoryFrame.ElementId.FRAME,
              'history/resolved_launch_variables',
              {
                launchVariables: getEmptyLaunchVariables(),
              },
            );
          }
        }
      });
    });

    runtime.listen('launcher/resolved_launch_variables', (payload) => {
      console.info(
        '[MindStudio][History] Received launch variables for current page, sending to history frame',
      );
      const { launchVariables } = payload;
      frame.send(
        HistoryFrame.ElementId.FRAME,
        'history/resolved_launch_variables',
        {
          launchVariables,
        },
      );
    });

    // Listen for auth token changes
    storage.onChange('AUTH_TOKEN', async (token) => {
      const organizationId = await storage.get('SELECTED_ORGANIZATION');
      if (organizationId && token && this.isReady()) {
        frame.send(HistoryFrame.ElementId.FRAME, 'auth/token_changed', {
          authToken: token,
          organizationId,
        });
      }
    });
  }

  protected onFrameLoad(): void {
    console.info('[MindStudio][History] Frame loaded');
  }

  reset(): void {
    console.info('[MindStudio][History] Resetting frame');
    this.setLoaded(false);
    const cleanedUrl = removeQueryParam(this.element.src, 'version');
    this.element.src = this.appendVersionToUrl(cleanedUrl);
  }
}
