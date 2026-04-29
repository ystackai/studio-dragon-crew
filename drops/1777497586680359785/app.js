(() => {
  "use strict";

  /* ========== Audio Engine ========== */
  let audioCtx = null;
  let masterGain = null;
  let isMuted = false;
  let audioAvailable = false;

  function ensureAudioContext() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.5;
        masterGain.connect(audioCtx.destination);
        audioAvailable = true;
      } catch (_) {
        audioAvailable = false;
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  function playTone(freq, type, duration, startTime, gain) {
    if (!audioAvailable || isMuted) return;
    const t = startTime || audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t);
    osc.stop(t + duration);
  }

  function playNoise(duration, startTime, gain, filterFreq) {
    if (!audioAvailable || isMuted) return;
    const t = startTime || audioCtx.currentTime;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(gain || 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq || 800;
    filter.Q.value = 2;
    source.connect(filter);
    filter.connect(g);
    g.connect(masterGain);
    source.start(t);
    source.stop(t + duration);
  }

  /* Dragon-specific sound palettes */
  const dragonSounds = {
    fire: {
      click: () => {
        const t = audioCtx.currentTime;
        playTone(220, "sawtooth", 0.12, t, 0.2);
        playTone(330, "sine", 0.15, t + 0.02, 0.15);
      },
      summon: () => {
        const t = audioCtx.currentTime;
        playTone(180, "sawtooth", 0.5, t, 0.25);
        playTone(277, "sawtooth", 0.5, t + 0.05, 0.2);
        playTone(360, "sawtooth", 0.6, t + 0.1, 0.15);
        playTone(480, "sawtooth", 0.3, t + 0.15, 0.2);
        playTone(660, "sine", 0.5, t + 0.2, 0.15);
        playNoise(0.35, t, 0.08, 600);
        playNoise(0.2, t + 0.1, 0.06, 1200);
        playTone(880, "triangle", 0.4, t + 0.25, 0.12);
      },
      color: "#ff6b35",
    },
    water: {
      click: () => {
        const t = audioCtx.currentTime;
        playTone(440, "sine", 0.15, t, 0.2);
        playTone(554, "sine", 0.12, t + 0.03, 0.15);
      },
      summon: () => {
        const t = audioCtx.currentTime;
        playTone(392, "sine", 0.6, t, 0.2);
        playTone(440, "sine", 0.5, t + 0.08, 0.18);
        playTone(523, "sine", 0.5, t + 0.15, 0.15);
        playTone(659, "sine", 0.4, t + 0.2, 0.12);
        playNoise(0.4, t, 0.06, 2000);
        playNoise(0.25, t + 0.15, 0.05, 3000);
        playTone(784, "triangle", 0.35, t + 0.25, 0.1);
      },
      color: "#4fc3f7",
    },
    ice: {
      click: () => {
        const t = audioCtx.currentTime;
        playTone(600, "sine", 0.08, t, 0.15);
        playTone(900, "sine", 0.06, t + 0.02, 0.1);
      },
      summon: () => {
        const t = audioCtx.currentTime;
        playTone(784, "sine", 0.5, t, 0.15);
        playTone(988, "sine", 0.4, t + 0.06, 0.12);
        playTone(1175, "sine", 0.4, t + 0.12, 0.1);
        playTone(1318, "sine", 0.35, t + 0.18, 0.12);
        playNoise(0.2, t, 0.05, 4000);
        playNoise(0.15, t + 0.1, 0.04, 5000);
        playTone(1568, "triangle", 0.3, t + 0.25, 0.08);
      },
      color: "#80deea",
    },
    snow: {
      click: () => {
        const t = audioCtx.currentTime;
        playTone(500, "sine", 0.1, t, 0.15);
        playTone(660, "sine", 0.08, t + 0.02, 0.1);
      },
      summon: () => {
        const t = audioCtx.currentTime;
        playTone(523, "sine", 0.5, t, 0.18);
        playTone(587, "sine", 0.45, t + 0.07, 0.15);
        playTone(659, "sine", 0.4, t + 0.14, 0.12);
        playTone(784, "sine", 0.35, t + 0.2, 0.1);
        playNoise(0.3, t, 0.04, 3500);
        playNoise(0.2, t + 0.1, 0.03, 4500);
        playTone(880, "triangle", 0.25, t + 0.25, 0.08);
      },
      color: "#e0e8ff",
    },
    sea: {
      click: () => {
        const t = audioCtx.currentTime;
        playTone(330, "sine", 0.12, t, 0.18);
        playTone(415, "sine", 0.1, t + 0.02, 0.12);
      },
      summon: () => {
        const t = audioCtx.currentTime;
        playTone(262, "sine", 0.6, t, 0.2);
        playTone(294, "sine", 0.5, t + 0.08, 0.18);
        playTone(330, "sine", 0.5, t + 0.16, 0.15);
        playTone(392, "sine", 0.4, t + 0.22, 0.12);
        playNoise(0.45, t, 0.06, 400);
        playNoise(0.3, t + 0.15, 0.05, 800);
        playTone(523, "triangle", 0.35, t + 0.28, 0.1);
      },
      color: "#00897b",
    },
    lava: {
      click: () => {
        const t = audioCtx.currentTime;
        playTone(150, "sawtooth", 0.15, t, 0.2);
        playTone(200, "sawtooth", 0.12, t + 0.04, 0.15);
      },
      summon: () => {
        const t = audioCtx.currentTime;
        playTone(130, "sawtooth", 0.55, t, 0.25);
        playTone(165, "sawtooth", 0.5, t + 0.06, 0.2);
        playTone(196, "sawtooth", 0.45, t + 0.12, 0.15);
        playTone(262, "sawtooth", 0.4, t + 0.18, 0.18);
        playNoise(0.5, t, 0.1, 300);
        playNoise(0.3, t + 0.1, 0.08, 600);
        playTone(392, "triangle", 0.3, t + 0.25, 0.1);
      },
      color: "#ef5350",
    },
  };

  function playClickSound(dragon) {
    ensureAudioContext();
    const s = dragonSounds[dragon];
    if (s && s.click) s.click();
  }

  function playSummonSound(dragon) {
    ensureAudioContext();
    const s = dragonSounds[dragon];
    if (s && s.summon) s.summon();
  }

  function playAllSummonedSound() {
    ensureAudioContext();
    const t = audioCtx.currentTime;
    [262, 330, 392, 523, 659, 784].forEach((f, i) => {
      playTone(f, i % 2 === 0 ? "sine" : "triangle", 0.6, t + i * 0.1, 0.12);
    });
    playNoise(0.5, t + 0.3, 0.06, 2000);
  }

  function playAlreadySummoned() {
    ensureAudioContext();
    const t = audioCtx.currentTime;
    playTone(200, "square", 0.15, t, 0.1);
    playTone(180, "square", 0.12, t + 0.08, 0.08);
  }

  function playResetSound() {
    ensureAudioContext();
    const t = audioCtx.currentTime;
    [784, 659, 523, 392].forEach((f, i) => {
      playTone(f, "sine", 0.3, t + i * 0.08, 0.12);
    });
  }

  function toggleMute() {
    isMuted = !isMuted;
    if (masterGain) {
      masterGain.gain.value = isMuted ? 0 : 0.5;
    }
    return isMuted;
  }

  /* ========== Particles ========== */
  const canvas = document.getElementById("particle-canvas");
  const ctx = canvas.getContext("2d");
  let particles = [];
  let animatingParticles = false;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  function spawnParticles(element, color) {
    const rect = element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.012 + Math.random() * 0.018,
        size: 2 + Math.random() * 4,
        color: color || "#b388ff",
      });
    }
    if (!animatingParticles) {
      animatingParticles = true;
      animateParticles();
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.life > 0);
    if (particles.length === 0) {
      animatingParticles = false;
      return;
    }
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life -= p.decay;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(animateParticles);
  }

  /* ========== DOM & State ========== */
  const dragonCards = document.querySelectorAll(".dragon-card");
  const statusBar = document.getElementById("status-text");
  const counterValue = document.getElementById("counter-value");
  const toastEl = document.getElementById("toast");
  const muteBtn = document.getElementById("mute-btn");
  const resetBtn = document.getElementById("reset-btn");
  let summoned = new Set();
  const totalDragons = dragonCards.length;
  let toastTimer = null;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function showToast(msg, duration) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    toastEl.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("visible");
      setTimeout(() => { toastEl.hidden = true; }, 300);
    }, duration || 2000);
  }

  function updateCounter() {
    counterValue.textContent = summoned.size;
  }

  function updateStatus(dragonName, action) {
    const summonMsgs = {
      "Fire Dragon": "The Fire Dragon answers your call! Warm amber light fills the air.",
      "Water Dragon": "The Water Dragon flows from the currents! Silver ripples cascade across the stage.",
      "Ice Dragon": "The Ice Dragon crystallizes into being! Frost sparkles in every direction.",
      "Snow Dragon": "The Snow Dragon drifts down gently! Soft flakes swirl in a luminous glow.",
      "Sea Dragon": "The Sea Dragon rises from the deep! A deep resonance fills the space.",
      "Lava Dragon": "The Lava Dragon emerges from molten earth! Warm light pulses with ancient power.",
    };
    const msgs = {
      summon: summonMsgs[dragonName] || `${dragonName} has joined the crew!`,
      duplicate: `${dragonName} has already been summoned! Wait for the full crew to assemble.`,
      complete: "All six dragons are present. The crew is complete!",
      reset: "The dragons return to their elemental realms. Choose again to summon a new crew.",
    };
    statusBar.textContent = msgs[action] || "";
  }

  function summonDragon(card, dragonKey) {
    if (summoned.has(dragonKey)) {
      playAlreadySummoned();
      updateStatus(card.querySelector(".dragon-name").textContent, "duplicate");
      card.classList.add("shake");
      setTimeout(() => card.classList.remove("shake"), 400);
      return;
    }

    ensureAudioContext();
    const ring = card.querySelector(".summon-ring");
    const dragonName = card.querySelector(".dragon-name").textContent;
    const color = dragonSounds[dragonKey]?.color || "#b388ff";

    playClickSound(dragonKey);

    ring.classList.remove("active");
    void ring.offsetWidth;
    ring.classList.add("active");

    if (!reducedMotion) {
      spawnParticles(card, color);
    }

    playSummonSound(dragonKey);

    card.classList.add("summoned");
    card.setAttribute("aria-label", `Summoned ${(card.getAttribute("aria-label") || "").replace("Summon ", "").trim()}`);
    summoned.add(dragonKey);
    updateCounter();
    updateStatus(dragonName, "summon");

    if (summoned.size === totalDragons) {
      setTimeout(() => {
        playAllSummonedSound();
        updateStatus("", "complete");
         showToast("The Dragon Crew has gathered. Feel the magic pulse through every element!", 3500);
        if (!reducedMotion) {
          document.querySelector(".dragon-grid").classList.add("all-summoned");
          setTimeout(() => {
            document.querySelector(".dragon-grid").classList.remove("all-summoned");
          }, 1000);
        }
      }, 400);
    }
  }

  function resetAll() {
    if (summoned.size === 0) return;
    summoned.clear();
    dragonCards.forEach(c => {
      c.classList.remove("summoned");
      const dragon = c.getAttribute("data-dragon");
      const ariaBase = {
        fire: "Summon Fire Dragon",
        water: "Summon Water Dragon",
        ice: "Summon Ice Dragon",
        snow: "Summon Snow Dragon",
        sea: "Summon Sea Dragon",
        lava: "Summon Lava Dragon",
      };
      c.setAttribute("aria-label", ariaBase[dragon] || `Summon ${dragon} Dragon`);
    });
    updateCounter();
    updateStatus("", "reset");
    playResetSound();
    showToast("The crew has dispersed. The magic lingers — tap a dragon to begin again.", 1500);
  }

  /* ========== Event Wiring ========== */
  dragonCards.forEach(card => {
    const dragonKey = card.getAttribute("data-dragon");

    function handleSummon(e) {
      e.preventDefault();
      summonDragon(card, dragonKey);
    }

    card.addEventListener("click", handleSummon);
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        handleSummon(e);
      }
    });
  });

  muteBtn.addEventListener("click", () => {
    const newMuted = toggleMute();
    muteBtn.querySelector(".icon").textContent = newMuted ? "🔇" : "🔊";
    muteBtn.classList.toggle("muted", newMuted);
    muteBtn.setAttribute("aria-label", newMuted ? "Unmute sound" : "Mute sound");
   });

  resetBtn.addEventListener("click", resetAll);

  /* ========== Init ========== */
  updateCounter();
})();
