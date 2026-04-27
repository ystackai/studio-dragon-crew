import { render } from './visuals';
import { AudioEngine } from './audio';
/* ---- Easing functions ---- */
function easeInCubic(t) {
    return t * t * t;
}
function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}
/* ---- State ---- */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
if (!ctx)
    throw new Error('Canvas 2D context unavailable');
const audio = new AudioEngine();
let audioContextResumed = false;
/* ---- Sizing ---- */
function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
}
window.addEventListener('resize', resize);
resize();
const w = () => window.innerWidth;
const h = () => window.innerHeight;
/* ---- Input tracking ---- */
let breathIntensity = 0.0;
let targetIntensity = 0.0;
let inputVelocity = 0.0;
let lastPointerX = 0;
let lastPointerY = 0;
let anyInputActive = false;
let fadeStartTime = 0;
const FADE_DURATION = 400;
function getRelativeIntensity(x, y) {
    const cx = w() * 0.5;
    const cy = h() * 0.4;
    const dx = (x - cx) / (w() * 0.5);
    const dy = (y - cy) / (h() * 0.5);
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 1);
    return 1 - dist;
}
canvas.addEventListener('pointerdown', () => { anyInputActive = true; });
canvas.addEventListener('pointerup', () => { anyInputActive = false; fadeStartTime = performance.now(); });
canvas.addEventListener('pointerleave', () => { anyInputActive = false; fadeStartTime = performance.now(); });
canvas.addEventListener('pointermove', (e) => {
    if (!audioContextResumed) {
        audio.init();
        audio.resume();
        audioContextResumed = true;
    }
    const dx = e.clientX - lastPointerX;
    const dy = e.clientY - lastPointerY;
    inputVelocity = Math.min(Math.sqrt(dx * dx + dy * dy) / 80, 1);
    targetIntensity = getRelativeIntensity(e.clientX, e.clientY);
    anyInputActive = true;
    fadeStartTime = 0;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
});
window.addEventListener('keydown', (e) => {
    if (!audioContextResumed) {
        audio.init();
        audio.resume();
        audioContextResumed = true;
    }
    anyInputActive = true;
    targetIntensity = 1.0;
    inputVelocity = 0.8;
    fadeStartTime = 0;
});
window.addEventListener('keyup', () => {
    anyInputActive = false;
    fadeStartTime = performance.now();
});
/* ---- Animation loop ---- */
let prevTime = performance.now();
let elapsed = 0;
function loop(now) {
    {
        let dt = (now - prevTime) / 1000;
        prevTime = now;
        // Delta-time clamp: max 50ms to prevent spiral of death
        dt = Math.min(dt, 0.05);
        if (dt < 0)
            dt = 0;
        elapsed += dt;
        // Breath intensity ramp
        if (anyInputActive) {
            // Ramp up via easeInCubic
            const rawDelta = (targetIntensity - breathIntensity) * dt * 4;
            const easedDelta = easeInCubic(Math.min(Math.abs(rawDelta) / 0.1, 1)) * Math.sign(rawDelta) * 0.1;
            breathIntensity = Math.max(0, Math.min(1, breathIntensity + easedDelta));
            // Also blend toward target smoothly
            breathIntensity += (targetIntensity - breathIntensity) * dt * 3;
            breathIntensity = Math.max(0, Math.min(1, breathIntensity));
        }
        else {
            // Drain via easeOutExpo
            const fadeProgress = fadeStartTime > 0 ? (now - fadeStartTime) / FADE_DURATION : 1;
            const clampedProgress = Math.min(fadeProgress, 1);
            const easedT = easeOutExpo(clampedProgress);
            breathIntensity = Math.max(0, breathIntensity * (1 - easedT * dt * 5));
            if (fadeProgress >= 1)
                fadeStartTime = 0;
        }
        // Decay velocity
        inputVelocity *= 0.9;
        if (inputVelocity < 0.001)
            inputVelocity = 0;
        // Audio update
        audio.update(breathIntensity, inputVelocity, elapsed);
        if (!anyInputActive) {
            audio.drain();
        }
        // Render
        const sceneConfig = {
            width: w(),
            height: h(),
            breathIntensity,
            time: elapsed,
        };
        render(ctx, sceneConfig);
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame((t) => {
    prevTime = t;
    requestAnimationFrame(loop);
});
//# sourceMappingURL=main.js.map