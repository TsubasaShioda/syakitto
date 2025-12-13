import { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage, screen } from 'electron';
import * as path from 'path';
import { createMainWindow } from './windows/mainWindow';

// グローバルウィンドウ参照（ガベージコレクション防止）
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false; // アプリ終了中フラグ

// アプリケーション準備完了時の処理
app.whenReady().then(() => {
  // メインウィンドウを作成して表示
  mainWindow = createMainWindow(quitApp);
  mainWindow.show();

  // macOSでDockアイコンを表示する（デフォルトの動作）
  // if (process.platform === 'darwin' && app.dock) {
  //   app.dock.hide();
  // }

  // Tray アイコンの作成 (初期アイコンは透明)
  try {
    const image = nativeImage.createEmpty();
    tray = new Tray(image);

    const contextMenu = Menu.buildFromTemplate([
      { label: '表示', click: () => mainWindow?.show() },
      { label: '終了', click: () => quitApp() },
    ]);
    tray.setToolTip('syakitto');
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
      mainWindow = createMainWindow(quitApp);
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

  // 旧アニメーション通知用のIPCイベントハンドラ（コメントアウト）
  /*
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
      focusable: false,
      hasShadow: false,
      acceptFirstMouse: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      resizable: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.ts'),
        devTools: false,
      },
    });

    const animationPath = path.join(__dirname, 'windows', 'animation', 'animation.html');
    animationWindow.loadFile(animationPath);

    if (process.platform === 'darwin') {
      animationWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      animationWindow.setAlwaysOnTop(true, 'pop-up-menu');
    } else {
      animationWindow.setAlwaysOnTop(true);
    }

    animationWindow.once('ready-to-show', () => {
      animationWindow.showInactive();
      animationWindow.setIgnoreMouseEvents(true, { forward: true });
    });

    setTimeout(() => {
      if (!animationWindow.isDestroyed()) {
        animationWindow.destroy();
      }
    }, 5000);
  });
  */

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
        type: 'panel', // macOS専用: パネルタイプでフォーカスを奪わない
      }),
      webPreferences: {
        preload: path.join(__dirname, 'preload.ts'),
        devTools: false,
      },
    });

    // `toggle.html` をロード（画像が交互に表示されるアニメーション）
    const animationPath = path.join(__dirname, 'windows', 'toggle', 'toggle.html');
    animationWindow.loadFile(animationPath);

    if (process.platform === 'darwin') {
      animationWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    } else {
      animationWindow.setAlwaysOnTop(true);
    }

    animationWindow.once('ready-to-show', () => {
      animationWindow.showInactive();
      animationWindow.setIgnoreMouseEvents(true, { forward: true });
    });

    // アニメーション終了後にウィンドウを破棄（4.5秒後）
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
        preload: path.join(__dirname, 'preload.ts'),
        devTools: true,
      },
    });

    // `cat_hand.html` をロード
    const catHandPath = path.join(__dirname, 'windows', 'cat_hand', 'cat_hand.html');
    catHandWindow.loadFile(catHandPath);

    if (process.platform === 'darwin') {
      catHandWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      catHandWindow.setAlwaysOnTop(true, 'pop-up-menu');
    } else {
      catHandWindow.setAlwaysOnTop(true);
    }

    catHandWindow.once('ready-to-show', () => {
      catHandWindow.showInactive();
      catHandWindow.setIgnoreMouseEvents(true, { forward: true });
    });

    // アニメーション終了後にウィンドウを破棄（6秒後）
    setTimeout(() => {
      if (!catHandWindow.isDestroyed()) {
        catHandWindow.destroy(); // close()の代わりにdestroy()を使用
      }
    }, 6000); // CSSアニメーションの時間に合わせる
  });

  ipcMain.on('close-window', () => {
    const win = BrowserWindow.getFocusedWindow();
    win?.close();
  });

  // クリーンアップ完了通知を受け取る
  ipcMain.on('cleanup-complete', () => {
    console.log('Cleanup complete, quitting app...');
    isQuitting = true;
    app.quit();
  });
});

// アプリ終了処理
function quitApp() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    app.quit();
    return;
  }

  // Rendererプロセスにクリーンアップを要求
  mainWindow.webContents.send('before-quit-cleanup');

  // タイムアウト: 3秒以内にクリーンアップが完了しなければ強制終了
  setTimeout(() => {
    if (!isQuitting) {
      console.log('Cleanup timeout, force quitting...');
      isQuitting = true;
      app.quit();
    }
  }, 3000);
}

// すべてのウィンドウが閉じられた時の処理
app.on('window-all-closed', () => {
  // macOS以外ではアプリケーションを終了
  if (process.platform !== 'darwin') {
    quitApp();
  }
});

// ウィンドウが閉じられた時の処理
app.on('before-quit', () => {
  mainWindow = null;
  if (tray) {
    tray.destroy(); // アプリ終了時にトレイアイコンを破棄
  }
});
