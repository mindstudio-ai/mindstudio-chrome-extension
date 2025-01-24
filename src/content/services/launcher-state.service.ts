import { StorageKeys } from '../constants';

export class LauncherStateService {
  private static instance: LauncherStateService;
  private launcherDock?: any; // Will be set after initialization

  private constructor() {
    this.setupStorageListener();
  }

  private setupStorageListener(): void {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes[StorageKeys.LAUNCHER_COLLAPSED]) {
        const newValue = changes[StorageKeys.LAUNCHER_COLLAPSED].newValue;
        // Only react to changes from other contexts
        if (this.launcherDock) {
          if (newValue) {
            this.launcherDock.collapse();
          } else {
            this.launcherDock.expand();
          }
        }
      }
    });
  }

  setLauncherDock(dock: any): void {
    this.launcherDock = dock;
  }

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
