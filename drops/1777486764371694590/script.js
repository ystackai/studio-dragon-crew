(function () {
    "use strict";

    /* ── Dragon Data ───────────────────────────────────── */
    var DRAGONS = [
        { name: "Pyralis", emoji: "🔥", element: "ember", desc: "Blessed guardian of hearth and dawn, scales of burnished copper and gold." },
        { name: "Aquoria", emoji: "💧", element: "freshwater", desc: "Graceful river spirit, translucent sapphire scales refracting river light." },
        { name: "Glacira", emoji: "❄️", element: "arctic", desc: "Stern arctic warden, frost-crystallized armor and piercing pale eyes." },
        { name: "Alpina", emoji: "🌨️", element: "alpine", desc: "Gentle mountain mist dragon, pearlescent white scales like cloud-silk." },
        { name: "Marinus", emoji: "🌊", element: "oceanic", desc: "Deep-sea sovereign, teal and pearl carapace that shimmers at the tide line." },
        { name: "Ignistra", emoji: "🌋", element: "volcanic", desc: "Obsidian titan veined with molten fire, calm but formidable." },
        { name: "Stellara", emoji: "✨", element: "stellar", desc: "Celestial wanderer, violet-black scales that hold captured starlight." },
        { name: "Verdantis", emoji: "🌿", element: "verdant", desc: "Old-grove drake of moss and bloom, ancient and benevolent." },
    ];

    /* ── Particle color palettes per element ─────────── */
    var PALETTES = {
        ember:    ["rgba(255,140,40,0.9)","rgba(255,180,60,0.8)","rgba(255,90,30,0.7)","rgba(255,210,100,0.6)"],
        freshwater: ["rgba(80,200,220,0.9)","rgba(60,180,210,0.8)","rgba(100,220,230,0.7)","rgba(130,230,240,0.6)"],
        arctic:   ["rgba(160,210,240,0.9)","rgba(180,220,245,0.8)","rgba(140,195,230,0.7)","rgba(200,230,250,0.6)"],
        alpine:   ["rgba(210,225,240,0.9)","rgba(220,230,245,0.8)","rgba(195,215,235,0.7)","rgba(230,235,250,0.6)"],
        oceanic:  ["rgba(60,160,190,0.9)","rgba(50,150,185,0.8)","rgba(80,180,200,0.7)","rgba(70,170,195,0.6)"],
        volcanic: ["rgba(255,100,30,0.9)","rgba(255,70,20,0.8)","rgba(240,50,10,0.7)","rgba(255,140,50,0.6)"],
        stellar:  ["rgba(180,140,255,0.9)","rgba(160,120,240,0.8)","rgba(200,160,255,0.7)","rgba(210,180,255,0.6)"],
        verdant:  ["rgba(80,200,100,0.9)","rgba(60,180,80,0.8)","rgba(100,220,120,0.7)","rgba(120,230,140,0.6)"],
        neutral:  ["rgba(94,196,212,0.9)","rgba(245,197,66,0.8)","rgba(180,220,240,0.8)","rgba(155,109,255,0.7)"],
    };

    /* ── DOM refs ──────────────────────────────────────── */
    var summonCircle = document.getElementById("summon-circle");
    var particleCanvas = document.getElementById("particle-canvas");
    var dragonCard = document.getElementById("dragon-card");
    var dragonName = document.getElementById("dragon-name");
    var dragonDesc = document.getElementById("dragon-desc");
    var dragonIcon = document.getElementById("dragon-element-icon");
    var dragonBadge = document.getElementById("dragon-badge");
    var muteBtn = document.getElementById("mute-btn");
    var resetBtn = document.getElementById("reset-btn");
    var countSpan = document.getElementById("summon-count");
    var appBg = document.querySelector(".app-bg");

    /* ── State ─────────────────────────────────────────── */
    var audioCtx = null;
    var masterGain = null;
    var muted = false;
    var summonCount = 0;
    var summoning = false;
    var lastDragonIdx = -1;
    var fizzleChance = 0;          /* increases with rapid clicks, resets on success */
    var ambientRAF = null;

    /* ── Audio Engine ──────────────────────────────────── */
    function getAudioCtx() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioCtx.createGain();
            masterGain.gain.value = 0.5;
            masterGain.connect(audioCtx.destination);
        }
        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function setMute(v) {
        muted = v;
        if (!masterGain) return;
        masterGain.gain.setTargetAtTime(v ? 0 : 0.5, getAudioCtx().currentTime, 0.05);
    }

    /* Play a single tone with optional vibrato and envelope. */
    function playTone(freq, dur, type, vol, startTime, detune) {
        if (muted) return;
        var ctx = getAudioCtx();
        var t = startTime || ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = type || "sine";
        osc.frequency.setValueAtTime(freq, t);
        if (detune) {
            osc.detune.setValueAtTime(Math.random() * detune - detune / 2, t);
        }
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(vol || 0.1, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(gain).connect(masterGain);
        osc.start(t);
        osc.stop(t + dur + 0.01);
    }

    /* Play filtered noise burst for whoosh / crackle effects. */
    function playNoise(dur, vol, filterFreq, filterType, startTime) {
        if (muted) return;
        var ctx = getAudioCtx();
        var t = startTime || ctx.currentTime;
        var bufferSize = ctx.sampleRate * dur;
        var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        var src = ctx.createBufferSource();
        src.buffer = buffer;
        var gain = ctx.createGain();
        gain.gain.setValueAtTime(vol || 0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        var filter = ctx.createBiquadFilter();
        filter.type = filterType || "bandpass";
        filter.frequency.setValueAtTime(filterFreq || 800, t);
        filter.Q.setValueAtTime(1.5, t);
        src.connect(filter).connect(gain).connect(masterGain);
        src.start(t);
        src.stop(t + dur + 0.01);
    }

    /* Arpeggiated chord for success. */
    function playChord(freqs, vol, startTime, dur) {
        var ctx = getAudioCtx();
        var t = startTime || ctx.currentTime;
        var d = dur || 0.7;
        var baseVol = vol || 0.08;
        for (var i = 0; i < freqs.length; i++) {
            playTone(freqs[i], d, "sine", baseVol * (1 - i * 0.12), t + i * 0.07);
            playTone(freqs[i] * 0.5, d * 0.8, "triangle", baseVol * 0.4, t + i * 0.07); /* sub octave warmth */
        }
    }

    /* ── SFX dictionary ───────────────────────────────── */
    var SFX = {
        /* Quick click / tap on the circle. */
        click: function () {
            var ctx = getAudioCtx();
            var t = ctx.currentTime;
            playTone(660, 0.08, "sine", 0.08, t);
            playTone(880, 0.06, "triangle", 0.04, t + 0.03);
        },

        /* Rising summon build-up. */
        summon: function () {
            var ctx = getAudioCtx();
            var t = ctx.currentTime;
            /* Ascending tones with slight spread. */
            playTone(260, 0.5, "sine", 0.09, t);
            playTone(330, 0.45, "sine", 0.07, t + 0.1);
            playTone(440, 0.4, "sine", 0.07, t + 0.2);
            playTone(550, 0.35, "triangle", 0.05, t + 0.32);
            playTone(660, 0.3, "sine", 0.06, t + 0.42);
            /* Subtle noise bed. */
            playNoise(0.8, 0.025, 600, "bandpass", t);
        },

        /* Success — bright, ascending chord. */
        success: function () {
            var ctx = getAudioCtx();
            var t = ctx.currentTime;
            /* C4 – E4 – G4 – C5 ascending. */
            playChord([523, 659, 784, 1047], 0.1, t, 0.9);
            /* Sparkle noise layer. */
            playNoise(0.4, 0.02, 2400, "highpass", t + 0.15);
            /* High shimmer. */
            playTone(1319, 0.5, "sine", 0.05, t + 0.35);
            playTone(1568, 0.45, "triangle", 0.04, t + 0.4);
        },

        /* Failure / fizzle — descending, slightly harsh. */
        fizzle: function () {
            var ctx = getAudioCtx();
            var t = ctx.currentTime;
            playTone(400, 0.2, "sawtooth", 0.04, t);
            playTone(320, 0.25, "sawtooth", 0.035, t + 0.08);
            playTone(250, 0.3, "sawtooth", 0.03, t + 0.16);
            playTone(180, 0.35, "triangle", 0.025, t + 0.28);
            /* Crackling noise. */
            playNoise(0.4, 0.03, 1200, "bandpass", t);
        },

        /* Reset — gentle descending tone. */
        reset: function () {
            var ctx = getAudioCtx();
            var t = ctx.currentTime;
            playTone(587, 0.15, "sine", 0.07, t);
            playTone(494, 0.15, "sine", 0.06, t + 0.08);
            playTone(440, 0.2, "sine", 0.05, t + 0.16);
            playNoise(0.15, 0.015, 500, "lowpass", t + 0.02);
        },

        /* Ambient pulse during idle — used as background shimmer. */
        ambient: function () {
            var ctx = getAudioCtx();
            var t = ctx.currentTime;
            playTone(180 + Math.random() * 60, 1.5, "sine", 0.008, t + Math.random() * 0.5);
        },

        /* Element-specific reveal tone. */
        element: function (element) {
            var ctx = getAudioCtx();
            var t = ctx.currentTime;
            var map = {
                ember:      [660, 784, 880],
                freshwater: [523, 659, 784],
                arctic:     [784, 880, 988],
                alpine:     [659, 784, 880],
                oceanic:    [494, 587, 659],
                volcanic:   [330, 392, 440],
                stellar:    [880, 988, 1108],
                verdant:    [587, 659, 784],
            };
            var notes = map[element] || [523, 659, 784];
            for (var i = 0; i < notes.length; i++) {
                playTone(notes[i], 0.5, "sine", 0.06, t + i * 0.1);
            }
        },
    };

    /* ── Particle System ───────────────────────────────── */
    function spawnParticles(count, paletteKey, spread) {
        var palette = PALETTES[paletteKey] || PALETTES.neutral;
        for (var i = 0; i < count; i++) {
            var p = document.createElement("span");
            p.className = "particle";
            var size = 3 + Math.random() * (spread || 7);
            var angle = Math.random() * Math.PI * 2;
            var speed = 50 + Math.random() * (spread ? 120 : 80);
            var dx = Math.cos(angle) * speed;
            var dy = Math.sin(angle) * speed;
            var dur = 0.5 + Math.random() * (spread ? 1.2 : 0.8);
            var color = palette[Math.floor(Math.random() * palette.length)];
            p.style.cssText =
                "width:" + size + "px;height:" + size + "px;" +
                "background:radial-gradient(circle," + color + ",transparent);" +
                "left:50%;top:50%;" +
                "transform:translate(-50%,-50%);" +
                "box-shadow:0 0 " + (size * 2) + "px " + color.replace(/[\d.]+\)$/, "0.3)") + ";";
            particleCanvas.appendChild(p);

            /* Trigger animation after a brief delay. */
            setTimeout(function () {
                p.style.transition = "transform " + dur + "s cubic-bezier(0.22,1,0.36,1), opacity " + dur + "s ease";
                p.style.transform = "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px))";
                p.style.opacity = "0";
                setTimeout(function () { p.remove(); }, dur * 1000);
            }, 15 + Math.random() * 40);
        }
    }

    function rainParticles(count, paletteKey) {
        var palette = PALETTES[paletteKey] || PALETTES.neutral;
        for (var i = 0; i < count; i++) {
            (function (idx) {
                setTimeout(function () {
                    var p = document.createElement("span");
                    p.className = "particle";
                    var size = 2 + Math.random() * 4;
                    var x = Math.random() * 100;
                    var dy = 70 + Math.random() * 130;
                    var dur = 1.2 + Math.random() * 1.4;
                    var color = palette[Math.floor(Math.random() * palette.length)];
                    p.style.cssText =
                        "width:" + size + "px;height:" + size + "px;" +
                        "background:radial-gradient(circle," + color + ",transparent);" +
                        "left:" + x + "%;top:-10px;" +
                        "box-shadow:0 0 " + (size * 2) + "px " + color.replace(/[\d.]+\)$/, "0.25)") + ";";
                    particleCanvas.appendChild(p);
                    setTimeout(function () {
                        p.style.transition = "transform " + dur + "s ease-in, opacity " + dur + "s ease";
                        p.style.transform = "translateY(" + dy + "px)";
                        p.style.opacity = "0";
                        setTimeout(function () { p.remove(); }, dur * 1000);
                    }, 20);
                }, Math.random() * 800);
            })(i);
        }
    }

    /* Ambient floating particles in the background. */
    function initAmbientParticles() {
        if (!appBg) return;
        var count = 18;
        for (var i = 0; i < count; i++) {
            var p = document.createElement("span");
            p.className = "ambient-particle";
            var size = 2 + Math.random() * 3;
            var x = 5 + Math.random() * 90;
            var y = 5 + Math.random() * 90;
            var dur = 4 + Math.random() * 8;
            var delay = Math.random() * 6;
            var palette = PALETTES.neutral;
            var color = palette[Math.floor(Math.random() * palette.length)];
            p.style.cssText =
                "width:" + size + "px;height:" + size + "px;" +
                "background:radial-gradient(circle," + color + ",transparent);" +
                "left:" + x + "%;top:" + y + "%;" +
                "--ambient-dur:" + dur + "s;--ambient-delay:" + delay + "s;";
            appBg.appendChild(p);
        }
    }

    /* ── Dragon Picker ─────────────────────────────────── */
    function pickDragon() {
        var idx;
        /* Avoid repeating the same dragon twice in a row. */
        do {
            idx = Math.floor(Math.random() * DRAGONS.length);
        } while (idx === lastDragonIdx && DRAGONS.length > 1);
        lastDragonIdx = idx;
        return DRAGONS[idx];
    }

    /* ── Summon Flow ────────────────────────────────────── */
    function beginSummon() {
        if (summoning) return;
        summoning = true;

        SFX.click();
        summonCircle.setAttribute("aria-pressed", "true");
        summonCircle.classList.add("summoning");
        summonCircle.classList.remove("success", "fizzle");

        /* Initial burst. */
        spawnParticles(20, "neutral");

        /* Build-up sound after short delay. */
        setTimeout(function () {
            SFX.summon();
            spawnParticles(30, "neutral", true);
        }, 200);

        /* Check for fizzle (failure) — 15% chance on first, increases with rapid summoning. */
        var willFizzle = Math.random() < (0.12 + fizzleChance * 0.12);
        if (willFizzle) {
            setTimeout(function () {
                SFX.fizzle();
                showFizzle();
                fizzleChance = Math.max(0, fizzleChance - 1);
                finishSummon();
            }, 1000);
        } else {
            setTimeout(function () {
                var dragon = pickDragon();
                fizzleChance = 0;
                showDragon(dragon);
                setTimeout(function () { finishSummon(); }, 400);
            }, 1200);
        }
    }

    function showFizzle() {
        /* Hide current card if fizzle triggered mid-animation. */
        dragonCard.classList.add("hidden");
        dragonCard.classList.remove("fizzle-card");

        /* Update card to show a fizzle message. */
        dragonIcon.innerHTML = "💨";
        dragonName.textContent = "The spell fizzled…";
        dragonName.className = "dragon-name fizzle-msg";
        dragonDesc.textContent = "Gather your energy and try again.";
        dragonBadge.textContent = "";
        dragonCard.removeAttribute("data-element");
        dragonCard.classList.remove("hidden");
        dragonCard.classList.add("fizzle-card");
        summonCircle.classList.remove("summoning");
        summonCircle.classList.add("fizzle");

        /* Show reset. */
        resetBtn.classList.remove("hidden");

        /* Fizzle particles. */
        spawnParticles(15, "neutral", true);
    }

    function showDragon(dragon) {
        SFX.success();
        setTimeout(function () {
            /* Play element-specific tone after success chord. */
            SFX.element(dragon.element);
        }, 350);

        summonCircle.classList.remove("summoning");
        summonCircle.classList.add("success");

        dragonName.textContent = dragon.name;
        dragonName.className = "dragon-name";
        dragonDesc.textContent = dragon.desc;
        dragonIcon.innerHTML = dragon.emoji;
        dragonBadge.textContent = dragon.element;
        dragonCard.setAttribute("data-element", dragon.element);
        dragonCard.classList.remove("fizzle-card");
        dragonCard.classList.remove("hidden");

        /* Elemental rain particles. */
        setTimeout(function () {
            rainParticles(25, dragon.element);
        }, 200);

        /* Burst of element-colored particles at summon circle. */
        spawnParticles(22, dragon.element, true);

        summonCount++;
        countSpan.textContent = summonCount;
        fizzleChance = 0;

        resetBtn.classList.remove("hidden");
    }

    function finishSummon() {
        summoning = false;
        summonCircle.setAttribute("aria-pressed", "false");
    }

    function resetSummon() {
        if (summoning) return;
        summoning = true;
        fizzleChance = Math.min(fizzleChance + 1, 5);
        SFX.reset();

        dragonCard.classList.add("hidden");
        resetBtn.classList.add("hidden");
        summonCircle.classList.remove("success", "fizzle");

        /* Small reset particle burst. */
        spawnParticles(10, "neutral");

        setTimeout(function () {
            summoning = false;
            summonCircle.setAttribute("aria-pressed", "false");
        }, 450);
    }

    /* ── Events ─────────────────────────────────────────── */
    summonCircle.addEventListener("click", beginSummon);
    summonCircle.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            beginSummon();
        }
    });

    muteBtn.addEventListener("click", function () {
        setMute(!muted);
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

    /* ── Init ───────────────────────────────────────────── */
    initAmbientParticles();

    /* Subtle initial ambient rain. */
    setTimeout(function () { rainParticles(6, "neutral"); }, 800);

})();
