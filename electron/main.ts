import { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage, screen, session } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { createMainWindow } from './windows/mainWindow';

// グローバルウィンドウ参照（ガベージコレクション防止）
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false; // 強制終了フラグ

// アプリケーション準備完了時の処理
app.whenReady().then(() => {
  // ダウンロードをすべてキャンセルする
  session.defaultSession.on('will-download', (event, item, webContents) => {
    item.cancel();
    console.log(`Download blocked for: ${item.getURL()}`);
  });

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

  // 音楽ファイルリストを取得するIPCハンドラ
  ipcMain.handle('get-music-files', async () => {
    let musicsDir: string;

    if (app.isPackaged) {
      // プロダクション環境: パッケージのルートからの相対パス
      musicsDir = path.join(process.resourcesPath, 'dist', 'electron', 'musics');
    } else {
      // 開発環境: プロジェクトルートからの相対パス
      musicsDir = path.join(process.cwd(), 'public', 'musics');
    }

    console.log('[main.ts] Trying to read music files from:', musicsDir);
    try {
      const files = await fs.promises.readdir(musicsDir);
      console.log('[main.ts] Found music files:', files);
      return files.filter(file => file.endsWith('.mp3'));
    } catch (error) {
      console.error('[main.ts] Failed to read music files:', error);
      return [];
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

    // `toggle.html` をロード
    const animationPath = path.join(__dirname, 'windows', 'toggle', 'toggle.html');
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

    // アニメーション終了後にウィンドウを閉じる（6秒後）
    setTimeout(() => {
      if (!catHandWindow.isDestroyed()) {
        catHandWindow.close();
      }
    }, 6000); // CSSアニメーションの時間に合わせる
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

// アプリケーション終了前の最後の処理
app.on('before-quit', (e) => {
  if (!isQuitting) {
    e.preventDefault(); // 終了を一旦キャンセル

    // レンダラープロセスにクリーンアップを要求
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('before-quit');
    }

    // レンダラーからの完了通知を待つ
    ipcMain.once('cleanup-complete', () => {
      isQuitting = true; // 強制終了フラグを立てる
      app.quit(); // 再度終了処理を実行
    });

    // タイムアウト処理（5秒以内に応答がない場合は強制終了）
    setTimeout(() => {
      if (!isQuitting) {
        console.warn('Cleanup timed out. Forcing quit.');
        isQuitting = true;
        app.quit();
      }
    }, 5000);
  }
});

// ウィンドウが閉じられた時の処理 (before-quitの前に呼ばれる)
app.on('will-quit', () => {
  // ここでトレイアイコンなどを破棄
  if (tray) {
    tray.destroy();
    tray = null;
  }
});
