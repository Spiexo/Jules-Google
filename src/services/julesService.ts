import type {
  JulesSourcesResponse,
  JulesSession,
  JulesSessionsResponse,
  ListActivitiesResponse,
  CreateSessionRequest,
  LocalSession,
  LogEntry,
} from '../types/jules';

export const julesService = {
  // Sources
  getSources: (): Promise<JulesSourcesResponse> =>
    window.electronAPI.getJulesSources(),

  // Sessions
  listSessions: (pageToken?: string): Promise<JulesSessionsResponse> =>
    window.electronAPI.listJulesSessions(pageToken),

  getSession: (sessionName: string): Promise<JulesSession> =>
    window.electronAPI.getJulesSession(sessionName),

  createSession: (opts: CreateSessionRequest): Promise<JulesSession> =>
    window.electronAPI.createJulesSession(opts),

  // Activités
  listActivities: (sessionName: string, pageToken?: string): Promise<ListActivitiesResponse> =>
    window.electronAPI.listJulesActivities(sessionName, pageToken),

  // Actions
  sendMessage: (sessionName: string, prompt: string): Promise<void> =>
    window.electronAPI.sendJulesMessage(sessionName, prompt),

  approvePlan: (sessionName: string): Promise<void> =>
    window.electronAPI.approveJulesPlan(sessionName),

  // Système
  openExternal: (url: string): Promise<void> =>
    window.electronAPI.openExternal(url),

  notify: (title: string, body: string): Promise<void> =>
    window.electronAPI.notify(title, body),

  openImageDialog: (): Promise<{ name: string; preview: string } | null> =>
    window.electronAPI.openImageDialog(),

  // Persistance locale
  readSessions: (): Promise<LocalSession[]> =>
    window.electronAPI.readSessions(),

  writeSessions: (sessions: LocalSession[]): Promise<void> =>
    window.electronAPI.writeSessions(sessions),

  readLogs: (): Promise<LogEntry[]> =>
    window.electronAPI.readLogs(),

  appendLog: (entry: LogEntry): Promise<void> =>
    window.electronAPI.appendLog(entry),

  readPrefs: (): Promise<Record<string, unknown>> =>
    window.electronAPI.readPrefs(),

  writePrefs: (prefs: Record<string, unknown>): Promise<void> =>
    window.electronAPI.writePrefs(prefs),
};
