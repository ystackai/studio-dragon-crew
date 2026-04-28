// ========================================
// Breath-Driven Sanctuary Core
// 56 BPM quantizer, audio-visual sync,
// moss-to-geode with frost fractals
// ========================================

(function () {
    "use strict";

    // ─── CONSTANTS ──────────────────────────
    const BPM = 56;
    const BEAT_DURATION = 60 / BPM;
    const QUANTUM_MS = 15;
    const SOFT_CAP = 1.0;
    const FROST_MIN = 0.8;
    const FROST_MAX = 0.9;
    const DAMPING = 0.055;
    const HYSTERESIS_THRESHOLD = 0.08;
    const LPF_ALPHA = 0.04;
    const EXHALE_DECAY = 0.35;

    // ─── STATE ──────────────────────────────
    let gl = null;
    let program = null;
    let audioCtx = null;
    let masterGain = null;
    let running = false;

    const S = {
        breathIntensity: 0,
        smoothIntensity: 0,
        rawInput: 0,
        lpfState: 0,
        mossPhase: 1.0,
        frostLevel: 0.0,
        geodeGlow: 0.0,
        time: 0,
        beatCount: 0,
        lastBeatTime: 0,
        prevTimestamp: 0,
        dragging: false,
        mouseX: 0.5,
        mouseY: 0.5,
        prevMouseX: 0.5,
        prevMouseY: 0.5,
        width: 0,
        height: 0,
        dpr: 1,
        lastPeakBeat: -1,
        inputVelocity: 0,
        hysteresisDir: 0,
    };

    // ─── SHADERS ────────────────────────────
    const VERT = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main(){
        v_uv = a_pos*0.5+0.5;
        gl_Position = vec4(a_pos,0.0,1.0);
      }
    `;

    const FRAG = `
      precision highp float;
      uniform float u_time;
      uniform float u_int;
      uniform float u_moss;
      uniform float u_frost;
      uniform float u_geode;
      uniform float u_beat;
      uniform vec2 u_res;
      varying vec2 v_uv;

      float hash(float n){return fract(sin(n)*43758.5453123);}
      float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}

      float noise(vec2 p){
        vec2 i=floor(p),f=fract(p);
        f=f*f*(3.0-2.0*f);
        return mix(mix(hash2(i),hash2(i+vec2(1,0)),f.x),
                     mix(hash2(i+vec2(0,1)),hash2(i+vec2(1,1)),f.x),f.y);
      }

      float fbm(vec2 p){
        float v=0.0,a=0.5;
        mat2 r=mat2(0.8,0.6,-0.6,0.8);
        for(int i=0;i<6;i++){
          v+=a*noise(p);
          p=r*p*2.1+vec2(0.3,0.7);
          a*=0.42;
        }
        return v;
      }

      float frostPattern(vec2 uv,float sharp){
        vec2 p=uv*6.0;
        float v=0.0;
        for(int i=0;i<5;i++){
          p=fract(p)-0.5;
          float d=length(p)*2.0;
          float angle=atan(p.y,p.x);
          float branch=abs(sin(angle*(6.0+float(i))+float(i)*1.5));
          v+=(1.0-d)*branch*sharp;
          p*=2.3;
        }
        return v;
      }

      float geodeCrystals(vec2 uv,float int){
        vec2 p=(uv-0.5)*2.0;
        float r=length(p),a=atan(p.y,p.x);
        float c=0.0;
        for(int i=0;i<16;i++){
          float an=float(i)/16.0*6.28318;
          float cr=abs(sin((a-an)*3.0));
          float dist=smoothstep(0.9,0.1,r);
          c+=cr*dist;
        }
        return c*int;
      }

      vec3 mossColors(vec2 uv,float t){
        vec2 s=uv*8.0;
        float n1=fbm(s+t*0.02);
        float n2=fbm(s*1.5+vec2(t*0.013,-t*0.009));
        float n3=noise(s*3.0+t*0.028);
        vec3 deep=vec3(0.022,0.048,0.032);
        vec3 mid=vec3(0.065,0.17,0.095);
        vec3 light=vec3(0.11,0.26,0.15);
        float mv=n1*0.55+n2*0.3+n3*0.15;
        vec3 col=mix(deep,mid,smoothstep(0.18,0.58,mv));
        col=mix(col,light,smoothstep(0.48,0.82,n2)*0.4);
        float mg=smoothstep(0.52,0.78,n1)*0.3;
        col+=vec3(0.045,0.14,0.075)*mg;
        float vig=1.0-smoothstep(0.25,1.4,length(uv-0.5)*1.6);
        col*=mix(0.52,1.0,vig);
        return col;
      }

      vec3 geodeColors(vec2 uv,float int,float t){
        vec2 p=(uv-0.5)*2.0;
        float r=length(p),a=atan(p.y,p.x);
        float facet=0.0;
        for(int i=0;i<10;i++){
          float an=float(i)/10.0*6.28318+t*0.04;
          facet+=abs(sin((a-an)*4.0));
        }
        facet/=10.0;
        vec3 dk=vec3(0.07,0.028,0.14);
        vec3 mc=vec3(0.33,0.11,0.52);
        vec3 bc=vec3(0.62,0.33,0.82);
        vec3 pearl=vec3(0.78,0.73,0.88);
        float rad=1.0-smoothstep(0.0,1.1,r);
        vec3 col=mix(dk,mc,rad*facet*int);
        col=mix(col,bc,smoothstep(0.08,0.65,rad*facet)*int*0.55);
        float pe=smoothstep(0.68,0.32,abs(facet-0.5))*rad;
        col+=pearl*pe*int*0.32;
        float hz=fbm(uv*3.0+t*0.035)*0.18;
        col+=vec3(0.13,0.11,0.16)*hz*int;
        return col;
      }

      void main(){
        float t=u_time, int=u_int;
        float bp=exp(-abs(sin(t*3.14159/1.0714))*4.0);
        vec3 moss=mossColors(v_uv,t);
        vec3 geode=geodeColors(v_uv,int*u_geode,t);
        float blend=pow(1.0-u_moss,1.5);
        vec3 col=mix(moss,geode,blend);
        float ft=smoothstep(0.78,0.93,int);
        float fr=frostPattern(v_uv,ft*u_frost);
        vec3 frostCol=vec3(0.76,0.83,0.9);
        col=mix(col,frostCol,fr*ft*0.22);
        float oc=smoothstep(0.91,1.0,int);
        col=mix(col,col*vec3(0.58,0.54,0.68),oc*0.28);
        col+=vec3(0.07,0.045,0.09)*bp*0.055*(1.0-oc);
        float cg=pow(1.0-length(v_uv-0.5)*1.35,3.0);
        col+=vec3(0.11,0.055,0.19)*cg*blend*0.45;
        float fv=1.0-smoothstep(0.25,1.45,length(v_uv-0.5)*1.5);
        col*=mix(0.48,1.0,fv);
        float grain=hash2(v_uv*1000.0+t*7.0)*0.012;
        col+=grain-0.006;
        col=col/(1.0+col);
        col=pow(col,vec3(0.94));
        gl_FragColor=vec4(col,1.0);
      }
    `;

    // ─── GL INIT ───────────────────────────
    function initGL() {
        const canvas = document.getElementById("gl");
        gl = canvas.getContext("webgl", {
            antialias: true, alpha: false, preserveDrawingBuffer: false,
            powerPreference: "high-performance"
        });
        if (!gl) return false;

        const vs = compileShader(gl.VERTEX_SHADER, VERT);
        const fs = compileShader(gl.FRAGMENT_SHADER, FRAG);
        if (!vs || !fs) return false;

        program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1
        ]), gl.STATIC_DRAW);

        const loc = gl.getAttribLocation(program, "a_pos");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        gl.useProgram(program);
        resize();
        return true;
    }

    function compileShader(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
        return s;
    }

    // ─── AUDIO ENGINE ──────────────────────
    let subBassOsc, subBassGain, subBassLPF;
    let swellOsc, swellGain, swellLPF;
    let pearlOsc1, pearlOsc2, pearlGain, pearlLPF;
    let chimeOsc, chimeGain, chimeLPF;
    let droneOsc1, droneOsc2, droneGain;
    let limNode;
    let audioInitialized = false;

    function initAudio() {
        if (audioInitialized) return;
        audioInitialized = true;

        audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // Soft-cap limiter
        limNode = audioCtx.createWaveShaper();
        const curve = new Float32Array(44100);
        for (let i = 0; i < 44100; i++) {
            const x = (i * 2) / 44100 - 1;
            curve[i] = Math.tanh(x * 2.2) / 2.2;
        }
        limNode.curve = curve;
        limNode.oversample = "4x";

        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.48;
        masterGain.connect(limNode);
        limNode.connect(audioCtx.destination);

        // ── Sub-bass swelling pulse (<80Hz strictly) ──
        subBassOsc = audioCtx.createOscillator();
        subBassOsc.type = "sine";
        subBassOsc.frequency.value = 44;
        subBassLPF = audioCtx.createBiquadFilter();
        subBassLPF.type = "lowpass";
        subBassLPF.frequency.value = 78;
        subBassLPF.Q.value = 0.4;
        subBassGain = audioCtx.createGain();
        subBassGain.gain.value = 0;
        subBassOsc.connect(subBassLPF);
        subBassLPF.connect(subBassGain);
        subBassGain.connect(masterGain);
        subBassOsc.start();

        // ── Ambient drone layer ──
        droneOsc1 = audioCtx.createOscillator();
        droneOsc1.type = "sine";
        droneOsc1.frequency.value = 73.42;
        droneOsc2 = audioCtx.createOscillator();
        droneOsc2.type = "sine";
        droneOsc2.frequency.value = 73.58;
        droneGain = audioCtx.createGain();
        droneGain.gain.value = 0.035;
        droneOsc1.connect(droneGain);
        droneOsc2.connect(droneGain);
        droneGain.connect(masterGain);
        droneOsc1.start();
        droneOsc2.start();

        // ── Breath-reactive swell (sub-bass <80Hz) ──
        swellOsc = audioCtx.createOscillator();
        swellOsc.type = "sine";
        swellOsc.frequency.value = 52;
        swellLPF = audioCtx.createBiquadFilter();
        swellLPF.type = "lowpass";
        swellLPF.frequency.value = 70;
        swellLPF.Q.value = 0.35;
        swellGain = audioCtx.createGain();
        swellGain.gain.value = 0;
        swellOsc.connect(swellLPF);
        swellLPF.connect(swellGain);
        swellGain.connect(masterGain);
        swellOsc.start();

        // ── Pearl harmonic layer ──
        pearlOsc1 = audioCtx.createOscillator();
        pearlOsc1.type = "sine";
        pearlOsc1.frequency.value = 220;
        pearlOsc2 = audioCtx.createOscillator();
        pearlOsc2.type = "triangle";
        pearlOsc2.frequency.value = 329.63;
        pearlLPF = audioCtx.createBiquadFilter();
        pearlLPF.type = "lowpass";
        pearlLPF.frequency.value = 600;
        pearlLPF.Q.value = 0.5;
        pearlGain = audioCtx.createGain();
        pearlGain.gain.value = 0;
        pearlOsc1.connect(pearlLPF);
        pearlOsc2.connect(pearlLPF);
        pearlLPF.connect(pearlGain);
        pearlGain.connect(masterGain);
        pearlOsc1.start();
        pearlOsc2.start();

        // ── Geode chimes (rolled-off upper harmonics) ──
        chimeOsc = audioCtx.createOscillator();
        chimeOsc.type = "sine";
        chimeOsc.frequency.value = 523.25;
        chimeLPF = audioCtx.createBiquadFilter();
        chimeLPF.type = "lowpass";
        chimeLPF.frequency.value = 850;
        chimeLPF.Q.value = 0.8;
        chimeGain = audioCtx.createGain();
        chimeGain.gain.value = 0;
        chimeOsc.connect(chimeLPF);
        chimeLPF.connect(chimeGain);
        chimeGain.connect(masterGain);
        chimeOsc.start();
    }

    // ─── AUDIO UPDATE ──────────────────────
    function updateAudio(dt) {
        if (!audioCtx || audioCtx.state === "suspended") return;
        const now = audioCtx.currentTime;
        const ci = S.smoothIntensity;
        const t = S.time;

        // ── Sub-bass pulse locked to 56 BPM ──
        const beatPhase = ((t - S.lastBeatTime) / BEAT_DURATION);
        const subPulseEnv = Math.exp(-beatPhase * 3.5) * (0.08 + ci * 0.28);
        subBassGain.gain.setTargetAtTime(subPulseEnv, now, 0.012);
        subBassOsc.frequency.setTargetAtTime(40 + ci * 12, now, 0.04);

        // ── Swell tracks breath via low-pass ──
        const swellFreq = 50 + ci * 25;
        swellOsc.frequency.setTargetAtTime(swellFreq, now, 0.07);
        const lpfFreq = ci > 0.5 ? 70 + (ci - 0.5) * 900 : 70;
        swellLPF.frequency.setTargetAtTime(Math.min(lpfFreq, 1100), now, 0.09);
        swellGain.gain.setTargetAtTime(ci * 0.13, now, 0.1);

        // ── Pearl layer unlocks at geode bloom threshold ──
        const pearlAct = smoothstepJS(0.35, 0.72, ci);
        pearlOsc1.frequency.setTargetAtTime(220 + ci * 55, now, 0.13);
        pearlOsc2.frequency.setTargetAtTime(329.63 + ci * 40, now, 0.13);
        pearlLPF.frequency.setTargetAtTime(500 + pearlAct * 600, now, 0.1);
        pearlGain.gain.setTargetAtTime(
            pearlAct * 0.055 * (1.0 + Math.sin(t * 0.75) * 0.25),
            now, 0.08
        );

        // ── Drone breathes subtly ──
        droneGain.gain.setTargetAtTime(0.032 + ci * 0.02, now, 0.04);

        // ── Chime triggers at frost peaks ──
        const { beat: qb } = quantizeBeat(t);
        if (ci > FROST_MIN && S.lastPeakBeat !== qb) {
            S.lastPeakBeat = qb;
            playChime(qb, now);
        }
    }

    function playChime(beat, now) {
        const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
        const note = notes[beat % notes.length];
        chimeOsc.frequency.setTargetAtTime(note, now, 0.008);
        chimeGain.gain.setTargetAtTime(0.065, now, 0.006);
        chimeGain.gain.setTargetAtTime(0.001, now + 0.28, 0.18);

        // Occasional harmonic 5th layer
        if (beat % 3 === 0) {
            chimeLPF.frequency.setTargetAtTime(1100, now, 0.02);
        } else {
            chimeLPF.frequency.setTargetAtTime(750, now, 0.03);
        }
    }

    // ─── BEAT QUANTIZER ───────────────────
    function quantizeBeat(time) {
        const raw = Math.round(time / BEAT_DURATION);
        const quantized = raw * BEAT_DURATION;
        const diff = Math.abs(time - quantized);
        const inWindow = diff <= (QUANTUM_MS / 1000);
        return { beat: raw, quantized, inWindow };
    }

    // ─── LOW-PASS FILTER ──────────────────
    function applyLowPass(raw) {
        S.lpfState = S.lpfState + LPF_ALPHA * (raw - S.lpfState);
        return S.lpfState;
    }

    // ─── HYSTERESIS ───────────────────────
    function applyHysteresis(current, raw) {
        const delta = raw - current;
        if (Math.abs(delta) < HYSTERESIS_THRESHOLD) return current;
        S.hysteresisDir = delta > 0 ? 1 : -1;
        return raw;
    }

    // ─── PHYSICS UPDATE ───────────────────
    function updatePhysics(dt) {
        const t = S.time;

        // Low-pass filter on raw input
        const filtered = applyLowPass(S.rawInput);
        const hysteresisFiltered = applyHysteresis(S.breathIntensity, filtered);
        S.breathIntensity = hysteresisFiltered;

        // Fluid damping: target -> smooth with eased curve
        const diff = S.breathIntensity - S.smoothIntensity;
        const factor = 1 - Math.exp(-DAMPING * dt * 60);
        S.smoothIntensity += diff * factor;

        // Soft cap
        S.smoothIntensity = Math.min(SOFT_CAP, Math.max(0, S.smoothIntensity));

        // Velocity tracking
        S.inputVelocity = (S.smoothIntensity - S.breathIntensity) / Math.max(dt, 0.001);

        // Moss-to-geode transition (smooth eased)
        const tp = smoothstepJS(0.12, 0.7, S.smoothIntensity);
        S.mossPhase = 1.0 - easeInOutCubic(tp);

        // Geode glow with breathing oscillation
        const baseGlow = tp;
        const breathPulse = Math.sin(t * Math.PI * 2 / BEAT_DURATION) * 0.04;
        S.geodeGlow = Math.max(0, baseGlow + breathPulse);

        // Frost fractal: sharp at 80-90%, cool fade above
        const frostRaw = smoothstepJS(FROST_MIN, FROST_MAX, S.smoothIntensity);
        const frostCool = 1.0 - smoothstepJS(0.91, 1.0, S.smoothIntensity);
        S.frostLevel = frostRaw * frostCool;

        // Exhale decay when input drops
        if (S.breathIntensity < 0.08 && S.smoothIntensity > 0.005) {
            S.smoothIntensity *= (1.0 - dt * EXHALE_DECAY);
        }

        // Beat tracking
        const { beat: qb, quantized: qt } = quantizeBeat(t);
        if (qb !== S.beatCount && qt > 0) {
            S.beatCount = qb;
            S.lastBeatTime = qt;
        }
    }

    // ─── EASING FUNCTIONS ─────────────────
    function smoothstepJS(min, max, x) {
        const t = Math.max(0, Math.min(1, (x - min) / (max - min)));
        return t * t * (3 - 2 * t);
    }

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // ─── RENDER ───────────────────────────
    function render() {
        if (!gl || !program) return;
        gl.viewport(0, 0, S.width, S.height);
        gl.clearColor(0.02, 0.025, 0.035, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const u = (n) => gl.getUniformLocation(program, n);
        gl.uniform1f(u("u_time"), S.time);
        gl.uniform1f(u("u_int"), S.smoothIntensity);
        gl.uniform1f(u("u_moss"), S.mossPhase);
        gl.uniform1f(u("u_frost"), S.frostLevel);
        gl.uniform1f(u("u_geode"), S.geodeGlow);
        gl.uniform1f(u("u_beat"),
            Math.exp(-Math.abs(Math.sin(S.time * Math.PI / BEAT_DURATION)) * 4.0));
        gl.uniform2f(u("u_res"), S.width, S.height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // ─── RESIZE ───────────────────────────
    function resize() {
        const canvas = document.getElementById("gl");
        S.dpr = Math.min(window.devicePixelRatio || 1, 2);
        S.width = Math.floor(canvas.clientWidth * S.dpr);
        S.height = Math.floor(canvas.clientHeight * S.dpr);
        canvas.width = S.width;
        canvas.height = S.height;
        if (gl) gl.viewport(0, 0, S.width, S.height);
    }

    // ─── INPUT HANDLING ───────────────────
    function setupInput() {
        const canvas = document.getElementById("gl");

        // Mouse
        let mouseDown = false;
        canvas.addEventListener("mousedown", (e) => {
            if (!running) { start(); running = true; }
            mouseDown = true;
            S.dragging = true;
            S.prevMouseX = e.clientX;
            S.prevMouseY = e.clientY;
        });
        canvas.addEventListener("mousemove", (e) => {
            if (!S.dragging && !mouseDown) return;
            const dx = e.clientX - S.prevMouseX;
            const dy = e.clientY - S.prevMouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = Math.min(dist / (60 * S.dpr), 1.0);
            S.rawInput = speed;
            S.prevMouseX = e.clientX;
            S.prevMouseY = e.clientY;
        });
        canvas.addEventListener("mouseup", () => {
            mouseDown = false;
            S.dragging = false;
            S.rawInput *= 0.25;
        });
        canvas.addEventListener("mouseleave", () => {
            mouseDown = false;
            S.dragging = false;
            S.rawInput *= 0.25;
        });

        // Touch
        canvas.addEventListener("touchstart", (e) => {
            if (!running) { start(); running = true; }
            e.preventDefault();
            S.dragging = true;
            const touch = e.touches[0];
            S.prevMouseX = touch.clientX;
            S.prevMouseY = touch.clientY;
        }, { passive: false });
        canvas.addEventListener("touchmove", (e) => {
            e.preventDefault();
            if (!S.dragging) return;
            const touch = e.touches[0];
            const dx = touch.clientX - S.prevMouseX;
            const dy = touch.clientY - S.prevMouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            S.rawInput = Math.min(dist / (60 * S.dpr), 1.0);
            S.prevMouseX = touch.clientX;
            S.prevMouseY = touch.clientY;
        }, { passive: false });
        canvas.addEventListener("touchend", (e) => {
            e.preventDefault();
            S.dragging = false;
            S.rawInput *= 0.25;
        }, { passive: false });

        // Scroll as breath proxy
        canvas.addEventListener("wheel", (e) => {
            e.preventDefault();
            S.rawInput = Math.min(Math.abs(e.deltaY) / 250, 1.0);
        }, { passive: false });

        // Space key
        document.addEventListener("keydown", (e) => {
            if (e.code === "Space") { e.preventDefault(); S.rawInput = 1; S.dragging = true; }
        });
        document.addEventListener("keyup", (e) => {
            if (e.code === "Space") { S.rawInput *= 0.2; S.dragging = false; }
        });

        window.addEventListener("resize", resize);
    }

    // ─── MAIN LOOP ────────────────────────
    let _frameStart = 0;
    let _prevBeat = -1;

    function mainLoop(timestamp) {
        if (!_frameStart) _frameStart = timestamp;

        const dt = Math.min((timestamp - S.prevTimestamp) / 1000, 0.05);
        S.prevTimestamp = timestamp || performance.now();
        S.time += dt;

        updatePhysics(dt);

        // Quantized audio update
        const { beat: qb } = quantizeBeat(S.time);
        if (qb !== _prevBeat) {
            _prevBeat = qb;
            if (audioCtx && audioCtx.state !== "suspended") {
                const now = audioCtx.currentTime;
                // Quantized sub-bass pulse at exact beat time
                subBassGain.gain.setTargetAtTime(0.3, now, 0.012);
                subBassGain.gain.setTargetAtTime(0.02, now + 0.07, 0.04);
            }
        }

        updateAudio(dt);
        render();

        requestAnimationFrame(mainLoop);
    }

    // ─── START / RESUME ──────────────────
    function start() {
        initAudio();
        if (audioCtx && audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        const overlay = document.getElementById("start-overlay");
        if (overlay) overlay.classList.add("hidden");
        running = true;
    }

    // ─── INIT ─────────────────────────────
    function init() {
        if (!initGL()) return;
        setupInput();

        // Wire start button
        const btn = document.getElementById("start-btn");
        if (btn) btn.addEventListener("click", start);

        // Also start on any canvas interaction
        const canvas = document.getElementById("gl");
        canvas.addEventListener("mousedown", () => { if (!running) start(); }, { once: true });
        canvas.addEventListener("touchstart", () => { if (!running) start(); }, { once: true });

        S.prevTimestamp = performance.now();
        requestAnimationFrame(mainLoop);
    }

    window.addEventListener("DOMContentLoaded", init);

})();
