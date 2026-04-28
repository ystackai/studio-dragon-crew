#version 300 es

precision highp float;

in vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;
uniform float uBreathIntensity;
uniform vec2 uDragPos;

out vec4 fragColor;

// Simplex 3D noise
vec3 mod2899(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod2899(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod2899(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.853734723400447 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod2899(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Soft easing / smoothstep helper
float easeOutCubic(float t) { return 1.0 - pow(1.0 - t, 3.0); }
float easeInOutSine(float t) { return -(cos(3.14159265 * t) - 1.0) * 0.5; }

// Sub-bass tidal pulse at 56 BPM
float tidalPulse(float time) {
  float bpm = 56.0;
  float period = 60.0 / bpm;
  float phase = fract(time / period);
  // Soft sine pulse with exponential ease
  return pow(sin(phase * 3.14159265), 2.0);
}

void main() {
  vec2 uv = vUv;
  vec2 pixel = uv * uResolution;

  // Time-based breathing pulse
  float pulse = tidalPulse(uTime);

  // Moss noise layers — crushed velvet from layered fbm
  vec3 noiseCoord = vec2(pixel * 0.012, uTime * 0.02);
  float moss1 = snoise(vec3(noiseCoord, 0.0)) * 0.5 + 0.5;
  float moss2 = snoise(vec3(noiseCoord * 2.1 + 33.0, 1.0)) * 0.5 + 0.5;
  float moss3 = snoise(vec3(noiseCoord * 4.3 + 67.0, 2.0)) * 0.5 + 0.5;

  float moss = moss1 * 0.5 + moss2 * 0.3 + moss3 * 0.2;

  // Drag influence — proximity-based brightness boost
  float dragDist = length(uv - uDragPos);
  float dragGlow = exp(-dragDist * 3.0) * uBreathIntensity;

  // Color palette: deep greens, muted, crushed velvet
  vec3 mossDark  = vec3(0.06, 0.10, 0.05);
  vec3 mossMid   = vec3(0.12, 0.22, 0.09);
  vec3 mossLight = vec3(0.18, 0.32, 0.14);
  vec3 glowTint  = vec3(0.25, 0.45, 0.30);

  vec3 mossColor = mix(mossDark, mossMid, moss);
  mossColor = mix(mossColor, mossLight, moss3 * 0.4);

  // Winter-bright diffuse lighting — soft and velvety
  float light = 0.6 + 0.4 * moss;
  light += dragGlow * 0.35;

  // Tidal pulse adds subtle breathing warmth
  float warmth = pulse * 0.04 * (1.0 + uBreathIntensity);
  mossColor += glowTint * warmth;

  // Velvety light falloff — vignette
  float vignette = 1.0 - 0.35 * pow(length(uv - 0.5) * 1.4, 2.0);
  mossColor *= vignette;

  // Breath intensity subtly brightens the moss
  mossColor *= 1.0 + uBreathIntensity * 0.12;

  fragColor = vec4(mossColor, 1.0);
}
