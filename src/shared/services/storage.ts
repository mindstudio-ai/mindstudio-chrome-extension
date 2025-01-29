import { Environment } from '../constants';

// Define the value types
type StorageValues = {
  AUTH_TOKEN: string | null;
  LAUNCHER_APPS: Array<{
    id: string;
    name: string;
    iconUrl: string;
    extensionSupportedSites: string[];
  }> | null;
  LAUNCHER_COLLAPSED: boolean;
};

// Move key generation here
const createStorageKey = (key: string) => `${key}_${Environment}` as const;

// Define storage keys
const StorageKeys = {
  AUTH_TOKEN: createStorageKey('AuthToken'),
  LAUNCHER_COLLAPSED: createStorageKey('LauncherCollapsed'),
  LAUNCHER_APPS: createStorageKey('LauncherApps'),
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
