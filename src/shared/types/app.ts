export interface AppData {
  id: string;
  name: string;
  iconUrl: string;
  extensionSupportedSites: string[];
}

export interface AppSettings {
  sortOrder: number;
  isVisible: boolean;
}
