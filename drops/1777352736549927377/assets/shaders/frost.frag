#version 300 es

precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform float uBreathIntensity;
uniform vec2 uDragPos;
uniform vec2 uGeodeCenter;
uniform float uGeodeRadius;

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

// Frost fractal — recursive branching pattern
float frostBranch(vec2 uv, float depth, float time) {
  if (depth <= 0.0) return 0.0;

  float angle = atan(uv.y, uv.x) * 6.0 + time * 0.01;
  float dist = length(uv);

  // Branch pattern
  float branch = abs(sin(angle * 3.0 + time * 0.005));
  branch = smoothstep(0.5, 0.95, branch);

  // Frost crystallization — noise-driven sharpness
  float crystal = snoise(vec3(uv * depth * 8.0, time * 0.02 + float(int(depth)) * 20.0));
  crystal = smoothstep(0.0, 0.8, crystal * 0.5 + 0.5);

  // Recursive sub-branches
  vec2 rotated = mat2(cos(time * 0.003), -sin(time * 0.003),
                       sin(time * 0.003), cos(time * 0.003)) * uv;
  float sub = frostBranch(rotated * 1.5 - vec2(0.3, 0.0), depth - 1.0, time) * 0.5;

  return branch * crystal * 0.7 + sub;
}

// Frost fractal accumulation for multi-layer look
float frostLayers(vec2 uv, float time) {
  float total = 0.0;
  float w = 0.0;

  // 4 layers of different scale frost
  float scales[4] = float[](12.0, 25.0, 45.0, 80.0);
  float weights[4] = float[](0.35, 0.30, 0.20, 0.15);

  for (int i = 0; i < 4; i++) {
    vec2 scaled = uv * scales[i];
    float angle = atan(scaled.y, scaled.x);
    float branch = abs(sin((angle * 5.0 + float(i) * 1.7 + time * 0.008) ));
    branch = smoothstep(0.4, 0.9, branch);

    float detail = snoise(vec3(scaled, time * 0.015 + float(i) * 15.0)) * 0.5 + 0.5;
    detail = pow(detail, 2.0);

    total += branch * detail * weights[i];
    w += weights[i];
  }

  return total / max(w, 0.001);
}

void main() {
  vec2 uv = vUv;

  // Distance from geode center for edge sharpening
  float distFromGeode = length(uv - uGeodeCenter);

  // Frost is concentrated near geode edges, sharpening distinctly
  float edgeProximity = smoothstep(uGeodeRadius * 1.8, uGeodeRadius * 0.85, distFromGeode);

  // Frost fractals — layered procedural crystallization
  float frost = frostLayers(uv * 2.0 - 1.0, uTime);

  // Sharpness increases near geode edges and with breath intensity
  float sharpness = edgeProximity * (0.5 + uBreathIntensity * 0.5);
  frost = smoothstep(1.0 - sharpness, 1.0, frost);

  // Frost color: cool blues, whites, with subtle warmth from geode glow
  vec3 frostCore    = vec3(0.65, 0.78, 0.90);
  vec3 frostBright  = vec3(0.88, 0.92, 0.97);
  vec3 frostEdge    = vec3(0.50, 0.65, 0.85);
  vec3 frostWarm    = vec3(0.75, 0.60, 0.80); // subtle geode warmth bleed

  vec3 frostColor = frostCore;
  frostColor = mix(frostColor, frostBright, pow(frost, 2.0));

  // Warm bleed from geode interior
  float warmBleed = edgeProximity * uBreathIntensity * 0.3;
  frostColor = mix(frostColor, frostWarm, warmBleed);

  // Edge glow — frost glows brighter at geode boundary
  float boundaryGlow = smoothstep(uGeodeRadius * 1.3, uGeodeRadius * 0.95, distFromGeode);
  frostColor += frostBright * boundaryGlow * uBreathIntensity * 0.2;

  // Alpha: frost fades outward, concentrates at edges
  float frostAlpha = frost * edgeProximity * (0.25 + uBreathIntensity * 0.65);
  frostAlpha = smoothstep(0.05, 0.8, frostAlpha);

  // Soft velvety falloff — no harsh alpha edges
  frostColor = pow(frostColor, vec3(0.92)); // slight warmth in color space

  fragColor = vec4(frostColor, frostAlpha);
}
