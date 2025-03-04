import { Environment } from '../constants';

// Define the value types
export type StorageValues = {
  AUTH_TOKEN: string | null;
  LAUNCHER_APPS: Record<
    string,
    Array<{
      id: string;
      name: string;
      iconUrl: string;
    }>
  > | null;
  SUGGESTED_APPS: Record<
    string,
    Array<{
      id: string;
      name: string;
      iconUrl: string;
      enabledSites?: string[];
    }>
  > | null;
  SUGGESTED_APPS_HIDDEN: boolean;
  LAUNCHER_COLLAPSED: boolean;
  LAUNCHER_HIDDEN: boolean;
  LAUNCHER_POSITION: {
    distance: number;
  } | null;
  SELECTED_ORGANIZATION: string | null;
  TOOLTIP_GUIDES_SHOWN: Record<string, boolean>;
  NUM_UNREAD_THREADS: number | null;
  REMOTE_CACHE_PREFIX: undefined;
  NOTIFICATION_HREF_CACHE_PREFIX: undefined;
};

// Move key generation here
const createStorageKey = (key: string) => `${key}_${Environment}` as const;

// Define storage keys
export const StorageKeys: Record<keyof StorageValues, string> = {
  AUTH_TOKEN: createStorageKey('AuthToken'),
  LAUNCHER_COLLAPSED: createStorageKey('LauncherCollapsed'),
  LAUNCHER_HIDDEN: createStorageKey('LauncherHidden'),
  LAUNCHER_APPS: createStorageKey('LauncherApps'),
  SUGGESTED_APPS: createStorageKey('SuggestedApps'),
  SUGGESTED_APPS_HIDDEN: createStorageKey('SuggestedAppsHidden'),
  LAUNCHER_POSITION: createStorageKey('LauncherPosition'),
  SELECTED_ORGANIZATION: createStorageKey('SelectedOrganization'),
  TOOLTIP_GUIDES_SHOWN: createStorageKey('TooltipGuidesShown'),
  NUM_UNREAD_THREADS: createStorageKey('NumUnreadThreads'),
  REMOTE_CACHE_PREFIX: createStorageKey('RemoteCache'),
  NOTIFICATION_HREF_CACHE_PREFIX: createStorageKey('NotificationHrefs'),
} as const;

export const storage = {
  async get<K extends keyof StorageValues>(key: K): Promise<StorageValues[K]> {
    const result = await chrome.storage.local.get(StorageKeys[key]);
    return result[StorageKeys[key]] ?? null;
  },

  async set<K extends keyof StorageValues>(
    key: K,
    value: StorageValues[K],
  ): Promise<void> {
    await chrome.storage.local.set({ [StorageKeys[key]]: value });
  },

  async remove(keys: Array<keyof StorageValues>): Promise<void> {
    await chrome.storage.local.remove(keys.map((k) => StorageKeys[k]));
  },

  onChange<K extends keyof StorageValues>(
    key: K,
    callback: (value: StorageValues[K]) => void,
  ): void {
    chrome.storage.onChanged.addListener((changes) => {
      const change = changes[StorageKeys[key]];
      if (change) {
        callback(change.newValue);
      }
    });
  },
};
