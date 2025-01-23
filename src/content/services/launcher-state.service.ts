import { StorageKeys } from '../constants';

export class LauncherStateService {
  private static instance: LauncherStateService;

  private constructor() {}

  static getInstance(): LauncherStateService {
    if (!LauncherStateService.instance) {
      LauncherStateService.instance = new LauncherStateService();
    }
    return LauncherStateService.instance;
  }

  async isCollapsed(): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.storage.local.get(StorageKeys.LAUNCHER_COLLAPSED, (result) => {
        resolve(result[StorageKeys.LAUNCHER_COLLAPSED] || false);
      });
    });
  }

  async setCollapsed(collapsed: boolean): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set(
        { [StorageKeys.LAUNCHER_COLLAPSED]: collapsed },
        () => {
          resolve();
        },
      );
    });
  }
}
