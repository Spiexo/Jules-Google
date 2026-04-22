import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  // Clé API
  saveApiKey:  (key: string) => ipcRenderer.invoke('auth:save-key', key),
  hasApiKey:   ()            => ipcRenderer.invoke('auth:has-key'),
  clearApiKey: ()            => ipcRenderer.invoke('auth:clear-key'),
  // Jules — Sources & Sessions
  getJulesSources:    ()           => ipcRenderer.invoke('jules:get-sources'),
  listJulesSessions:  ()           => ipcRenderer.invoke('jules:list-sessions'),
  getJulesSession:    (name: string) => ipcRenderer.invoke('jules:get-session', name),
  createJulesSession: (opts: any)    => ipcRenderer.invoke('jules:create-session', opts),
  // Jules — Activités & Actions
  listJulesActivities: (sessionName: string)                 => ipcRenderer.invoke('jules:list-activities', sessionName),
  sendJulesMessage:    (sessionName: string, prompt: string) => ipcRenderer.invoke('jules:send-message', sessionName, prompt),
  approveJulesPlan:    (sessionName: string)                 => ipcRenderer.invoke('jules:approve-plan', sessionName),
  // Système
  openExternal: (url: string)                 => ipcRenderer.invoke('shell:open-external', url),
  notify:       (title: string, body: string) => ipcRenderer.invoke('app:notify', title, body),
  // Persistance locale
  readSessions:   ()                       => ipcRenderer.invoke('store:read-sessions'),
  writeSessions:  (sessions: unknown[])    => ipcRenderer.invoke('store:write-sessions', sessions),
  readLogs:       ()                       => ipcRenderer.invoke('store:read-logs'),
  appendLog:      (entry: unknown)         => ipcRenderer.invoke('store:append-log', entry),
});
