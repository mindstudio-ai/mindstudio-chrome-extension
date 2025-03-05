import { AppData } from '../types/app';

export const filterAppsForUrl = (
  apps: AppData[],
  currentUrl?: string,
  allowIfNoEnabledSites?: boolean,
) => {
  return apps.filter((app: AppData) => {
    const { enabledSites } = app;
    if (allowIfNoEnabledSites && (!enabledSites || enabledSites.length === 0)) {
      return true;
    }

    if (!enabledSites) {
      return false;
    }

    return enabledSites.some((pattern) => {
      if (!currentUrl) {
        return false;
      }

      const escapedPattern = pattern.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');

      const regexPattern = new RegExp(
        `^${escapedPattern.replace(/\*/g, '.*')}$`,
      );

      return regexPattern.test(currentUrl);
    });
  });
};
