import { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage, screen } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { createMainWindow } from './windows/mainWindow';

// --- File Logger Placeholder ---
let logToFile: (message: string) => void = () => {};

// グローバルウィンドウ参照（ガベージコレクション防止）
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false; // アプリ終了中フラグ
let forceQuitTimeout: NodeJS.Timeout | null = null;
let postureCheckInterval: NodeJS.Timeout | null = null; // 姿勢チェック用タイマー
let timerWindow: BrowserWindow | null = null; // タイマーウィンドウ

// --- PNGベースのTrayアイコン ---
const pictogramIcons = new Map<number, Electron.NativeImage>();

// アプリケーション準備完了時の処理
app.whenReady().then(() => {
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

  // --- Trayアイコンの設定 (PNGテンプレート版) ---
  try {
    const imagePath = app.isPackaged
      ? path.join(process.resourcesPath, 'public', 'images', 'pictograms')
      : path.join(__dirname, '..', '..', 'public', 'images', 'pictograms');
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

    const contextMenu = Menu.buildFromTemplate([
      { label: '表示', click: () => mainWindow?.show() },
      { label: '終了', click: () => app.quit() },
    ]);
    tray.setToolTip('syakitto');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
      mainWindow?.isVisible() ? mainWindow?.hide() : mainWindow?.show();
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
  });
  
  ipcMain.on('show-notification', (event, options) => {
    new Notification(options).show();
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
      height: 64,
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

  // アニメーション通知用のIPCイベントハンドラ（旧toggleから変更）
  ipcMain.on('show-animation-notification', () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const animationWindow = new BrowserWindow({
      width: 280,
      height: 280,
      x: width - 280,
      y: 10,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      hasShadow: false,
      acceptFirstMouse: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      resizable: false,
      ...(process.platform === 'darwin' && {
        type: 'panel',
      }),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        devTools: false,
      },
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
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const catHandWindow = new BrowserWindow({
      width: 300,
      height: 400,
      x: width - 300,
      y: height - 400,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      hasShadow: false,
      acceptFirstMouse: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      resizable: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        devTools: false,
      },
    });

    const catHandPath = path.join(__dirname, 'windows', 'cat_hand', 'cat_hand.html');
    catHandWindow.loadFile(catHandPath);

    setTimeout(() => {
      if (!catHandWindow.isDestroyed()) {
        catHandWindow.destroy();
      }
    }, 6000);
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


// すべてのウィンドウが閉じられた時の処理
app.on('window-all-closed', () => {
  logToFile('All windows closed.');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// アプリケーションが終了する前の最後の処理
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
