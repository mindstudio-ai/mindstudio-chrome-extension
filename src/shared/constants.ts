export const Environment =
  process.env.NODE_ENV === 'development' ? 'dev' : 'prod';

export const RootUrl =
  Environment === 'dev' ? 'http://localhost:3000' : 'https://app.mindstudio.ai';

export const ApiUrl =
  Environment === 'dev' ? 'http://localhost:3129' : 'https://api.mindstudio.ai';

export const THANK_YOU_PAGE = `${RootUrl}/extension/thank-you`;

export const QueryParams = {
  VERSION: '__ext_version',
} as const;

export const ZIndexes = {
  FLOATING_BUTTON: 999997,
  LAUNCHER: 999999,
  PLAYER: 999998,
  AUTH: 999998,
} as const;

export const MINDSTUDIO_ID_PREFIX = '__MindStudioExtension_';

// Add frame dimensions
export const FrameDimensions = {
  LAUNCHER: {
    VISUAL_WIDTH: 40,
    TOTAL_WIDTH: 340, // 40px visible + 300px for tooltip
  },
} as const;

export const DefaultIcons = {
  WORKSPACE:
    'https://images.mindstudio-cdn.com/images/a47f3f3a-a1fa-41ca-8de3-e415452b4611_1731693706328.png?w=120&fm=auto',
  APP: 'https://images.mindstudio-cdn.com/images/a47f3f3a-a1fa-41ca-8de3-e415452b4611_1731686870175.png',
} as const;
