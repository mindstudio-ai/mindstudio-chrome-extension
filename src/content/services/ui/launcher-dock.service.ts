import { ElementIds, FrameDimensions, ZIndexes } from '../../constants';
import { MessagingService } from '../messaging.service';
import { AuthService } from '../auth.service';
import { LauncherStateService } from '../launcher-state.service';
import { FloatingButtonService } from './floating-button.service';
import { StorageKeys } from '../../constants';
import { PlayerService } from '../player.service';
import { LayoutService } from './layout.service';

interface AppData {
  id: string;
  name: string;
  iconUrl: string;
}

export class LauncherDockService {
  private static instance: LauncherDockService;
  private launcherState = LauncherStateService.getInstance();
  private floatingButton = FloatingButtonService.getInstance();
  private playerService = PlayerService.getInstance();
  private layoutService = LayoutService.getInstance();
  private apps: AppData[] = [];

  private constructor() {}

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

    // Create apps container immediately
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

    // Add collapse button at the bottom
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

    // 1. Ensure the content wrapper is created by LayoutService
    this.layoutService.ensureContentWrapper();

    // 2. Now create and append our dock to the DOM
    const dock = this.createDockElement();
    document.body.appendChild(dock);

    // 3. Initialize apps, storage listeners, etc.
    this.initialize();
  }

  private handleAppClick(app: AppData): void {
    this.playerService.launchWorker({
      id: app.id,
      name: app.name,
      iconUrl: app.iconUrl,
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
    container.addEventListener('click', () => this.handleAppClick(app));

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

  updateApps(apps: AppData[]): void {
    this.apps = apps;
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
    this.playerService.closePlayer();
    this.hideDock();
    this.floatingButton.showButton();
  }

  async expand(): Promise<void> {
    await this.launcherState.setCollapsed(false);
    this.showDock();
    this.floatingButton.hideButton();
  }

  async showDock(): Promise<void> {
    const isCollapsed = await this.launcherState.isCollapsed();
    if (isCollapsed) {
      this.floatingButton.showButton();
      return;
    }

    const dock = document.getElementById(ElementIds.LAUNCHER);
    if (!dock) {
      return;
    }

    dock.style.display = 'block';

    requestAnimationFrame(() => {
      dock.style.opacity = '1';
      dock.style.transform = 'translateX(0)';
      this.layoutService.shiftContent(FrameDimensions.LAUNCHER.VISUAL_WIDTH);
    });
  }

  hideDock(): void {
    const dock = document.getElementById(ElementIds.LAUNCHER);
    if (!dock) {
      return;
    }

    dock.style.transform = 'translateX(100%)';
    dock.style.opacity = '0';

    this.layoutService.shiftContent(0);

    setTimeout(() => {
      dock.style.display = 'none';
    }, 300);
  }
}
