export const Environment =
  process.env.NODE_ENV === 'development' ? 'dev' : 'prod';

export const RootUrl =
  Environment === 'dev' ? 'http://localhost:3000' : 'https://app.mindstudio.ai';

export const THANK_YOU_PAGE = 'https://www.mindstudio.ai/extension/thank-you';

export const StorageKeys = {
  AUTH_TOKEN: `AuthToken_${Environment}`,
  LAUNCHER_COLLAPSED: `LauncherCollapsed_${Environment}`,
  LAUNCHER_APPS: `LauncherApps_${Environment}`,
  SELECTED_ORGANIZATION: `SelectedOrganization_${Environment}`,
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
