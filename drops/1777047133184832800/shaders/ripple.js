// Refractive ripple particle shader
// Renders expanding circular ripples from input points with pseudo-refraction effect.

const RippleVertexSrc = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const RippleFragmentSrc = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time;

// Up to 32 ripple instances
#define MAX_RIPPLES 32
uniform vec2  u_rippleCenter[MAX_RIPPLES];
uniform float u_rippleBirth[MAX_RIPPLES];
uniform float u_rippleCount;

void main() {
    vec4 accum = vec4(0.0);
    vec2 px = v_uv * u_resolution;
    vec2 uv = v_uv;

    for (int i = 0; i < MAX_RIPPLES; i++) {
        if (float(i) >= u_rippleCount) break;
        float age = u_time - u_rippleBirth[i];
        if (age < 0.0 || age > 3.0) continue;

        vec2 delta = px - u_rippleCenter[i];
        float dist = length(delta);
        float speed = 250.0;
        float radius = age * speed;
        float falloff = 1.0 - smoothstep(0.0, 3.0, age);

        // Refractive ring
        float ring = exp(-pow((dist - radius) * 0.015, 2.0));
        float innerRing = exp(-pow((dist - radius * 0.6) * 0.025, 2.0));

        // Refraction distortion pseudo-direction
        float angle = atan(delta.y, delta.x);
        float refract = sin(angle * 3.0 + u_time * 4.0) * 0.5 + 0.5;

        vec3 ringColor = mix(
            vec3(0.45, 0.25, 0.80),  // purple core
            vec3(0.20, 0.55, 0.90),  // cyan outer
            refract
        );

        float alpha = (ring * 0.4 + innerRing * 0.15) * falloff;
        accum += vec4(ringColor * alpha, alpha);
    }

    fragColor = accum;
    if (fragColor.a < 0.005) discard;
}`;

function compileShader(gl, src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Ripple shader compile error:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
    }
    return s;
}

function createRippleProgram(gl) {
    const vs = compileShader(gl, RippleVertexSrc, gl.VERTEX_SHADER);
    const fs = compileShader(gl, RippleFragmentSrc, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error('Ripple program link error:', gl.getProgramInfoLog(prog));
        return null;
    }
    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const MAX = 32;
    const loc = {
        aPosition: gl.getAttribLocation(prog, 'a_position'),
        uResolution: gl.getUniformLocation(prog, 'u_resolution'),
        uTime: gl.getUniformLocation(prog, 'u_time'),
        uRippleCount: gl.getUniformLocation(prog, 'u_rippleCount'),
        uRippleCenter: [],
        uRippleBirth: [],
    };
    for (let i = 0; i < MAX; i++) {
        loc.uRippleCenter.push(gl.getUniformLocation(prog, `u_rippleCenter[${i}]`));
        loc.uRippleBirth.push(gl.getUniformLocation(prog, `u_rippleBirth[${i}]`));
    }
    return { program: prog, buffer: buf, loc, maxRipples: MAX };
}

window.createRippleProgram = createRippleProgram;
