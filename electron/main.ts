import { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage, screen } from 'electron';
import * as path from 'path';
import { createMainWindow } from './windows/mainWindow';

// グローバルウィンドウ参照（ガベージコレクション防止）
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// アプリケーション準備完了時の処理
app.whenReady().then(() => {
  mainWindow = createMainWindow();

  // Tray アイコンの作成 (初期アイコンは透明)
  try {
    const image = nativeImage.createEmpty();
    tray = new Tray(image);

    const contextMenu = Menu.buildFromTemplate([
      { label: '開く', click: () => mainWindow?.show() },
      { label: '終了', click: () => app.quit() },
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

  // macOSでの動作: Dockアイコンクリック時にウィンドウを再作成
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });

  // IPCイベントハンドラの設定
  ipcMain.on('show-notification', (event, options) => {
    const notification = new Notification(options);
    notification.show();
  });

  // Data URL から Tray アイコンを更新
  ipcMain.on('update-tray-icon', (event, dataUrl: string) => {
    if (tray) {
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
        preload: path.join(__dirname, 'preload.ts'),
      },
    });

    // `flash.html` をロード
    const flashPath = path.join(__dirname, 'windows', 'flash', 'flash.html');
    flashWindow.loadFile(flashPath);
    flashWindow.setVisibleOnAllWorkspaces(true);
    flashWindow.focus();


    // アニメーション終了後にウィンドウを閉じる
    setTimeout(() => {
      if (!flashWindow.isDestroyed()) {
        flashWindow.close();
      }
    }, 500); // CSSアニメーションより少し長く待つ
  });

  ipcMain.on('close-window', () => {
    const win = BrowserWindow.getFocusedWindow();
    win?.close();
  });
});

// すべてのウィンドウが閉じられた時の処理
app.on('window-all-closed', () => {
  // macOS以外ではアプリケーションを終了
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ウィンドウが閉じられた時の処理
app.on('before-quit', () => {
  mainWindow = null;
  if (tray) {
    tray.destroy(); // アプリ終了時にトレイアイコンを破棄
  }
});
