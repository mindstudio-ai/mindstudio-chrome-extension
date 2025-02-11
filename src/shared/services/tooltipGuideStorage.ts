import { storage } from './storage';

export const tooltipGuideStorage = {
  async get(key: string): Promise<boolean> {
    const tooltipGuidesShown =
      (await storage.get('TOOLTIP_GUIDES_SHOWN')) || {};

    return tooltipGuidesShown[key] || false;
  },

  async set(key: string, value: boolean): Promise<void> {
    const tooltipGuidesShown =
      (await storage.get('TOOLTIP_GUIDES_SHOWN')) || {};

    tooltipGuidesShown[key] = value;

    await storage.set('TOOLTIP_GUIDES_SHOWN', tooltipGuidesShown);
  },
};
