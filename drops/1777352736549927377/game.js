// ===== Sanctuary: Procedural Moss, Geode, Frost WebGL Experience =====
// Zero-asset, fully procedural. Targets 60fps, 56 BPM tidal pulse.

const SHADERS = {
  mossVert: `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`,
  mossFrag: `#version 300 es
precision highp float;
in vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform float uBreathIntensity;
uniform vec2 uDragPos;
out vec4 fragColor;

vec3 mod2899(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod2899(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod2899(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.853734723400447*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod2899(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

float tidalPulse(float time){
  float bpm=56.0;
  float period=60.0/bpm;
  float phase=fract(time/period);
  return pow(sin(phase*3.14159265),2.0);
}

void main(){
  vec2 uv=vUv;
  vec2 pixel=uv*uResolution;

  float pulse=tidalPulse(uTime);

  vec2 noiseCoord = pixel * 0.012;
  float moss1=snoise(vec3(noiseCoord,uTime*0.02))*0.5+0.5;
  float moss2=snoise(vec3(noiseCoord*2.1+33.0,uTime*0.02+1.0))*0.5+0.5;
  float moss3=snoise(vec3(noiseCoord*4.3+67.0,uTime*0.02+2.0))*0.5+0.5;
  float moss=moss1*0.5+moss2*0.3+moss3*0.2;

  float dragDist=length(uv-uDragPos);
  float dragGlow=exp(-dragDist*3.0)*uBreathIntensity;

  vec3 mossDark=vec3(0.06,0.10,0.05);
  vec3 mossMid=vec3(0.12,0.22,0.09);
  vec3 mossLight=vec3(0.18,0.32,0.14);
  vec3 glowTint=vec3(0.25,0.45,0.30);

  vec3 mossColor=mix(mossDark,mossMid,moss);
  mossColor=mix(mossColor,mossLight,moss3*0.4);

  float light=0.6+0.4*moss;
  light+=dragGlow*0.35;
  float warmth=pulse*0.04*(1.0+uBreathIntensity);
  mossColor*=light;
  mossColor+=glowTint*warmth;

  float vignette=1.0-0.35*pow(length(uv-0.5)*1.4,2.0);
  mossColor*=vignette;
  mossColor*=1.0+uBreathIntensity*0.12;

  fragColor=vec4(mossColor,1.0);
}`,

  geodeVert: `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 vUv;
void main(){
  vUv=aPosition*0.5+0.5;
  gl_Position=vec4(aPosition,0.0,1.0);
}`,

  geodeFrag: `#version 300 es
precision highp float;
in vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform float uBreathIntensity;
uniform vec2 uDragPos;
uniform vec2 uGeodeCenter;
uniform float uGeodeRadius;
out vec4 fragColor;

vec3 mod2899(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod2899(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod2899(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.853734723400447*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod2899(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

float tidalPulse(float time){
  float bpm=56.0;float period=60.0/bpm;float phase=fract(time/period);
  return pow(sin(phase*3.14159265),2.0);
}

float geodeShape(vec2 uv,vec2 center,float radius,float time){
  vec2 d=uv-center;float dist=length(d);
  float angle=atan(d.y,d.x);
  float edgeNoise=snoise(vec3(angle*3.0+time*0.05,time*0.1))*0.15;
  float crystalNoise=snoise(vec3(d*4.0+time*0.03,10.0))*0.08;
  float r=radius+edgeNoise+crystalNoise;
  float edge=smoothstep(r-0.06,r+0.06,dist);
  return edge;
}

float crystalFacets(vec2 uv,vec2 center,float time){
  vec2 d=(uv-center)*6.0;
  float n1=snoise(vec3(d,time*0.02))*0.5+0.5;
  float n2=snoise(vec3(d*2.3+50.0,time*0.04+5.0))*0.5+0.5;
  float n3=snoise(vec3(d*5.0+100.0,time*0.01+10.0))*0.5+0.5;
  float facets=fract(n1*5.0)*0.3+n2*0.4+n3*0.3;
  return facets;
}

void main(){
  vec2 uv=vUv;
  float pulse=tidalPulse(uTime);
  float geodeRadius=uGeodeRadius+uBreathIntensity*0.15;
  float edge=geodeShape(uv,uGeodeCenter,geodeRadius,uTime);
  float facets=crystalFacets(uv,uGeodeCenter,uTime);

  vec3 geodeDark=vec3(0.08,0.03,0.12);
  vec3 geodeMid=vec3(0.20,0.08,0.35);
  vec3 geodeLight=vec3(0.45,0.18,0.60);
  vec3 geodeGlow=vec3(0.70,0.35,0.85);
  vec3 coreWarm=vec3(0.85,0.50,0.55);

  vec3 geodeColor=geodeDark;
  geodeColor=mix(geodeColor,geodeMid,facets*0.6);
  geodeColor=mix(geodeColor,geodeLight,pow(facets,2.0)*0.3);

  float bloom=smoothstep(0.5,1.0,uBreathIntensity)*pulse;
  geodeColor+=geodeGlow*bloom*0.4;
  geodeColor+=coreWarm*bloom*0.15;

  float innerGlow=1.0-smoothstep(0.0,geodeRadius*0.8,length(uv-uGeodeCenter));
  geodeColor+=geodeGlow*innerGlow*bloom*0.25;

  float invEdge=1.0-edge;
  float alpha=smoothstep(0.0,0.3,invEdge);
  float breathe=1.0+pulse*0.05*(1.0+uBreathIntensity*2.0);
  geodeColor*=breathe;

  fragColor=vec4(geodeColor,alpha);
}`,

  frostVert: `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 vUv;
void main(){
  vUv=aPosition*0.5+0.5;
  gl_Position=vec4(aPosition,0.0,1.0);
}`,

  frostFrag: `#version 300 es
precision highp float;
in vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform float uBreathIntensity;
uniform vec2 uDragPos;
uniform vec2 uGeodeCenter;
uniform float uGeodeRadius;
out vec4 fragColor;

vec3 mod2899(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod2899(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod2899(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.853734723400447*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod2899(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

float frostLayers(vec2 uv,float time){
  float total=0.0;float w=0.0;
  float scales[4]=float[](12.0,25.0,45.0,80.0);
  float weights[4]=float[](0.35,0.30,0.20,0.15);
  for(int i=0;i<4;i++){
    vec2 scaled=uv*scales[i];
    float angle=atan(scaled.y,scaled.x);
    float branch=abs(sin((angle*5.0+float(i)*1.7+time*0.008)));
    branch=smoothstep(0.4,0.9,branch);
    float detail=snoise(vec3(scaled,time*0.015+float(i)*15.0))*0.5+0.5;
    detail=pow(detail,2.0);
    total+=branch*detail*weights[i];
    w+=weights[i];
  }
  return total/max(w,0.001);
}

void main(){
  vec2 uv=vUv;
  float distFromGeode=length(uv-uGeodeCenter);
  float edgeProximity=smoothstep(uGeodeRadius*1.8,uGeodeRadius*0.85,distFromGeode);
  float frost=frostLayers(uv*2.0-1.0,uTime);
  float sharpness=edgeProximity*(0.5+uBreathIntensity*0.5);
  frost=smoothstep(1.0-sharpness,1.0,frost);

  vec3 frostCore=vec3(0.65,0.78,0.90);
  vec3 frostBright=vec3(0.88,0.92,0.97);
  vec3 frostWarm=vec3(0.75,0.60,0.80);

  vec3 frostColor=frostCore;
  frostColor=mix(frostColor,frostBright,pow(frost,2.0));

  float warmBleed=edgeProximity*uBreathIntensity*0.3;
  frostColor=mix(frostColor,frostWarm,warmBleed);

  float boundaryGlow=smoothstep(uGeodeRadius*1.3,uGeodeRadius*0.95,distFromGeode);
  frostColor+=frostBright*boundaryGlow*uBreathIntensity*0.2;

  float frostAlpha=frost*edgeProximity*(0.25+uBreathIntensity*0.65);
  frostAlpha=smoothstep(0.05,0.8,frostAlpha);
  frostColor=pow(frostColor,vec3(0.92));

  fragColor=vec4(frostColor,frostAlpha);
}`,

  // Final composite shader merges all layers
  compositeVert: `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 vUv;
void main(){
  vUv=aPosition*0.5+0.5;
  gl_Position=vec4(aPosition,0.0,1.0);
}`,

  compositeFrag: `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uMoss;
uniform sampler2D uGeode;
uniform sampler2D uFrost;
uniform float uBreathIntensity;
uniform float uTime;
out vec4 fragColor;

float tidalPulse(float time){
  float bpm=56.0;float period=60.0/bpm;float phase=fract(time/period);
  return pow(sin(phase*3.14159265),2.0);
}

void main(){
  vec3 moss=texture(uMoss,vUv).rgb;
  vec4 geode=texture(uGeode,vUv);
  vec4 frost=texture(uFrost,vUv);

  // Layer geode over moss with alpha blend
  vec3 combined=mix(moss,geode.rgb,geode.a);

  // Layer frost on top
  combined=mix(combined,frost.rgb,frost.a);

  // Light scattering bloom — subtle glow at peak intensity
  float pulse=tidalPulse(uTime);
  float scatter=pulse*smoothstep(0.4,1.0,uBreathIntensity)*0.08;
  combined+=vec3(0.7,0.6,0.85)*scatter;

  // Soft vignette on final composite
  float vig=1.0-0.25*pow(length(vUv-0.5)*1.5,2.0);
  combined*=vig;

  // Gamma correction
  combined=pow(combined,vec3(1.0/2.2));

  fragColor=vec4(combined,1.0);
}`
};

// ===== WebGL Engine =====

class SanctuaryApp {
  constructor() {
    this.canvas = document.getElementById('gl-canvas');
    this.gl = this.canvas.getContext('webgl2', {
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: false
    });

    if (!this.gl) {
      console.error('WebGL2 not supported');
      return;
    }

    // State
    this.time = 0;
    this.breathIntensity = 0;
    this.targetIntensity = 0;
    this.dragPos = { x: 0.5, y: 0.5 };
    this.lastDragPos = { x: 0.5, y: 0.5 };
    this.isDragging = false;
    this.dragVelocity = 0;
    this.geodeCenter = { x: 0.5, y: 0.45 };
    this.geodeRadius = 0.18;

    // Audio
    this.audioCtx = null;
    this.audioStarted = false;
    this.subBassGain = 0;

    // Low-pass filter for drag input (prevents micro-drift)
    this.inputSmoothing = 0.92;
    this.accumulatedVelocity = 0;

    this.init();
  }

  init() {
    this.setupResizer();
    this.createGeometry();
    this.createPrograms();
    this.createFramebuffers();
    this.setupInput();
    this.lastTime = performance.now();
    this.resize();
    this.render();
  }

  setupResizer() {
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth * dpr;
    this.height = window.innerHeight * dpr;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.gl.viewport(0, 0, this.width, this.height);

    if (this.framebuffers) {
      this.recreateTextures();
    }
  }

  createGeometry() {
    const gl = this.gl;
    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1, -1, 1,
      -1,  1,  1, -1,  1, 1
    ]), gl.STATIC_DRAW);
  }

  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  createProgram(vertSrc, fragSrc) {
    const gl = this.gl;
    const vs = this.compileShader(gl.VERTEX_SHADER, vertSrc);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  createPrograms() {
    this.progMoss = this.createProgram(SHADERS.mossVert, SHADERS.mossFrag);
    this.progGeode = this.createProgram(SHADERS.geodeVert, SHADERS.geodeFrag);
    this.progFrost = this.createProgram(SHADERS.frostVert, SHADERS.frostFrag);
    this.progComposite = this.createProgram(SHADERS.compositeVert, SHADERS.compositeFrag);
  }

  createFramebuffers() {
    const gl = this.gl;
    this.framebuffers = {};

    ['moss', 'geode', 'frost'].forEach(name => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      this.framebuffers[name] = { tex, fb };
    });
  }

  recreateTextures() {
    const gl = this.gl;
    ['moss', 'geode', 'frost'].forEach(name => {
      const { tex, fb } = this.framebuffers[name];
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    });
  }

  setupInput() {
    const normalizePos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) / rect.width,
        y: 1.0 - (clientY - rect.top) / rect.height
      };
    };

    const onDown = (e) => {
      e.preventDefault();
      this.isDragging = true;
      const pos = normalizePos(e);
      this.lastDragPos = { ...pos };
      this.dragPos = { ...pos };
      this.accumulatedVelocity = 0;
      this.initAudio();
    };
    const onMove = (e) => {
      e.preventDefault();
      if (!this.isDragging) return;
      const pos = normalizePos(e);

      const dx = pos.x - this.lastDragPos.x;
      const dy = pos.y - this.lastDragPos.y;
      const vel = Math.sqrt(dx * dx + dy * dy);

      this.accumulatedVelocity = this.accumulatedVelocity * this.inputSmoothing + vel * (1 - this.inputSmoothing);
      this.targetIntensity = Math.min(1.0, this.accumulatedVelocity * 12.0);

      this.lastDragPos = { ...pos };
      this.dragPos = pos;
    };
    const onUp = () => {
      this.isDragging = false;
      this.targetIntensity = 0;
    };

    this.canvas.addEventListener('mousedown', onDown);
    this.canvas.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    this.canvas.addEventListener('touchstart', onDown, { passive: false });
    this.canvas.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  }

  // ===== WebAudio: Deep Current ambient bed at 56 BPM, sub-bass <80Hz =====
  initAudio() {
    if (this.audioStarted) return;
    this.audioStarted = true;

    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = this.audioCtx;
    const master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);

    // --- Sub-bass tidal layer <80Hz ---
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.value = 45; // Deep sub-bass, well under 80Hz

    const subGain = ctx.createGain();
    subGain.gain.value = 0.25;

    // Slow LFO modulating sub-bass at 56 BPM
    const subLfo = ctx.createOscillator();
    subLfo.type = 'sine';
    subLfo.frequency.value = 56 / 60; // 56 BPM
    const subLfoGain = ctx.createGain();
    subLfoGain.gain.value = 15;
    subLfo.connect(subLfoGain);
    subLfoGain.connect(subOsc.frequency);
    subOsc.connect(subGain);
    subGain.connect(master);
    subOsc.start();
    subLfo.start();

    // --- Pearl harmonic layer (activates with geode bloom) ---
    const pearlOsc = ctx.createOscillator();
    pearlOsc.type = 'sine';
    pearlOsc.frequency.value = 220;
    const pearlGain = ctx.createGain();
    pearlGain.gain.value = 0;
    const pearlFilter = ctx.createBiquadFilter();
    pearlFilter.type = 'lowpass';
    pearlFilter.frequency.value = 400;
    pearlFilter.Q.value = 2;
    pearlOsc.connect(pearlFilter);
    pearlFilter.connect(pearlGain);
    pearlGain.connect(master);
    pearlOsc.start();

    // Second pearl harmonic
    const pearl2 = ctx.createOscillator();
    pearl2.type = 'sine';
    pearl2.frequency.value = 330;
    const pearl2Gain = ctx.createGain();
    pearl2Gain.gain.value = 0;
    pearl2.connect(pearl2Gain);
    pearl2Gain.connect(master);
    pearl2.start();

    // Upper harmonics rolled off
    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = 'lowpass';
    hpFilter.frequency.value = 2000;
    hpFilter.Q.value = 0.5;
    master.disconnect();
    master.connect(hpFilter);
    hpFilter.connect(ctx.destination);

    this.audioNodes = { master, subGain, pearlGain, pearl2Gain, subOsc };
  }

  updateAudio(dt) {
    if (!this.audioStarted || !this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // Sub-bass pulses with 56 BPM tidal rhythm
    const bpm = 56;
    const period = 60 / bpm;
    const phase = (this.time % period) / period;
    const pulse = Math.pow(Math.sin(phase * Math.PI), 2);

    this.audioNodes.subGain.gain.setTargetAtTime(0.15 + pulse * 0.15, now, 0.05);

    // Pearl harmonics fade in with breath intensity above 0.6
    const pearlVolume = this.breathIntensity > 0.6
      ? (this.breathIntensity - 0.6) * 0.12
      : 0;
    this.audioNodes.pearlGain.gain.setTargetAtTime(pearlVolume, now, 0.1);
    this.audioNodes.pearl2Gain.gain.setTargetAtTime(pearlVolume * 0.6, now, 0.1);
  }

  // ===== Render Loop =====

  drawToFramebuffer(program, fb, uniforms) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb.fb);
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(program);
    this.bindUniforms(program, uniforms);
    this.drawQuad();
  }

  drawQuad() {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    const loc = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), 'aPosition');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  bindUniforms(program, uniforms) {
    const gl = this.gl;
    for (const [name, val] of Object.entries(uniforms)) {
      const loc = gl.getUniformLocation(program, name);
      if (!loc) continue;
      if (typeof val === 'number') {
        gl.uniform1f(loc, val);
      } else if (val instanceof Float32Array || val.length === 2) {
        gl.uniform2fv(loc, val);
      } else if (val && val.tex) {
        gl.activeTexture(gl.TEXTURE0 + val.unit || gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, val.tex);
        gl.uniform1i(loc, val.unit || 0);
      }
    }
  }

  render() {
    const gl = this.gl;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.time += dt;

    // Smooth breath intensity with soft damping
    const dampingFactor = this.isDragging ? 0.08 : 0.04;
    this.breathIntensity += (this.targetIntensity - this.breathIntensity) * dampingFactor;
    this.breathIntensity = Math.max(0, Math.min(1, this.breathIntensity));

    // Update audio
    this.updateAudio(dt);

    // === Pass 1: Moss ===
    this.drawToFramebuffer(this.progMoss, this.framebuffers.moss, {
      uTime: this.time,
      uResolution: [this.width, this.height],
      uBreathIntensity: this.breathIntensity,
      uDragPos: [this.dragPos.x, this.dragPos.y]
    });

    // === Pass 2: Geode ===
    this.drawToFramebuffer(this.progGeode, this.framebuffers.geode, {
      uTime: this.time,
      uResolution: [this.width, this.height],
      uBreathIntensity: this.breathIntensity,
      uDragPos: [this.dragPos.x, this.dragPos.y],
      uGeodeCenter: [this.geodeCenter.x, this.geodeCenter.y],
      uGeodeRadius: this.geodeRadius
    });

    // === Pass 3: Frost ===
    this.drawToFramebuffer(this.progFrost, this.framebuffers.frost, {
      uTime: this.time,
      uResolution: [this.width, this.height],
      uBreathIntensity: this.breathIntensity,
      uDragPos: [this.dragPos.x, this.dragPos.y],
      uGeodeCenter: [this.geodeCenter.x, this.geodeCenter.y],
      uGeodeRadius: this.geodeRadius
    });

    // === Pass 4: Composite ===
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(this.progComposite);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.framebuffers.moss.tex);
    gl.uniform1i(gl.getUniformLocation(this.progComposite, 'uMoss'), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.framebuffers.geode.tex);
    gl.uniform1i(gl.getUniformLocation(this.progComposite, 'uGeode'), 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.framebuffers.frost.tex);
    gl.uniform1i(gl.getUniformLocation(this.progComposite, 'uFrost'), 2);

    gl.uniform1f(gl.getUniformLocation(this.progComposite, 'uBreathIntensity'), this.breathIntensity);
    gl.uniform1f(gl.getUniformLocation(this.progComposite, 'uTime'), this.time);

    this.drawQuad();

    requestAnimationFrame(() => this.render());
  }
}

// Boot on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new SanctuaryApp());
} else {
  new SanctuaryApp();
}
