import { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage, screen } from 'electron';
import * as path from 'path';
import { createMainWindow } from './windows/mainWindow';

// グローバルウィンドウ参照（ガベージコレクション防止）
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let quitTimeout: NodeJS.Timeout | null = null;

// アプリケーション準備完了時の処理
app.whenReady().then(() => {
  // メインウィンドウを作成して表示
  mainWindow = createMainWindow(quitApp);
  mainWindow.show();

  // Tray アイコンの作成 (初期アイコンは透明)
  try {
    const image = nativeImage.createEmpty();
    tray = new Tray(image);

    const contextMenu = Menu.buildFromTemplate([
      { label: '表示', click: () => mainWindow?.show() },
      { label: '終了', click: () => app.quit() }, // Triggers 'before-quit'
    ]);
    tray.setToolTip('Posture Checker');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
      mainWindow?.isVisible() ? mainWindow?.hide() : mainWindow?.show();
    });
    console.log('Tray icon created successfully.');
  } catch (error) {
    console.error('Failed to create Tray icon:', error);
  }

  // macOSでの動作: Dockアイコンクリック時にウィンドウを表示
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow(quitApp);
    } else {
      mainWindow?.show();
    }
  });

  // IPCイベントハンドラの設定
  ipcMain.on('show-notification', (event, options) => {
    const notification = new Notification(options);
    notification.show();
  });

  ipcMain.on('update-tray-icon', (event, dataUrl: string) => {
    if (tray && !tray.isDestroyed()) {
      const newImage = nativeImage.createFromDataURL(dataUrl);
      tray.setImage(newImage);
    }
  });

  // クリーンアップ完了通知を受け取る
  ipcMain.on('cleanup-complete', () => {
    console.log('Cleanup complete, now really quitting...');
    if (quitTimeout) {
      clearTimeout(quitTimeout);
    }
    if (mainWindow) {
      mainWindow.destroy(); // Destroy the window manually
    }
    app.quit();
  });

  // (Other IPC listeners for animations remain unchanged)
});

function quitApp() {
  if (isQuitting) {
    return;
  }
  console.log("Attempting to gracefully quit...");
  isQuitting = true;

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('before-quit-cleanup');
    quitTimeout = setTimeout(() => {
      console.log('Cleanup timeout, force quitting...');
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.destroy();
      }
      app.quit();
    }, 3000);
  } else {
    app.quit();
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', (event) => {
  console.log("Before-quit event triggered.");
  if (!isQuitting) {
    console.log("Quit initiated by user (e.g., from Dock). Preventing immediate quit and starting cleanup.");
    event.preventDefault();
    quitApp();
  } else {
    console.log("isQuitting is true, allowing app to quit.");
    if (tray && !tray.isDestroyed()) {
      tray.destroy();
    }
  }
});
