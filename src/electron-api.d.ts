export interface ElectronAPI {
  platform: NodeJS.Platform;
  isElectron: boolean;
  showNotification: (options: Electron.NotificationConstructorOptions) => void;
  updateTrayIcon: (dataUrl: string) => void;
  updatePostureScore: (score: number) => void; // <--- 追加
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
  showTimerWindow: () => void;
  updateTimerWindow: (data: { timeLeft: number; isActive: boolean; sessionType: string }) => void;
  closeTimerWindow: () => void;
}

export interface ElectronTimerAPI {
  onUpdateTimer: (callback: (data: { timeLeft: number; isActive: boolean; sessionType: string }) => void) => void;
  closeTimerWindow: () => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    electronAPI?: ElectronTimerAPI;
  }
}