import { THANK_YOU_PAGE, WsUrl } from '../shared/constants';
import { runtime } from '../shared/services/messaging';
import { storage, StorageKeys } from '../shared/services/storage';
import { api } from '../shared/services/api';
import { sendRunCompleteNotification } from '../shared/services/notifications';

class BackgroundService {
  private static instance: BackgroundService;
  private ws?: WebSocket;
  private tabsWithOpenSidePanels = new Set<number>();

  private constructor() {
    chrome.sidePanel.setOptions({
      enabled: false,
    });
    chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: false,
    });
    this.setupMessageListeners();
    this.setupSidePanelListeners();
    this.setupInstallationHandler();
    this.setupActionButtonListener();
    this.setupAuthListeners();
    this.setupNotificationListeners();
    this.onAuth();
  }

  static getInstance(): BackgroundService {
    if (!BackgroundService.instance) {
      BackgroundService.instance = new BackgroundService();
    }
    return BackgroundService.instance;
  }

  private getPanelPath(tabId: number, appId?: string): string {
    return `panel.html?tabId=${tabId}${appId ? `&appId=${appId}` : ''}`;
  }

  private setupMessageListeners(): void {
    // Handle open history event
    runtime.listen('sidepanel/toggle', async (_, sender) => {
      const tabId = sender?.tab?.id;
      if (!tabId) {
        console.info(
          '[MindStudio][Background] Side panel open failed: No tab ID',
        );
        return;
      }

      try {
        // If a panel exists, remove it from our list. The panel will handle its
        // own close event using window.close() as there is no
        // chrome.sidePanel.close event, and setting
        // setOptions({ enabled: false }) closes it without any animation
        if (this.tabsWithOpenSidePanels.has(tabId)) {
          this.tabsWithOpenSidePanels.delete(tabId);
          return;
        }

        const path = this.getPanelPath(tabId);
        this.tabsWithOpenSidePanels.add(tabId);
        chrome.sidePanel.setOptions({
          tabId,
          path,
          enabled: true,
        });
        await chrome.sidePanel.open({ tabId });
      } catch (error) {
        console.error(
          '[MindStudio][Background] Side panel open failed:',
          error,
        );
      }
    });

    // Handle worker launch directly from content script click
    runtime.listen('player/launch_worker', async (payload, sender) => {
      const tabId = sender?.tab?.id;
      if (!tabId) {
        console.info('[MindStudio][Background] Agent launch failed: No tab ID');
        return;
      }

      // If we already have a side panel open, let it handle the worker launch
      // event
      if (this.tabsWithOpenSidePanels.has(tabId)) {
        return;
      }

      try {
        // Generate a new run ID for this worker instance
        const path = this.getPanelPath(tabId, payload.appId);
        this.tabsWithOpenSidePanels.add(tabId);

        console.info('[MindStudio][Background] Launching agent:', {
          tabId,
          appId: payload.appId,
        });

        // Configure and open the panel with the run ID
        chrome.sidePanel.setOptions({
          tabId,
          path,
          enabled: true,
        });
        await chrome.sidePanel.open({ tabId });
      } catch (error) {
        console.error('[MindStudio][Background] Launch failed:', error);
      }
    });

    runtime.listen('remote/reload_apps', () => {
      this.updateApps();
    });
  }

  private setupSidePanelListeners(): void {
    // Handle tab removal
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.tabsWithOpenSidePanels.delete(tabId);
    });
  }

  private setupNotificationListeners(): void {
    chrome.notifications.onClicked.addListener((notificationId) => {
      const cacheKey = `${StorageKeys.NOTIFICATION_HREF_CACHE_PREFIX}_${notificationId}`;
      chrome.storage.local.get(cacheKey, (data) => {
        const url = data[cacheKey];
        if (url) {
          chrome.tabs.create({ url });
        }
        chrome.notifications.clear(notificationId);
      });
    });
  }

  private setupInstallationHandler(): void {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        console.info('[MindStudio][Background] Extension installed');
        chrome.tabs.create({ url: THANK_YOU_PAGE });
      }
    });
  }

  private setupActionButtonListener(): void {
    chrome.action.onClicked.addListener(async (tab) => {
      if (tab.id) {
        // If there's already something open, do nothing
        if (this.tabsWithOpenSidePanels.has(tab.id)) {
          return;
        }

        try {
          const path = this.getPanelPath(tab.id);
          this.tabsWithOpenSidePanels.add(tab.id);
          chrome.sidePanel.setOptions({
            tabId: tab.id,
            path,
            enabled: true,
          });
          await chrome.sidePanel.open({ tabId: tab.id });
          await storage.set('LAUNCHER_HIDDEN', false);
          await storage.set('LAUNCHER_COLLAPSED', false);
        } catch (error) {
          console.error('[MindStudio][Background] Toggle failed:', error);
        }
      }
    });
  }

  private setupAuthListeners(): void {
    // Listen for auth token changes
    storage.onChange('AUTH_TOKEN', this.onAuth.bind(this));

    // Listen for organization selection changes
    storage.onChange('SELECTED_ORGANIZATION', this.onAuth.bind(this));
  }

  private async onAuth() {
    this.updateApps();
    this.initializeSocket();
  }

  private async updateApps(): Promise<void> {
    const token = await storage.get('AUTH_TOKEN');
    const organizationId = await storage.get('SELECTED_ORGANIZATION');

    if (token && organizationId) {
      // Load the user's pinned apps
      console.info('[MindStudio][Background] Fetching apps');
      try {
        const apps = await api.getPinnedApps(organizationId);
        const existingApps = (await storage.get('LAUNCHER_APPS')) ?? {};
        await storage.set('LAUNCHER_APPS', {
          ...existingApps,
          [organizationId]: apps,
        });

        if (apps.length === 0) {
          await storage.set('LAUNCHER_COLLAPSED', true);
        }
        console.info('[MindStudio][Background] Updated apps list:', {
          organizationId,
          count: apps.length,
        });
      } catch (error) {
        console.error('[MindStudio][Background] Failed to fetch apps:', error);
      }

      // Load all the apps with suggested sites so we can hide/show without
      // needing to send browsing data to the server
      console.info(
        '[MindStudio][Background] Fetching all apps with site listeners',
      );
      try {
        const apps = await api.getSuggestedApps(organizationId);
        const existingApps = (await storage.get('SUGGESTED_APPS')) ?? {};
        await storage.set('SUGGESTED_APPS', {
          ...existingApps,
          [organizationId]: apps,
        });
        console.info('[MindStudio][Background] Updated suggested apps list:', {
          organizationId,
          count: apps.length,
        });
      } catch (error) {
        console.error(
          '[MindStudio][Background] Failed to fetch site-specific apps:',
          error,
        );
      }
    }
  }

  private async initializeSocket() {
    const token = await storage.get('AUTH_TOKEN');

    if (token) {
      if (this.ws) {
        try {
          this.ws.close();
        } catch {
          //
        }
        this.ws = undefined;
      }

      // New connection
      this.ws = new WebSocket(`${WsUrl}/?authorization=${token}`);

      // Receive message event
      this.ws.onmessage = async (e) => {
        try {
          const messageData = JSON.parse(e.data);
          switch (messageData.type) {
            case 'General/UserProfileChanged': {
              const remoteOrganizationId =
                messageData.userProfileChanged.userProfile.preferences
                  .CurrentOrganizationId;

              const currentOrganizationId = await storage.get(
                'SELECTED_ORGANIZATION',
              );

              if (
                remoteOrganizationId &&
                remoteOrganizationId !== currentOrganizationId
              ) {
                console.info(
                  '[MindStudio][Socket] Switching organization',
                  remoteOrganizationId,
                );

                await storage.set(
                  'SELECTED_ORGANIZATION',
                  remoteOrganizationId,
                );
              }
            }
            case 'General/UserUnreadThreadsChanged': {
              const numUnreadThreads =
                messageData.userUnreadThreadsChanged.unreadThreadIds.length;
              storage.set('NUM_UNREAD_THREADS', numUnreadThreads);
              return;
            }
            case 'General/UserPinnedAppsChanged': {
              this.updateApps();
            }
            case 'Extension/SendNotification': {
              const { title, message, href, iconUrl } =
                messageData.extensionSendNotification;

              sendRunCompleteNotification(title, message, href, iconUrl);
              return;
            }
            default:
              break;
          }
        } catch {
          //
        }
      };
    }
  }
}

// Initialize background service
BackgroundService.getInstance();
