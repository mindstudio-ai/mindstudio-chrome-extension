import { ACTIONS } from "../utils/action";

/**
 * Rather than using a popup, the action button now triggers the opening of the right drawer,
 * which contains all necessary functionalities.
 */
chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
  const activeTab = tabs[0];

  if (activeTab && activeTab.id) {
    chrome.tabs.sendMessage(activeTab.id, { action: ACTIONS.openDrawer });
  }

  /**
   * Will close the popup after clicking
   */
  window.close();
});
