#version 300 es

precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform float uBreathIntensity;
uniform vec2 uDragPos;

in vec2 vUv;
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

// 56 BPM tidal pulse
float tidalPulse(float time) {
  float bpm = 56.0;
  float period = 60.0 / bpm;
  float phase = fract(time / period);
  return pow(sin(phase * 3.14159265), 2.0);
}

// Geode crystalline shape — organic with noise deformation
float geodeShape(vec2 uv, vec2 center, float radius, float time) {
  vec2 d = uv - center;
  float dist = length(d);

  // Noise-based edge deformation for organic crystal look
  float angle = atan(d.y, d.x);
  float edgeNoise = snoise(vec3(angle * 3.0 + time * 0.05, time * 0.1)) * 0.15;
  float crystalNoise = snoise(vec3(d * 4.0 + time * 0.03, 10.0)) * 0.08;

  float r = radius + edgeNoise + crystalNoise;

  // Smooth edge transition
  float edge = smoothstep(r - 0.06, r + 0.06, dist);
  return edge;
}

// Internal crystal facets — layered with noise
float crystalFacets(vec2 uv, vec2 center, float time) {
  vec2 d = (uv - center) * 6.0;
  float n1 = snoise(vec3(d, time * 0.02)) * 0.5 + 0.5;
  float n2 = snoise(vec3(d * 2.3 + 50.0, time * 0.04 + 5.0)) * 0.5 + 0.5;
  float n3 = snoise(vec3(d * 5.0 + 100.0, time * 0.01 + 10.0)) * 0.5 + 0.5;

  // Create faceted look by quantizing
  float facets = fract(n1 * 5.0) * 0.3 + n2 * 0.4 + n3 * 0.3;
  return facets;
}

void main() {
  vec2 uv = vUv;
  vec2 pixel = uv * uResolution;

  // Geode center slightly offset for dramatic composition
  vec2 geodeCenter = vec2(0.5, 0.45);
  float baseRadius = 0.18;

  // Tidal pulse at 56 BPM
  float pulse = tidalPulse(uTime);

  // Geode grows with breath intensity — dormant at 0, blooms at high intensity
  float geodeRadius = baseRadius + uBreathIntensity * 0.15;

  // Edge of the geode
  float edge = geodeShape(uv, geodeCenter, geodeRadius, uTime);

  // Internal crystal structure
  float facets = crystalFacets(uv, geodeCenter, uTime);

  // Color palette: deep purples, amethyst, with warm inner glow
  vec3 geodeDark  = vec3(0.08, 0.03, 0.12);
  vec3 geodeMid   = vec3(0.20, 0.08, 0.35);
  vec3 geodeLight = vec3(0.45, 0.18, 0.60);
  vec3 geodeGlow  = vec3(0.70, 0.35, 0.85);
  vec3 coreWarm   = vec3(0.85, 0.50, 0.55);

  // Build geode color from layers
  vec3 geodeColor = geodeDark;
  geodeColor = mix(geodeColor, geodeMid, facets * 0.6);
  geodeColor = mix(geodeColor, geodeLight, pow(facets, 2.0) * 0.3);

  // Bloom transition driven by intensity
  float bloom = smoothstep(0.5, 1.0, uBreathIntensity) * pulse;
  geodeColor += geodeGlow * bloom * 0.4;
  geodeColor += coreWarm * bloom * 0.15;

  // Inner glow softens edges — velvety falloff
  float innerGlow = 1.0 - smoothstep(0.0, geodeRadius * 0.8, length(uv - geodeCenter));
  geodeColor += geodeGlow * innerGlow * bloom * 0.25;

  // Apply geode mask — outside the geode is transparent
  float invEdge = 1.0 - edge;
  // Soft edge blending
  float alpha = smoothstep(0.0, 0.3, invEdge);

  // Pulse breathing — the geode breathes with the 56 BPM rhythm
  float breathe = 1.0 + pulse * 0.05 * (1.0 + uBreathIntensity * 2.0);
  geodeColor *= breathe;

  fragColor = vec4(geodeColor, alpha);
}
