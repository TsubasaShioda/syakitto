const canvas = document.getElementById('noise-canvas');
const ctx = canvas.getContext('2d');

let w, h;
let animationFrameId;

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}

function noise() {
  const imageData = ctx.createImageData(w, h);
  const buffer32 = new Uint32Array(imageData.data.buffer);
  const len = buffer32.length;

  for (let i = 0; i < len; i++) {
    if (Math.random() < 0.5) {
      buffer32[i] = 0xff000000; // Black
    } else {
      buffer32[i] = 0xffffffff; // White
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function loop() {
  noise();
  animationFrameId = requestAnimationFrame(loop);
}

function init() {
  resize();
  window.addEventListener('resize', resize);
  loop();
}

init();

// Stop the animation after a short period to prevent performance issues
setTimeout(() => {
  cancelAnimationFrame(animationFrameId);
}, 2500); // Stop after 2.5 seconds
