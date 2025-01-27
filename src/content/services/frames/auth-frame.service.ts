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

    // Create auth iframe
    const frame = document.createElement('iframe');
    frame.id = ElementIds.AUTH;
    frame.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 0;
      height: 100vh;
      border: none;
      z-index: ${ZIndexes.AUTH};
      background: #FEFEFF;
      transition: width 0.3s ease;
      display: none;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
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

    auth.style.width = `${FrameDimensions.AUTH.WIDTH}px`;
    auth.style.borderLeft = '1px solid #E6E7E8';
    auth.style.display = 'block';
  }

  hide(): void {
    const auth = document.getElementById(ElementIds.AUTH) as HTMLIFrameElement;
    if (!auth) {
      return;
    }

    auth.style.width = '0';
    auth.style.display = 'none';
  }
}
