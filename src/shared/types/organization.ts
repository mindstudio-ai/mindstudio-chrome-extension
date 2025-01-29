export interface OrganizationData {
  id: string;
  name: string;
  logoUrl?: string;
  description?: string;
  companyName?: string;
  requestingUserRole: 'owner' | 'admin' | 'member' | 'guest';
  requestingUserStatus: 'active' | 'pending' | 'inactive';
}
