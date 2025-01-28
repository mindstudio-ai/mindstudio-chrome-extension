import {
  ElementIds,
  FrameDimensions,
  RootUrl,
  StorageKeys,
  ZIndexes,
} from '../constants';
import { DOMService } from './dom.service';
import { AuthService } from './auth.service';
import { MessagingService } from './messaging.service';

interface AppData {
  id: string;
  name: string;
  iconUrl: string;
  extensionSupportedSites: string[];
}

export class LauncherService {
  private static instance: LauncherService;
  private domService = DOMService.getInstance();
  private authService = AuthService.getInstance();
  private messagingService = MessagingService.getInstance();
  private apps: AppData[] = [];
  private currentHostUrl: string = window.location.href;

  private constructor() {
    this.setupStorageListeners();
  }

  static getInstance(): LauncherService {
    if (!LauncherService.instance) {
      LauncherService.instance = new LauncherService();
    }
    return LauncherService.instance;
  }

  private setupStorageListeners(): void {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local') {
        // Handle app data updates
        if (changes[StorageKeys.LAUNCHER_APPS]) {
          const apps = changes[StorageKeys.LAUNCHER_APPS].newValue || [];
          this.updateApps(apps);
        }

        // Handle collapsed state changes from other contexts
        if (changes[StorageKeys.LAUNCHER_COLLAPSED]) {
          const newValue = changes[StorageKeys.LAUNCHER_COLLAPSED].newValue;
          if (newValue) {
            this.collapse();
          } else {
            this.expand();
          }
        }
      }
    });
  }

  private createLogoSvg(): string {
    return `
      <svg width="28" height="16" viewBox="0 0 28 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M11.9957 3.75733C11.8085 4.32707 11.694 4.93386 11.422 5.46033C9.97282 8.26551 8.49953 11.0587 7.00408 13.8399C5.93552 15.8271 3.73318 16.5345 1.87822 15.5336C0.0734324 14.5597 -0.52834 12.3779 0.502818 10.404C1.99299 7.55167 3.48286 4.69841 5.02979 1.87636C5.87947 0.326252 7.58533 -0.304487 9.2649 0.17678C10.8346 0.62658 11.9069 2.07437 11.9957 3.75733Z" fill="#FEFEFE"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M22.0606 3.73975C21.8734 4.30949 21.7589 4.91628 21.4869 5.44275C20.0378 8.24793 18.5645 11.0411 17.069 13.8223C16.0005 15.8096 13.7981 16.5169 11.9432 15.516C10.1384 14.5421 9.53658 12.3603 10.5678 10.3865C12.0579 7.53409 13.5478 4.68084 15.0947 1.85878C15.9444 0.308675 17.6503 -0.322065 19.3298 0.159202C20.8995 0.609001 21.9719 2.0568 22.0606 3.73975Z" fill="#FEFEFE"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M23.6046 4.7959C24.6423 6.61697 25.6657 8.37485 26.6522 10.1555C27.609 11.8824 27.302 13.878 25.9349 15.0884C24.5834 16.285 22.5927 16.2838 21.2605 15.0855C19.9032 13.8645 19.6076 11.8589 20.5637 10.144C21.5543 8.36745 22.5726 6.60805 23.6046 4.7959Z" fill="#FEFEFE"/>
      </svg>
    `;
  }

  private createLauncherElement(): HTMLElement {
    const launcher = document.createElement('div');
    launcher.id = ElementIds.LAUNCHER;
    launcher.style.cssText = `
      position: fixed;
      bottom: 128px;
      right: 0;
      width: ${FrameDimensions.LAUNCHER.TOTAL_WIDTH}px;
      z-index: ${ZIndexes.LAUNCHER};
      background: transparent;
      pointer-events: none;
    `;

    const inner = document.createElement('div');
    inner.style.cssText = `
      margin-left: auto;
      width: 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      position: relative;
      background: rgba(18, 18, 19, 0.85);
      padding: 4px 0;
      border-radius: 8px 0 0 8px;
      box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.04), 0px 8px 16px 0px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      pointer-events: all;
      box-sizing: border-box;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      height: 40px; /* Initial collapsed height */
      cursor: pointer;
    `;

    // In collapsed state, make the inner div clickable
    inner.addEventListener('click', async (e) => {
      if (inner.style.width === '48px') {
        e.stopPropagation();
        await this.authService.ensureAuthenticated();
        await this.expand();
      }
    });

    // Add collapse button at the top
    const collapseButton = this.createCollapseButton();
    collapseButton.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #FEFEFE;
      opacity: 0;
      position: absolute;
      top: 4px;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: auto;
      z-index: 2;
    `;

    // Create apps container
    const appsContainer = document.createElement('div');
    appsContainer.className = 'apps-container';
    appsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 0 0;
      flex: 1;
      width: 100%;
      overflow-y: auto;
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    `;

    // Add logo at the bottom
    const logo = document.createElement('div');
    logo.innerHTML = this.createLogoSvg();
    logo.style.cssText = `
      padding: 8px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s ease-in-out;
      pointer-events: none;
      flex-shrink: 0;
      color: #FEFEFE;
    `;

    // Add elements in the correct order
    inner.appendChild(collapseButton);
    inner.appendChild(appsContainer);
    inner.appendChild(logo);
    launcher.appendChild(inner);
    return launcher;
  }

  private createCollapseButton(): HTMLElement {
    const button = document.createElement('button');
    button.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 16px;
      margin: 4px;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #FEFEFE;
    `;

    button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 6L8 10L12 6" stroke="#99999A" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    `;

    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#12121310';
    });

    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'transparent';
    });

    button.addEventListener('click', () => this.collapse());

    return button;
  }

  private async handleAppClick(app: AppData): Promise<void> {
    try {
      const userSelection = this.domService.getSelectedContent();
      const rawHtml = document.documentElement.outerHTML;
      const fullText = document.body.innerText;

      chrome.runtime.sendMessage({
        _MindStudioEvent: '@@mindstudio/player/launch_worker',
        payload: {
          appId: app.id,
          appName: app.name,
          appIcon: app.iconUrl,
          launchVariables: {
            url: window.location.href,
            rawHtml,
            fullText,
            userSelection,
          },
        },
      });
    } catch (error) {
      console.error('Failed to launch worker:', error);
    }
  }

  private createAppButton(app: AppData): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 40px;
      height: 40px;
      pointer-events: auto;
      flex-shrink: 0;
    `;

    // Create icon container
    const iconContainer = document.createElement('div');
    iconContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      transition: all 0.2s ease-in-out;
    `;

    const icon = document.createElement('img');
    icon.src = app.iconUrl;
    icon.alt = `${app.name} icon`;
    icon.style.cssText = `
      width: 24px;
      height: 24px;
      border-radius: 4px;
      object-fit: cover;
      transition: all 0.2s ease-in-out;
    `;

    // Create name tooltip (moved outside the container)
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      opacity: 0;
      display: flex;
      max-width: 200px;
      padding: 8px 12px;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      
      position: fixed;
      right: ${FrameDimensions.LAUNCHER.VISUAL_WIDTH + 5}px;
      transform: translateY(-50%);
      
      border-radius: 8px;
      background: #121213;
      box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.04), 0px 4px 12px 0px rgba(0, 0, 0, 0.15);
      
      color: #FEFEFF;
      font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 12px;
      font-weight: 400;
      line-height: 120%;
      text-align: right;
      
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      
      pointer-events: none;
      z-index: ${ZIndexes.LAUNCHER + 1};
      transition: opacity 0.2s ease-in-out;
    `;
    tooltip.textContent = app.name;

    // Add hover effects
    container.addEventListener('mouseenter', () => {
      tooltip.style.opacity = '1';
      // Position the tooltip at the center of the container
      const rect = container.getBoundingClientRect();
      tooltip.style.top = `${rect.top + rect.height / 2}px`;

      icon.style.width = '30px';
      icon.style.height = '30px';
      iconContainer.style.width = '30px';
      iconContainer.style.height = '30px';
    });

    container.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
      icon.style.width = '24px';
      icon.style.height = '24px';
      iconContainer.style.width = '24px';
      iconContainer.style.height = '24px';
    });

    container.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      this.handleAppClick(app);
    });

    iconContainer.appendChild(icon);
    container.appendChild(iconContainer);

    // Add tooltip to the launcher element instead of the container
    const launcher = document.getElementById(ElementIds.LAUNCHER);
    if (launcher) {
      launcher.appendChild(tooltip);
    }

    return container;
  }

  private updateDockContent(): void {
    const launcher = document.getElementById(ElementIds.LAUNCHER);
    if (!launcher) {
      return;
    }

    const inner = launcher.firstElementChild as HTMLElement;
    if (!inner) {
      return;
    }

    let appsContainer = inner.querySelector('.apps-container');
    if (!appsContainer) {
      appsContainer = document.createElement('div');
      appsContainer.className = 'apps-container';
      (appsContainer as HTMLElement).style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        padding: 8px 0;
        flex: 1;
        overflow: visible;
        scrollbar-width: none;
        &::-webkit-scrollbar {
          display: none;
        }
      `;
      inner.insertBefore(appsContainer, inner.firstChild);
    }

    // Create a map of existing app elements by app ID
    const existingApps = new Map<string, HTMLElement>();
    appsContainer.childNodes.forEach((node) => {
      const appElement = node as HTMLElement;
      const appId = appElement.getAttribute('data-app-id');
      if (appId) {
        existingApps.set(appId, appElement);
      }
    });

    // Update or create app elements
    this.apps.forEach((app) => {
      const existingElement = existingApps.get(app.id);
      if (existingElement) {
        existingApps.delete(app.id);
        const icon = existingElement.querySelector('img');
        if (icon && icon.src !== app.iconUrl) {
          icon.src = app.iconUrl;
        }
        const tooltip = existingElement.querySelector('div');
        if (tooltip && tooltip.textContent !== app.name) {
          tooltip.textContent = app.name;
        }
      } else {
        const newElement = this.createAppButton(app);
        newElement.setAttribute('data-app-id', app.id);
        appsContainer.appendChild(newElement);
      }
    });

    // Remove any remaining elements that are no longer needed
    existingApps.forEach((element) => element.remove());
  }

  private filterAppsByUrl(apps: AppData[]): AppData[] {
    return apps.filter(({ extensionSupportedSites }) => {
      if (extensionSupportedSites.length === 0 || !this.currentHostUrl) {
        return true;
      }

      for (let i = 0; i < extensionSupportedSites.length; i += 1) {
        const escapedPattern = extensionSupportedSites[i].replace(
          /[-/\\^$+?.()|[\]{}]/g,
          '\\$&',
        );

        const regexPattern = new RegExp(
          `^${escapedPattern.replace(/\*/g, '.*')}$`,
        );

        const isValid = regexPattern.test(this.currentHostUrl);
        if (!isValid) {
          return false;
        }
      }
      return true;
    });
  }

  private updateApps(apps: AppData[]): void {
    this.apps = this.filterAppsByUrl(apps);
    this.updateDockContent();
  }

  private async loadAppsFromStorage(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get(StorageKeys.LAUNCHER_APPS, (result) => {
        const apps = result[StorageKeys.LAUNCHER_APPS] || [];
        this.updateApps(apps);
        resolve();
      });
    });
  }

  private async injectSyncFrame(): Promise<void> {
    if (document.getElementById(ElementIds.LAUNCHER_SYNC)) {
      return;
    }

    const token = await this.authService.getToken();
    if (!token) {
      return;
    }

    const frame = document.createElement('iframe');
    frame.id = ElementIds.LAUNCHER_SYNC;
    frame.style.cssText = `
      width: 0;
      height: 0;
      border: none;
      position: fixed;
      top: -9999px;
      left: -9999px;
    `;

    frame.src = `${RootUrl}/_extension/launcher?__displayContext=extension&__controlledAuth=1`;
    document.body.appendChild(frame);

    // Wait for launcher to be ready before sending token
    this.messagingService.subscribe('launcher/loaded', () => {
      this.messagingService.sendToLauncherSync('auth/token_changed', {
        authToken: token,
      });
    });

    // Set up message handler for app data updates
    this.messagingService.subscribe('launcher/apps_updated', ({ apps }) => {
      chrome.storage.local.set({ [StorageKeys.LAUNCHER_APPS]: apps }, () => {});
    });
  }

  async reinjectSyncFrame(token: string): Promise<void> {
    const frame = document.getElementById(ElementIds.LAUNCHER_SYNC);
    if (frame) {
      frame.remove();
    }
    await this.injectSyncFrame();
  }

  private async setCollapsed(collapsed: boolean): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set(
        { [StorageKeys.LAUNCHER_COLLAPSED]: collapsed },
        () => {
          resolve();
        },
      );
    });
  }

  private async isCollapsed(): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.storage.local.get(StorageKeys.LAUNCHER_COLLAPSED, (result) => {
        resolve(result[StorageKeys.LAUNCHER_COLLAPSED] || false);
      });
    });
  }

  private showFloatingButton(): void {
    const launcher = document.getElementById(ElementIds.LAUNCHER);
    if (!launcher) {
      return;
    }

    const inner = launcher.firstElementChild as HTMLElement;
    if (!inner) {
      return;
    }

    inner.style.height = '40px';
    inner.style.width = '48px';
    inner.style.cursor = 'pointer';

    const appsContainer = inner.querySelector('.apps-container') as HTMLElement;
    const collapseButton = inner.querySelector('button') as HTMLElement;

    if (appsContainer) {
      appsContainer.style.opacity = '0';
    }
    if (collapseButton) {
      collapseButton.style.opacity = '0';
    }
  }

  private hideFloatingButton(): void {
    // No longer needed as we're using a single element
  }

  private async showLauncher(): Promise<void> {
    const launcher = document.getElementById(ElementIds.LAUNCHER);
    if (!launcher) {
      return;
    }

    const inner = launcher.firstElementChild as HTMLElement;
    if (!inner) {
      return;
    }

    inner.style.cursor = 'default';
    inner.style.width = '40px';
    inner.style.height = 'auto';
    const height = inner.offsetHeight;
    inner.style.height = '40px';

    // Force a reflow
    inner.offsetHeight;

    inner.style.height = `${Math.min(height, window.innerHeight - 256)}px`;

    const appsContainer = inner.querySelector('.apps-container') as HTMLElement;
    const collapseButton = inner.querySelector('button') as HTMLElement;

    if (appsContainer) {
      appsContainer.style.opacity = '1';
    }
    if (collapseButton) {
      collapseButton.style.opacity = '1';
    }
  }

  private hideLauncher(): void {
    const launcher = document.getElementById(ElementIds.LAUNCHER);
    if (!launcher) {
      return;
    }

    const inner = launcher.firstElementChild as HTMLElement;
    if (!inner) {
      return;
    }

    inner.style.height = '40px';
    inner.style.width = '48px';
    inner.style.cursor = 'pointer';

    const appsContainer = inner.querySelector('.apps-container') as HTMLElement;
    const collapseButton = inner.querySelector('button') as HTMLElement;

    if (appsContainer) {
      appsContainer.style.opacity = '0';
    }
    if (collapseButton) {
      collapseButton.style.opacity = '0';
    }
  }

  async collapse(): Promise<void> {
    await this.setCollapsed(true);
    this.hideLauncher();
    this.showFloatingButton();
  }

  async expand(): Promise<void> {
    await this.setCollapsed(false);
    this.showLauncher();
    this.hideFloatingButton();
  }

  async initialize(): Promise<void> {
    // Create UI elements
    document.body.appendChild(this.createLauncherElement());

    // Initialize sync frame and load apps
    await this.injectSyncFrame();
    await this.loadAppsFromStorage();

    // Set initial state
    const isCollapsed = await this.isCollapsed();
    if (isCollapsed) {
      this.showFloatingButton();
    } else {
      this.showLauncher();
    }
  }
}
