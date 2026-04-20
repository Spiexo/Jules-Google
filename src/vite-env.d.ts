/// <reference types="vite/client" />
declare module "*.css";

interface Window {
  electronAPI: {
    ping: () => Promise<string>;
    getJulesSources: () => Promise<any>;
    createJulesSession: (sourceName: string) => Promise<any>;
  };
}
