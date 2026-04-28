(function () {
  "use strict";

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const hint = document.getElementById("hint");
  let w = 0;
  let h = 0;
  let active = false;
  let pulse = 0;
  let pointer = { x: 0.5, y: 0.5 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function engage(x, y) {
    active = true;
    pulse = 1;
    pointer = { x: x / Math.max(1, w), y: y / Math.max(1, h) };
    if (hint) hint.textContent = "hold, drag, and release";
  }

  function draw(t) {
    ctx.fillStyle = "#08090c";
    ctx.fillRect(0, 0, w, h);

    const cx = pointer.x * w;
    const cy = pointer.y * h;
    const count = 22;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + t * 0.00035;
      const r = 70 + i * 13 + pulse * 120;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      ctx.strokeStyle = `rgba(235, 80, 46, ${0.1 + (i % 5) * 0.04})`;
      ctx.lineWidth = 1 + (i % 4);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    ctx.fillStyle = active ? "#ffb38a" : "#ef4b2f";
    ctx.beginPath();
    ctx.arc(cx, cy, 16 + pulse * 18, 0, Math.PI * 2);
    ctx.fill();

    pulse *= active ? 0.94 : 0.9;
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  canvas.addEventListener("pointerdown", (event) => {
    canvas.setPointerCapture(event.pointerId);
    engage(event.clientX, event.clientY);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!active) return;
    engage(event.clientX, event.clientY);
  });
  canvas.addEventListener("pointerup", () => {
    active = false;
    if (hint) hint.textContent = "press space or click";
  });
  window.addEventListener("keydown", (event) => {
    if (event.code === "Space") engage(w / 2, h / 2);
  });

  resize();
  requestAnimationFrame(draw);
})();
