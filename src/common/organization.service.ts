import { StorageKeys } from './constants';
import { OrganizationData } from './types';

export class OrganizationService {
  private static instance: OrganizationService;

  private constructor() {}

  static getInstance(): OrganizationService {
    if (!OrganizationService.instance) {
      OrganizationService.instance = new OrganizationService();
    }
    return OrganizationService.instance;
  }

  async getSelectedOrganization(): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get(StorageKeys.SELECTED_ORGANIZATION, (result) => {
        resolve(result[StorageKeys.SELECTED_ORGANIZATION] || null);
      });
    });
  }

  async setSelectedOrganization(organizationId: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set(
        { [StorageKeys.SELECTED_ORGANIZATION]: organizationId },
        () => {
          resolve();
        },
      );
    });
  }

  async getOrganizations(): Promise<OrganizationData[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get(StorageKeys.ORGANIZATIONS, (result) => {
        resolve(result[StorageKeys.ORGANIZATIONS] || []);
      });
    });
  }
}
