import { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage, screen, protocol } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { createMainWindow } from './windows/mainWindow';

const isDev = process.env.NODE_ENV === 'development';
const URL = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../renderer/index.html')}`;

// MIMEタイプを取得するヘルパー関数
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.txt': 'text/plain',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// 本番環境でのカスタムプロトコル登録（file://での絶対パス問題を解決）
if (!isDev) {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true } }
  ]);
}

// --- File Logger Placeholder ---
let logToFile: (message: string) => void = () => {};

// グローバルウィンドウ参照（ガベージコレクション防止）
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let trayWindow: BrowserWindow | null = null;
let isQuitting = false; // アプリ終了中フラグ
let forceQuitTimeout: NodeJS.Timeout | null = null;
let postureCheckInterval: NodeJS.Timeout | null = null; // 姿勢チェック用タイマー
let timerWindow: BrowserWindow | null = null; // タイマーウィンドウ
let dimmerWindow: BrowserWindow | null = null; // 薄暗くするウィンドウ

// --- PNGベースのTrayアイコン ---
const pictogramIcons = new Map<number, Electron.NativeImage>();

// トレイウィンドウを作成する関数
const createTrayWindow = () => {
  trayWindow = new BrowserWindow({
    width: 220,
    height: 250,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.platform === 'darwin') {
    trayWindow.setVibrancy('fullscreen-ui');
  }

  const trayUrl = isDev ? 'http://localhost:3000/tray' : 'app://./tray.html';
  trayWindow.loadURL(trayUrl);


  trayWindow.on('blur', () => {
    trayWindow?.hide();
  });
};


// アプリケーション準備完了時の処理
app.whenReady().then(() => {
  // 本番環境でカスタムプロトコルを登録（Next.jsの静的ファイルを正しくサーブ）
  if (!isDev) {
    const outPath = path.join(__dirname, '../../out');

    protocol.handle('app', (request) => {
      let url = request.url.replace('app://', '');
      // URLのホスト部分を除去（app://./path → path）
      url = url.replace(/^\.?\/?/, '');

      // ルートへのアクセスはindex.htmlを返す
      if (url === '' || url === '/') {
        url = 'index.html';
      }

      const filePath = path.join(outPath, url);
      return new Response(fs.readFileSync(filePath), {
        headers: { 'Content-Type': getMimeType(filePath) }
      });
    });
  }

  // --- Logger Initialization ---
  const logPath = path.join(app.getPath('userData'), 'session.log');
  logToFile = (message: string) => {
    const timestamp = new Date().toISOString();
    try {
      fs.appendFileSync(logPath, `${timestamp}: ${message}\n`);
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  };
  if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
  logToFile('Application starting...');
  // --- End Logger Initialization ---
  
  app.name = 'syakitto';
  if (process.platform === 'darwin' && app.dock) app.dock.show();

  mainWindow = createMainWindow();
  mainWindow.show();
  createTrayWindow();


  // --- Trayアイコンの設定 (PNGテンプレート版) ---
  try {
    const imagePath = path.join(__dirname, '..', '..', 'public', 'images', 'pictograms');
    logToFile(`[DEBUG] Icon base path: ${imagePath}`);

    const percentages = [0, 25, 50, 75, 100];
    for (const p of percentages) {
      const fullPath = path.join(imagePath, `posture-${p}.png`);
      logToFile(`[DEBUG] Loading icon: ${fullPath}`);
      
      if (!fs.existsSync(fullPath)) {
        logToFile(`[ERROR] Icon file not found at: ${fullPath}`);
        continue; // ファイルがなければスキップ
      }

      const img = nativeImage.createFromPath(fullPath);
      const isEmpty = img.isEmpty();
      logToFile(`[DEBUG] Loaded 'posture-${p}.png'. Is empty? ${isEmpty}`);

      if (isEmpty) {
        throw new Error(`Loaded image is empty: ${fullPath}`);
      }
      img.setTemplateImage(true);
      pictogramIcons.set(p, img);
    }
    
    if (pictogramIcons.size === 0) {
      throw new Error('No icons were loaded. Check paths and file existence.');
    }

    tray = new Tray(pictogramIcons.get(0)!);

    // const contextMenu = Menu.buildFromTemplate([
    //   { label: '表示', click: () => mainWindow?.show() },
    //   { label: '終了', click: () => app.quit() },
    // ]);
    // tray.setToolTip('syakitto');
    // tray.setContextMenu(contextMenu);

    tray.on('click', () => {
      if (trayWindow && tray) {
        const trayBounds = tray.getBounds();
        const windowBounds = trayWindow.getBounds();
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
  // --- END: Trayアイコンの設定 ---

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    } else {
      mainWindow?.show();
    }
  });

  // --- IPCイベントハンドラ ---

  // 姿勢スコアを受け取り、Trayアイコンを更新
  ipcMain.on('update-posture-score', (event, score: number) => {
    if (tray && !tray.isDestroyed() && pictogramIcons.size > 0) {
      const level = Math.round(score / 25) * 25;
      const icon = pictogramIcons.get(level);
      if (icon) {
        tray.setImage(icon);
      }
    }

    // トレイウィンドウが開いていたら、そこにもスコアを送って表示更新させる
    if (trayWindow && !trayWindow.isDestroyed()) {
      trayWindow.webContents.send('update-posture-score', score);
    }
  });
  
  ipcMain.on('show-notification', (event, options) => {
    let iconPath: string | undefined = undefined;
    if (options.icon) {
      const publicPath = app.isPackaged 
        ? path.join(process.resourcesPath, 'public')
        : path.join(__dirname, '..', '..', 'public');
      const resolvedPath = path.join(publicPath, options.icon);

      if (fs.existsSync(resolvedPath)) {
        iconPath = resolvedPath;
      } else {
        logToFile(`[WARN] Notification icon not found at: ${resolvedPath}`);
      }
    }

    new Notification({ ...options, icon: iconPath }).show();
  });

  // タイマーウィンドウの表示
  ipcMain.on('show-timer-window', () => {
    if (timerWindow && !timerWindow.isDestroyed()) {
      timerWindow.show();
      timerWindow.focus();
      return;
    }

    const { width } = screen.getPrimaryDisplay().workAreaSize;
    timerWindow = new BrowserWindow({
      width: 200,
      height: 110,
      x: width - 220,
      y: 20,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      hasShadow: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        backgroundThrottling: false,
      },
    });

    const timerPath = path.join(__dirname, 'windows', 'timer', 'timer.html');
    timerWindow.loadFile(timerPath);
    timerWindow.setVisibleOnAllWorkspaces(true);

    timerWindow.on('closed', () => {
      timerWindow = null;
    });
  });

  // タイマーウィンドウの更新
  ipcMain.on('update-timer-window', (_event, data) => {
    if (timerWindow && !timerWindow.isDestroyed()) {
      timerWindow.webContents.send('update-timer', data);
    }
  });

  // タイマーウィンドウを閉じる
  ipcMain.on('close-timer-window', () => {
    if (timerWindow && !timerWindow.isDestroyed()) {
      timerWindow.close();
    }
  });

  // タイマーウィンドウからのタイマー操作をメインウィンドウに転送
  ipcMain.on('toggle-timer', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('toggle-timer-from-window');
    }
  });

  ipcMain.on('reset-timer', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('reset-timer-from-window');
    }
  });

  // アニメーション通知用のIPCイベントハンドラ（旧toggleから変更）
  ipcMain.on('show-animation-notification', () => {
    const settings = getSettings();
    const pos = settings.animationWindowPositions?.toggle;
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    const animationWindow = new BrowserWindow({
      width: 280,
      height: 280,
      x: pos?.x ?? width - 280,
      y: pos?.y ?? 10,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      hasShadow: false,
      acceptFirstMouse: false,
      minimizable: false,
      maximizable: false,
      closable: true,
      resizable: false,
      ...(process.platform === 'darwin' && {
        type: 'panel',
      }),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        devTools: false,
      },
    });

    animationWindow.on('close', () => {
      const currentSettings = getSettings();
      const bounds = animationWindow.getBounds();
      currentSettings.animationWindowPositions.toggle = { x: bounds.x, y: bounds.y };
      saveSettings(currentSettings);
    });

    const animationPath = path.join(__dirname, 'windows', 'toggle', 'toggle.html');
    animationWindow.loadFile(animationPath);

    setTimeout(() => {
      if (!animationWindow.isDestroyed()) {
        animationWindow.destroy();
      }
    }, 4500);
  });

  // 猫の手アニメーション通知用のIPCイベントハンドラ
  ipcMain.on('show-cat-hand-notification', () => {
    const settings = getSettings();
    const pos = settings.animationWindowPositions?.cat_hand;
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    const catHandWindow = new BrowserWindow({
      width: 300,
      height: 400,
      x: pos?.x ?? width - 300,
      y: pos?.y ?? height - 400,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      hasShadow: false,
      acceptFirstMouse: false,
      minimizable: false,
      maximizable: false,
      closable: true,
      resizable: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        devTools: false,
      },
    });

    catHandWindow.on('close', () => {
      const currentSettings = getSettings();
      const bounds = catHandWindow.getBounds();
      currentSettings.animationWindowPositions.cat_hand = { x: bounds.x, y: bounds.y };
      saveSettings(currentSettings);
    });

    const catHandPath = path.join(__dirname, 'windows', 'cat_hand', 'cat_hand.html');
    catHandWindow.loadFile(catHandPath);

    setTimeout(() => {
      if (!catHandWindow.isDestroyed()) {
        catHandWindow.destroy();
      }
    }, 6000);
  });

  // 砂嵐アニメーション通知用のIPCイベントハンドラ
  ipcMain.on('show-noise-notification', () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const noiseWindow = new BrowserWindow({
      width,
      height,
      x: 0,
      y: 0,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      hasShadow: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        devTools: false,
      },
    });

    const noisePath = path.join(__dirname, 'windows', 'noise', 'noise.html');
    noiseWindow.loadFile(noisePath);
    noiseWindow.setVisibleOnAllWorkspaces(true);

    setTimeout(() => {
      if (!noiseWindow.isDestroyed()) {
        noiseWindow.close();
      }
    }, 2000); // 2秒後に閉じる
  });

  // 画面を薄暗くするアニメーション用のIPCイベントハンドラ
  ipcMain.on('request-dimmer-update', (_event, score: number) => {
    const SHOW_THRESHOLD = 40; // 表示を開始するスコア
    const HIDE_THRESHOLD = 35; // 表示を終了するスコア
    const MAX_OPACITY = 0.8;

    if (score > SHOW_THRESHOLD) {
        // opacityの計算 (SHOW_THRESHOLD-100の範囲を0.0-MAX_OPACITYにマッピング)
        const opacity = Math.min(
            ((score - SHOW_THRESHOLD) / (100 - SHOW_THRESHOLD)) * MAX_OPACITY,
            MAX_OPACITY
        );

        if (dimmerWindow && !dimmerWindow.isDestroyed()) {
            // ウィンドウが既に存在すればOpacityを更新
            dimmerWindow.setOpacity(opacity);
        } else {
            // ウィンドウが存在しなければ新規作成
            const { width, height } = screen.getPrimaryDisplay().workAreaSize;
            dimmerWindow = new BrowserWindow({
                width,
                height,
                x: 0,
                y: 0,
                transparent: true,
                frame: false,
                alwaysOnTop: true,
                skipTaskbar: true,
                focusable: false,
                hasShadow: false,
                webPreferences: {
                    devTools: false,
                },
            });
            dimmerWindow.setOpacity(opacity);
            dimmerWindow.setIgnoreMouseEvents(true); // マウスイベントを無視
            dimmerWindow.setVisibleOnAllWorkspaces(true);

            const dimmerPath = path.join(__dirname, 'windows', 'dimmer', 'dimmer.html');
            dimmerWindow.loadFile(dimmerPath);

            dimmerWindow.on('closed', () => {
                dimmerWindow = null;
            });
        }
    } else if (score <= HIDE_THRESHOLD) {
        // scoreが終了しきい値以下になったらウィンドウを閉じる
        if (dimmerWindow && !dimmerWindow.isDestroyed()) {
            dimmerWindow.close();
        }
    }
  });

  // レンダラープロセスからのログを受け取るハンドラ
  ipcMain.on('log-from-renderer', (event, message: string) => {
    logToFile(message);
  });

  // クリーンアップ完了通知を受け取る
  ipcMain.on('cleanup-complete', () => {
    logToFile('[QUIT] Received "cleanup-complete" from renderer.');
    isQuitting = true;
    if (forceQuitTimeout) {
      logToFile('[QUIT] Clearing force quit timeout.');
      clearTimeout(forceQuitTimeout);
    }
    logToFile('[QUIT] Calling app.exit(0).');
    app.exit(0);
  });

  // 姿勢チェックタイマーの開始/停止
  ipcMain.on('start-posture-check', (_event, interval: number) => {
    // 既存のタイマーがあればクリア
    if (postureCheckInterval) {
      clearInterval(postureCheckInterval);
    }

    // メインプロセスで定期的にレンダラーに測定を指示
    postureCheckInterval = setInterval(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('trigger-posture-check');
      }
    }, interval);
  });

  ipcMain.on('stop-posture-check', () => {
    if (postureCheckInterval) {
      clearInterval(postureCheckInterval);
      postureCheckInterval = null;
    }
  });
});

app.on('window-all-closed', () => {
  logToFile('All windows closed.');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', (event) => {
  logToFile('[QUIT] "before-quit" event triggered.');
  if (isQuitting) {
    logToFile('[QUIT] isQuitting is true, performing final cleanup.');
    if (process.platform === 'darwin' && app.dock) app.dock.hide();
    if (tray && !tray.isDestroyed()) tray.destroy();
    return;
  }

  logToFile('[QUIT] Preventing default quit action.');
  event.preventDefault();

  if (mainWindow && !mainWindow.isDestroyed()) {
    logToFile('[QUIT] Sending "before-quit-cleanup" to renderer.');
    mainWindow.webContents.send('before-quit-cleanup');
    
    forceQuitTimeout = setTimeout(() => {
        logToFile('[QUIT] Force quit timeout executed. Forcing exit.');
        app.exit();
    }, 2000);
  } else {
    logToFile('[QUIT] Main window not found or destroyed. Quitting directly.');
    isQuitting = true;
    app.quit();
  }
});

// Settings management
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

const defaultSettings = {
  notification: {
    all: true,
    sound: true,
    soundVolume: 0.5,
    soundFile: 'Syakiin01.mp3',
    visual: true,
    visualType: 'cat_hand', // 'cat_hand', 'dimmer', 'noise'
    pomodoro: true, // ポモドーロタイマーの通知
    type: 'desktop', // 'desktop', 'voice', 'animation', 'none'
  },
  threshold: {
    slouch: 60, // 判定のしきい値
    duration: 10, // しきい値越えを何秒許容するか
    reNotificationMode: 'cooldown',
    cooldownTime: 5,
    continuousInterval: 10,
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


const getSettings = (): typeof defaultSettings => {
  try {
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      // デフォルト設定とマージして、新しい設定項目を補完する
      return { ...defaultSettings, ...settings };
    }
  } catch (error) {
    console.error('Failed to read settings, using default:', error);
  }
  return defaultSettings;
};

const saveSettings = (settings: typeof defaultSettings) => {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

ipcMain.handle('get-settings', () => {
  return getSettings();
});

ipcMain.handle('save-settings', (event, settings) => {
  saveSettings(settings);
});

// 通知のON/OFF切り替え（トレイ画面から呼ばれる）
ipcMain.on('toggle-notifications', (event, enabled: boolean) => {
  const currentSettings = getSettings();
  currentSettings.notification.all = enabled;
  saveSettings(currentSettings);
  
  console.log(`[Tray] Notification toggled: ${enabled}`);
  
  // メインウィンドウに設定変更を知らせる
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('settings-updated', currentSettings);
  }
});

ipcMain.on('quit-app', () => {
  app.quit();
});
