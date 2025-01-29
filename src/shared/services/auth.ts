import { RootUrl } from '../constants';
import { frame } from './messaging';
import { storage } from './storage';

type LoginHandler = (token: string) => void | Promise<void>;

// Private state (module scope)
const loginCompletionHandlers: Set<LoginHandler> = new Set();

// Setup storage listener only once
let isStorageListenerInitialized = false;
function initializeStorageListener() {
  if (isStorageListenerInitialized) {
    return;
  }
  isStorageListenerInitialized = true;

  // Listen for token changes
  storage.onChange('AUTH_TOKEN', async (token) => {
    if (!token) {
      return;
    }

    // Expand launcher on successful login
    await storage.set('LAUNCHER_COLLAPSED', false);

    // Notify handlers
    for (const handler of loginCompletionHandlers) {
      try {
        await handler(token);
      } catch (error) {
        console.error('[Auth] Error in completion handler:', error);
      }
    }
  });
}

// Setup frame listener immediately if we're in the login window
if (window.location.pathname === '/_extension/login') {
  frame.listen('auth/login_completed', async ({ token, organizations }) => {
    if (!token) {
      return;
    }

    console.info('[MindStudio][Auth] Login completed, storing credentials');
    storage.set('AUTH_TOKEN', token);
    storage.set('ORGANIZATIONS', organizations);

    // Handle organization selection
    const currentSelectedOrg = await storage.get('SELECTED_ORGANIZATION');
    if (organizations.length === 0) {
      // Reset selection if there are no organizations
      await storage.remove(['SELECTED_ORGANIZATION']);
    } else if (currentSelectedOrg) {
      // Check if the currently selected org still exists in the new list
      const orgExists = organizations.some(
        (org) => org.id === currentSelectedOrg,
      );
      if (!orgExists) {
        // If not, select the first organization
        console.info(
          '[MindStudio][Auth] Updating to first available organization',
        );
        await storage.set('SELECTED_ORGANIZATION', organizations[0].id);
      }
    } else {
      // If no organization was selected before, select the first one
      console.info('[MindStudio][Auth] Setting initial organization');
      await storage.set('SELECTED_ORGANIZATION', organizations[0].id);
    }

    // Close window after delay
    setTimeout(() => window.close(), 3000);
  });
}

export const auth = {
  async getToken(): Promise<string | null> {
    return storage.get('AUTH_TOKEN');
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  },

  async login(): Promise<void> {
    // Only need storage listener for completion handlers
    initializeStorageListener();
    console.info('[MindStudio][Auth] Opening login window');
    window.open(
      `${RootUrl}/_extension/login?__displayContext=extension`,
      '_blank',
    );
  },

  async logout(): Promise<void> {
    console.info('[MindStudio][Auth] Logging out');
    await storage.set('LAUNCHER_COLLAPSED', true);
    await storage.remove(['AUTH_TOKEN', 'LAUNCHER_APPS', 'ORGANIZATIONS']);
  },

  onLoginComplete(handler: LoginHandler): () => void {
    // Need storage listener for completion handlers
    initializeStorageListener();

    loginCompletionHandlers.add(handler);
    return () => {
      loginCompletionHandlers.delete(handler);
    };
  },

  async ensureAuthenticated(): Promise<string> {
    // Need storage listener for completion handlers
    initializeStorageListener();

    const token = await this.getToken();
    if (!token) {
      return new Promise((resolve) => {
        const handler = (newToken: string) => {
          loginCompletionHandlers.delete(handler);
          resolve(newToken);
        };

        loginCompletionHandlers.add(handler);
        this.login();
      });
    }
    return token;
  },
};
