export const Environment =
  process.env.NODE_ENV === 'development' ? 'dev' : 'prod';

export const RootUrl =
  Environment === 'dev' ? 'http://localhost:3000' : 'https://app.mindstudio.ai';

export const StorageKeys = {
  AUTH_TOKEN: `AuthToken_${Environment}`,
} as const;
