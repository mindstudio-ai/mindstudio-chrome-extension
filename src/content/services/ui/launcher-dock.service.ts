import { ElementIds, FrameDimensions, ZIndexes } from '../../constants';
import { MessagingService } from '../messaging.service';
import { AuthService } from '../auth.service';
import { LauncherStateService } from '../launcher-state.service';
import { FloatingButtonService } from './floating-button.service';
import { StorageKeys } from '../../constants';
import { PlayerService } from '../player.service';
import { LayoutService } from '../layout.service';

interface AppData {
  id: string;
  name: string;
  iconUrl: string;
}

export class LauncherDockService {
  private static instance: LauncherDockService;
  private messagingService = MessagingService.getInstance();
  private authService = AuthService.getInstance();
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
    appsContainer.style.cssText = `
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
    `;

    const icon = document.createElement('img');
    icon.src = app.iconUrl;
    icon.style.cssText = `
      width: 24px;
      height: 24px;
      border-radius: 4px;
      object-fit: cover;
    `;

    // Add hover effects
    container.addEventListener('mouseenter', () => {
      tooltip.style.opacity = '1';
    });

    container.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
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

    // Clear existing apps
    const appsContainer = inner.querySelector('.apps-container');
    if (appsContainer) {
      appsContainer.remove();
    }

    // Create new apps container
    const newAppsContainer = document.createElement('div');
    newAppsContainer.className = 'apps-container';
    newAppsContainer.style.cssText = `
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

    // Add app buttons
    this.apps.forEach((app) => {
      newAppsContainer.appendChild(this.createAppButton(app));
    });

    // Insert before any existing elements (like collapse button)
    inner.insertBefore(newAppsContainer, inner.firstChild);
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
