import { RootUrl } from '../constants';

export class FrameService {
  private static instance: FrameService;
  private readonly launcherId = '__MindStudioLauncher';
  private readonly playerId = '__MindStudioPlayer';

  private constructor() {}

  static getInstance(): FrameService {
    if (!FrameService.instance) {
      FrameService.instance = new FrameService();
    }
    return FrameService.instance;
  }

  injectFrames(): void {
    this.injectLauncher();
    this.injectPlayer();
  }

  private injectLauncher(): void {
    if (document.getElementById(this.launcherId)) {
      return;
    }

    const frame = document.createElement('iframe');
    frame.id = this.launcherId;
    frame.src = `${RootUrl}/_extension/launcher?__displayContext=extension&__controlledAuth=1`;
    frame.style.cssText = `
      position: fixed;
      bottom: 64px;
      right: 0px;
      width: 0;
      height: 0;
      border: none;
      z-index: 999999;
      background: transparent;
    `;

    // Handle MindStudio page case
    if (this.isMindStudioPage()) {
      frame.style.display = 'none';
    }

    document.body.appendChild(frame);
  }

  private injectPlayer(): void {
    if (document.getElementById(this.playerId)) {
      return;
    }

    const frame = document.createElement('iframe');
    frame.id = this.playerId;
    frame.src = `${RootUrl}/_extension/player?__displayContext=extension&__controlledAuth=1`;
    frame.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      border: none;
      z-index: 999999;
      background: transparent;
      display: none;
      opacity: 0;
    `;

    document.body.appendChild(frame);
  }

  private isMindStudioPage(): boolean {
    return (
      window.top?.location.host === 'app.mindstudio.ai' ||
      window.top?.location.host === 'localhost:3000'
    );
  }
}
