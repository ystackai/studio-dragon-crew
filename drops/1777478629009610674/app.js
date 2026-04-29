/**
 * Ice Dragon Core Interaction Loop
 * State machine: locked -> charging -> exhaled -> reset -> locked
 */
(() => {
  'use strict';

  // DOM refs
  const stage = document.getElementById('dragon-stage');
  const muteBtn = document.getElementById('mute-btn');
  const muteLabel = document.getElementById('mute-label');
  const muteIconOn = muteBtn.querySelector('.volume-icon');
  const muteIconOff = muteBtn.querySelector('.volume-off-icon');
  const instructions = document.getElementById('instructions');
  const canvas = document.getElementById('particle-canvas');
  const statusDisplay = document.getElementById('status-display');

  // --- State machine ---
  const State = {
    LOCKED: 'locked',
    CHARGING: 'charging',
    EXHALED: 'exhaled',
    COOLDOWN: 'cooldown',
   };
  let currentState = State.LOCKED;
  let stateTimer = null;

  // --- Particle system ---
  let particles = [];
  let animFrameId = null;
  const ctxRef = canvas ? canvas.getContext('2d') : null;

  function resizeCanvas() {
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
   }

  class IceParticle {
    constructor(originX, originY, options = {}) {
      this.x = originX + (Math.random() - 0.5) * 40;
      this.y = originY + (Math.random() - 0.5) * 20;
      this.vx = (Math.random() - 0.3) * 4;
      this.vy = -Math.random() * 2 - 0.5;
      this.life = 1;
      this.decay = 0.005 + Math.random() * 0.01;
      this.radius = 2 + Math.random() * 4;
      this.opacity = 0.6 + Math.random() * 0.4;
      this.hue = 190 + Math.random() * 30;
      this.sparkle = Math.random() > 0.5;
      this.gravity = options.gravity || 0.02;
     }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.vx *= 0.99;
      this.life -= this.decay;
     }

    draw(c) {
      if (this.life <= 0) return;
      c.save();
      c.globalAlpha = this.life * this.opacity;

      if (this.sparkle) {
        c.fillStyle = `hsla(${this.hue}, 80%, 85%, ${this.life})`;
        c.shadowColor = `hsla(${this.hue}, 90%, 70%, ${this.life * 0.8})`;
        c.shadowBlur = 8;
        c.beginPath();
        // Diamond shape
        c.moveTo(this.x, this.y - this.radius);
        c.lineTo(this.x + this.radius * 0.6, this.y);
        c.lineTo(this.x, this.y + this.radius);
        c.lineTo(this.x - this.radius * 0.6, this.y);
        c.closePath();
        c.fill();
       } else {
        c.fillStyle = `hsla(${this.hue}, 70%, 75%, ${this.life})`;
        c.shadowColor = `hsla(${this.hue}, 80%, 65%, ${this.life * 0.5})`;
        c.shadowBlur = 5;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fill();
       }

      c.restore();
     }
   }

  function spawnExhaleParticles(count, mouthX, mouthY) {
    for (let i = 0; i < count; i++) {
      particles.push(new IceParticle(
        mouthX,
        mouthY,
        { gravity: -0.03 + Math.random() * 0.02 }
      ));
    }
  }

  function spawnAmbientParticles() {
    const w = canvas.width;
    const h = canvas.height;
    for (let i = 0; i < 2; i++) {
      particles.push(new IceParticle(
        Math.random() * w,
        h + 10,
        { gravity: -0.01 }
       ));
     }
   }

  function renderLoop() {
    if (!ctxRef || !canvas) return;
    ctxRef.clearRect(0, 0, canvas.width, canvas.height);

    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      p.update();
      p.draw(ctxRef);
     });

    animFrameId = requestAnimationFrame(renderLoop);
   }

  function startRenderLoop() {
    if (!animFrameId) {
      resizeCanvas();
      animFrameId = requestAnimationFrame(renderLoop);
     }
   }

  // --- State transitions ---

  function setState(state) {
    currentState = state;

    // Remove all state classes
    stage.classList.remove('locked', 'charging', 'exhaled', 'cooldown');

    // Add current state class
    stage.classList.add(state);

    // Update status display
    if (statusDisplay) {
      const labels = {
        [State.LOCKED]: '⬡ TRIGGER LOCKED — READY',
        [State.CHARGING]: '◉ CHARGING...',
        [State.EXHALED]: '✦ Exhale!',
        [State.COOLDOWN]: '◌ Cooling...',
       };
      statusDisplay.textContent = labels[state] || '';
     }

    // Instructions visibility
    if (state === State.LOCKED) {
      instructions.style.opacity = '0.7';
     } else {
      instructions.style.opacity = '0';
     }
   }

  function triggerExhale() {
    if (currentState !== State.LOCKED) return;

     // Phase 1: Click feedback + charging
    DragonAudio.playClick();
    setState(State.CHARGING);

    stateTimer = setTimeout(() => {
      // Phase 2: Transition sound + exhale
      DragonAudio.playTransition();
      setState(State.EXHALED);
      DragonAudio.startWind();

       // Spawn burst of particles from mouth region
      if (canvas) {
        const mouth = document.getElementById('dragon-mouth');
        if (mouth) {
          const stageRect = stage.getBoundingClientRect();
          const mouthRect = mouth.getBoundingClientRect();
          const mx = mouthRect.left + mouthRect.width / 2 - stageRect.left;
          const my = mouthRect.top + mouthRect.height - stageRect.top;
          spawnExhaleParticles(120, mx, my);
         }
       }

      // Phase 3: Success chime after exhale builds
      setTimeout(() => {
        DragonAudio.playSuccess();
         // Second particle burst on success
        if (canvas) {
          const w = canvas.width;
          const h = canvas.height;
          spawnExhaleParticles(60, w / 2, h * 0.45);
         }

        // Phase 4: Cooldown then reset
        stateTimer = setTimeout(() => {
          DragonAudio.stopWind();
          DragonAudio.playReset();
          setState(State.COOLDOWN);

          stateTimer = setTimeout(() => {
            setState(State.LOCKED);
            stateTimer = null;
           }, 800);
         }, 2500);
       }, 300);
     }, 600);
   }

  // --- Ambient idle particles ---
  let ambientInterval = null;
  function startAmbient() {
    if (ambientInterval) return;
    ambientInterval = setInterval(() => {
      if (currentState === State.LOCKED && canvas) {
        spawnAmbientParticles();
       }
     }, 400);
   }

  // --- Event wiring ---

  // Click/tap on dragon visual triggers exhale (if unlocked)
  stage.addEventListener('click', (e) => {
     // Don't trigger if clicking mute button
    if (e.target === muteBtn || muteBtn.contains(e.target)) return;
    triggerExhale();
   });

  // Space bar
  document.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.key === ' ') && !e.repeat) {
      e.preventDefault();
      triggerExhale();
     }
   });

  // Mute toggle
  muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isMuted = DragonAudio.isMuted();
    const newVal = !isMuted;
    DragonAudio.setMute(newVal);

    muteBtn.setAttribute('aria-pressed', String(newVal));
    muteLabel.textContent = newVal ? 'UNMUTE' : 'MUTE';
    muteIconOn.classList.toggle('hidden', newVal);
    muteIconOn.classList.toggle('visible', !newVal);
    muteIconOff.classList.toggle('hidden', !newVal);
    muteIconOff.classList.toggle('visible', newVal);
   });

  // --- Init ---
  function init() {
    setState(State.LOCKED);
    startRenderLoop();
    startAmbient();

    // Audio context must start on user gesture
    const firstInteraction = (e) => {
      DragonAudio.init();
      document.removeEventListener('pointerdown', firstInteraction);
      document.removeEventListener('keydown', firstInteraction);
     };
    document.addEventListener('pointerdown', firstInteraction);
    document.addEventListener('keydown', firstInteraction);

    window.addEventListener('resize', resizeCanvas);
   }

  // Go
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
   } else {
    init();
   }
})();
