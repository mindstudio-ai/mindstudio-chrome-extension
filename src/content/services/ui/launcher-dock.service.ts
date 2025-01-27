import {
  ElementIds,
  FrameDimensions,
  RootUrl,
  StorageKeys,
  ZIndexes,
} from '../../constants';
import { LauncherStateService } from '../launcher-state.service';
import { FloatingButtonService } from './floating-button.service';
import { SidePanelService } from '../side-panel.service';
import { DOMService } from '../dom.service';

interface AppData {
  id: string;
  name: string;
  iconUrl: string;
  extensionSupportedSites: string[];
}

export class LauncherDockService {
  private static instance: LauncherDockService;
  private launcherState = LauncherStateService.getInstance();
  private floatingButton = FloatingButtonService.getInstance();
  private sidePanelService = SidePanelService.getInstance();
  private domService = DOMService.getInstance();
  private apps: AppData[] = [];
  private currentHostUrl: string = window.location.href;

  private constructor() {
    this.launcherState.setLauncherDock(this);
  }

  static getInstance(): LauncherDockService {
    if (!LauncherDockService.instance) {
      LauncherDockService.instance = new LauncherDockService();
    }
    return LauncherDockService.instance;
  }

  private createDockElement(): HTMLElement {
    const dock = document.createElement('div');
    dock.id = ElementIds.LAUNCHER;
    dock.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: ${FrameDimensions.LAUNCHER.TOTAL_WIDTH}px;
      height: 100vh;
      z-index: ${ZIndexes.LAUNCHER};
      background: transparent;
      display: none;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: visible;
      pointer-events: none;
    `;

    const inner = document.createElement('div');
    inner.style.cssText = `
      margin-left: auto;
      height: 100%;
      width: ${FrameDimensions.LAUNCHER.VISUAL_WIDTH}px;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      background: #f6f6f7;
      padding: 4px 0;
      border-left: 1px solid #12121340;
      overflow: visible;
      pointer-events: all;
      box-sizing: border-box;
    `;

    // Add logo at the top
    const logo = document.createElement('div');
    logo.innerHTML = `
      <svg width="28" height="16" viewBox="0 0 28 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M11.9957 3.75733C11.8085 4.32707 11.694 4.93386 11.422 5.46033C9.97282 8.26551 8.49953 11.0587 7.00408 13.8399C5.93552 15.8271 3.73318 16.5345 1.87822 15.5336C0.0734324 14.5597 -0.52834 12.3779 0.502818 10.404C1.99299 7.55167 3.48286 4.69841 5.02979 1.87636C5.87947 0.326252 7.58533 -0.304487 9.2649 0.17678C10.8346 0.62658 11.9069 2.07437 11.9957 3.75733Z" fill="#121213"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M22.0606 3.73975C21.8734 4.30949 21.7589 4.91628 21.4869 5.44275C20.0378 8.24793 18.5645 11.0411 17.069 13.8223C16.0005 15.8096 13.7981 16.5169 11.9432 15.516C10.1384 14.5421 9.53658 12.3603 10.5678 10.3865C12.0579 7.53409 13.5478 4.68084 15.0947 1.85878C15.9444 0.308675 17.6503 -0.322065 19.3298 0.159202C20.8995 0.609001 21.9719 2.0568 22.0606 3.73975Z" fill="#121213"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M23.6046 4.7959C24.6423 6.61697 25.6657 8.37485 26.6522 10.1555C27.609 11.8824 27.302 13.878 25.9349 15.0884C24.5834 16.285 22.5927 16.2838 21.2605 15.0855C19.9032 13.8645 19.6076 11.8589 20.5637 10.144C21.5543 8.36745 22.5726 6.60805 23.6046 4.7959Z" fill="#121213"/>
      </svg>
    `;
    logo.style.cssText = `
      padding: 12px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: opacity 0.2s ease-in-out;
    `;

    logo.addEventListener('click', () => {
      window.open(RootUrl, '_blank');
    });

    logo.addEventListener('mouseenter', () => {
      logo.style.opacity = '0.7';
    });

    logo.addEventListener('mouseleave', () => {
      logo.style.opacity = '1';
    });

    // Create apps container
    const appsContainer = document.createElement('div');
    appsContainer.className = 'apps-container';
    (appsContainer as HTMLElement).style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 8px 0;
      flex: 1;
      overflow: visible;
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    `;

    // Add elements in order: logo, apps container, collapse button
    inner.appendChild(logo);
    inner.appendChild(appsContainer);
    inner.appendChild(this.createCollapseButton());
    dock.appendChild(inner);
    return dock;
  }

  async initialize(): Promise<void> {
    await this.loadAppsFromStorage();
    this.setupStorageListener();
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

  private setupStorageListener(): void {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes[StorageKeys.LAUNCHER_APPS]) {
        const apps = changes[StorageKeys.LAUNCHER_APPS].newValue || [];

        this.updateApps(apps);
      }
    });
  }

  injectDock(): void {
    // Prevent duplicate docks
    if (document.getElementById(ElementIds.LAUNCHER)) {
      return;
    }

    // Remove layoutService call and just create and append our dock to the DOM
    const dock = this.createDockElement();
    document.body.appendChild(dock);

    // Initialize apps, storage listeners, etc.
    this.initialize();
  }

  private handleAppClick(app: AppData): void {
    // Send click message directly to background script
    chrome.runtime.sendMessage({
      _MindStudioEvent: '@@mindstudio/player/launch_worker',
      payload: {
        appId: app.id,
        appName: app.name,
        appIcon: app.iconUrl,
      },
    });
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
    `;

    // Create name tooltip
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      opacity: 0;
      display: flex;
      max-width: 200px;
      padding: 8px 12px;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      
      position: absolute;
      right: calc(100% + 5px); 
      top: 50%;
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
    icon.style.cssText = `
      width: 24px;
      height: 24px;
      border-radius: 4px;
      object-fit: cover;
      transition: all 0.2s ease-in-out;
    `;

    // Add hover effects
    container.addEventListener('mouseenter', () => {
      tooltip.style.opacity = '1';
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

    // Add click handler
    container.addEventListener('mousedown', () => this.handleAppClick(app));

    iconContainer.appendChild(icon);
    container.appendChild(tooltip);
    container.appendChild(iconContainer);
    return container;
  }

  private updateDockContent(): void {
    const dock = document.getElementById(ElementIds.LAUNCHER);
    if (!dock) {
      return;
    }

    const inner = dock.firstElementChild as HTMLElement;
    if (!inner) {
      return;
    }

    // Get or create apps container
    let appsContainer = inner.querySelector('.apps-container');
    if (!appsContainer) {
      appsContainer = document.createElement('div');
      appsContainer.className = 'apps-container';
      (appsContainer as HTMLElement).style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
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
        // Remove from map to track which ones need to be removed later
        existingApps.delete(app.id);

        // Update existing element if needed (e.g., icon URL or name changed)
        const icon = existingElement.querySelector('img');
        if (icon && icon.src !== app.iconUrl) {
          icon.src = app.iconUrl;
        }
        const tooltip = existingElement.querySelector('div');
        if (tooltip && tooltip.textContent !== app.name) {
          tooltip.textContent = app.name;
        }
      } else {
        // Create new element if it doesn't exist
        const newElement = this.createAppButton(app);
        newElement.setAttribute('data-app-id', app.id);
        appsContainer.appendChild(newElement);
      }
    });

    // Remove any remaining elements that are no longer needed
    existingApps.forEach((element) => {
      element.remove();
    });
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

  updateApps(apps: AppData[]): void {
    this.apps = this.filterAppsByUrl(apps);
    this.updateDockContent();
  }

  private createCollapseButton(): HTMLElement {
    const button = document.createElement('button');
    button.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      margin: 4px;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: background-color 0.2s ease;
      color: #6D6D6E;
    `;

    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M9 6l6 6l-6 6" />
      </svg>
    `;

    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#12121310';
    });

    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'transparent';
    });

    button.addEventListener('click', async () => {
      await this.collapse();
    });

    return button;
  }

  async collapse(): Promise<void> {
    await this.launcherState.setCollapsed(true);
    this.hideDock();
    this.floatingButton.showButton();
  }

  async expand(): Promise<void> {
    await this.launcherState.setCollapsed(false);
    this.showDock();
    this.floatingButton.hideButton();
  }

  async showDock(): Promise<void> {
    const dock = document.getElementById(ElementIds.LAUNCHER);
    if (!dock) {
      return;
    }

    dock.style.display = 'block';
    // Add small delay to ensure display: block is applied before transition
    await new Promise((resolve) => setTimeout(resolve, 50));
    dock.style.opacity = '1';
    dock.style.transform = 'translateX(0)';
  }

  hideDock(): void {
    const dock = document.getElementById(ElementIds.LAUNCHER);
    if (!dock) {
      return;
    }

    dock.style.opacity = '0';
    dock.style.transform = 'translateX(100%)';

    // Hide the dock after transition
    setTimeout(() => {
      if (dock.style.opacity === '0') {
        dock.style.display = 'none';
      }
    }, 300);
  }
}
