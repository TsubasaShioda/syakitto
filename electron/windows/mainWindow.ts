/**
 * @file このファイルは、Electronアプリケーションのメインブラウザウィンドウを作成および設定する役割を担います。
 * `createMainWindow`関数をエクスポートし、この関数が呼び出されると、
 * アプリケーションの主要なUIコンポーネントを表示するための`BrowserWindow`インスタンスを生成します。
 * ウィンドウの寸法、Webコンテンツのセキュリティ設定（preloadスクリプトの指定など）、
 * 開発環境と本番環境でロードするURLの分岐処理、外部リンクの挙動、ウィンドウが閉じられる際の動作などが定義されています。
 */
import { BrowserWindow, shell, app } from 'electron';
import * as path from 'path';

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
    // カスタムプロトコル app:// を使用（絶対パス問題を解決）
    mainWindow.loadURL('app://./index.html');
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