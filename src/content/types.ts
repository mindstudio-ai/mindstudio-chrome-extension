// Consolidate all event types in one place
export interface Events {
  // Auth events
  'auth/login_completed': {
    authToken: string;
  };
  'auth/token_changed': {
    authToken: string;
  };
  'auth/login_required': undefined;

  // Player events
  'player/loaded': {
    isLoggedIn: boolean;
  };
  'player/launch_worker': WorkerLaunchPayload;
  'player/close_worker': undefined;
  'player/load_worker': {
    id: string;
    name: string;
    iconUrl: string;
    launchVariables: {
      url: string;
      rawHtml: string;
      fullText: string;
      userSelection: string | null;
    };
  };

  // Launcher events
  'launcher/loaded': undefined;
  'launcher/apps_updated': {
    apps: Array<{
      id: string;
      name: string;
      iconUrl: string;
      extensionSupportedSites: string[];
    }>;
  };

  // URL events
  'url/changed': {
    url: string;
  };
}

export interface WorkerLaunchPayload {
  id: string;
  name: string;
  iconUrl: string;
  launchVariables?: {
    url: string;
    rawHtml: string;
    fullText: string;
    userSelection: string | null;
  };
}

// Make event type a discriminated union based on the _MindStudioEvent field
export type MindStudioEvent = {
  [K in keyof Events]: {
    _MindStudioEvent: `@@mindstudio/${K}`;
    payload: Events[K];
  };
}[keyof Events];

// Type guard for initial event check
export function isMindStudioEvent(event: unknown): event is MindStudioEvent {
  return Boolean(
    event &&
      typeof event === 'object' &&
      '_MindStudioEvent' in event &&
      typeof (event as any)._MindStudioEvent === 'string',
  );
}

// Type guard for specific event types
export function isEventOfType<T extends keyof Events>(
  event: MindStudioEvent,
  type: T,
): event is Extract<
  MindStudioEvent,
  { _MindStudioEvent: `@@mindstudio/${T}` }
> {
  return event._MindStudioEvent === `@@mindstudio/${type}`;
}
