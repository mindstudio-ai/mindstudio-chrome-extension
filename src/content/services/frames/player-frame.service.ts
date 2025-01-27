import {
  ElementIds,
  FrameDimensions,
  RootUrl,
  ZIndexes,
} from '../../constants';

export class PlayerFrameService {
  private static instance: PlayerFrameService;

  private constructor() {}

  static getInstance(): PlayerFrameService {
    if (!PlayerFrameService.instance) {
      PlayerFrameService.instance = new PlayerFrameService();
    }
    return PlayerFrameService.instance;
  }

  injectFrame(): void {
    if (document.getElementById(ElementIds.PLAYER)) {
      return;
    }

    const frame = document.createElement('iframe');
    frame.id = ElementIds.PLAYER;
    frame.src = `${RootUrl}/_extension/player?__displayContext=extension&__controlledAuth=1`;
    frame.style.cssText = `
      position: fixed;
      top: 0;
      right: ${FrameDimensions.LAUNCHER.VISUAL_WIDTH}px;
      width: ${FrameDimensions.PLAYER.WIDTH}px;
      height: 100vh;
      border: none;
      z-index: ${ZIndexes.PLAYER};
      background: #FFFFFF;
      display: none;
      opacity: 0;
      transition: all 0.3s ease;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    `;

    document.body.appendChild(frame);
  }

  show(): void {
    const player = document.getElementById(
      ElementIds.PLAYER,
    ) as HTMLIFrameElement;
    if (!player) {
      return;
    }

    player.style.display = 'block';
    player.style.opacity = '1';
    player.style.width = `${FrameDimensions.PLAYER.WIDTH}px`;
    player.style.right = `${FrameDimensions.LAUNCHER.VISUAL_WIDTH}px`;
    player.style.borderLeft = '1px solid #E6E7E8';
  }

  hide(): void {
    const player = document.getElementById(
      ElementIds.PLAYER,
    ) as HTMLIFrameElement;
    if (!player) {
      return;
    }

    player.style.display = 'none';
    player.style.opacity = '0';
  }
}
