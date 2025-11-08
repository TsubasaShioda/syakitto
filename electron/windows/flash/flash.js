// This script is not strictly necessary for the flash effect itself,
// but it's good practice to have a way to programmatically close the window
// or interact with the main process if needed in the future.

// For now, we can just have it close the window after the animation.
setTimeout(() => {
  window.close();
}, 400); // Same as animation duration
