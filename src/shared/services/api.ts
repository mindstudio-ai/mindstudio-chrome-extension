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

  async getApps(organizationId: string): Promise<AppData[]> {
    const response = await this.request<{
      apps: any[];
    }>(`/v1/pinned/list`, organizationId);
    return (response?.apps || []).map((app) => ({
      id: app.id,
      name: app.name,
      iconUrl: app.iconUrl || DefaultIcons.APP,
    }));
  }
}

export const api = ApiClient.getInstance();
