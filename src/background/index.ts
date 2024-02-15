import { getLocalConfig } from "../utils/config";

import { ACTIONS } from "../utils/constants";

const rebuildContextMenus = async () => {
  chrome.contextMenus.removeAll();

  const config = await getLocalConfig();

  chrome.contextMenus.create({
    id: "openDrawer",
    title: "Open Mindstudio",
    contexts: ["all"],
  });

  config.ais
    .filter(({ apiKey, appId }) => apiKey && appId)
    .forEach((ai, idx) => {
      chrome.contextMenus.create({
        id: String(idx),
        title: `Run "${ai.name}" : "%s"`,
        contexts: ["selection"],
      });
    });
};

/**
 * Rebuild context menus on extension install
 */
chrome.runtime.onInstalled.addListener(async () => {
  rebuildContextMenus();
});

/**
 * Rebuild context menus on config change
 */
chrome.storage.local.onChanged.addListener(() => {
  rebuildContextMenus();
});

/**
 * Define the handlers
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) {
    return;
  }

  if (info.menuItemId === "openDrawer") {
    chrome.tabs.sendMessage(tab.id, {
      action: ACTIONS.openDrawer,
    });

    return;
  }

  chrome.tabs.sendMessage(tab.id, {
    action: ACTIONS.loadSelection,
    selection: info.selectionText,
    aiIndex: Number(info.menuItemId),
  });
});
