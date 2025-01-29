export const Environment =
  process.env.NODE_ENV === 'development' ? 'dev' : 'prod';

export const RootUrl =
  Environment === 'dev' ? 'http://localhost:3000' : 'https://app.mindstudio.ai';

export const THANK_YOU_PAGE = 'https://www.mindstudio.ai/extension/thank-you';

// Storage keys with their environment suffix
const createStorageKey = (key: string) => `${key}_${Environment}` as const;

export const StorageKeys = {
  AUTH_TOKEN: createStorageKey('AuthToken'),
  LAUNCHER_COLLAPSED: createStorageKey('LauncherCollapsed'),
  LAUNCHER_APPS: createStorageKey('LauncherApps'),
} as const;

export const ZIndexes = {
  FLOATING_BUTTON: 999997,
  LAUNCHER: 999999,
  PLAYER: 999998,
  AUTH: 999998,
} as const;

export const ElementIds = {
  FLOATING_BUTTON: '__MindStudioFloatingButton',
  LAUNCHER: '__MindStudioLauncher',
  PLAYER: '__MindStudioPlayer',
  AUTH: '__MindStudioAuth',
  CONTENT_WRAPPER: '__MindStudioContentWrapper',
  LAUNCHER_SYNC: '__MindStudioLauncherSync',
} as const;

// Add frame dimensions
export const FrameDimensions = {
  LAUNCHER: {
    VISUAL_WIDTH: 40,
    TOTAL_WIDTH: 340, // 40px visible + 300px for tooltip
  },
  PLAYER: {
    WIDTH: 440,
  },
  AUTH: {
    WIDTH: 440,
  },
} as const;
