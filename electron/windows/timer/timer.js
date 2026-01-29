/**
 * @file このJavaScriptファイルは、ポモドーロタイマーのオーバーレイウィンドウの動作を制御します。
 * `electronAPI`（preloadスクリプト経由で公開）を通じてメインプロセスと通信します。
 *
 * 主な機能：
 * - `onUpdateTimer`リスナー：メインプロセスからタイマーの状態（残り時間、アクティブ状態、セッション種別）を受け取り、
 *   UI（時間表示、ボタンのテキスト、背景色）を動的に更新します。
 * - 各種ボタンのクリックイベントハンドラ：「開始/一時停止」「終了」「閉じる」ボタンがクリックされた際に、
 *   対応する処理をメインプロセスに要求します。
 */
// タイマー表示を更新
window.electronAPI?.onUpdateTimer((data) => {
  const { timeLeft, isActive, sessionType } = data;

  // 時間を分:秒形式に変換
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // DOM更新（時間）
  document.getElementById('timeDisplay').textContent = timeString;

  // セッションタイプを更新
  const sessionTypeElement = document.getElementById('sessionType');
  if (sessionTypeElement && sessionType) {
    sessionTypeElement.textContent = sessionType;
  }

  // 休憩時は背景色を赤系に変更（作業を止めて休憩を促す）
  const timerWindow = document.querySelector('.timer-window');
  if (timerWindow && sessionType) {
    const isBreakTime = sessionType === '短い休憩' || sessionType === '長い休憩';
    timerWindow.style.background = isBreakTime ? '#e57373' : '#a8d5ba';
  }

  // ボタンのテキストを更新
  const toggleBtn = document.getElementById('toggleBtn');
  if (toggleBtn) {
    toggleBtn.textContent = isActive ? '一時停止' : '開始';
  }
});

// 開始/一時停止ボタン
document.getElementById('toggleBtn').addEventListener('click', () => {
  window.electronAPI?.toggleTimer();
});

// 終了ボタン
document.getElementById('resetBtn').addEventListener('click', () => {
  window.electronAPI?.resetTimer();
});

// 閉じるボタン
document.getElementById('closeBtn').addEventListener('click', () => {
  window.electronAPI?.closeTimerWindow();
});
