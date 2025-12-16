export interface ElectronAPI {
  platform: NodeJS.Platform;
  isElectron: boolean;
  showNotification: (options: Electron.NotificationConstructorOptions) => void;
  updateTrayIcon: (dataUrl: string) => void;
  flashScreen: () => void;
  showAnimationNotification: () => void;
  showCatHandNotification: () => void;
  minimizeWindow?: () => void;
  maximizeWindow?: () => void;
  closeWindow?: () => void;
  onBeforeQuit: (callback: () => void) => void;
  removeOnBeforeQuit: () => void;
  cleanupComplete: () => void;
  startPostureCheck: (interval: number) => void;
  stopPostureCheck: () => void;
  onTriggerPostureCheck: (callback: () => void) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}