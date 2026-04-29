(function () {
   "use strict";

   /* ── Data ─────────────────────────────────────────────── */
   const DRAGONS = [
     { name: "Fire Dragon", emoji: "🔥", element: "Ember", desc: "Heroic golden-hour warmth, copper and amber scales, and a welcoming face." },
     { name: "Water Dragon", emoji: "💧", element: "Freshwater", desc: "Graceful river light, translucent blue-green scales, and a calm expression." },
     { name: "Ice Dragon", emoji: "❄️", element: "Arctic", desc: "Crystalline frost detail, polished blue-white scales, and a precise calm gaze." },
     { name: "Snow Dragon", emoji: "🌨️", element: "Alpine", desc: "Soft white texture, bright diffuse light, and a notably gentle presence." },
     { name: "Sea Dragon", emoji: "🌊", element: "Oceanic", desc: "Pearl and teal tones, coastal air, open horizon, and a wise face." },
     { name: "Lava Dragon", emoji: "🌋", element: "Volcanic", desc: "Obsidian structure, molten seams, blue-hour contrast, and a calm powerful expression." },
   ];

   const PARTICLE_COLORS = [
     "rgba(98,182,203,0.9)",
     "rgba(255,159,90,0.85)",
     "rgba(180,220,240,0.8)",
     "rgba(255,200,140,0.7)",
     "rgba(130,200,220,0.85)",
   ];

   /* ── DOM refs ──────────────────────────────────────────── */
   const summonCircle = document.getElementById("summon-circle");
   const particleCanvas = document.getElementById("particle-canvas");
   const dragonCard = document.getElementById("dragon-card");
   const dragonName = document.getElementById("dragon-name");
   const dragonDesc = document.getElementById("dragon-desc");
   const dragonIcon = document.getElementById("dragon-element-icon");
   const muteBtn = document.getElementById("mute-btn");
   const resetBtn = document.getElementById("reset-btn");
   const countSpan = document.getElementById("summon-count");

   /* ── State ─────────────────────────────────────────────── */
   let audioCtx = null;
   let muted = false;
   let summonCount = 0;
   let summoning = false;

   /* ── Audio ─────────────────────────────────────────────── */
   function getAudioCtx() {
     if (!audioCtx) {
       audioCtx = new (window.AudioContext || window.webkitAudioContext)();
     }
     if (audioCtx.state === "suspended") audioCtx.resume();
     return audioCtx;
   }

   function playTone(freq, dur, type, vol, startTime) {
     if (muted) return;
     const ctx = getAudioCtx();
     const t = startTime || ctx.currentTime;
     const osc = ctx.createOscillator();
     const gain = ctx.createGain();
     osc.type = type || "sine";
     osc.frequency.setValueAtTime(freq, t);
     gain.gain.setValueAtTime(vol || 0.12, t);
     gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
     osc.connect(gain).connect(ctx.destination);
     osc.start(t);
     osc.stop(t + dur);
   }

   function playNoise(dur, vol, startTime) {
     if (muted) return;
     const ctx = getAudioCtx();
     const t = startTime || ctx.currentTime;
     const bufferSize = ctx.sampleRate * dur;
     const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
     const data = buffer.getChannelData(0);
     for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
     const src = ctx.createBufferSource();
     src.buffer = buffer;
     const gain = ctx.createGain();
     gain.gain.setValueAtTime(vol || 0.06, t);
     gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
     const filter = ctx.createBiquadFilter();
     filter.type = "bandpass";
     filter.frequency.setValueAtTime(800, t);
     src.connect(filter).connect(gain).connect(ctx.destination);
     src.start(t);
     src.stop(t + dur);
   }

   const SFX = {
     click: function () {
       playTone(520, 0.12, "sine", 0.1);
       playTone(780, 0.08, "triangle", 0.06, getAudioCtx().currentTime + 0.04);
     },
     summon: function () {
       const ctx = getAudioCtx();
       playTone(220, 0.6, "sine", 0.1, ctx.currentTime);
       playTone(330, 0.5, "sine", 0.08, ctx.currentTime + 0.12);
       playTone(440, 0.4, "triangle", 0.07, ctx.currentTime + 0.28);
       playNoise(0.8, 0.04, ctx.currentTime);
       playTone(660, 0.35, "sine", 0.06, ctx.currentTime + 0.5);
     },
     success: function () {
       const ctx = getAudioCtx();
       playTone(523, 0.25, "sine", 0.12, ctx.currentTime);
       playTone(659, 0.25, "sine", 0.1, ctx.currentTime + 0.08);
       playTone(784, 0.3, "sine", 0.12, ctx.currentTime + 0.16);
       playTone(1047, 0.5, "triangle", 0.09, ctx.currentTime + 0.24);
       playTone(1319, 0.6, "sine", 0.06, ctx.currentTime + 0.35);
     },
     reset: function () {
       playTone(440, 0.1, "sine", 0.08);
       playTone(330, 0.12, "triangle", 0.06, getAudioCtx().currentTime + 0.05);
     },
   };

   /* ── Particles ─────────────────────────────────────────── */
   function spawnParticles(count) {
     for (let i = 0; i < count; i++) {
       const p = document.createElement("span");
       p.className = "particle";
       const size = 3 + Math.random() * 6;
       const angle = Math.random() * Math.PI * 2;
       const speed = 40 + Math.random() * 80;
       const dx = Math.cos(angle) * speed;
       const dy = Math.sin(angle) * speed;
       const dur = 0.6 + Math.random() * 0.8;
       const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
       p.style.cssText = `
         width:${size}px; height:${size}px;
         background: radial-gradient(circle, ${color}, transparent);
         left:50%; top:50%;
         transform: translate(-50%,-50%);
         box-shadow: 0 0 ${size * 2}px ${color.replace(/[\d.]+\)$/, "0.4)")}
       `;
       particleCanvas.appendChild(p);

       const id = setTimeout(function () {
         p.style.transition = `transform ${dur}s cubic-bezier(0.22,1,0.36,1), opacity ${dur}s ease`;
         p.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
         p.style.opacity = "0";
         setTimeout(function () { p.remove(); }, dur * 1000);
       }, 20);
     }
   }

   function rainParticles(count) {
     for (let i = 0; i < count; i++) {
       setTimeout(function () {
         const p = document.createElement("span");
         p.className = "particle";
         const size = 2 + Math.random() * 4;
         const x = Math.random() * 100;
         const dy = 60 + Math.random() * 120;
         const dur = 1.2 + Math.random() * 1.5;
         const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
         p.style.cssText = `
           width:${size}px; height:${size}px;
           background: radial-gradient(circle, ${color}, transparent);
           left:${x}%; top:-10px;
           box-shadow: 0 0 ${size * 2}px ${color.replace(/[\d.]+\)$/, "0.3")}
         `;
         particleCanvas.appendChild(p);
         const id = setTimeout(function () {
           p.style.transition = `transform ${dur}s ease-in, opacity ${dur}s ease`;
           p.style.transform = `translateY(${dy}px)`;
           p.style.opacity = "0";
           setTimeout(function () { p.remove(); }, dur * 1000);
         }, 30);
       }, Math.random() * 600);
     }
   }

   /* ── Summon Flow ───────────────────────────────────────── */
   function pickDragon() {
     return DRAGONS[Math.floor(Math.random() * DRAGONS.length)];
   }

   function beginSummon() {
     if (summoning) return;
     summoning = true;
     SFX.click();

     summonCircle.classList.add("summoning");
     summonCircle.setAttribute("aria-pressed", "true");

     spawnParticles(25);

     setTimeout(function () {
       SFX.summon();
       spawnParticles(35);
     }, 250);

     setTimeout(function () {
       const dragon = pickDragon();
       showDragon(dragon);
       finishSummon();
     }, 1200);
   }

   function showDragon(dragon) {
     SFX.success();
     dragonName.textContent = dragon.name;
     dragonDesc.textContent = dragon.desc;
     dragonIcon.innerHTML = dragon.emoji;
     dragonCard.classList.remove("hidden");
     resetBtn.classList.remove("hidden");
     summonCircle.classList.remove("summoning");
     summonCircle.classList.add("success");
     rainParticles(30);
     summonCount++;
     countSpan.textContent = summonCount;
   }

   function finishSummon() {
     summoning = false;
   }

   function resetSummon() {
     if (summoning) return;
     summoning = true;
     SFX.reset();
     dragonCard.classList.add("hidden");
     resetBtn.classList.add("hidden");
     summonCircle.classList.remove("success");
     spawnParticles(12);
     setTimeout(function () { summoning = false; }, 400);
   }

   /* ── Events ────────────────────────────────────────────── */
   summonCircle.addEventListener("click", beginSummon);
   summonCircle.addEventListener("keydown", function (e) {
     if (e.key === "Enter" || e.key === " ") {
       e.preventDefault();
       beginSummon();
     }
   });

   muteBtn.addEventListener("click", function () {
     muted = !muted;
     muteBtn.setAttribute("aria-pressed", String(muted));
     muteBtn.querySelector(".mute-icon").textContent = muted ? "🔇" : "🔊";
   });

   resetBtn.addEventListener("click", resetSummon);
   resetBtn.addEventListener("keydown", function (e) {
     if (e.key === "Enter" || e.key === " ") {
       e.preventDefault();
       resetSummon();
     }
   });

   /* ── Init subtle glow particles on load ───────────────── */
   setTimeout(function () { rainParticles(8); }, 600);

})();
