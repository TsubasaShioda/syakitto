import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { Settings } from '@/types/electron-api.d';

/**
 * @module preload
 * @description Electronのメインプロセスとレンダラープロセス間の安全な通信ブリッジを定義します。
 * `contextBridge`を使用して、レンダラーの`window`オブジェクトに安全なAPIを公開します。
 */

/**
 * @global
 * @interface ElectronAPI
 * @description メインのレンダラープロセス（UI）向けに公開されるAPIです。
 * アプリケーションのコア機能へのアクセスを提供します。
 */
contextBridge.exposeInMainWorld('electron', {
  /**
   * 現在のOSプラットフォーム名（'darwin', 'win32', 'linux'など）
   * @type {string}
   */
  platform: process.platform,

  /**
   * アプリケーションがElectron環境で実行されているかどうかを示すブール値。
   * @type {boolean}
   */
  isElectron: true,

  /**
   * メインプロセスからアプリケーション設定を非同期に取得します。
   * @returns {Promise<Settings>} 現在の設定オブジェクト。
   */
  getSettings: (): Promise<Settings> => ipcRenderer.invoke('get-settings'),

  /**
   * 部分的な設定オブジェクトをメインプロセスに送信して保存します。
   * @param {Partial<Settings>} settings - 保存したい設定のキーと値。
   * @returns {Promise<void>}
   */
  saveSettings: (settings: Partial<Settings>): Promise<void> => ipcRenderer.invoke('save-settings', settings),

  /**
   * レンダラープロセスからのログメッセージをメインプロセスに送信します。
   * @param {string} message - ログに記録するメッセージ。
   */
  logRenderer: (message: string) => ipcRenderer.send('log-from-renderer', message),
  
  /**
   * OS標準のデスクトップ通知を表示するようメインプロセスに要求します。
   * @param {Electron.NotificationConstructorOptions} options - 通知のタイトル、本文などのオプション。
   */
  showNotification: (options: Electron.NotificationConstructorOptions) => ipcRenderer.send('show-notification', options),
  
  /**
   * 姿勢スコアをメインプロセスに送信して、システムトレイのアイコンを更新します。
   * @param {number} score - 0から100の間の姿勢スコア。
   */
  updatePostureScore: (score: number) => ipcRenderer.send('update-posture-score', score),

  /**
   * 指定されたタイプのアニメーション通知を表示するようメインプロセスに要求します。
   * @param {'toggle' | 'cat_hand' | 'noise' | 'switch'} type - 表示するアニメーションの種類。
   */
  showAnimationNotification: (type: 'toggle' | 'cat_hand' | 'noise' | 'switch', switchType?: 'on' | 'off') => {
    switch (type) {
      case 'toggle':
        ipcRenderer.send('show-animation-notification');
        break;
      case 'cat_hand':
        ipcRenderer.send('show-cat-hand-notification');
        break;
      case 'noise':
        ipcRenderer.send('show-noise-notification');
        break;
      case 'switch':
        ipcRenderer.send('show-switch-notification', switchType);
        break;
    }
  },

  /**
   * 画面を薄暗くするオーバーレイの不透明度を更新するようメインプロセスに要求します。
   * @param {number} score - 姿勢スコア。スコアが高いほど画面が暗くなります。
   */
  requestDimmerUpdate: (score: number) => ipcRenderer.send('request-dimmer-update', score),
  
  /**
   * アプリケーション終了前のクリーンアップ処理を行うコールバックを登録します。
   * @param {() => void} callback - メインプロセスから終了シグナルを受け取ったときに実行される関数。
   */
  onBeforeQuit: (callback: () => void) => {
    ipcRenderer.on('before-quit-cleanup', callback);
  },

  /**
   * `onBeforeQuit`で登録したコールバックを削除します。
   */
  removeOnBeforeQuit: () => {
    ipcRenderer.removeAllListeners('before-quit-cleanup');
  },
  
  /**
   * レンダラープロセスでのクリーンアップが完了したことをメインプロセスに通知します。
   */
  cleanupComplete: () => ipcRenderer.send('cleanup-complete'),

  /**
   * 定期的な姿勢チェックを開始するようメインプロセスに要求します。
   * @param {number} interval - チェック間隔（ミリ秒）。
   */
  startPostureCheck: (interval: number) => ipcRenderer.send('start-posture-check', interval),
  
  /**
   * 定期的な姿勢チェックを停止するようメインプロセスに要求します。
   */
  stopPostureCheck: () => ipcRenderer.send('stop-posture-check'),
  
  /**
   * メインプロセスからの姿勢チェック要求をリッスンするコールバックを登録します。
   * @param {() => void} callback - 姿勢チェックをトリガーする際に実行される関数。
   */
  onTriggerPostureCheck: (callback: () => void) => {
    ipcRenderer.removeAllListeners('trigger-posture-check');
    ipcRenderer.on('trigger-posture-check', callback);
  },

  /**
   * ポモドーロタイマー用のオーバーレイウィンドウを表示します。
   */
  showTimerWindow: () => ipcRenderer.send('show-timer-window'),
  
  /**
   * タイマーウィンドウの表示内容を更新します。
   * @param {{ timeLeft: number; isActive: boolean; sessionType: string }} data - タイマーの状態データ。
   */
  updateTimerWindow: (data: { timeLeft: number; isActive: boolean; sessionType: string }) =>
    ipcRenderer.send('update-timer-window', data),
  
  /**
   * タイマーウィンドウを閉じます。
   */
  closeTimerWindow: () => ipcRenderer.send('close-timer-window'),

  /**
   * タイマーウィンドウからの再生/停止トグルイベントをリッスンするコールバックを登録します。
   * @param {() => void} callback - イベント受信時に実行される関数。
   */
  onToggleTimerFromWindow: (callback: () => void) => {
    ipcRenderer.removeAllListeners('toggle-timer-from-window');
    ipcRenderer.on('toggle-timer-from-window', callback);
  },
  
  /**
   * タイマーウィンドウからのリセットイベントをリッスンするコールバックを登録します。
   * @param {() => void} callback - イベント受信時に実行される関数。
   */
  onResetTimerFromWindow: (callback: () => void) => {
    ipcRenderer.removeAllListeners('reset-timer-from-window');
    ipcRenderer.on('reset-timer-from-window', callback);
  },
});

/**
 * @global
 * @interface ElectronAPIForOverlays
 * @description 各種オーバーレイウィンドウ（タイマー、アニメーションなど）向けに公開される、より限定的なAPIです。
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * タイマー情報の更新を受け取るコールバックを登録します。
   * @param {(data: { timeLeft: number; isActive: boolean; sessionType: string }) => void} callback - タイマーデータ受信時に実行される関数。
   */
  onUpdateTimer: (callback: (data: { timeLeft: number; isActive: boolean; sessionType: string }) => void) => {
    ipcRenderer.on('update-timer', (_event, data) => callback(data));
  },
  /**
   * スイッチアニメーション用の画像パスを受け取るコールバックを登録します。
   * @param {(imagePath: string) => void} callback - 画像パス受信時に実行される関数。
   */
  onSwitchType: (callback: (imagePath: string) => void) => {
    ipcRenderer.on('switch-type', (_event, imagePath) => callback(imagePath));
  },
  /**
   * メインプロセスにタイマーの再生/停止を要求します。
   */
  toggleTimer: () => ipcRenderer.send('toggle-timer'),
  /**
   * メインプロセスにタイマーのリセットを要求します。
   */
  resetTimer: () => ipcRenderer.send('reset-timer'),
});

/**
 * @global
 * @interface TrayAPI
 * @description システムトレイのメニューウィンドウ向けに公開されるAPIです。
 */
contextBridge.exposeInMainWorld('trayAPI', {
  /**
   * 全ての通知の有効/無効を切り替えるようメインプロセスに要求します。
   * @param {boolean} enabled - 通知を有効にする場合はtrue、無効にする場合はfalse。
   */
  toggleNotifications: (enabled: boolean) => ipcRenderer.send('toggle-notifications', enabled),
  /**
   * アプリケーションを終了するようメインプロセスに要求します。
   */
  quitApp: () => ipcRenderer.send('quit-app'),
  /**
   * 姿勢スコアの更新をリッスンするコールバックを登録します。
   * @param {(score: number) => void} callback - スコア更新時に実行される関数。
   * @returns {() => void} 登録解除用のクリーンアップ関数。
   */
  onUpdatePostureScore: (callback: (score: number) => void) => {
    const listener = (_event: IpcRendererEvent, score: number) => callback(score);
    ipcRenderer.on('update-posture-score', listener);
    return () => ipcRenderer.removeListener('update-posture-score', listener);
  },
  /**
   * メインプロセスからの設定更新イベントをリッスンするコールバックを登録します。
   * @param {(settings: Settings) => void} callback - 設定更新時に実行される関数。
   */
  onSettingsUpdated: (callback: (settings: Settings) => void) => {
    const listener = (_event: IpcRendererEvent, settings: Settings) => callback(settings);
    ipcRenderer.on('settings-updated', listener);
    return () => ipcRenderer.removeListener('settings-updated', listener);
  }
});