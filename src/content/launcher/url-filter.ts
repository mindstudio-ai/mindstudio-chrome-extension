import { AppData } from '../../shared/types/app';

export function filterAppsByUrl(
  apps: AppData[],
  currentUrl: string,
): AppData[] {
  return apps.filter(({ extensionSupportedSites }) => {
    if (extensionSupportedSites.length === 0 || !currentUrl) {
      return true;
    }

    return extensionSupportedSites.every((pattern) => {
      const escapedPattern = pattern.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');
      const regexPattern = new RegExp(
        `^${escapedPattern.replace(/\*/g, '.*')}$`,
      );
      return regexPattern.test(currentUrl);
    });
  });
}
