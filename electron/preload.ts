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
  updatePostureScore: (score: number) => ipcRenderer.send('update-posture-score', score), // <--- 追加
  flashScreen: () => ipcRenderer.send('flash-screen'),
  showAnimationNotification: () => ipcRenderer.send('show-animation-notification'), // 画像トグルアニメーション
  showCatHandNotification: () => ipcRenderer.send('show-cat-hand-notification'),
  showNoiseNotification: () => ipcRenderer.send('show-noise-notification'),
  requestDimmerUpdate: (score: number) => ipcRenderer.send('request-dimmer-update', score),
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

  // タイマーウィンドウ関連
  showTimerWindow: () => ipcRenderer.send('show-timer-window'),
  updateTimerWindow: (data: { timeLeft: number; isActive: boolean; sessionType: string }) =>
    ipcRenderer.send('update-timer-window', data),
  closeTimerWindow: () => ipcRenderer.send('close-timer-window'),
});

// タイマーウィンドウ用のAPI
contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateTimer: (callback: (data: { timeLeft: number; isActive: boolean; sessionType: string }) => void) => {
    ipcRenderer.on('update-timer', (_event, data) => callback(data));
  },
  closeTimerWindow: () => ipcRenderer.send('close-timer-window'),
});

// メニューバートレイ用のAPI
contextBridge.exposeInMainWorld('trayAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  // 通知切り替え（単純なON/OFF送信に変更）
  toggleNotifications: (enabled: boolean) => ipcRenderer.send('toggle-notifications', enabled),
  // アプリ終了
  quitApp: () => ipcRenderer.send('quit-app'),
  // ★重要：スコアの更新を受け取るリスナー
  onUpdatePostureScore: (callback: (score: number) => void) => {
    const listener = (_event: any, score: number) => callback(score);
    ipcRenderer.on('update-posture-score', listener);
    // クリーンアップ用に関数を返す
    return () => ipcRenderer.removeListener('update-posture-score', listener);
  },
});