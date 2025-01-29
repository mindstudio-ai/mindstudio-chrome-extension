import { storage } from './storage';
import { runtime, frame } from './messaging';
import { RootUrl } from '../constants';

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
  frame.listen('auth/token_generated', async ({ token }) => {
    if (!token) {
      return;
    }

    // Forward token to background
    await runtime.send('auth/token_generated', { token });

    // Close window after delay
    setTimeout(() => window.close(), 1000);
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

    window.open(
      `${RootUrl}/_extension/login?__displayContext=extension`,
      '_blank',
    );
  },

  async logout(): Promise<void> {
    await storage.set('LAUNCHER_COLLAPSED', true);
    await storage.remove(['AUTH_TOKEN', 'LAUNCHER_APPS']);
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
