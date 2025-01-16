const Events = {
  LOADED: 'loaded',
  AUTHENTICATED: 'authenticated',
  SIZE_UPDATED: 'size_updated',
  LAUNCH_WORKER: 'launch_worker',
  PLAYER_LOADED: 'player/loaded',
  CLOSE_WORKER: 'player/close_worker'
};

const Actions = {
  AUTH_TOKEN_CHANGED: 'auth_token_changed',
  LOGIN_REQUIRED: 'login_required',
  URL_CHANGED: 'url_changed',
  LOAD_WORKER: 'load_worker',
};

// Create the launcher iframe
const launcherFrame = document.createElement('iframe');
launcherFrame.src = 'http://localhost:3000/_extension/launcher';
launcherFrame.id = '__MindStudioLauncher';
launcherFrame.style = `
  position: fixed;
  bottom: 64px;
  right: 0px;
  width: 0;
  height: 0;
  border: none;
  z-index: 10000;
  background: transparent;
`;

const currentPageIsMindStudio = (
  window.top.location.host === 'app.mindstudio.ai' ||
  window.top.location.host === 'localhost:3000'
);
if (currentPageIsMindStudio) {
  launcherFrame.style += `display: none; width: 0; height: 0;`;
}
document.body.appendChild(launcherFrame);

// Create the player frame
const playerFrame = document.createElement('iframe');
playerFrame.src = 'http://localhost:3000/_extension/player';
playerFrame.id = '__MindStudioPlayer';
playerFrame.style = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  border: none;
  z-index: 10000;
  background: transparent;
  display: none;
  opacity: 0;
`;
document.body.appendChild(playerFrame);

// Send a message to the launcher iframe
const sendMessageToLauncher = (event, payload = {}) => {
  try {
    document.getElementById('__MindStudioLauncher').contentWindow.postMessage({
      _MindStudioEvent: `@@mindstudio/${event}`,
      payload,
    }, '*');
  } catch (err) {
    console.log(err);
  }
};

// Send a message to the player iframe
const sendMessageToPlayer = (event, payload = {}) => {
  try {
    document.getElementById('__MindStudioPlayer').contentWindow.postMessage({
      _MindStudioEvent: `@@mindstudio/player/${event}`,
      payload,
    }, '*');
  } catch (err) {
    console.log(err);
  }
};

// Send the current URL to the launcher iframe
const sendCurrentUrl = () => {
  sendMessageToLauncher(Actions.URL_CHANGED, { url: window.location.href });
}

// Attempt to clean the raw HTML of the page
const cleanDOM = () => {
  // Clone the document body
  const clone = document.body.cloneNode(true);

  // Recursive function to clean elements
  const cleanNode = (node) => {
    // Remove unimportant tags
    const tagsToRemove = ['script', 'iframe', 'svg'];
    if (node.tagName) {
      if (tagsToRemove.includes(node.tagName.toLowerCase())) {
        node.remove();
      }
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      // Remove all attributes
      for (const attr of [...node.attributes]) {
        if (['href', 'src', 'alt', 'title'].includes(attr.name)) {
          continue; // Keep essential attributes
        }
        node.removeAttribute(attr.name);
      }
    }

    // Recurse through child nodes
    for (const child of [...node.childNodes]) {
      cleanNode(child);
    }
  };

  cleanNode(clone);

  // Return the serialized HTML
  return clone.innerHTML;
};

// Attempt to get any text the user currently has selected
const getSelectedContent = () => {
  try {
    const selection = window.getSelection();

    if (!selection.rangeCount) {
      return null; // No selection
    }

    // Get the range of the selection
    const range = selection.getRangeAt(0);

    // Check if the selection is within a form field
    const activeElement = document.activeElement;
    if (activeElement &&
        (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
      // Return the selected text from the form field
      const start = activeElement.selectionStart;
      const end = activeElement.selectionEnd;
      return activeElement.value.substring(start, end);
    }

    // Otherwise, return the selected text as HTML
    const container = document.createElement('div');
    container.appendChild(range.cloneContents());
    return container.innerHTML; // Preserves the HTML structure of the selection
  } catch (err) {
    return '';
  }
};

// Listen for messages from the iframe
window.addEventListener('message', ({ data }) => {
  try {
    if (data._MindStudioEvent) {
      const eventName = data._MindStudioEvent.replace(
        '@@mindstudio/',
        ''
      );
      const { payload } = data;

      if (eventName === Events.LOADED) {
        const { isLoggedIn } = payload;
        if (!isLoggedIn) {
          // See if we have an auth token. If we do, send it. Otherwise, send a
          // "no token" state
          chrome.storage.local.get('authToken', (result) => {
            if (result.authToken) {
              sendMessageToLauncher(Actions.AUTH_TOKEN_CHANGED, { authToken: result.authToken });
            } else {
              sendMessageToLauncher(Actions.LOGIN_REQUIRED);
            }
          });
        }

        sendCurrentUrl();
      }

      if (eventName === Events.AUTHENTICATED) {
        if (payload.authToken) {
          chrome.storage.local.set({ authToken: payload.authToken }, () => {
            launcherFrame.src += ''; // Trigger iframe reload
            playerFrame.src += ''; // Trigger iframe reload
          });
        }
      }

      if (eventName === Events.SIZE_UPDATED) {
        const { width, height } = payload;
        document.getElementById('__MindStudioLauncher').style.width = `${width}px`;
        document.getElementById('__MindStudioLauncher').style.height = `${height}px`;
      }

      if (eventName === Events.LAUNCH_WORKER) {
        const { id, name, iconUrl } = payload;
        sendMessageToPlayer(Actions.LOAD_WORKER, {
          id,
          name,
          iconUrl,
          launchVariables: {
            url: window.location.href,
            rawHtml: cleanDOM(),
            fullText: document.body.innerText,
            userSelection: getSelectedContent(),
          },
        });
        playerFrame.style.display = 'block';
        playerFrame.style.opacity = '1';
      }

      if (eventName === Events.PLAYER_LOADED) {
        const { isLoggedIn } = payload;
        if (!isLoggedIn) {
          // See if we have an auth token. If we do, send it. Otherwise, send a
          // "no token" state
          chrome.storage.local.get('authToken', (result) => {
            if (result.authToken) {
              sendMessageToPlayer(Actions.AUTH_TOKEN_CHANGED, { authToken: result.authToken });
            } else {
              sendMessageToPlayer(Actions.LOGIN_REQUIRED);
            }
          });
        }
      }

      if (eventName === Events.CLOSE_WORKER) {
        playerFrame.style.display = 'none';
        playerFrame.style.opacity = '0';
      }
    }
  } catch (err) {
    console.log('[MindStudio Extension]', err);
  }
});

// Listen for changes in the page URL and keep track of the current URL. Is
// there really no better way of doing this in 2025? Crazy!
window.__MindStudio_CurrentURL = window.location.href;
setInterval(() => {
  if (location.href !== window.__MindStudio_CurrentURL) {
    window.__MindStudio_CurrentURL = location.href;
    sendCurrentUrl();
  }
}, 500);
