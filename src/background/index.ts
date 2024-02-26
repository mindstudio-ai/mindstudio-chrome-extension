import { getLocalConfig } from "../utils/config";

import { ACTIONS } from "../utils/constants";

const rebuildContextMenus = async () => {
  chrome.contextMenus.removeAll();

  const config = await getLocalConfig();

  const activeAis = config.ais.filter(({ apiKey, appId }) => apiKey && appId);

  chrome.contextMenus.create({
    id: "openDrawer",
    title: "Open Mindstudio",
    contexts: ["all"],
  });

  chrome.contextMenus.create({
    id: "s1",
    type: "separator",
    contexts: ["all"],
  });

  /**
   * Load HTML Source
   */
  activeAis.forEach((ai, idx) => {
    chrome.contextMenus.create({
      id: `loadHtml-${idx}`,
      title: `Run "${ai.name}" : Scrape URL`,
      contexts: ["all"],
    });
  });

  chrome.contextMenus.create({
    id: "s2",
    type: "separator",
    contexts: ["all"],
  });

  /**
   * Load YouTube captions
   */
  activeAis.forEach((ai, idx) => {
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

  chrome.contextMenus.create({
    id: "s3",
    type: "separator",
    contexts: ["all"],
  });

  /**
   * Load Gmail emails
   */
  activeAis.forEach((ai, idx) => {
    chrome.contextMenus.create({
      id: `loadGmailEmail-${idx}`,
      title: `Run "${ai.name}" : Gmail Email`,
      contexts: ["all"],
      documentUrlPatterns: ["*://mail.google.com/mail*"],
    });
  });

  chrome.contextMenus.create({
    id: "s4",
    type: "separator",
    contexts: ["all"],
  });

  /**
   * Load Selection
   */
  activeAis.forEach((ai, idx) => {
    chrome.contextMenus.create({
      id: `selection-${idx}`,
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

  if (!String(info.menuItemId).includes("-")) {
    return;
  }

  const action = String(info.menuItemId).split("-")[0];
  const aiIndex = Number(String(info.menuItemId).split("-")[1]);

  if (action === "loadHtml") {
    chrome.tabs.sendMessage(tab.id, {
      action: ACTIONS.loadHtmlSource,
      aiIndex,
      info,
    });

    return;
  }

  if (action === "loadYoutubeCaptions") {
    chrome.tabs.sendMessage(tab.id, {
      action: ACTIONS.loadYouTubeCaptions,
      aiIndex,
      info,
    });

    return;
  }

  if (action === "loadGmailEmail") {
    chrome.tabs.sendMessage(tab.id, {
      action: ACTIONS.loadGmailEmail,
      aiIndex,
      info,
    });

    return;
  }

  if (action === "selection") {
    chrome.tabs.sendMessage(tab.id, {
      action: ACTIONS.loadSelection,
      selection: info.selectionText,
      aiIndex,
    });

    return;
  }
});
