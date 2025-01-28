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

  async ensureSelectedOrganization(): Promise<string | null> {
    const selectedId = await this.getSelectedOrganization();
    if (selectedId) {
      // Verify the selected org still exists and is active
      const organizations = await this.getOrganizations();
      const selectedOrg = organizations.find(
        (org) => org.id === selectedId && org.requestingUserStatus === 'active',
      );

      if (selectedOrg) {
        return selectedId;
      }
    }

    // No valid selection, try to select a default
    const organizations = await this.getOrganizations();
    const activeOrgs = organizations.filter(
      (org) => org.requestingUserStatus === 'active',
    );

    if (activeOrgs.length > 0) {
      // Prefer personal workspace (where user is owner) or take the first active org
      const defaultOrg =
        activeOrgs.find((org) => org.requestingUserRole === 'owner') ||
        activeOrgs[0];
      await this.setSelectedOrganization(defaultOrg.id);
      return defaultOrg.id;
    }

    return null;
  }
}
