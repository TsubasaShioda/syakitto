// タイマー表示を更新
window.electronAPI?.onUpdateTimer((data) => {
  const { timeLeft } = data;

  // 時間を分:秒形式に変換
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // DOM更新（時間のみ）
  document.getElementById('timeDisplay').textContent = timeString;
});

// 閉じるボタン
document.getElementById('closeBtn').addEventListener('click', () => {
  window.electronAPI?.closeTimerWindow();
});
