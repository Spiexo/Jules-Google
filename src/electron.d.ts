import type {
  JulesSourcesResponse,
  JulesSession,
  JulesSessionsResponse,
  ListActivitiesResponse,
  CreateSessionRequest,
} from './types/jules';

declare global {
  interface Window {
    electronAPI: {
      ping: () => Promise<string>;
      // Clé API
      saveApiKey:  (key: string) => Promise<void>;
      hasApiKey:   ()            => Promise<boolean>;
      clearApiKey: ()            => Promise<void>;
      // Jules — Sources & Sessions
      getJulesSources:    ()                              => Promise<JulesSourcesResponse>;
      listJulesSessions:  ()                              => Promise<JulesSessionsResponse>;
      getJulesSession:    (name: string)                  => Promise<JulesSession>;
      createJulesSession: (opts: CreateSessionRequest)    => Promise<JulesSession>;
      // Jules — Activités & Actions
      listJulesActivities: (sessionName: string)                  => Promise<ListActivitiesResponse>;
      sendJulesMessage:    (sessionName: string, prompt: string)   => Promise<void>;
      approveJulesPlan:    (sessionName: string)                   => Promise<void>;
      // Système
      openExternal: (url: string)                  => Promise<void>;
      notify:       (title: string, body: string)  => Promise<void>;
    };
  }
}

export {};
