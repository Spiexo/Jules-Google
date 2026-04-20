interface Window {
  electronAPI: {
    ping: () => Promise<string>;
  };
}
