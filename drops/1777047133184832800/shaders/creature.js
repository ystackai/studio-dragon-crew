// Creature material shader system
// Dual-state: Active (sharp, luminous, high-contrast) vs Drift (velvety SSS approximation, warm/cool low-sat)

const CreatureVertexSrc = `#version 300 es
precision highp float;
in vec2 a_position;
in vec2 a_uv;
in vec3 a_normal;
out vec2 v_uv;
out vec3 v_normal;
out vec3 v_worldPos;
uniform mat4 u_mvp;
uniform mat4 u_model;
uniform mat3 u_normalMat;
void main() {
    v_uv = a_uv;
    v_normal = normalize(u_normalMat * a_normal);
    vec4 wp = u_model * vec4(a_position, 0.0, 1.0);
    v_worldPos = wp.xyz;
    gl_Position = u_mvp * vec4(a_position, 0.0, 1.0);
}`;

const CreatureFragmentSrc = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform float u_time;
void main() {
    float pulse = 0.5 + 0.5 * sin(u_time * 2.5);
    fragColor = vec4(0.35 + pulse * 0.35, 0.45, 0.72 + pulse * 0.18, 1.0);
}`;

function compileShader(gl, src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Creature shader compile error:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
    }
    return s;
}

function createCreatureProgram(gl) {
    const vs = compileShader(gl, CreatureVertexSrc, gl.VERTEX_SHADER);
    const fs = compileShader(gl, CreatureFragmentSrc, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.useProgram(prog);
    gl.bindAttribLocation(prog, 0, 'a_position');
    gl.bindAttribLocation(prog, 1, 'a_uv');
    gl.bindAttribLocation(prog, 2, 'a_normal');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error('Creature program link error:', gl.getProgramInfoLog(prog));
        return null;
    }
    const loc = {
        uMvp:        gl.getUniformLocation(prog, 'u_mvp'),
        uModel:      gl.getUniformLocation(prog, 'u_model'),
        uNormalMat:  gl.getUniformLocation(prog, 'u_normalMat'),
        uActiveBaseColor:    gl.getUniformLocation(prog, 'u_activeBaseColor'),
        uActiveEmissive:     gl.getUniformLocation(prog, 'u_activeEmissive'),
        uActiveLuminosity:   gl.getUniformLocation(prog, 'u_activeLuminosity'),
        uActiveNormalTex:    gl.getUniformLocation(prog, 'u_activeNormalTex'),
        uDriftBaseColor:     gl.getUniformLocation(prog, 'u_driftBaseColor'),
        uDriftWarmTint:      gl.getUniformLocation(prog, 'u_driftWarmTint'),
        uDriftSSSStrength:   gl.getUniformLocation(prog, 'u_driftSSSStrength'),
        uDriftGaussianSigma: gl.getUniformLocation(prog, 'u_driftGaussianSigma'),
        uDriftDiffuseTex:    gl.getUniformLocation(prog, 'u_driftDiffuseTex'),
        uDriftFactor:        gl.getUniformLocation(prog, 'u_driftFactor'),
        uLightDir:     gl.getUniformLocation(prog, 'u_lightDir'),
        uCameraPos:    gl.getUniformLocation(prog, 'u_cameraPos'),
        uTime:         gl.getUniformLocation(prog, 'u_time'),
    };
    return { program: prog, loc };
}

window.createCreatureProgram = createCreatureProgram;
