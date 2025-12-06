export interface ElectronAPI {
  platform: NodeJS.Platform;
  isElectron: boolean;
  showNotification: (options: Electron.NotificationConstructorOptions) => void;
  updateTrayIcon: (dataUrl: string) => void;
  flashScreen: () => void;
  showAnimationNotification: () => void; // 画像トグルアニメーション
  // showToggleNotification: () => void; // 削除（animationに統合）
  showCatHandNotification: () => void;
  minimizeWindow?: () => void;
  maximizeWindow?: () => void;
  closeWindow?: () => void;
  onBeforeQuit: (callback: () => void) => void;
  removeOnBeforeQuit: (callback: () => void) => void;
  cleanupComplete: () => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
