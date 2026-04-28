(function () {
   "use strict";

   const CYCLE = 12;
   const INHALE = 3;
   const HOLD = 5;
   const EXHALE = 4;
   const MAX_P = 1500;
   const HC = 14, HR = 10;

   const canvas = document.getElementById("gl");
   const startBtn = document.getElementById("start");
   const eltsDiv = document.getElementById("elements");
   const phaseLabel = document.getElementById("phase");

   let gl, audioCtx;
   let running = false;
   let breathVal = 0, curPhase = "inhale";
   let pressure = 0, dragging = false;
   let activeElts = new Set(["water", "fire"]);
   let t0 = 0, audioStart = 0;
   let lastFrame = 0;

   let fbo, fboTex;
   let latticeProg, latVao, latVbo, latIbo, latCount;
   let particleProg, pVao, pPosBuf, pColBuf, pSizeBuf;
   let bgProg, quadVao, qBuf;
   let postProg, postVao, postBuf;
   let pData = { pos: null, col: null, size: null, vel: null, life: null, maxLife: null, elt: null };

   const palette = {
      water: [0.25, 0.50, 0.90], fire: [0.95, 0.40, 0.10],
      sea: [0.10, 0.35, 0.55], lava: [0.90, 0.25, 0.05],
      snow: [0.90, 0.92, 0.97], ice: [0.45, 0.85, 0.95]
   };
   const eltNames = ["water", "fire", "sea", "lava", "snow", "ice"];

   /* ─── Shaders ──────────────────────────────────── */
   const BG_VERT = `#version 300 es
      in vec2 a_pos; out vec2 v_uv;
      void main(){ v_uv=a_pos*.5+.5; gl_Position=vec4(a_pos,0,1); }`;

   const BG_FRAG = `#version 300 es
      precision highp float;
      in vec2 v_uv; uniform float u_t, u_b; out vec4 fragColor;
      void main(){
         vec2 p=v_uv-.5; float t=u_t*.08;
         float ray=(sin(length(p)*8.-t*.7)*.5+.5)*smoothstep(.5,.0,length(p));
         vec3 bg=vec3(.02,.02,.07);
         vec3 c=mix(bg, vec3(.05,.07,.16)+(vec3(.02,.015,.035)*u_b), ray*.4+.12*u_b);
         float s=step(.997,fract(sin(dot(floor(v_uv*250.),vec2(12.9898,78.233)))*43758.5453));
         c+=s*.12*(.5+.5*sin(u_t*1.3+s*6.28));
         for(int i=0;i<3;i++){
            float fi=float(i);
            vec2 rd=normalize(vec2(cos(fi*2.1+t*.3),sin(fi*1.7+t*.2)));
            float g=abs(dot(p,rd))*2.;
            g=exp(-g*g*8.)*.04*(.5+.5*sin(t+fi));
            c+=vec3(.15,.2,.35)*g*u_b;
          }
         fragColor=vec4(c,1);
       }`;

   const LAT_VERT = `#version 300 es
      in vec3 a_v; in float a_i;
      uniform float u_t, u_b; out vec2 v_uv; out float v_i; out vec3 v_bc;
      void main(){
         vec2 uv=a_v.xy;
         float d=a_v.z;
         float breathe=sin(u_t*.3+a_i*.8)*u_b*.06+sin(u_t*.18+a_i*1.5)*u_b*.04;
         uv+=vec2(breathe*d, breathe*d*.7);
         v_uv=uv; v_i=a_i;
         v_bc=mix(vec3(.15,.2,.45), vec3(.2,.35,.65), sin(a_i*.4+u_t*.3)*.5+.5);
         gl_Position=vec4(uv*2., 0, 1);
       }`;

   const LAT_FRAG = `#version 300 es
      precision highp float;
      in vec2 v_uv; in float v_i; in vec3 v_bc;
      uniform float u_b; uniform vec3 u_c0, u_c1; out vec4 fragColor;
      void main(){
         vec3 c=mix(u_c0, u_c1, sin(v_i*.3+u_b*2.)*.5+.5);
         float a=v_bc.r;
         a*=.3+u_b*.7;
         float edge=smoothstep(.0,.08, fract(v_i*.17));
         edge=smoothstep(.0,.2, edge);
         a+=edge*.15;
         fragColor=vec4(c*a, a*.9);
       }`;

   const P_VERT = `#version 300 es
      in vec2 a_pos; in vec4 a_col; in float a_sz;
      uniform vec2 u_res;
      out vec4 v_col;
      void main(){
         vec2 ndc=a_pos/u_res*2.-1.;
         ndc.y=-ndc.y;
         gl_Position=vec4(ndc,0,1);
         gl_PointSize=a_sz;
         v_col=a_col;
       }`;

   const P_FRAG = `#version 300 es
      precision highp float; in vec4 v_col; out vec4 fragColor;
      void main(){
         float d=length(gl_PointCoord-.5)*2.;
         float a=smoothstep(1.,.3,d);
         fragColor=v_col*a;
       }`;

   const POST_FRAG = `#version 300 es
      precision highp float; in vec2 v_uv;
      uniform sampler2D u_tex; uniform float u_bloom, u_vig; out vec4 fragColor;
      void main(){
         vec3 c=texture(u_tex, v_uv).rgb;
         vec3 b=vec3(0);
         for(int i=0;i<16;i++){
            float ang=6.28318/16.*float(i);
            vec2 off=vec2(cos(ang),sin(ang))*.01*u_bloom;
            b+=texture(u_tex, v_uv+off).rgb;
          }
         b/=16.;
         vec3 o=c+b*u_bloom*.4;
         float v=1.-distance(v_uv,.5)*u_vig;
         o*=clamp(v,0.,1.);
         fragColor=vec4(o,1.);
       }`;

   /* ─── Shader compile ──────────────── */
   function mkShader(t, s) {
      const sh = gl.createShader(t);
      gl.shaderSource(sh, s); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      return sh;
   }
   function mkProg(v, f) {
      const p = gl.createProgram();
      gl.attachShader(p, mkShader(gl.VERTEX_SHADER, v));
      gl.attachShader(p, mkShader(gl.FRAGMENT_SHADER, f));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return p;
   }

   /* ─── Hex lattice ──────────────────── */
   function buildLattice() {
      const v = [], idx = [], verts3 = [];
      let vi = 0;
      for (let r = 0; r < HR; r++) {
         for (let c = 0; c < HC; c++) {
            const cx = (c - HC / 2 + .5) * .115 + (r % 2 ? .0575 : 0);
            const cy = (r - HR / 2 + .5) * .175;
            const edgeVerts = [];
            const sz = .052;
            for (let k = 0; k < 6; k++) {
               const a = Math.PI / 3 * k;
               const px = cx + Math.cos(a) * sz;
               const py = cy + Math.sin(a) * sz;
               const d = Math.sqrt(cx * cx + cy * cy);
               verts3.push(px, py, d);
               edgeVerts.push(vi);
               vi++;
             }
             for (let k = 0; k < 6; k++) {
               idx.push(edgeVerts[0], edgeVerts[k], edgeVerts[(k + 1) % 6]);
               }
          }
       }
      return { v: new Float32Array(verts3), idx: new Uint16Array(idx), vi: vi, tri: idx.length };
   }

   /* ─── Particle init ───────────────── */
   function initPD(w, h) {
      const n = MAX_P;
      const pos = new Float32Array(n * 2);
      const vel = new Float32Array(n * 2);
      const col = new Float32Array(n * 4);
      const sz = new Float32Array(n);
      const life = new Float32Array(n);
      const ml = new Float32Array(n);
      const elt = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
         pos[i * 2] = Math.random() * w;
         pos[i * 2 + 1] = Math.random() * h;
         life[i] = Math.random() * 200;
         ml[i] = 80 + Math.random() * 200;
         elt[i] = Math.floor(Math.random() * 6);
       }
      return { pos, col, sz, vel, life, ml, elt };
   }

   /* ─── WebGL bootstrap ─────────────── */
   function initGL() {
      gl = canvas.getContext("webgl2", { antialias: true, alpha: false });
      if (!gl) { alert("WebGL2 not supported"); return false; }
      return true;
   }

   function resizeGL() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const w = innerWidth * dpr, h = innerHeight * dpr;
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);

      if (fbo) { gl.deleteFramebuffer(fbo); gl.deleteTexture(fboTex); }
      fboTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, fboTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, Math.floor(w), Math.floor(h), 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fboTex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      buildPrograms(w, h);
   }

   function buildPrograms(w, h) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      /* Background */
      bgProg = mkProg(BG_VERT, BG_FRAG);
      quadVao = gl.createVertexArray();
      gl.bindVertexArray(quadVao);
      qBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, qBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(gl.getAttribLocation(bgProg, "a_pos"));
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);

      /* Post */
      postProg = mkProg(BG_VERT, POST_FRAG);
      postVao = gl.createVertexArray();
      gl.bindVertexArray(postVao);
      postBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, postBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(gl.getAttribLocation(postProg, "a_pos"));
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);

      /* Lattice */
      const lat = buildLattice();
      latticeProg = mkProg(LAT_VERT, LAT_FRAG);
      latVao = gl.createVertexArray();
      gl.bindVertexArray(latVao);

      latVbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, latVbo);
      gl.bufferData(gl.ARRAY_BUFFER, lat.v, gl.STATIC_DRAW);
      const a0 = gl.getAttribLocation(latticeProg, "a_v");
      gl.enableVertexAttribArray(a0);
      gl.vertexAttribPointer(a0, 3, gl.FLOAT, false, 0, 0);

      const idxV = new Float32Array(lat.vi);
      for (let i = 0; i < lat.vi; i++) idxV[i] = i;
      const ibo2 = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, ibo2);
      gl.bufferData(gl.ARRAY_BUFFER, idxV, gl.STATIC_DRAW);
      const ai = gl.getAttribLocation(latticeProg, "a_i");
      gl.enableVertexAttribArray(ai);
      gl.vertexAttribPointer(ai, 1, gl.FLOAT, false, 0, 0);

      latIbo = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, latIbo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, lat.idx, gl.STATIC_DRAW);
      latCount = lat.tri;
      gl.bindVertexArray(null);

        /* Particles */
      pData = initPD(w, h);
      particleProg = mkProg(P_VERT, P_FRAG);
      pVao = gl.createVertexArray();
      gl.bindVertexArray(pVao);

      const ppLoc = gl.getAttribLocation(particleProg, "a_pos");
      pPosBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, pPosBuf);
      gl.bufferData(gl.ARRAY_BUFFER, pData.pos, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(ppLoc);
      gl.vertexAttribPointer(ppLoc, 2, gl.FLOAT, false, 0, 0);

      const pcLoc = gl.getAttribLocation(particleProg, "a_col");
      pColBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, pColBuf);
      gl.bufferData(gl.ARRAY_BUFFER, pData.col, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(pcLoc);
      gl.vertexAttribPointer(pcLoc, 4, gl.FLOAT, false, 0, 0);

      const psLoc = gl.getAttribLocation(particleProg, "a_sz");
      pSizeBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, pSizeBuf);
      gl.bufferData(gl.ARRAY_BUFFER, pData.sz, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(psLoc);
      gl.vertexAttribPointer(psLoc, 1, gl.FLOAT, false, 0, 0);

      gl.bindVertexArray(null);
   }

   /* ─── Audio engine ───────────────── */
   let audio = {};

   function initAudio() {
      audioCtx = new (AudioContext || webkitAudioContext)();
      const now = audioCtx.currentTime;

      const comp = audioCtx.createDynamicsCompressor();
      comp.threshold.value = -10; comp.knee.value = 8;
      comp.ratio.value = 6; comp.attack.value = 0.005; comp.release.value = 0.1;

      const ms = audioCtx.createGain(); ms.gain.value = 0.65;

      const dry = audioCtx.createGain(); dry.gain.value = 0.7;
      const wet = audioCtx.createGain(); wet.gain.value = 0.25;

      const conv = audioCtx.createConvolver();
      const sr = audioCtx.sampleRate, len = sr * 3;
      const ir = audioCtx.createBuffer(2, len, sr);
      for (let ch = 0; ch < 2; ch++) {
         const d = ir.getChannelData(ch);
         for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
       }
      conv.buffer = ir;

      ms.connect(dry); dry.connect(comp);
      ms.connect(conv); conv.connect(wet); wet.connect(comp);
      comp.connect(audioCtx.destination);

      audio.ms = ms; audio.comp = comp; audio.wet = wet; audio.wetG = wet;

      eltNames.forEach(n => {
         const g = audioCtx.createGain(); g.gain.value = 0;
         const f = audioCtx.createBiquadFilter(); f.type = "lowpass";
         f.frequency.value = 800; f.Q.value = 0.8;
         g.connect(f); f.connect(ms);
         audio[n + "_g"] = g; audio[n + "_f"] = f;
       });

      buildAllLayers();
      audio.start = now;
   }

   function buildAllLayers() {
      /* Water: sine chord */
      audio._wo = [261.6, 329.6, 392, 523].map(f => {
         const o = audioCtx.createOscillator(); o.type = "sine"; o.frequency.value = f;
         const g = audioCtx.createGain(); g.gain.value = 0.06;
         o.connect(g); g.connect(audio.water_g); o.start(); return { o, g };
       });

      /* Fire: FM */
      audio._fc = audioCtx.createOscillator(); audio._fc.type = "sine"; audio._fc.frequency.value = 440;
      audio._fm = audioCtx.createOscillator(); audio._fm.type = "sine"; audio._fm.frequency.value = 1100;
      audio._fmg = audioCtx.createGain(); audio._fmg.gain.value = 250;
      audio._fm.connect(audio._fmg); audio._fmg.connect(audio._fc.frequency);
      audio._fcg = audioCtx.createGain(); audio._fcg.gain.value = 0.04;
      audio._fc.connect(audio._fcg); audio._fcg.connect(audio.fire_g);
      audio._fc.start(); audio._fm.start();

      /* Sea: sub-bass */
      audio._so = audioCtx.createOscillator(); audio._so.type = "sine"; audio._so.frequency.value = 55;
      audio._sog = audioCtx.createGain(); audio._sog.gain.value = 0.1;
      audio._so.connect(audio._sog); audio._sog.connect(audio.sea_g); audio._so.start();

      /* Lava: noise */
      const nr = audioCtx.createBufferSource();
      const lb = audioCtx.createBuffer(1, audioCtx.sampleRate * 3, audioCtx.sampleRate);
      const ld = lb.getChannelData(0);
      for (let i = 0; i < ld.length; i++) ld[i] = Math.random() * 2 - 1;
      nr.buffer = lb; nr.loop = true;
      audio._lvg = audioCtx.createGain(); audio._lvg.gain.value = 0.03;
      nr.connect(audio._lvg); audio._lvg.connect(audio.lava_g); nr.start();

      /* Snow: glass */
      audio._xo = [1175, 1319, 1568, 2093].map(f => {
         const o = audioCtx.createOscillator(); o.type = "sine"; o.frequency.value = f;
         const g = audioCtx.createGain(); g.gain.value = 0.015;
         o.connect(g); g.connect(audio.snow_g); o.start(); return { o, g };
       });

      /* Ice: detuned saw */
      audio._io = [220, 222, 330, 332].map(f => {
         const o = audioCtx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f;
         const g = audioCtx.createGain(); g.gain.value = 0.01;
         o.connect(g); g.connect(audio.ice_g); o.start(); return { o, g };
       });
   }

   function tickAudio(t, br, pr) {
      if (!audioCtx) return;
      const n = audioCtx.currentTime;
      const active = Array.from(activeElts);
      const base = 0.2 + br * 0.5;
      let totalVol = 0;

      active.forEach(name => {
         let vol = base * 0.08;
         if (curPhase === "inhale") vol *= 1 + br * 1.2;
         else if (curPhase === "hold") vol *= 0.7 + pr * 1.5;
         else vol *= 0.4 + (1 - br) * 0.6;
         vol = Math.min(vol, 0.18);
         audio[name + "_g"].gain.setTargetAtTime(vol, n, 0.03);
         totalVol += vol;

         const f = audio[name + "_f"];
         const cut = 400 + br * 2200 + pr * 1500;
         f.frequency.setTargetAtTime(Math.min(cut, 5500), n, 0.06);
         f.Q.setTargetAtTime(0.8 + br * 3, n, 0.08);
       });

      eltNames.forEach(name => {
         if (!activeElts.has(name)) {
            audio[name + "_g"].gain.setTargetAtTime(0, n, 0.12);
          }
       });

      audio.wetG.gain.setTargetAtTime(0.15 + br * 0.3, n, 0.08);

      if (audio._fc) {
         audio._fc.frequency.setTargetAtTime(440 + br * 100, n, 0.08);
         audio._fmg.gain.setTargetAtTime(200 + pr * 350, n, 0.04);
       }
      if (audio._so) audio._so.frequency.setTargetAtTime(55 + br * 10, n, 0.15);
      if (audio._wo) {
         [261.6, 329.6, 392, 523].forEach((f, i) => {
            audio._wo[i].o.frequency.setTargetAtTime(f * (1 + br * 0.015), n, 0.08);
          });
       }

      const masterDuck = totalVol > 0.5 ? 0.6 : 0.9;
      audio.ms.gain.setTargetAtTime(masterDuck, n, 0.05);
   }

   /* ─── Particle update ───────────── */
   function tickPart(t, br, pr) {
      const p = pData, w = canvas.width, h = canvas.height;
      const cx = w / 2, cy = h / 2;
      const active = Array.from(activeElts);
      const emit = 0.12 + br * 0.7 + pr * 2.5;

      for (let i = 0; i < MAX_P; i++) {
         p.life[i] += 1.5;
         if (p.life[i] > p.ml[i]) {
            if (Math.random() < emit * 0.13) {
               const ang = Math.random() * 6.283;
               const dist = 30 + Math.random() * Math.min(w, h) * 0.35;
               p.pos[i * 2] = cx + Math.cos(ang) * dist;
               p.pos[i * 2 + 1] = cy + Math.sin(ang) * dist;
               p.life[i] = 0; p.ml[i] = 60 + Math.random() * 180;
               const sp = 0.4 + br * 1.8;
               const nx = (cx - p.pos[i * 2]) / dist;
               const ny = (cy - p.pos[i * 2 + 1]) / dist;
               if (curPhase === "inhale") {
                  p.vel[i * 2] = nx * sp;
                  p.vel[i * 2 + 1] = ny * sp;
                } else {
                  p.vel[i * 2] = -nx * sp * (0.5 + br * 0.5);
                  p.vel[i * 2 + 1] = -ny * sp * (0.5 + br * 0.5);
                }
             } else { p.life[i] = 9999; }
          }
         p.pos[i * 2] += p.vel[i * 2];
         p.pos[i * 2 + 1] += p.vel[i * 2 + 1];
         p.vel[i * 2] *= 0.985;
         p.vel[i * 2 + 1] *= 0.985;

         const fade = Math.max(0, 1 - p.life[i] / p.ml[i]);
         const ek = Math.min(p.elt[i], 5);
         const en = active[ek % active.length] || "water";
         const pc = palette[en];
         p.col[i * 4] = pc[0]; p.col[i * 4 + 1] = pc[1];
         p.col[i * 4 + 2] = pc[2]; p.col[i * 4 + 3] = fade * (0.25 + br * 0.55);
         p.sz[i] = (2 + br * 5) * (0.4 + fade * 0.6);
       }

      gl.bindBuffer(gl.ARRAY_BUFFER, pPosBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, p.pos);
      gl.bindBuffer(gl.ARRAY_BUFFER, pColBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, p.col);
      gl.bindBuffer(gl.ARRAY_BUFFER, pSizeBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, p.sz);
   }

   /* ─── Render ─────────────────────── */
   function render(t, br, pr) {
      const w = canvas.width, h = canvas.height;
      gl.enable(gl.BLEND);

      /* Pass 1: scene -> FBO */
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(bgProg);
      gl.uniform1f(gl.getUniformLocation(bgProg, "u_t"), t);
      gl.uniform1f(gl.getUniformLocation(bgProg, "u_b"), br);
      gl.bindVertexArray(quadVao);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      const ac = Array.from(activeElts);
      gl.useProgram(latticeProg);
      gl.uniform1f(gl.getUniformLocation(latticeProg, "u_t"), t);
      gl.uniform1f(gl.getUniformLocation(latticeProg, "u_b"), br);
      const c0 = palette[ac[0] || "water"];
      const c1 = palette[ac[1] || "fire"];
      gl.uniform3f(gl.getUniformLocation(latticeProg, "u_c0"), c0[0], c0[1], c0[2]);
      gl.uniform3f(gl.getUniformLocation(latticeProg, "u_c1"), c1[0], c1[1], c1[2]);
      gl.bindVertexArray(latVao);
      gl.drawElements(gl.TRIANGLES, latCount, gl.UNSIGNED_SHORT, 0);

      tickPart(t, br, pr);
      gl.useProgram(particleProg);
      gl.uniform2f(gl.getUniformLocation(particleProg, "u_res"), w, h);
      gl.bindVertexArray(pVao);
      gl.drawArrays(gl.POINTS, 0, MAX_P);

      /* Pass 2: post -> screen */
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(postProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fboTex);
      gl.uniform1i(gl.getUniformLocation(postProg, "u_tex"), 0);
      gl.uniform1f(gl.getUniformLocation(postProg, "u_bloom"), 0.5 + br * 1.3 + pr * 0.5);
      gl.uniform1f(gl.getUniformLocation(postProg, "u_vig"), 1.3);
      gl.bindVertexArray(postVao);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
   }

   /* ─── Breath cycle ──────────────── */
   function breathFromCycle(ct) {
      if (ct < INHALE) {
         const t = ct / INHALE;
         return { p: "inhale", v: 1 - Math.pow(1 - t, 3) };
       } else if (ct < INHALE + HOLD) {
         const t = (ct - INHALE) / HOLD;
         return { p: "hold", v: 0.85 + 0.15 * Math.sin(t * 3.1416) };
       } else {
         const t = (ct - INHALE - HOLD) / EXHALE;
         return { p: "exhale", v: 1 - t * t * t };
       }
   }

   /* ─── Input ─────────────────────── */
   let lastPX = 0, lastPY = 0, downT = 0, velAcc = 0, velN = 0;

   function onDown(e) {
      e.preventDefault(); dragging = true; pressure = 0;
      downT = performance.now();
      const p = getPtr(e); lastPX = p.x; lastPY = p.y;
   }
   function onMove(e) {
      if (!dragging) return; e.preventDefault();
      const p = getPtr(e);
      const dx = p.x - lastPX, dy = p.y - lastPY;
      const dt = Math.max((performance.now() - downT) / 1000, 0.05);
      velAcc += Math.sqrt(dx * dx + dy * dy); velN++;
      pressure = Math.min(velAcc / velN / dt / 400, 1);
      lastPX = p.x; lastPY = p.y;
   }
   function onUp() { dragging = false; }
   function getPtr(e) {
      if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      return { x: e.clientX || 0, y: e.clientY || 0 };
   }

   function bindInput() {
      canvas.addEventListener("mousedown", onDown);
      canvas.addEventListener("mousemove", onMove);
      canvas.addEventListener("mouseup", onUp);
      canvas.addEventListener("mouseleave", onUp);
      canvas.addEventListener("touchstart", onDown, { passive: false });
      canvas.addEventListener("touchmove", onMove, { passive: false });
      canvas.addEventListener("touchend", onUp);
   }

   /* ─── UI ─────────────────────────── */
   const btns = eltsDiv.querySelectorAll("[data-element]");

   function bindUI() {
      btns.forEach(b => {
         b.addEventListener("click", e => {
            e.stopPropagation();
             const n = b.dataset.element;
            if (activeElts.has(n)) {
               if (activeElts.size > 1) activeElts.delete(n);
             } else {
               activeElts.add(n);
             }
             btns.forEach(b2 => b2.classList.toggle("active", activeElts.has(b2.dataset.element)));
          });
       });

      startBtn.addEventListener("click", launch);
      startBtn.addEventListener("touchend", e => { e.preventDefault(); launch(); });
      canvas.addEventListener("click", () => { if (!running) launch(); });
   }

   function launch() {
      if (running) return;
      running = true;
      startBtn.style.display = "none";
      eltsDiv.style.display = "flex";
      phaseLabel.style.display = "block";
      if (!audioCtx) initAudio();
      if (audioCtx.state === "suspended") audioCtx.resume();
      audio.start = audioCtx.currentTime;
      t0 = performance.now() / 1000;
      lastFrame = performance.now();
      bindInput();
      requestAnimationFrame(frame);
   }

   /* ─── Frame loop ─────────────────── */
   function frame(ts) {
      requestAnimationFrame(frame);
      if (!running) return;
      const dt = Math.min((ts - lastFrame) / 1000, 0.05);
      lastFrame = ts;
      const t = ts / 1000 - t0;
      const ct = t % CYCLE;
      const br = breathFromCycle(ct);
      curPhase = br.p; breathVal = br.v;
      phaseLabel.textContent = curPhase;
      const pr = dragging ? pressure : pressure * 0.97;
      tickAudio(t, br.v, pr);
      render(t, br.v, pr);
   }

   /* ─── Boot ───────────────────────── */
   function boot() {
      if (!initGL()) return;
      resizeGL();
      addEventListener("resize", resizeGL);
      bindUI();
   }

   if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
   else boot();
})();
