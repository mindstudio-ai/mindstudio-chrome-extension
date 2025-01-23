export const Environment =
  process.env.NODE_ENV === 'development' ? 'dev' : 'prod';

export const RootUrl =
  Environment === 'dev' ? 'http://localhost:3000' : 'https://app.mindstudio.ai';

export const StorageKeys = {
  AUTH_TOKEN: `AuthToken_${Environment}`,
  LAUNCHER_COLLAPSED: `LauncherCollapsed_${Environment}`,
} as const;

export const ZIndexes = {
  FLOATING_BUTTON: 999997,
  LAUNCHER: 999998,
  PLAYER: 999998,
  AUTH: 999998,
} as const;

export const ElementIds = {
  FLOATING_BUTTON: '__MindStudioFloatingButton',
  LAUNCHER: '__MindStudioLauncher',
  PLAYER: '__MindStudioPlayer',
  AUTH: '__MindStudioAuth',
} as const;

// Add frame dimensions
export const FrameDimensions = {
  LAUNCHER: {
    WIDTH: 40,
  },
  PLAYER: {
    WIDTH: 440,
  },
} as const;
