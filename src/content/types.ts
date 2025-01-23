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

  // Launcher events
  'launcher/loaded': {
    isLoggedIn: boolean;
  };
  'launcher/size_updated': {
    width: number;
    height: number;
  };
  'launcher/collapse': undefined;

  // Player events
  'player/loaded': {
    isLoggedIn: boolean;
  };
  'player/launch_worker': {
    id: string;
    name: string;
    iconUrl: string;
  };
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

  // URL events
  'url/changed': {
    url: string;
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
