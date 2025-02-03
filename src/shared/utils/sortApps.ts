import { AppData, AppSettings } from '../types/app';

export const sortApps = (
  apps: AppData[],
  appsSettings: Record<string, AppSettings>,
) => {
  return apps.sort((a, b) => {
    const aSettings = appsSettings[a.id] || {
      sortOrder: 0,
      isVisible: true,
    };
    const bSettings = appsSettings[b.id] || {
      sortOrder: 0,
      isVisible: true,
    };

    const aSortOrder = aSettings.sortOrder;
    const bSortOrder = bSettings.sortOrder;

    if (aSortOrder === 0 && bSortOrder === 0) {
      return a.name.localeCompare(b.name);
    }
    return bSortOrder - aSortOrder;
  });
};
