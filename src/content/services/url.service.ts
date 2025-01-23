import { MessagingService } from './messaging.service';

export class URLService {
  private static instance: URLService;
  private currentUrl: string = window.location.href;
  private messagingService = MessagingService.getInstance();
  private checkingIntervalId: number | null = null;

  private constructor() {}

  static getInstance(): URLService {
    if (!URLService.instance) {
      URLService.instance = new URLService();
    }
    return URLService.instance;
  }

  startTracking(): void {
    // Clear any existing interval
    if (this.checkingIntervalId) {
      window.clearInterval(this.checkingIntervalId);
      this.checkingIntervalId = null;
    }

    // Simple approach to detect URL changes every 500ms
    this.checkingIntervalId = window.setInterval(() => {
      if (window.location.href !== this.currentUrl) {
        this.currentUrl = window.location.href;
        this.messagingService.sendToLauncherSync('url/changed', {
          url: this.currentUrl,
        });
      }
    }, 500);
  }

  stopTracking(): void {
    if (this.checkingIntervalId) {
      clearInterval(this.checkingIntervalId);
      this.checkingIntervalId = null;
    }
  }
}
