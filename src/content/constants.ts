export const Environment =
  process.env.NODE_ENV === 'development' ? 'dev' : 'prod';

export const RootUrl =
  Environment === 'dev' ? 'http://localhost:3000' : 'https://app.mindstudio.ai';

export const StorageKeys = {
  AUTH_TOKEN: `AuthToken_${Environment}`,
} as const;

export const Events = {
  LOADED: 'loaded',
  AUTHENTICATED: 'authenticated',
  SIZE_UPDATED: 'size_updated',
  LAUNCH_WORKER: 'launch_worker',
  PLAYER_LOADED: 'player/loaded',
  CLOSE_WORKER: 'player/close_worker',
} as const;

export const Actions = {
  AUTH_TOKEN_CHANGED: 'auth_token_changed',
  LOGIN_REQUIRED: 'login_required',
  URL_CHANGED: 'url_changed',
  LOAD_WORKER: 'load_worker',
} as const;
