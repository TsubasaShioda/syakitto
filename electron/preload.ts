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
  closeWindow: () => ipcRenderer.send('close-window'),
});
