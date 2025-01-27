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
  'auth/token_generated': {
    token: string;
  };
  'auth/state_changed': undefined;

  // Player events
  'player/loaded': void;
  'player/launch_worker': WorkerLaunchPayload;
  'player/init': WorkerLaunchPayload;
  'player/close_worker': void;
  'player/load_worker': {
    id: string;
    name: string;
    iconUrl: string;
    launchVariables: Record<string, any>;
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
  appId: string;
  appName: string;
  appIcon: string;
}

export interface WorkerLaunchData {
  appId: string;
  appName: string;
  appIcon: string;
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
