import type {
  JulesSourcesResponse,
  JulesSession,
  JulesSessionsResponse,
  ListActivitiesResponse,
  CreateSessionRequest,
} from '../types/jules';

export const julesService = {
  // Sources
  getSources: (): Promise<JulesSourcesResponse> =>
    window.electronAPI.getJulesSources(),

  // Sessions
  listSessions: (): Promise<JulesSessionsResponse> =>
    window.electronAPI.listJulesSessions(),

  getSession: (sessionName: string): Promise<JulesSession> =>
    window.electronAPI.getJulesSession(sessionName),

  createSession: (opts: CreateSessionRequest): Promise<JulesSession> =>
    window.electronAPI.createJulesSession(opts),

  // Activités
  listActivities: (sessionName: string): Promise<ListActivitiesResponse> =>
    window.electronAPI.listJulesActivities(sessionName),

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
};
