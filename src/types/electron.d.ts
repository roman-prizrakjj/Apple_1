export interface ElectronAPI {
  sendScreenChange: (screenName: 'start' | 'menu') => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
