/**
 * @file このJavaScriptファイルは、「トグル」タイプのアニメーション通知の動作を制御します。
 * `bad_posture.png`と`good_posture.png`の2つの画像を約0.7秒ごとに切り替えることで、
 * ユーザーに姿勢の改善を視覚的に促すアニメーションを実装しています。
 * 画像の切り替えは、CSSのトランジションと連動したフェードイン・フェードアウト効果を伴います。
 * メインプロセスによってウィンドウが閉じられる前に、最終的に`bad_posture.png`が表示された状態で
 * アニメーションが停止するように、4.5秒後にタイマーがクリアされます。
 */
// Toggle between two images every ~500ms. Window will be closed by main process after 5s.
(() => {
  const images = ['./bad_posture.png', './good_posture.png'];
  let idx = 0;
  const imgEl = document.getElementById('toggle-img');
  if (!imgEl) return;

  // small helper to swap with fade
  function swap() {
    // fade out
    imgEl.classList.add('image-hidden');
    setTimeout(() => {
      idx = (idx + 1) % images.length;
      imgEl.src = images[idx];
      // fade in
      imgEl.classList.remove('image-hidden');
    }, 260); // match CSS transition timing
  }

  // start toggling after a brief delay so the first image is visible
  const interval = setInterval(swap, 700);

  // 最後にbad_posture.pngを表示するため、4500ms後に停止
  // 0ms: bad (idx=0)
  // 700ms: good (idx=1)
  // 1400ms: bad (idx=0)
  // 2100ms: good (idx=1)
  // 2800ms: bad (idx=0)
  // 3500ms: good (idx=1)
  // 4200ms: bad (idx=0)
  // 4500ms: ここで停止（badのまま）
  setTimeout(() => {
    clearInterval(interval);
  }, 4500);

  console.log('Toggle animation started');
})();

