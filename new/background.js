chrome.declarativeNetRequest.updateDynamicRules({
  addRules: [
    {
      id: 1,
      priority: 1,
      action: {
        type: "modifyHeaders",
        responseHeaders: [
          {
            header: "content-security-policy",
            operation: "append",
            value: "frame-src https://app.mindstudio.ai;"
          }
        ]
      },
      condition: {
        urlFilter: "*",
        resourceTypes: ["main_frame", "sub_frame"]
      }
    }
  ],
  removeRuleIds: [1] // Optional: removes any existing rule with the same ID before adding.
});
