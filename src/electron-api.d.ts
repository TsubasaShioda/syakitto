export interface ElectronAPI {
  platform: NodeJS.Platform;
  isElectron: boolean;
  showNotification: (options: Electron.NotificationConstructorOptions) => void;
  updateTrayIcon: (dataUrl: string) => void;
  flashScreen: () => void;
  minimizeWindow?: () => void;
  maximizeWindow?: () => void;
  closeWindow?: () => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
