import { contextBridge, ipcRenderer } from 'electron';

// Renderer プロセスから安全に使える API を公開
contextBridge.exposeInMainWorld('electron', {
  // 将来的に IPC 通信などを追加する場合のサンプル
  // 例: 新しいウィンドウを開く
  // openSettingsWindow: () => ipcRenderer.send('open-settings-window'),

  // プラットフォーム情報
  platform: process.platform,

  // アプリがElectron環境で動作しているかの判定用
  isElectron: true,

  // 通知関連API
  showNotification: (options: Electron.NotificationConstructorOptions) => ipcRenderer.send('show-notification', options),
  updateTrayIcon: (dataUrl: string) => ipcRenderer.send('update-tray-icon', dataUrl),
  flashScreen: () => ipcRenderer.send('flash-screen'),
  showAnimationNotification: () => ipcRenderer.send('show-animation-notification'), // 画像トグルアニメーション
  showCatHandNotification: () => ipcRenderer.send('show-cat-hand-notification'),
  // showToggleNotification: () => ipcRenderer.send('show-toggle-notification'), // 削除（animationに統合）
  closeWindow: () => ipcRenderer.send('close-window'),

  // アプリ終了前のクリーンアップ通知を受け取る
  onBeforeQuit: (callback: () => void) => {
    ipcRenderer.on('before-quit-cleanup', callback);
  },
  // クリーンアップ完了を通知
  cleanupComplete: () => ipcRenderer.send('cleanup-complete'),
});
