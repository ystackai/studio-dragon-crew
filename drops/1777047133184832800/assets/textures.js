// Placeholder texture generator — creates procedural textures for mood reference overlays and creature materials
// All generated in-canvas, loads asynchronously without blocking the render loop

function generateTexture(width, height, drawFn) {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    drawFn(ctx, width, height);
    return c;
}

// Active normal map placeholder: high-contrast bump pattern
function createActiveNormalTexture() {
    return generateTexture(256, 256, (ctx, w, h) => {
        const img = ctx.createImageData(w, h);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4;
                const nx = Math.sin(x * 0.15) * Math.cos(y * 0.1);
                const ny = Math.cos(x * 0.1) * Math.sin(y * 0.15);
                // High contrast normal encoding
                img.data[i]     = Math.floor((nx * 0.5 + 0.5) * 255);
                img.data[i + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
                img.data[i + 2] = Math.floor(200);
                img.data[i + 3] = 255;
            }
        }
        ctx.putImageData(img, 0, 0);
    });
}

// Drift diffuse texture placeholder: velvety warm/cool gradient
function createDriftDiffuseTexture() {
    return generateTexture(256, 256, (ctx, w, h) => {
        const img = ctx.createImageData(w, h);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4;
                const fx = x / w, fy = y / h;
                // Soft gradient with noise
                const n = Math.sin(fx * 12 + fy * 8) * Math.cos(fx * 7 - fy * 11) * 0.5 + 0.5;
                // Warm (peach) → cool (lavender) blend
                const warmth = Math.sin(fy * Math.PI) * 0.5 + 0.5;
                const warmR = 180, warmG = 130, warmB = 100;
                const coolR = 140, coolG = 130, coolB = 190;
                img.data[i]     = Math.floor((warmR * warmth + coolR * (1 - warmth)) * (0.6 + n * 0.4));
                img.data[i + 1] = Math.floor((warmG * warmth + coolG * (1 - warmth)) * (0.6 + n * 0.4));
                img.data[i + 2] = Math.floor((warmB * warmth + coolB * (1 - warmth)) * (0.6 + n * 0.4));
                img.data[i + 3] = 255;
            }
        }
        ctx.putImageData(img, 0, 0);
    });
}

// Mood vignette placeholder: dark edges for parallax background overlay
function createMoodVignetteTexture() {
    return generateTexture(512, 512, (ctx, w, h) => {
        const cx = w * 0.5, cy = h * 0.5;
        const grad = ctx.createRadialGradient(cx, cy, w * 0.15, cx, cy, w * 0.5);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.4, 'rgba(0,0,0,0.15)');
        grad.addColorStop(0.7, 'rgba(10,5,25,0.5)');
        grad.addColorStop(1, 'rgba(5,2,15,0.85)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    });
}

// Async loader wrapper — returns a promise so textures don't block render loop
function loadPlaceholderTextures() {
    return Promise.resolve({
        activeNormal: createActiveNormalTexture(),
        driftDiffuse: createDriftDiffuseTexture(),
        moodVignette: createMoodVignetteTexture(),
    });
}

window.createActiveNormalTexture  = createActiveNormalTexture;
window.createDriftDiffuseTexture  = createDriftDiffuseTexture;
window.createMoodVignetteTexture  = createMoodVignetteTexture;
window.loadPlaceholderTextures     = loadPlaceholderTextures;
