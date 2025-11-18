import { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage, screen } from 'electron';
import * as path from 'path';
import { createMainWindow } from './windows/mainWindow';

// グローバルウィンドウ参照（ガベージコレクション防止）
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// アプリケーション準備完了時の処理
app.whenReady().then(() => {
  // メインウィンドウを作成するが、最初は非表示
  mainWindow = createMainWindow();
  mainWindow.hide();

  // macOSでDockアイコンを非表示にする
  if (process.platform === 'darwin' && app.dock) {
    app.dock.hide();
  }

  // Tray アイコンの作成 (初期アイコンは透明)
  try {
    const image = nativeImage.createEmpty();
    tray = new Tray(image);

    const contextMenu = Menu.buildFromTemplate([
      { label: '表示', click: () => mainWindow?.show() },
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

  // macOSでの動作: Dockアイコンクリック時にウィンドウを表示
  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show();
    } else {
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

  // アニメーション通知用のIPCイベントハンドラ
  ipcMain.on('show-animation-notification', () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const animationWindow = new BrowserWindow({
      width: 400,
      height: 280,
      x: width - 420,
      y: 20,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false, // フォーカスを受け取らない
      hasShadow: false, // 影を表示しない
      acceptFirstMouse: false, // 最初のマウスクリックを受け付けない
      minimizable: false,
      maximizable: false,
      closable: false,
      resizable: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.ts'),
        devTools: false, // DevToolsを無効化
      },
    });

    // `animation.html` をロード
    const animationPath = path.join(__dirname, 'windows', 'animation', 'animation.html');
    animationWindow.loadFile(animationPath);

    // macOS特有の設定
    if (process.platform === 'darwin') {
      animationWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      animationWindow.setAlwaysOnTop(true, 'pop-up-menu'); // pop-up-menuレベルに変更
    } else {
      animationWindow.setAlwaysOnTop(true);
    }

    // ウィンドウが完全にロードされてから表示（フォーカス問題を回避）
    animationWindow.once('ready-to-show', () => {
      animationWindow.showInactive();
      // 念のため、フォーカスを明示的に無効化
      animationWindow.setIgnoreMouseEvents(true, { forward: true });
    });

    // アニメーション終了後にウィンドウを閉じる（5秒後）
    setTimeout(() => {
      if (!animationWindow.isDestroyed()) {
        animationWindow.close();
      }
    }, 5000); // CSS アニメーション（フェードイン + 表示 + フェードアウト = 5秒）
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
