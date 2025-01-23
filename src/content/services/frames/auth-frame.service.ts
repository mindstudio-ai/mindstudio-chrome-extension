import {
  ElementIds,
  FrameDimensions,
  RootUrl,
  ZIndexes,
} from '../../constants';
import { AuthService } from '../auth.service';

export class AuthFrameService {
  private static instance: AuthFrameService;
  private authService: AuthService;

  private constructor() {
    this.authService = AuthService.getInstance();
  }

  static getInstance(): AuthFrameService {
    if (!AuthFrameService.instance) {
      AuthFrameService.instance = new AuthFrameService();
    }
    return AuthFrameService.instance;
  }

  injectFrame(): void {
    if (document.getElementById(ElementIds.AUTH)) {
      return;
    }

    const frame = document.createElement('iframe');
    frame.id = ElementIds.AUTH;
    frame.style.cssText = `
      position: fixed;
      top: 0;
      right: 1px;
      width: 0;
      height: 100vh;
      border: none;
      z-index: ${ZIndexes.AUTH};
      background: #FEFEFF;
      transition: width 0.3s ease;
      display: none;
    `;

    document.body.appendChild(frame);
  }

  show(): void {
    const auth = document.getElementById(ElementIds.AUTH) as HTMLIFrameElement;
    if (!auth) {
      return;
    }

    if (!auth.src) {
      auth.src = `${RootUrl}/_extension/login?__displayContext=extension`;
    }

    auth.style.width = '400px';
    auth.style.borderLeft = '1px solid #E6E7E8';
    auth.style.display = 'block';
    document.body.style.width = `calc(100% - ${FrameDimensions.AUTH.WIDTH}px)`;
  }

  hide(): void {
    const auth = document.getElementById(ElementIds.AUTH) as HTMLIFrameElement;
    if (!auth) {
      return;
    }

    auth.style.width = '0';
    document.body.style.width = '100%';
  }
}
