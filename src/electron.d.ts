import type {
  JulesSourcesResponse,
  JulesSession,
  JulesSessionsResponse,
  ListActivitiesResponse,
  CreateSessionRequest,
  LocalSession,
  LogEntry,
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
      listJulesSessions:  (pageToken?: string)             => Promise<JulesSessionsResponse>;
      getJulesSession:    (name: string)                  => Promise<JulesSession>;
      createJulesSession: (opts: CreateSessionRequest)    => Promise<JulesSession>;
      // Jules — Activités & Actions
      listJulesActivities: (sessionName: string, pageToken?: string) => Promise<ListActivitiesResponse>;
      sendJulesMessage:    (sessionName: string, prompt: string)   => Promise<void>;
      approveJulesPlan:    (sessionName: string)                   => Promise<void>;
      // Système
      openExternal: (url: string)                  => Promise<void>;
      notify:       (title: string, body: string)  => Promise<void>;
      openImageDialog: ()                          => Promise<{ name: string; preview: string } | null>;
      // Persistance locale
      readSessions:  ()                        => Promise<LocalSession[]>;
      writeSessions: (sessions: LocalSession[]) => Promise<void>;
      readLogs:      ()                        => Promise<LogEntry[]>;
      appendLog:     (entry: LogEntry)         => Promise<void>;
      readPrefs:     ()                        => Promise<Record<string, unknown>>;
      writePrefs:    (prefs: Record<string, unknown>) => Promise<void>;
    };
  }
}

export {};
