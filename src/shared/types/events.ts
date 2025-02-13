import { AppData } from './app';
import { OrganizationData } from './organization';

// Consolidate all event types in one place
export interface Events {
  'auth/token_changed': {
    authToken: string;
    organizationId: string;
  };
  'auth/login_completed': {
    token: string;
    organizations: Array<OrganizationData>;
  };
  'auth/organization_id_changed': {
    organizationId: string;
  };

  // Player events
  'player/launch_worker': BaseWorkerPayload;

  // History events
  'remote/loaded': void;
  'remote/navigate/app': {
    appId: string;
  };
  'remote/navigate/root': undefined;
  'remote/request_launch_variables': undefined;
  'remote/resolved_launch_variables': {
    launchVariables: LaunchVariables;
  };

  // Launcher events
  'launcher/loaded': undefined;
  'launcher/apps_updated': {
    apps: Array<AppData>;
  };
  'launcher/resolved_launch_variables': {
    launchVariables: LaunchVariables;
  };

  // Settings events
  'settings/open': undefined;

  // Sidepanel events
  'sidepanel/open': undefined;
}

export interface LaunchVariables {
  url: string;
  rawHtml: string;
  fullText: string;
  metadata: string;
  userSelection: string | null;
}

export const getEmptyLaunchVariables = (): LaunchVariables => ({
  url: '',
  rawHtml: '',
  fullText: '',
  metadata: '',
  userSelection: null,
});

// Base worker payload without tabId
export interface BaseWorkerPayload {
  appId: string;
}

// Full worker payload with tabId (used internally)
export interface WorkerLaunchPayload extends BaseWorkerPayload {
  tabId: number;
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
