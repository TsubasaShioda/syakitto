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
