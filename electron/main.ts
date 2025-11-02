import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { createMainWindow } from './windows/mainWindow';

// グローバルウィンドウ参照（ガベージコレクション防止）
let mainWindow: BrowserWindow | null = null;

// アプリケーション準備完了時の処理
app.whenReady().then(() => {
  mainWindow = createMainWindow();

  // macOSでの動作: Dockアイコンクリック時にウィンドウを再作成
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
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
});
