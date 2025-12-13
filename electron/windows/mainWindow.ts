import { BrowserWindow, shell, app } from 'electron';
import * as path from 'path';
import * as url from 'url';

export function createMainWindow(quitApp: () => void): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    title: 'syakitto',
  });

  // 開発環境と本番環境でURLを切り替え
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    // 開発者ツールを開く（コメントアウト）
    // mainWindow.webContents.openDevTools();
  } else {
    // app.getAppPath() is unreliable in translocated apps. Use __dirname instead.
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

  // ウィンドウを閉じる時は、クリーンアップ処理を伴う終了を要求
  mainWindow.on('close', (event) => {
    // デフォルトの終了処理を防止し、クリーンアップを許可
    event.preventDefault();
    // クリーンアップを伴うアプリの正常終了を要求
    quitApp(); // Directly call the passed quitApp function
  });

  return mainWindow;
}
