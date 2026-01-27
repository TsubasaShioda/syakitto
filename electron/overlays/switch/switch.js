window.electronAPI?.onSwitchType((imagePath) => {
  const img = document.getElementById('switch-icon');
  if (img) {
    img.src = imagePath;
  }
});
