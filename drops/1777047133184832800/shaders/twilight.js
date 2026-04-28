// Deep twilight gradient background shader module.
// The original noise helper used invalid vec3/float assignments in WebGL2 on
// some browsers, which prevented the whole experience from initializing.

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

float softNoise(vec2 p) {
    return sin(p.x * 8.3 + sin(p.y * 3.1)) * cos(p.y * 6.7 + sin(p.x * 2.4));
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
    float n = softNoise(v_uv * 3.0 + u_time * 0.02) * 0.5 + 0.5;
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
