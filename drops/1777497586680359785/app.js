/* ===== Dragon's Breath — Core Loop ===== */
(function () {
    'use strict';

    /* ---------- State ---------- */
    var STATE = {
        IDLE: 'idle',
        CHARGING: 'charging',
        BREATHING: 'breathing',
        WIFF: 'whiff',
        COOLDOWN: 'cooldown'
     };

    var MIN_CHARGE = 10;

    var currentState = STATE.IDLE;
    var chargeLevel = 0;
    var chargeInterval = null;
    var cooldownTimeout = null;
    var audioCtx = null;
    var masterGain = null;
    var muted = false;
    var audioEngineBroken = false;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Bundled audio buffers for crisp, low-latency playback */
    var audioBuffers = {};
    var audioBuffersLoaded = false;

    /* Audio asset manifest: 5 interaction sounds */
    var AUDIO_ASSETS = [
        { key: 'input',    src: 'audio/spark.wav'  },
        { key: 'transition', src: 'audio/whoosh.wav' },
        { key: 'success',  src: 'audio/chime.wav'  },
        { key: 'failure',  src: 'audio/thud.wav'   },
        { key: 'reset',    src: 'audio/exhale.wav' }
    ];

    var CHARGE_RATE = 0.45; // percent per tick
    var COOLDOWN_MS = 1500;
    var CHARGE_TICK_MS = 8;

    /* ---------- DOM refs ---------- */
    var dragonArea = document.getElementById('dragonArea');
    var statusText = document.getElementById('statusText');
    var chargeFill = document.getElementById('chargeFill');
    var particleCanvas = document.getElementById('particleCanvas');
    var muteBtn = document.getElementById('muteBtn');
    var muteIcon = document.getElementById('muteIcon');
    var dragonSvg = document.getElementById('dragonSvg');

    /* ---------- Stars ---------- */
    (function createStars() {
        if (reducedMotion) return;
        var container = document.getElementById('stars');
        for (var i = 0; i < 80; i++) {
            var s = document.createElement('div');
            s.className = 'star';
            s.style.left = (Math.random() * 100) + '%';
            s.style.top = (Math.random() * 100) + '%';
            var size = 1 + Math.random() * 2;
            s.style.width = size + 'px';
            s.style.height = size + 'px';
            s.style.setProperty('--delay', (Math.random() * 4) + 's');
            s.style.setProperty('--dur', (2 + Math.random() * 3) + 's');
            container.appendChild(s);
        }
    })();

      /* ========== Audio Engine ========== */
    var chargeOsc1 = null;
    var chargeOsc2 = null;
    var chargeGain1 = null;
    var chargeGain2 = null;
    var hoverOsc = null;
    var hoverGain = null;


    function ensureAudioCtx() {
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                masterGain = audioCtx.createGain();
                masterGain.gain.value = muted ? 0 : 0.6;
                masterGain.connect(audioCtx.destination);
              } catch (e) {
                audioCtx = null;
                return false;
              }
          }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
          }
        return true;
      }

      /* Load bundled WAV audio assets */
         var audioLoadPromise = null;

     /* No-op helper for fallback when no procedural audio needed */
    function noop() {}

    function loadAudioBuffers() {
        if (audioLoadPromise) return audioLoadPromise;
        audioLoadPromise = new Promise(function (resolve) {
            if (!ensureAudioCtx()) {
                audioBuffersLoaded = false;
                resolve(false);
                return;
            }
            var total = AUDIO_ASSETS.length;
            var loaded = 0;
            var failed = false;

            AUDIO_ASSETS.forEach(function (asset) {
                try {
                    var req = new XMLHttpRequest();
                    req.open('GET', asset.src, true);
                    req.responseType = 'arraybuffer';
                    req.onload = function () {
                        if (req.status === 200) {
                            try {
                                audioCtx.decodeAudioData(req.response, function (buf) {
                                    audioBuffers[asset.key] = buf;
                                    loaded++;
                                    if (loaded === total && !failed) {
                                        audioBuffersLoaded = true;
                                        resolve(true);
                                    }
                                }, function () {
                                    failed = true;
                                    loaded++;
                                    if (loaded === total) {
                                        audioBuffersLoaded = false;
                                        resolve(false);
                                    }
                                });
                            } catch (e) {
                                failed = true;
                                loaded++;
                                if (loaded === total) {
                                    audioBuffersLoaded = false;
                                    resolve(false);
                                }
                            }
                        } else {
                            failed = true;
                            loaded++;
                            if (loaded === total) {
                                audioBuffersLoaded = false;
                                resolve(false);
                            }
                        }
                    };
                    req.onerror = function () {
                        failed = true;
                        loaded++;
                        if (loaded === total) {
                            audioBuffersLoaded = false;
                            resolve(false);
                        }
                    };
                    req.send();
                } catch (e) {
                    failed = true;
                    loaded++;
                    if (loaded === total) {
                        audioBuffersLoaded = false;
                        resolve(false);
                    }
                }
            });

             /* Timeout fallback: if loading > 3s, give up and use procedural audio */
            setTimeout(function () {
                if (!audioBuffersLoaded) {
                    audioBuffersLoaded = false;
                    audioLoadPromise = null; // allow retry
                    resolve(false);
                }
            }, 3000);
        });
        return audioLoadPromise;
    }

     /* Play a bundled audio buffer by key, falls back to procedural */
    function playAudioBuffer(key, fallbackFn) {
        if (audioEngineBroken || muted) return;
        var buf = audioBuffers[key];
        if (!buf || !audioCtx) {
            if (fallbackFn) fallbackFn();
            return;
        }
        try {
            var src = audioCtx.createBufferSource();
            src.buffer = buf;
            var g = audioCtx.createGain();
            g.gain.value = 0.5;
            src.connect(g);
            g.connect(masterGain);
            src.start(0);
        } catch (e) {
            audioEngineBroken = true;
            if (fallbackFn) fallbackFn();
        }
    }

    /* Growl / hum during charge — uses two oscillators */
    function startGrowl() {
        if (!audioCtx) return;
        var now = audioCtx.currentTime;

        stopGrowl();

        chargeGain1 = audioCtx.createGain();
        chargeGain2 = audioCtx.createGain();

        chargeOsc1 = audioCtx.createOscillator();
        chargeOsc2 = audioCtx.createOscillator();

        chargeOsc1.type = 'sawtooth';
        chargeOsc1.frequency.setValueAtTime(55, now);

        chargeOsc2.type = 'sine';
        chargeOsc2.frequency.setValueAtTime(110, now);

        chargeGain1.gain.setValueAtTime(0.08, now);
        chargeGain2.gain.setValueAtTime(0.12, now);

        chargeOsc1.connect(chargeGain1);
        chargeOsc2.connect(chargeGain2);
        chargeGain1.connect(masterGain);
        chargeGain2.connect(masterGain);

        chargeOsc1.start(now);
        chargeOsc2.start(now);
    }

    function updateGrowl(level) {
        if (!audioCtx || !chargeOsc1 || !chargeOsc2) return;
        var now = audioCtx.currentTime;
        var pitch = 55 + level * 85;
        chargeOsc1.frequency.linearRampToValueAtTime(pitch, now);
        chargeOsc2.frequency.linearRampToValueAtTime(pitch * 2, now + 0.1);
        if (chargeGain1) {
            chargeGain1.gain.linearRampToValueAtTime(0.06 + level * 0.1, now + 0.1);
         }
        }

        // Track if hover sound already played this hover session
    var hoverPlayed = false;

    function stopGrowl() {
        try { if (chargeOsc1) { chargeOsc1.stop(); chargeOsc1.disconnect(); } } catch (_) {}
        try { if (chargeOsc2) { chargeOsc2.stop(); chargeOsc2.disconnect(); } } catch (_) {}
        try { if (chargeGain1) { chargeGain1.disconnect(); } } catch (_) {}
        try { if (chargeGain2) { chargeGain2.disconnect(); } } catch (_) {}
        chargeOsc1 = null;
        chargeOsc2 = null;
        chargeGain1 = null;
        chargeGain2 = null;
      }

    /* Fire burst — noise-based */
    function playFireBreath(intensity) {
        if (!audioCtx) return;
        var now = audioCtx.currentTime;
        var duration = 0.4 + intensity * 0.8;

        /* Deep roar: noise through low-pass */
        var bufSz = audioCtx.sampleRate * duration;
        var buf = audioCtx.createBuffer(1, bufSz, audioCtx.sampleRate);
        var data = buf.getChannelData(0);
        for (var i = 0; i < bufSz; i++) {
            data[i] = (Math.random() * 2 - 1);
        }
        var src = audioCtx.createBufferSource();
        src.buffer = buf;

        var lp = audioCtx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(300 + intensity * 600, now);
        lp.frequency.exponentialRampToValueAtTime(80, now + duration);
        lp.Q.value = 1.5;

        var noiseG = audioCtx.createGain();
        noiseG.gain.setValueAtTime(0.2 * intensity + 0.05, now);
        noiseG.gain.exponentialRampToValueAtTime(0.001, now + duration);

        src.connect(lp);
        lp.connect(noiseG);
        noiseG.connect(masterGain);
        src.start(now);
        src.stop(now + duration);

        /* Whoosh: higher frequency noise */
        var whooshDur = duration * 0.6;
        var whooshBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * whooshDur, audioCtx.sampleRate);
        var whooshData = whooshBuf.getChannelData(0);
        for (var j = 0; j < whooshData.length; j++) {
            whooshData[j] = (Math.random() * 2 - 1);
        }
        var wSrc = audioCtx.createBufferSource();
        wSrc.buffer = whooshBuf;
        var bp = audioCtx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(1200, now);
        bp.frequency.exponentialRampToValueAtTime(400, now + whooshDur);
        bp.Q.value = 3;
        var wG = audioCtx.createGain();
        wG.gain.setValueAtTime(0.08 * intensity + 0.03, now + 0.02);
        wG.gain.exponentialRampToValueAtTime(0.001, now + whooshDur);
        wSrc.connect(bp);
        bp.connect(wG);
        wG.connect(masterGain);
        wSrc.start(now + 0.02);
        wSrc.stop(now + whooshDur + 0.02);

        /* Crackle: short percussive hits */
        for (var k = 0; k < Math.floor(3 + intensity * 5); k++) {
            var crackDur = 0.03;
            var crackBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * crackDur, audioCtx.sampleRate);
            var cData = crackBuf.getChannelData(0);
            for (var c = 0; c < cData.length; c++) {
                cData[c] = (Math.random() * 2 - 1) * (1 - c / cData.length);
            }
            var cSrc = audioCtx.createBufferSource();
            cSrc.buffer = crackBuf;
            var cG = audioCtx.createGain();
            cG.gain.setValueAtTime(0.06 * intensity, now + k * (duration * 0.15));
            cG.gain.exponentialRampToValueAtTime(0.001, now + k * (duration * 0.15) + crackDur);
            var hp = audioCtx.createBiquadFilter();
            hp.type = 'highpass';
            hp.frequency.value = 2500;
            cSrc.connect(hp);
            hp.connect(cG);
            cG.connect(masterGain);
            cSrc.start(now + k * (duration * 0.15));
            cSrc.stop(now + k * (duration * 0.15) + crackDur);
        }

        /* Rising sine for impact */
        var impactOsc = audioCtx.createOscillator();
        var impactG = audioCtx.createGain();
        impactOsc.type = 'sine';
        impactOsc.frequency.setValueAtTime(80, now);
        impactOsc.frequency.exponentialRampToValueAtTime(200, now + duration * 0.3);
        impactG.gain.setValueAtTime(0.12 * intensity, now);
        impactG.gain.exponentialRampToValueAtTime(0.001, now + duration);
        impactOsc.connect(impactG);
        impactG.connect(masterGain);
        impactOsc.start(now);
        impactOsc.stop(now + duration);
    }

    function playCooldownTick() {
        if (!audioCtx) return;
        var now = audioCtx.currentTime;
        var o = audioCtx.createOscillator();
        var g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.value = 220;
        g.gain.setValueAtTime(0.06, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        o.connect(g);
        g.connect(masterGain);
        o.start(now);
        o.stop(now + 0.2);
       }

       /* Hover chirp — short ascending chirp */
    function playHover() {
        if (!audioCtx) return;
        var now = audioCtx.currentTime;
        var o = audioCtx.createOscillator();
        var g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(500, now);
        o.frequency.linearRampToValueAtTime(700, now + 0.08);
        g.gain.setValueAtTime(0.04, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        o.connect(g);
        g.connect(masterGain);
        o.start(now);
        o.stop(now + 0.12);
       }

        /* Whiff / failure — short comical sneeze */
    function playWhiff() {
        if (!audioCtx) return;
        var now = audioCtx.currentTime;

        /* Nasal "sneeze" tone */
        var o1 = audioCtx.createOscillator();
        var g1 = audioCtx.createGain();
        o1.type = 'triangle';
        o1.frequency.setValueAtTime(350, now);
        o1.frequency.linearRampToValueAtTime(200, now + 0.2);
        g1.gain.setValueAtTime(0.1, now);
        g1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        o1.connect(g1);
        g1.connect(masterGain);
        o1.start(now);
        o1.stop(now + 0.25);

        /* Weak puff: low-pass filtered noise */
        var puffDur = 0.3;
        var puffBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * puffDur, audioCtx.sampleRate);
        var pData = puffBuf.getChannelData(0);
        for (var i = 0; i < pData.length; i++) {
            pData[i] = (Math.random() * 2 - 1);
         }
        var pSrc = audioCtx.createBufferSource();
        pSrc.buffer = puffBuf;
        var pLp = audioCtx.createBiquadFilter();
        pLp.type = 'lowpass';
        pLp.frequency.value = 200;
        var pG = audioCtx.createGain();
        pG.gain.setValueAtTime(0.08, now);
        pG.gain.exponentialRampToValueAtTime(0.001, now + puffDur);
        pSrc.connect(pLp);
        pLp.connect(pG);
        pG.connect(masterGain);
        pSrc.start(now);
        pSrc.stop(now + puffDur);
       }

        /* Success chime — ascending triad */
    function playSuccessChime() {
        if (!audioCtx) return;
        var now = audioCtx.currentTime;
        var notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
        notes.forEach(function (freq, idx) {
            var o = audioCtx.createOscillator();
            var g = audioCtx.createGain();
            o.type = 'sine';
            o.frequency.value = freq;
            var t = now + idx * 0.08;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.08, t + 0.03);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            o.connect(g);
            g.connect(masterGain);
            o.start(t);
            o.stop(t + 0.45);
        });
       }

      /* ========== Particles (canvas) ========== */
    var pCtx = null;
    if (particleCanvas) {
        pCtx = particleCanvas.getContext('2d');
      }
    var breathParticles = [];
    var animatingBreath = false;

    function resizeParticleCanvas() {
        if (!particleCanvas) return;
        var w = particleCanvas.offsetWidth;
        var h = particleCanvas.offsetHeight;
        if (w === 0 || h === 0) return; // can't size until visible
        var dpr = window.devicePixelRatio || 1;
        particleCanvas.width = w * dpr;
        particleCanvas.height = h * dpr;
      }
    // Defer first resize so the layout has been computed
    if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(resizeParticleCanvas);
      } else {
        setTimeout(resizeParticleCanvas, 50);
      }
    window.addEventListener('resize', resizeParticleCanvas);

    /* Particle color palette: deep purples to magma oranges to golds */
    var PALETTE = [
        [255, 80, 20],    // deep orange
        [255, 120, 50],   // magma
        [255, 170, 80],   // warm orange
        [240, 192, 64],   // gold
        [200, 140, 255],  // purple highlight
        [255, 60, 30],    // red-orange
    ];

    function spawnBreathParticles(count, intensity, originX, originY) {
        var ox = (originX !== undefined) ? originX : 0.28;
        var oy = (originY !== undefined) ? originY : 0.23;

        for (var i = 0; i < count; i++) {
            var spread = 0.3 + Math.random() * 0.4;
            var angle = -0.5 + Math.random() * 1.0; // fire goes left-ish upward
            var speed = (2 + Math.random() * 5) * (0.5 + intensity);
            var colIdx = Math.floor(Math.random() * PALETTE.length);
            var col = PALETTE[colIdx];

            breathParticles.push({
                x: ox * particleCanvas.offsetWidth,
                y: oy * particleCanvas.offsetHeight,
                vx: -Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - (1 + Math.random() * 2),
                life: 1,
                decay: 0.01 + Math.random() * 0.025,
                size: (2 + Math.random() * 4) * (0.5 + intensity),
                r: col[0],
                g: col[1],
                b: col[2],
            });
        }
        if (reducedMotion) {
            // still spawn a minimal set for visual feedback
        }
        if (!animatingBreath) {
            animatingBreath = true;
            requestAnimationFrame(animateBreathParticles);
        }
    }

    function animateBreathParticles() {
        if (!pCtx || !particleCanvas) return;
        var w = particleCanvas.width;
        var h = particleCanvas.height;
        pCtx.clearRect(0, 0, w, h);

        breathParticles = breathParticles.filter(function (p) { return p.life > 0; });
        if (breathParticles.length === 0) {
            animatingBreath = false;
            return;
        }

        var dpr = window.devicePixelRatio || 1;

        for (var i = 0; i < breathParticles.length; i++) {
            var p = breathParticles[i];
            p.x += p.vx * dpr;
            p.y += p.vy * dpr;
            p.vy += 0.03 * dpr; // slight gravity
            p.vx *= 0.99;
            p.life -= p.decay;

            var alpha = Math.max(0, p.life);
            var sz = p.size * p.life * dpr;

            pCtx.globalAlpha = alpha;
            pCtx.fillStyle = 'rgb(' + p.r + ',' + p.g + ',' + p.b + ')';
            pCtx.shadowColor = 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + alpha + ')';
            pCtx.shadowBlur = sz * 2;

            pCtx.beginPath();
            pCtx.arc(p.x, p.y, Math.max(sz, 0.5), 0, Math.PI * 2);
            pCtx.fill();
        }

        pCtx.globalAlpha = 1;
        pCtx.shadowBlur = 0;

        requestAnimationFrame(animateBreathParticles);
    }

    /* ========== Core Loop State Machine ========== */
    function setState(next) {
        currentState = next;

        dragonArea.classList.remove('charging', 'breathing', 'cooldown');
        statusText.classList.remove('glow', 'cooldown-text');

        switch (next) {
        case STATE.IDLE:
            statusText.textContent = 'Hold the dragon to charge';
            playedFullChime = false;
            break;
        case STATE.CHARGING:
            statusText.textContent = 'Charging...';
            dragonArea.classList.add('charging');
            chargeFill.parentElement.classList.add('visible');
            startGrowl();
            startChargeTimer();
            break;
        case STATE.BREATHING:
            dragonArea.classList.remove('charging');
            dragonArea.classList.add('breathing');
            statusText.classList.add('glow');
            statusText.textContent = (chargeLevel > 70) ? 'MAXIMUM BREATH!' : 'Dragon breathes fire!';
            stopGrowl();
            fireBreath();
            break;
        case STATE.WIFF:
            dragonArea.classList.remove('charging');
            dragonArea.classList.add('whiff');
            statusText.textContent = 'Oops... not enough power!';
            stopGrowl();
            handleWhiff();
            break;
        case STATE.COOLDOWN:
            dragonArea.classList.remove('breathing', 'whiff');
            dragonArea.classList.add('cooldown');
            statusText.classList.remove('glow');
            statusText.classList.add('cooldown-text');
            statusText.textContent = 'Recovering...';
            playCooldownTick();
            break;
        }
    }

    function startChargeTimer() {
        if (chargeInterval) clearInterval(chargeInterval);
        chargeInterval = setInterval(function () {
            if (currentState !== STATE.CHARGING) {
                clearInterval(chargeInterval);
                chargeInterval = null;
                return;
             }
            chargeLevel = Math.min(100, chargeLevel + CHARGE_RATE);
            chargeFill.style.width = chargeLevel + '%';

            if (chargeLevel >= 100) {
                dragonSvg.classList.add('full-charge');
             }

            updateGrowl(chargeLevel / 100);
         }, CHARGE_TICK_MS);
        }

        var playedFullChime = false;

    function fireBreath() {
      /* Transition: play bundled whoosh + procedural fire roar in parallel */
      playAudioBuffer('transition', noop);
      var intensity = Math.max(0.2, chargeLevel / 100);
      playFireBreath(intensity);

      if (chargeLevel >= 100 && !playedFullChime) {
          playedFullChime = true;
          setTimeout(function () {
              playAudioBuffer('success', function () {
                  playSuccessChime();
                });
            }, 300);
          }

      var particleCount = Math.floor(20 + intensity * 80);
      if (!reducedMotion) {
          spawnBreathParticles(particleCount, intensity);
       }

       // Secondary burst for richness
      setTimeout(function () {
          if (currentState === STATE.BREATHING) {
              spawnBreathParticles(Math.floor(particleCount * 0.4), intensity * 0.6, 0.3 + Math.random() * 0.1, 0.22 + Math.random() * 0.05);
           }
       }, 80);

      setTimeout(function () {
          if (currentState !== STATE.COOLDOWN) {
              setState(STATE.COOLDOWN);
           }
          chargeLevel = 0;
          chargeFill.style.width = '0%';
          dragonSvg.classList.remove('full-charge');

          cooldownTimeout = setTimeout(function () {
              setState(STATE.IDLE);
              playAudioBuffer('reset', noop);
             }, COOLDOWN_MS);
       }, 600 + (1 - intensity) * 400);
     }

     function handleWhiff() {
        playAudioBuffer('failure', function () {
            playWhiff();
          });

        if (!reducedMotion) {
             /* Tiny puff of smoke particles */
            for (var i = 0; i < 8; i++) {
                var col = [120 + Math.random() * 30, 120 + Math.random() * 30, 140 + Math.random() * 30];
                breathParticles.push({
                    x: 0.28 * particleCanvas.offsetWidth,
                    y: 0.23 * particleCanvas.offsetHeight,
                    vx: -(1 + Math.random() * 2),
                    vy: -(0.5 + Math.random() * 1.5),
                    life: 1,
                    decay: 0.02 + Math.random() * 0.02,
                    size: 2 + Math.random() * 3,
                    r: col[0], g: col[1], b: col[2]
                 });
             }
            if (!animatingBreath) {
                animatingBreath = true;
                requestAnimationFrame(animateBreathParticles);
             }
          }

        setTimeout(function () {
            if (currentState !== STATE.COOLDOWN) {
                setState(STATE.COOLDOWN);
             }
            chargeLevel = 0;
            chargeFill.style.width = '0%';
            dragonSvg.classList.remove('full-charge');

            cooldownTimeout = setTimeout(function () {
                setState(STATE.IDLE);
                playAudioBuffer('reset', noop);
               }, COOLDOWN_MS * 0.6);
         }, 400);
     }

    function handleHoldStart() {
        if (currentState === STATE.COOLDOWN || currentState === STATE.CHARGING || currentState === STATE.BREATHING || currentState === STATE.WIFF) return;
        if (cooldownTimeout) { clearTimeout(cooldownTimeout); cooldownTimeout = null; }
        ensureAudioCtx();
        if (!audioBuffersLoaded) {
            loadAudioBuffers();
          }
        chargeLevel = 0;
        setState(STATE.CHARGING);
        }

    function handleHoldEnd() {
        if (currentState !== STATE.CHARGING) return;
        clearInterval(chargeInterval);
        chargeInterval = null;
        if (chargeLevel < MIN_CHARGE) {
            setState(STATE.WIFF);
          } else {
            setState(STATE.BREATHING);
          }
       }

    /* ========== Input Wiring ========== */
    var holdActive = false;

    function onDown(e) {
        if (e) e.preventDefault();
        if (holdActive) return;
        holdActive = true;
        handleHoldStart();
    }

    function onUp(e) {
        if (e) e.preventDefault();
        if (!holdActive) return;
        holdActive = false;
        handleHoldEnd();
    }

    dragonArea.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    dragonArea.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('touchend', onUp);
    window.addEventListener('touchcancel', onUp);

    /* Keyboard */
    dragonArea.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (!holdActive) {
                holdActive = true;
                handleHoldStart();
            }
        }
    });
    dragonArea.addEventListener('keyup', function (e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (holdActive) {
                holdActive = false;
                handleHoldEnd();
            }
        }
    });

      /* Mouse leave during hold -> release */
    dragonArea.addEventListener('mouseleave', function () {
         if (holdActive && currentState === STATE.CHARGING) {
             holdActive = false;
             handleHoldEnd();
          }
         hoverPlayed = false;
       });

       /* Hover sound on mouse enter / focus */
    dragonArea.addEventListener('mouseenter', function () {
        if (currentState === STATE.IDLE && !hoverPlayed) {
            ensureAudioCtx();
            playAudioBuffer('input', function () {
                playHover();
              });
            hoverPlayed = true;
          }
       });
    dragonArea.addEventListener('focus', function () {
        if (currentState === STATE.IDLE && !hoverPlayed) {
            ensureAudioCtx();
            playAudioBuffer('input', function () {
                playHover();
              });
            hoverPlayed = true;
          }
       });
    dragonArea.addEventListener('blur', function () {
         hoverPlayed = false;
       });

    /* ========== Mute Toggle ========== */
    muteBtn.addEventListener('click', function () {
        muted = !muted;
        muteBtn.setAttribute('aria-pressed', String(muted));
        muteIcon.textContent = muted ? '\u{1F507}' : '\u{1F50A}';
        if (masterGain) {
            masterGain.gain.value = muted ? 0 : 0.6;
        }
        if (!muted) ensureAudioCtx();
    });

    /* ========== Init ========== */
    setState(STATE.IDLE);

})();
