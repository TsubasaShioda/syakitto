import { BrowserWindow, shell, app } from 'electron';
import * as path from 'path';
import * as url from 'url';

export function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      backgroundThrottling: false, // バックグラウンド時も姿勢検出を継続するため無効化
    },
    title: 'syakitto',
  });

  // 開発環境と本番環境でURLを切り替え
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '../../../out/index.html');
    mainWindow.loadURL(
      url.format({
        pathname: indexPath,
        protocol: 'file:',
        slashes: true,
      }),
    );
  }

  // 外部リンクはブラウザで開く
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // ウィンドウを閉じる時は、アプリを終了するのではなくウィンドウを隠す
  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  return mainWindow;
}