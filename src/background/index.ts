chrome.declarativeNetRequest.updateDynamicRules({
  addRules: [
    {
      id: 1,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        responseHeaders: [
          {
            header: 'X-Frame-Options',
            operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
          },
          {
            header: 'Content-Security-Policy',
            operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
          },
        ],
      },
      condition: {
        urlFilter: '*',
        resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
      },
    },
  ],
  removeRuleIds: [1],
});
