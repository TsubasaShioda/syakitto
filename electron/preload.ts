import { contextBridge, ipcRenderer } from 'electron';

// Renderer プロセスから安全に使える API を公開
contextBridge.exposeInMainWorld('electron', {
  // プラットフォーム情報
  platform: process.platform,

  // アプリがElectron環境で動作しているかの判定用
  isElectron: true,

  // レンダラープロセスからのログをメインプロセスに送信する
  logRenderer: (message: string) => ipcRenderer.send('log-from-renderer', message),

  // 通知関連API
  showNotification: (options: Electron.NotificationConstructorOptions) => ipcRenderer.send('show-notification', options),
  updateTrayIcon: (dataUrl: string) => ipcRenderer.send('update-tray-icon', dataUrl),
  flashScreen: () => ipcRenderer.send('flash-screen'),
  showAnimationNotification: () => ipcRenderer.send('show-animation-notification'), // 画像トグルアニメーション
  showCatHandNotification: () => ipcRenderer.send('show-cat-hand-notification'),
  closeWindow: () => ipcRenderer.send('close-window'),

  // アプリ終了前のクリーンアップ通知を受け取る
  onBeforeQuit: (callback: () => void) => {
    ipcRenderer.on('before-quit-cleanup', () => {
      ipcRenderer.send('log-from-renderer', '[RENDERER] Received before-quit-cleanup event.');
      callback();
      ipcRenderer.send('log-from-renderer', '[RENDERER] Executed before-quit-cleanup callback and sending cleanupComplete.');
    });
  },
  removeOnBeforeQuit: () => {
    ipcRenderer.removeAllListeners('before-quit-cleanup');
  },
  // クリーンアップ完了を通知
  cleanupComplete: () => ipcRenderer.send('cleanup-complete'),

  // 姿勢チェックタイマー制御
  startPostureCheck: (interval: number) => ipcRenderer.send('start-posture-check', interval),
  stopPostureCheck: () => ipcRenderer.send('stop-posture-check'),
  onTriggerPostureCheck: (callback: () => void) => {
    // 既存のリスナーを削除してから新しいリスナーを登録
    ipcRenderer.removeAllListeners('trigger-posture-check');
    ipcRenderer.on('trigger-posture-check', callback);
  },
});
