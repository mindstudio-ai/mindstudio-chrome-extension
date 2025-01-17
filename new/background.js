chrome.declarativeNetRequest.updateDynamicRules({
  addRules: [
    {
      id: 1,
      priority: 1,
      action: {
        type: "modifyHeaders",
        responseHeaders: [
          {
            "header": "X-Frame-Options",
            "operation": "remove"
          },
          {
            "header": "Content-Security-Policy",
            "operation": "remove"
          }
        ]
      },
      condition: {
        urlFilter: "*",
        resourceTypes: ["main_frame"]
      }
    }
  ],
  removeRuleIds: [1]
});
