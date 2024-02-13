import { getLocalConfig } from "../utils/config";

import { ACTIONS } from "../utils/action";

/**
 * Define context menus
 */
chrome.runtime.onInstalled.addListener(async () => {
  const config = await getLocalConfig();

  chrome.contextMenus.create({
    id: "openDrawer",
    title: "Open Mindstudio",
    contexts: ["all"],
  });

  config.ais.forEach((ai, idx) => {
    chrome.contextMenus.create({
      id: String(idx),
      title: `Run "${ai.name}" : "%s"`,
      contexts: ["selection"],
    });
  });
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
