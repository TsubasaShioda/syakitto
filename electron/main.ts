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

// アプリケーション準備完了時の処理
app.whenReady().then(() => {
  // --- Logger Initialization ---
  const logPath = path.join(app.getPath('userData'), 'session.log');
  console.log(`[DEBUG] Attempting to write log to: ${logPath}`); // Add this debug log
  logToFile = (message: string) => {
    const timestamp = new Date().toISOString();
    try {
      fs.appendFileSync(logPath, `${timestamp}: ${message}\n`);
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  };

  if (fs.existsSync(logPath)) {
    fs.unlinkSync(logPath);
  }

  logToFile('---------------------------------');
  logToFile('Application starting...');
  logToFile(`Log file path: ${logPath}`);
  logToFile('App is ready.');
  // --- End Logger Initialization ---
  
  // アプリ名を設定
  app.name = 'syakitto';

  // macOSでDockアイコンを明示的に表示
  if (process.platform === 'darwin' && app.dock) {
    app.dock.show();
  }

  // メインウィンドウを作成して表示
  mainWindow = createMainWindow();
  mainWindow.show();

  // Tray アイコンの作成 (初期アイコンは透明)
  try {
    const image = nativeImage.createEmpty();
    tray = new Tray(image);

    const contextMenu = Menu.buildFromTemplate([
      { label: '表示', click: () => mainWindow?.show() },
      { label: '終了', click: () => app.quit() },
    ]);
    tray.setToolTip('syakitto');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
      mainWindow?.isVisible() ? mainWindow?.hide() : mainWindow?.show();
    });
    logToFile('Tray icon created successfully.');
  } catch (error) {
    console.error('Failed to create Tray icon:', error);
    logToFile(`Failed to create Tray icon: ${error}`);
  }

  // macOSでの動作: Dockアイコンクリック時にウィンドウを表示
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      logToFile('App activated, creating new window.');
      mainWindow = createMainWindow();
    } else {
      logToFile('App activated, showing existing window.');
      mainWindow?.show();
    }
  });

  // IPCイベントハンドラの設定
  ipcMain.on('show-notification', (event, options) => {
    const notification = new Notification(options);
    notification.show();
  });

  // Data URL から Tray アイコンを更新
  ipcMain.on('update-tray-icon', (event, dataUrl: string) => {
    if (tray && !tray.isDestroyed()) {
      const newImage = nativeImage.createFromDataURL(dataUrl);
      tray.setImage(newImage);
    }
  });

  // フラッシュ通知用のIPCイベントハンドラ
  ipcMain.on('flash-screen', () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const flashWindow = new BrowserWindow({
      width,
      height,
      x: 0,
      y: 0,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        devTools: false,
      },
    });

    const flashPath = path.join(__dirname, 'windows', 'flash', 'flash.html');
    flashWindow.loadFile(flashPath);
    flashWindow.setVisibleOnAllWorkspaces(true);
    flashWindow.focus();

    setTimeout(() => {
      if (!flashWindow.isDestroyed()) {
        flashWindow.close();
      }
    }, 500);
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
    // Dockアイコンを非表示にする
    if (process.platform === 'darwin' && app.dock) {
      app.dock.hide();
    }
    if (tray && !tray.isDestroyed()) {
      tray.destroy();
    }
    return;
  }

  logToFile('[QUIT] Preventing default quit action.');
  event.preventDefault();

  if (mainWindow && !mainWindow.isDestroyed()) {
    logToFile('[QUIT] Sending "before-quit-cleanup" to renderer.');
    mainWindow.webContents.send('before-quit-cleanup');
    
    logToFile('[QUIT] Setting force quit timeout for 2000ms.');
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
