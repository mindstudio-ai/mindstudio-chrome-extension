export interface MindStudioEvent {
  _MindStudioEvent: string;
  payload: any;
}

export interface LaunchVariables {
  url: string;
  rawHtml: string;
  fullText: string;
  userSelection: string | null;
}

export type EventHandler = (payload: any) => void | Promise<void>;
