import { getLocalConfig } from "../utils/config";

import { ACTIONS } from "../utils/constants";

const rebuildContextMenus = async () => {
  chrome.contextMenus.removeAll();

  const config = await getLocalConfig();

  const activeAis = config.ais.filter(({ apiKey, appId }) => apiKey && appId);

  chrome.contextMenus.create({
    id: ACTIONS.openDrawer,
    title: "Open Mindstudio",
    contexts: ["all"],
  });

  chrome.contextMenus.create({
    id: "s1",
    type: "separator",
    contexts: ["all"],
  });

  /**
   * Use current page's URL as a message
   */
  activeAis.forEach((ai, idx) => {
    chrome.contextMenus.create({
      id: `${ACTIONS.useUrl}-${idx}`,
      title: `${ai.name} - Preload Current URL`,
      contexts: ["all"],
    });

    chrome.contextMenus.create({
      id: `${ACTIONS.submitUrl}-${idx}`,
      title: `${ai.name} - Submit Current URL`,
      contexts: ["all"],
    });
  });

  chrome.contextMenus.create({
    id: "s2",
    type: "separator",
    contexts: ["all"],
  });

  /**
   * YouTube & Gmail tests
   */
  /*activeAis.forEach((ai, idx) => {
    chrome.contextMenus.create({
      id: `loadYoutubeCaptions-${idx}`,
      title: `Run "${ai.name}" : YouTube Captions`,
      contexts: ["all"],
      documentUrlPatterns: [
        "*://youtube.com/watch*",
        "*://www.youtube.com/watch*",
      ],
    });
  });
  activeAis.forEach((ai, idx) => {
    chrome.contextMenus.create({
      id: `loadGmailEmail-${idx}`,
      title: `Run "${ai.name}" : Gmail Email`,
      contexts: ["all"],
      documentUrlPatterns: ["*://mail.google.com/mail*"],
    });
  });
  chrome.contextMenus.create({
    id: "s3",
    type: "separator",
    contexts: ["all"],
  });
  */

  /**
   * Load Selection as a message
   */
  activeAis.forEach((ai, idx) => {
    chrome.contextMenus.create({
      id: `${ACTIONS.useSelection}-${idx}`,
      title: `${ai.name} - Preload "%s"`,
      contexts: ["selection"],
    });

    chrome.contextMenus.create({
      id: `${ACTIONS.submitSelection}-${idx}`,
      title: `${ai.name} - Submit "%s"`,
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

  if (info.menuItemId === ACTIONS.openDrawer) {
    chrome.tabs.sendMessage(tab.id, {
      action: ACTIONS.openDrawer,
    });

    return;
  }

  if (!String(info.menuItemId).includes("-")) {
    return;
  }

  const action = String(info.menuItemId).split("-")[0];
  const aiIndex = Number(String(info.menuItemId).split("-")[1]);

  if (action === ACTIONS.useUrl) {
    chrome.tabs.sendMessage(tab.id, {
      action: ACTIONS.useUrl,
      url: info.pageUrl,
      aiIndex,
    });

    return;
  }

  if (action === ACTIONS.submitUrl) {
    chrome.tabs.sendMessage(tab.id, {
      action: ACTIONS.submitUrl,
      url: info.pageUrl,
      aiIndex,
    });

    return;
  }

  if (action === ACTIONS.useSelection) {
    chrome.tabs.sendMessage(tab.id, {
      action: ACTIONS.useSelection,
      selection: info.selectionText,
      aiIndex,
    });

    return;
  }

  if (action === ACTIONS.submitSelection) {
    chrome.tabs.sendMessage(tab.id, {
      action: ACTIONS.submitSelection,
      selection: info.selectionText,
      aiIndex,
    });

    return;
  }
});
