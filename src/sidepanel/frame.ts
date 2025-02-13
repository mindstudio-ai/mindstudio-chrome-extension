import { RootUrl } from '../shared/constants';
import { Frame } from '../shared/services/frame';
import { frame, runtime } from '../shared/services/messaging';
import { storage } from '../shared/services/storage';
import { getEmptyLaunchVariables } from '../shared/types/events';
import { createElementId } from '../shared/utils/dom';
import { removeQueryParam } from '../shared/utils/url';

export class SidepanelFrame extends Frame {
  static readonly ElementId = {
    FRAME: createElementId('SidepanelFrame'),
  };

  private readonly tabId: number;

  constructor(container: HTMLElement, tabId: number, initialPath: string) {
    super({
      id: SidepanelFrame.ElementId.FRAME,
      src: `${RootUrl}${initialPath}?__displayContext=extension&__controlledAuth=1`,
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
    // Listen for view loaded event
    frame.listen('remote/loaded', async () => {
      this.setLoaded(true);

      // Send auth token if available
      const token = await storage.get('AUTH_TOKEN');
      const organizationId = await storage.get('SELECTED_ORGANIZATION');

      if (token && organizationId) {
        frame.send(SidepanelFrame.ElementId.FRAME, 'auth/token_changed', {
          authToken: token,
          organizationId,
        });
      }

      // Request the current URL from the page
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs.length > 0 && tabs[0].id) {
          try {
            await chrome.tabs.sendMessage(tabs[0].id, {
              type: '@@mindstudio/remote/request_current_url',
              _MindStudioEvent: '@@mindstudio/remote/request_current_url',
            });
          } catch {
            //
          }
        }
      });
    });

    // Because we need to get the launch variables from the page, we need to
    // ask the content script to get them for us and then send them back
    frame.listen('remote/request_launch_variables', async () => {
      console.info(
        '[MindStudio][Sidepanel] Sidepanel frame requested launch variables for current page',
      );

      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs.length > 0 && tabs[0].id) {
          console.info(
            `[MindStudio][Sidepanel] Sending launch variable request to content script on tab: ${tabs[0].id}`,
          );
          try {
            await chrome.tabs.sendMessage(tabs[0].id, {
              type: '@@mindstudio/remote/request_launch_variables',
              _MindStudioEvent: '@@mindstudio/remote/request_launch_variables',
            });
          } catch (err) {
            console.info(
              '[MindStudio][Sidepanel] Failed to get launch variables from tab, sending default',
              err,
            );

            frame.send(
              SidepanelFrame.ElementId.FRAME,
              'remote/resolved_launch_variables',
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
        '[MindStudio][Sidepanel] Received launch variables for current page, sending to history frame',
      );
      const { launchVariables } = payload;
      frame.send(
        SidepanelFrame.ElementId.FRAME,
        'remote/resolved_launch_variables',
        {
          launchVariables,
        },
      );
    });

    // If we already have a sidepanel open, just listen for events and pass
    // them along if we receive them
    runtime.listen('player/launch_worker', ({ appId }, sender) => {
      if (sender?.tab?.id !== this.tabId) {
        return;
      }

      console.info(
        '[MindStudio][Sidepanel] Already-open side panel received launch event, forwarding to remote',
        { appId },
      );
      frame.send(SidepanelFrame.ElementId.FRAME, 'remote/navigate/app', {
        appId,
      });
    });

    runtime.listen('sidepanel/open', (_, sender) => {
      if (sender?.tab?.id !== this.tabId) {
        return;
      }

      console.info(
        '[MindStudio][Sidepanel] Already-open side panel received open event, forwarding to remote',
      );
      frame.send(SidepanelFrame.ElementId.FRAME, 'remote/navigate/root');
    });

    runtime.listen('launcher/current_url_updated', (payload, sender) => {
      if (sender?.tab?.id !== this.tabId) {
        return;
      }

      const { url, faviconUrl } = payload;
      frame.send(
        SidepanelFrame.ElementId.FRAME,
        'remote/resolved_current_url',
        {
          url,
          faviconUrl,
        },
      );
    });

    // Listen for organization ID changes from the remote frame (the user
    // manually changing their organization from the menu)
    frame.listen('auth/organization_id_changed', async (payload) => {
      const { organizationId } = payload;
      const currentOrganizationId = await storage.get('SELECTED_ORGANIZATION');
      if (organizationId !== currentOrganizationId) {
        await storage.set('SELECTED_ORGANIZATION', organizationId);
      }
    });

    frame.listen('settings/open', () => {
      runtime.send('settings/open', undefined);
    });

    // Listen for auth token changes
    storage.onChange('AUTH_TOKEN', async (token) => {
      const organizationId = await storage.get('SELECTED_ORGANIZATION');
      if (organizationId && token && this.isReady()) {
        frame.send(SidepanelFrame.ElementId.FRAME, 'auth/token_changed', {
          authToken: token,
          organizationId,
        });
      }
    });
  }

  protected onFrameLoad(): void {
    console.info('[MindStudio][Sidepanel] Frame loaded');
  }

  reset(): void {
    console.info('[MindStudio][Sidepanel] Resetting frame');
    this.setLoaded(false);
    const cleanedUrl = removeQueryParam(this.element.src, 'version');
    this.element.src = this.appendVersionToUrl(cleanedUrl);
  }
}
