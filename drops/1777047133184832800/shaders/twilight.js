// Deep twilight gradient background — GLSL shader module
// Renders a full-screen quad with a multi-stop gradient from deep indigo → warm twilight violet → near-black.

const TwilightVertexSrc = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const TwilightFragmentSrc = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform float u_time;
uniform vec2 u_resolution;

// Simplex-like 2D noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                             dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= m;
    vec3 g = a0 * a0 - h * h;
    vec3 n0 = sqrt(0.5 - g.x);
    vec3 n1 = sqrt(1.0 - 2.0 * abs(ox) - h * h + a0 * a0);
    vec3 n2 = vec3(0.15);
    vec3 norm = vec3(0.327417781997716);
    return 130.0 * dot(m * m * norm, vec3(dot(n0, g), dot(n1, g), dot(n2, g)));
}

void main() {
    // Base twilight gradient: deep indigo at bottom, warm violet in center, near-black above
    float gradient = v_uv.y;
    vec3 deepIndigo   = vec3(0.05, 0.04, 0.12);
    vec3 twilightViolet = vec3(0.18, 0.10, 0.30);
    vec3 warmAccent   = vec3(0.25, 0.14, 0.22);
    vec3 nearBlack    = vec3(0.02, 0.02, 0.05);

    vec3 col = nearBlack;
    col = mix(col, twilightViolet, smoothstep(0.0, 0.4, gradient));
    col = mix(col, warmAccent, smoothstep(0.3, 0.55, gradient));
    col = mix(col, deepIndigo, smoothstep(0.6, 1.0, gradient));

    // Subtle animated noise layer for organic feel
    float n = snoise(v_uv * 3.0 + u_time * 0.02) * 0.5 + 0.5;
    col += n * vec3(0.03, 0.015, 0.05);

    // Horizon glow
    float horizonGlow = exp(-pow((gradient - 0.35) * 5.0, 2.0));
    col += horizonGlow * vec3(0.12, 0.06, 0.10);

    fragColor = vec4(col, 1.0);
}`;

function compileShader(gl, src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
    }
    return s;
}

function createTwilightProgram(gl) {
    const vs = compileShader(gl, TwilightVertexSrc, gl.VERTEX_SHADER);
    const fs = compileShader(gl, TwilightFragmentSrc, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(prog));
        return null;
    }
    // Full-screen quad geometry
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = {
        aPosition: gl.getAttribLocation(prog, 'a_position'),
        uTime: gl.getUniformLocation(prog, 'u_time'),
        uResolution: gl.getUniformLocation(prog, 'u_resolution'),
    };
    return { program: prog, buffer: buf, loc };
}

window.createTwilightProgram = createTwilightProgram;
