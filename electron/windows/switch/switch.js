/**
 * @file このJavaScriptファイルは、「スイッチ」通知ウィンドウの動的な画像設定を担当します。
 * `electronAPI`（preloadスクリプト経由で公開）を通じて、メインプロセスからの`onSwitchType`イベントを待ち受けます。
 * イベントが発生すると、渡された画像のパス（`imagePath`）を受け取り、
 * HTML内の`<img>`要素（ID: `switch-icon`）の`src`属性をそのパスに設定します。
 * これにより、メインプロセスの指示に基づいて表示される画像を動的に変更できます（例：ON/OFFスイッチの切り替え）。
 */
window.electronAPI?.onSwitchType((imagePath) => {
  const img = document.getElementById('switch-icon');
  if (img) {
    img.src = imagePath;
  }
});
