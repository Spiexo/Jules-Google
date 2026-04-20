import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  getJulesSources: () => ipcRenderer.invoke('jules:get-sources'),
  createJulesSession: (sourceName: string) => ipcRenderer.invoke('jules:create-session', sourceName),
});
