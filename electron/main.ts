// Electronの主要モジュールをインポート
import { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage, screen, protocol } from 'electron';
// Node.jsのコアモジュールをインポート
import * as path from 'path';
import * as fs from 'fs';
// メインウィンドウ生成用の関数をインポート
import { createMainWindow } from './mainWindow';

// 開発モードか本番モードかを判定
const isDev = process.env.NODE_ENV === 'development';
// レンダラープロセスがロードするURL。開発時はNext.jsの開発サーバー、本番時はビルドされた静的ファイルを指す
const URL = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../renderer/index.html')}`;

// ファイル拡張子からMIMEタイプを取得するヘルパー関数
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    // ... 他のMIMEタイプ
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// 本番環境（非開発モード）でのみ、カスタムプロトコル'app://'を登録
if (!isDev) {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true } }
  ]);
}

// 簡易的なファイルロガー（デバッグ用）
let logToFile: (message: string) => void = () => {};

// --- ウィンドウ管理 ---
// 各ウィンドウの参照をグローバルに保持し、ガベージコレクションによる破棄を防ぐ
let mainWindow: BrowserWindow | null = null; // メインのUIウィンドウ
let tray: Tray | null = null; // システムトレイのアイコン
let trayWindow: BrowserWindow | null = null; // トレイアイコンクリック時に表示されるメニューウィンドウ
let timerWindow: BrowserWindow | null = null; // ポモドーロタイマー用の小型ウィンドウ
let dimmerWindow: BrowserWindow | null = null; // 画面を暗くするオーバーレイウィンドウ

let isQuitting = false; // アプリケーションが意図的に終了処理中であるかを示すフラグ
let forceQuitTimeout: NodeJS.Timeout | null = null; // 終了処理がタイムアウトした場合に強制終了させるためのタイマー
let postureCheckInterval: NodeJS.Timeout | null = null; // 定期的な姿勢チェックをトリガーするためのタイマー

// --- Trayアイコン用の画像キャッシュ ---
const pictogramIcons = new Map<number, Electron.NativeImage>();

/**
 * トレイアイコンクリック時に表示されるメニューウィンドウを生成・設定する
 */
const createTrayWindow = () => {
  trayWindow = new BrowserWindow({
    width: 220,
    height: 250,
    show: false, // 初期状態は非表示
    frame: false, // フレームレスウィンドウ
    fullscreenable: false,
    resizable: false,
    transparent: true, // 背景を透過
    skipTaskbar: true, // タスクバーに表示しない
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // preloadスクリプトを指定
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // macOSではウィンドウに特定の視覚効果を適用
  if (process.platform === 'darwin') {
    trayWindow.setVibrancy('fullscreen-ui');
  }

  // トレイウィンドウがロードするURLを指定
  const trayUrl = isDev ? 'http://localhost:3000/tray' : 'app://./tray.html';
  trayWindow.loadURL(trayUrl);

  // ウィンドウがフォーカスを失ったら非表示にする
  trayWindow.on('blur', () => {
    trayWindow?.hide();
  });
};


// Electronアプリケーションの準備が完了したときの処理
app.whenReady().then(() => {
  // 本番環境で 'app://' プロトコルをハンドルし、ビルドされた静的ファイルを提供する
  if (!isDev) {
    const outPath = path.join(__dirname, '../../out');
    protocol.handle('app', (request) => {
      let url = request.url.replace('app://./', '');
      if (url === '' || url === '/') url = 'index.html';
      const filePath = path.join(outPath, url);
      return new Response(fs.readFileSync(filePath), {
        headers: { 'Content-Type': getMimeType(filePath) }
      });
    });
  }

  // --- ロガーの初期化 ---
  const logPath = path.join(app.getPath('userData'), 'session.log');
  logToFile = (message: string) => {
    // ... ログ書き込み処理
  };
  if (fs.existsSync(logPath)) fs.unlinkSync(logPath); // 起動時に古いログを削除
  logToFile('Application starting...');
  
  // アプリケーション名を設定
  app.name = 'syakitto';
  // macOSでDockアイコンを表示
  if (process.platform === 'darwin' && app.dock) app.dock.show();

  // メインウィンドウとトレイウィンドウを生成
  mainWindow = createMainWindow();
  mainWindow.show();
  createTrayWindow();

  // --- システムトレイのアイコン設定 ---
  try {
    const imagePath = path.join(__dirname, '..', '..', 'public', 'images', 'pictograms');
    const percentages = [0, 25, 50, 75, 100]; // スコアに応じたアイコンの段階
    for (const p of percentages) {
      const fullPath = path.join(imagePath, `posture-${p}.png`);
      if (!fs.existsSync(fullPath)) continue;
      const img = nativeImage.createFromPath(fullPath);
      if (img.isEmpty()) throw new Error(`Loaded image is empty: ${fullPath}`);
      img.setTemplateImage(true); // macOSでアイコンが適切に表示されるようにテンプレートイメージとして設定
      pictogramIcons.set(p, img);
    }
    if (pictogramIcons.size === 0) throw new Error('No icons were loaded.');

    // 初期アイコンでトレイを生成
    tray = new Tray(pictogramIcons.get(0)!);

    // トレイアイコンがクリックされたときの動作
    tray.on('click', () => {
      if (trayWindow && tray) {
        const trayBounds = tray.getBounds();
        const windowBounds = trayWindow.getBounds();
        // トレイアイコンの真下にメニューウィンドウを表示
        const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
        const y = Math.round(trayBounds.y + trayBounds.height);
        
        trayWindow.setPosition(x, y, false);
        trayWindow.isVisible() ? trayWindow.hide() : trayWindow.show();
      }
    });

    logToFile('PNG Tray icons initialized successfully.');
  } catch (error) {
    console.error('Failed to create Tray icon:', error);
    logToFile(`[FATAL] Failed to create Tray icon: ${error instanceof Error ? error.message : String(error)}`);
  }

  // macOSでDockアイコンがクリックされた場合などのアクティベートイベント
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    } else {
      mainWindow?.show();
    }
  });

  // --- IPC (プロセス間通信) イベントハンドラ ---
  // レンダラープロセスからの要求に応じて様々なネイティブ機能を提供する

  // 姿勢スコアをレンダラーから受け取り、システムトレイのアイコンを更新
  ipcMain.on('update-posture-score', (event, score: number) => {
    if (tray && !tray.isDestroyed() && pictogramIcons.size > 0) {
      const level = Math.round(score / 25) * 25; // スコアを0, 25, 50, 75, 100のいずれかに丸める
      const icon = pictogramIcons.get(level);
      if (icon) tray.setImage(icon);
    }
    // トレイメニューウィンドウにもスコアを転送
    if (trayWindow && !trayWindow.isDestroyed()) {
      trayWindow.webContents.send('update-posture-score', score);
    }
  });
  
  // OS標準の通知を表示
  ipcMain.on('show-notification', (event, options) => {
    // ... 通知アイコンのパス解決と表示
    new Notification({ ...options }).show();
  });

  // --- タイマーウィンドウ関連 ---
  // ポモドーロタイマー用の小型オーバーレイウィンドウを表示
  ipcMain.on('show-timer-window', () => {
    if (timerWindow && !timerWindow.isDestroyed()) { // 既に存在すれば表示するだけ
      timerWindow.show();
      timerWindow.focus();
      return;
    }
    // 新規作成
    const { width } = screen.getPrimaryDisplay().workAreaSize;
    timerWindow = new BrowserWindow({ /* ...ウィンドウ設定... */ });
    timerWindow.loadFile(path.join(__dirname, 'overlays', 'timer', 'timer.html'));
    timerWindow.on('closed', () => { timerWindow = null; });
  });

  // タイマーウィンドウの表示内容を更新
  ipcMain.on('update-timer-window', (_event, data) => {
    if (timerWindow && !timerWindow.isDestroyed()) {
      timerWindow.webContents.send('update-timer', data);
    }
  });

  // タイマーウィンドウを閉じる
  ipcMain.on('close-timer-window', () => {
    timerWindow?.close();
  });
  
  // タイマーウィンドウからの操作をメインウィンドウへ転送
  ipcMain.on('toggle-timer', () => mainWindow?.webContents.send('toggle-timer-from-window'));
  ipcMain.on('reset-timer', () => mainWindow?.webContents.send('reset-timer-from-window'));

  // --- 各種アニメーション通知ウィンドウ ---
  // これらは短時間表示され、自動的に閉じるフレームレスのオーバーレイウィンドウ

  // 汎用アニメーション通知
  ipcMain.on('show-animation-notification', () => {
    const animationWindow = new BrowserWindow({ /* ...設定... */ });
    animationWindow.loadFile(path.join(__dirname, 'overlays', 'toggle', 'toggle.html'));
    setTimeout(() => animationWindow.destroy(), 4500); // 4.5秒後に自動で閉じる
  });

  // 猫の手が伸びるアニメーション通知
  ipcMain.on('show-cat-hand-notification', () => {
    const catHandWindow = new BrowserWindow({ /* ...設定... */ });
    catHandWindow.loadFile(path.join(__dirname, 'overlays', 'cat_hand', 'cat_hand.html'));
    setTimeout(() => catHandWindow.destroy(), 6000); // 6秒後に閉じる
  });

  // 砂嵐アニメーション通知
  ipcMain.on('show-noise-notification', () => {
    const noiseWindow = new BrowserWindow({ /* ...画面全体を覆う設定... */ });
    noiseWindow.loadFile(path.join(__dirname, 'overlays', 'noise', 'noise.html'));
    setTimeout(() => noiseWindow.close(), 2000); // 2秒後に閉じる
  });

  // スイッチのON/OFFアニメーション通知
  ipcMain.on('show-switch-notification', (event, switchType: 'on' | 'off') => {
    const switchWindow = new BrowserWindow({ /* ...設定... */ });
    // ... 画像パスを解決し、ウィンドウに送信
    setTimeout(() => switchWindow.destroy(), 4500); // 4.5秒後に閉じる
  });

  // 画面全体を薄暗くするオーバーレイ表示
  ipcMain.on('request-dimmer-update', (_event, score: number) => {
    // ... スコアに応じてウィンドウの透明度を更新、またはウィンドウを生成/破棄
  });

  // --- アプリケーション制御 ---
  
  // レンダラープロセスからのログメッセージをファイルに書き込む
  ipcMain.on('log-from-renderer', (event, message: string) => logToFile(message));

  // レンダラーでの終了前処理が完了したことを受け取り、アプリケーションを終了
  ipcMain.on('cleanup-complete', () => {
    isQuitting = true;
    if (forceQuitTimeout) clearTimeout(forceQuitTimeout);
    app.exit(0);
  });

  // 定期的な姿勢チェックの開始/停止
  ipcMain.on('start-posture-check', (_event, interval: number) => {
    if (postureCheckInterval) clearInterval(postureCheckInterval);
    postureCheckInterval = setInterval(() => {
      mainWindow?.webContents.send('trigger-posture-check');
    }, interval);
  });
  ipcMain.on('stop-posture-check', () => {
    if (postureCheckInterval) clearInterval(postureCheckInterval);
    postureCheckInterval = null;
  });
});

// 全てのウィンドウが閉じたときの挙動 (macOS以外ではアプリを終了)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// アプリケーションが終了する直前の処理
app.on('before-quit', (event) => {
  if (isQuitting) return; // 既に終了処理中なら何もしない

  event.preventDefault(); // デフォルトの終了動作をキャンセル
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('before-quit-cleanup'); // レンダラーに終了前処理を依頼
    // タイムアウトを設定し、応答がない場合は強制終了
    forceQuitTimeout = setTimeout(() => app.exit(), 2000);
  } else {
    isQuitting = true;
    app.quit(); // メインウィンドウがなければ即時終了
  }
});

// --- 設定管理 ---
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

// デフォルトの設定値。設定ファイルが存在しない場合や、新しい設定項目が追加された場合に使われる。
const defaultSettings = {
  notification: {
    all: true,
    sound: true,
    soundVolume: 0.5,
    soundFile: 'cat_sweet_voice1.mp3',
    visual: true,
    visualType: 'cat_hand',
    pomodoro: true,
    type: 'voice',
  },
  threshold: {
    slouch: 60,
    duration: 10,
    reNotificationMode: 'continuous',
    cooldownTime: 5,
    continuousInterval: 5,
  },
  drowsiness: {
    earThreshold: 0.2,
    timeThreshold: 2,
  },
  shortcut: {
    enabled: true,
    keys: 'CommandOrControl+Shift+S',
  },
  camera: {
    id: 'default',
  },
  pomodoro: {
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    sessions: 4,
  },
  startup: {
    runOnStartup: false,
    startMinimized: false,
  },
  animationWindowPositions: {
    toggle: null as { x: number; y: number } | null,
    cat_hand: null as { x: number; y: number } | null,
  },
};

/**
 * settings.jsonファイルから設定を読み込む。
 * ファイルが存在しない、または読み込みに失敗した場合はデフォルト設定を返す。
 * @returns {typeof defaultSettings} アプリケーション設定
 */
const getSettings = (): typeof defaultSettings => {
  try {
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      // 既存の設定とデフォルト設定をマージし、新しい設定項目が追加されても対応できるようにする
      return { ...defaultSettings, ...settings };
    }
  } catch (error) {
    console.error('Failed to read settings, using default:', error);
  }
  return defaultSettings;
};

/**
 * 指定された設定オブジェクトをsettings.jsonファイルに保存する。
 * @param {typeof defaultSettings} settings - 保存する設定オブジェクト
 */
const saveSettings = (settings: typeof defaultSettings) => {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

// レンダラープロセスからの要求に応じて設定を返す
ipcMain.handle('get-settings', () => getSettings());
// レンダラープロセスからの要求に応じて設定を保存する
ipcMain.handle('save-settings', (event, settings) => saveSettings(settings));

// トレイメニューからの通知ON/OFF切り替え
ipcMain.on('toggle-notifications', (event, enabled: boolean) => {
  const currentSettings = getSettings();
  currentSettings.notification.all = enabled;
  saveSettings(currentSettings);
  // メインウィンドウにも設定変更を通知
  mainWindow?.webContents.send('settings-updated', currentSettings);
});

// トレイメニューからアプリを終了
ipcMain.on('quit-app', () => app.quit());
