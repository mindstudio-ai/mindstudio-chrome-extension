import { ApiUrl, DefaultIcons } from '../constants';
import { storage } from './storage';
import { AppData } from '../types/app';

class ApiClient {
  private static instance: ApiClient;

  private constructor() {}

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private async getHeaders(): Promise<Headers> {
    const token = await storage.get('AUTH_TOKEN');
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    if (token) {
      headers.append('Authorization', `Bearer: ${token}`);
    }

    return headers;
  }

  private async request<T>(path: string, organizationId: string): Promise<T> {
    const url = `${ApiUrl}${path}`;
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      headers: {
        ...Object.fromEntries(headers.entries()),
        'X-Organization-Id': organizationId,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getPinnedApps(organizationId: string): Promise<AppData[]> {
    const response = await this.request<{
      apps: any[];
    }>(`/v1/apps/pinned/list`, organizationId);

    const resolvedApps = response?.apps || [];

    return resolvedApps.map((app) => ({
      id: app.id,
      name: app.name,
      iconUrl: app.iconUrl || DefaultIcons.APP,
      enabledSites: app.extensionSupportedSites,
    }));
  }

  async getSuggestedApps(organizationId: string): Promise<AppData[]> {
    const response = await this.request<{
      apps: any[];
    }>(`/v1/discovery/extension/list-site-specific`, organizationId);

    const resolvedApps = response?.apps || [];

    return resolvedApps.map((app) => ({
      id: app.id,
      name: app.name,
      iconUrl: app.iconUrl || DefaultIcons.APP,
      enabledSites: app.extensionSupportedSites,
    }));
  }

  async getSignedUploadUrl(): Promise<{
    fields: { [index: string]: string };
    url: string;
    path: string;
  }> {
    const organizationId = await storage.get('SELECTED_ORGANIZATION');
    if (!organizationId) {
      throw new Error();
    }

    const url = `${ApiUrl}/v1/cdn/upload-private`;
    const headers = await this.getHeaders();

    const request = await fetch(url, {
      method: 'POST',
      headers: {
        ...Object.fromEntries(headers.entries()),
        'X-Organization-Id': organizationId,
      },
      body: JSON.stringify({
        extension: 'pdf',
        appId: '_extensionTemp',
      }),
    });

    if (!request.ok) {
      throw new Error(`API request failed: ${request.statusText}`);
    }

    const response = await request.json();

    return response;
  }

  uploadFile(
    route: string,
    file: FormData,
    onProgress?: (progress: number) => void,
  ) {
    return new Promise((resolve, reject) => {
      const req = new XMLHttpRequest();
      req.open('post', route);

      req.addEventListener(
        'load',
        () => {
          if (req.status >= 200 && req.status <= 299) {
            resolve(req.response);
          } else {
            reject();
          }
        },
        false,
      );

      req.addEventListener(
        'error',
        () => {
          reject();
        },
        false,
      );

      req.upload.addEventListener(
        'progress',
        (e) => {
          try {
            const { loaded, total } = e;
            const progress = Math.floor((loaded / total) * 100) / 100;
            onProgress?.(progress);
          } catch {}
        },
        false,
      );

      // Send file
      req.send(file);
    });
  }
}

export const api = ApiClient.getInstance();
