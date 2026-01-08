export interface ElectronAPI {
  platform: NodeJS.Platform;
  isElectron: boolean;
  showNotification: (options: Electron.NotificationConstructorOptions) => void;
  updateTrayIcon: (dataUrl: string) => void;
  updatePostureScore: (score: number) => void; // <--- 追加
  showAnimationNotification: () => void;
  showCatHandNotification: () => void;
  showNoiseNotification: () => void;
  requestDimmerUpdate: (score: number) => void;
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

export interface ElectronTrayAPI {
  getSettings: () => Promise<{ notification: { all: boolean } }>;
  toggleNotifications: (enabled: boolean) => void;
  quitApp: () => void;
  // スコア更新を受け取る関数（戻り値は解除用の関数）
  onUpdatePostureScore: (callback: (score: number) => void) => () => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    electronAPI?: ElectronTimerAPI;
    trayAPI: ElectronTrayAPI;
  }
}