import React from "react";
import { createRoot } from "react-dom/client";
import { StyleSheetManager } from "styled-components";

import App from "./App";

const body = document.querySelector("body");

const container = document.createElement("div");
container!.style.all = "initial"; // reset container style
const rootId = "mindstudio-content-root";

container.id = rootId;

/**
 * Use Shadow DOM technique so the CSS styles are not preserved
 */
const shadowRoot = container.attachShadow({ mode: "open" });

const styleSlot = document.createElement("section");
shadowRoot.appendChild(styleSlot);

// Make sure the element that you want to mount the app to has loaded. You can
// also use `append` or insert the app using another method:
// https://developer.mozilla.org/en-US/docs/Web/API/Element#methods
//
// Also control when the content script is injected from the manifest.json:
// https://developer.chrome.com/docs/extensions/mv3/content_scripts/#run_time
if (body) {
  body.prepend(container);
}

const root = createRoot(shadowRoot);

root.render(
  <React.StrictMode>
    <StyleSheetManager target={styleSlot}>
      <style>
        {`
          * {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
          }
        `}
      </style>
      <App />
    </StyleSheetManager>
  </React.StrictMode>
);
