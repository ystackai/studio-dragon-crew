// src/visuals.ts — Procedural canvas drawing (zero external assets)

export function easeInCubic(t: number): number { return t * t * t; }
export function easeOutExpo(t: number): number { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
export function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

// -- Seeded PRNG ----------------------------------------------------------
function seedRandom(seed: number): () => number {
    let s = seed | 0;
    return () => { s = (s * 9301 + 49297) & 0x7FFF; return s / 0x7FFF; };
}

// -- Background -------------------------------------------------------------
function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, breath: number): void {
    // Deep slate base — breath lifts brightness
    const bg = ctx.createRadialGradient(w * 0.45, h * 0.48, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.8);
    const r0 = Math.floor(14 + breath * 22 + 4 * Math.sin(time * 0.15));
    const g0 = Math.floor(12 + breath * 16 + 2 * Math.sin(time * 0.12 + 1));
    const b0 = Math.floor(22 + breath * 20 + 3 * Math.sin(time * 0.1 + 2));
    bg.addColorStop(0, `rgb(${r0}, ${g0}, ${b0})`);
    const r1 = Math.floor(Math.max(4, r0 * 0.35));
    const g1 = Math.floor(Math.max(3, g0 * 0.3));
    const b1 = Math.floor(Math.max(6, b0 * 0.45));
    bg.addColorStop(1, `rgb(${r1}, ${g1}, ${b1})`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
}

// -- Moss-draped step ------------------------------------------------------
function drawMossStep(ctx: CanvasRenderingContext2D, w: number, h: number, breath: number): void {
    const rng = seedRandom(42);
    const stepY = h * 0.68;

    ctx.save();

    // Stone base with subtle curvature
    const stoneGrad = ctx.createLinearGradient(0, stepY, 0, h);
    stoneGrad.addColorStop(0, `rgba(${38 + breath * 15}, ${35 + breath * 12}, ${44 + breath * 10}, ${0.85 + breath * 0.15})`);
    stoneGrad.addColorStop(0.5, `rgba(${28 + breath * 10}, ${26 + breath * 8}, ${34 + breath * 8}, 0.92)`);
    stoneGrad.addColorStop(1, `rgba(${18 + breath * 5}, ${16 + breath * 5}, ${24 + breath * 4}, 0.97)`);
    ctx.fillStyle = stoneGrad;

    ctx.beginPath();
    ctx.moveTo(0, h);

    // Organic curved top edge with undulating stone surface
    const stepRng = seedRandom(73);
    for (let x = 0; x <= w; x += 20) {
        const t = x / w;
        const baseOff = Math.sin(t * 6 + 0.5) * 14 + Math.sin(t * 13 + 1.2) * 6;
        const noise = stepRng() * 4 - 2;
        ctx.lineTo(x, stepY + baseOff + noise);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Subtle surface texture lines on stone
    ctx.strokeStyle = `rgba(50, 48, 58, ${0.15 + breath * 0.05})`;
    ctx.lineWidth = 0.6;
    const texRng = seedRandom(555);
    for (let i = 0; i < 25; i++) {
        const sx = texRng() * w;
        const sy = stepY + 20 + texRng() * (h - stepY - 30);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + texRng() * 40 - 10, sy + texRng() * 8 - 3);
        ctx.stroke();
    }
    ctx.restore();

    // Moss patches — organic green overlays
    ctx.save();
    for (let i = 0; i < 14; i++) {
        const mx = rng() * w;
        const my = stepY - 12 + rng() * 60;
        const mr = 18 + rng() * 45;
        const rot = rng() * Math.PI * 0.6 - 0.15;

        const mossGrad = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
        const gBase = Math.floor(75 + breath * 55);
        mossGrad.addColorStop(0, `rgba(${25 + breath * 18}, ${gBase + 10}, ${35 + breath * 14}, ${0.65 + breath * 0.3})`);
        mossGrad.addColorStop(0.5, `rgba(${22 + breath * 12}, ${Math.floor(gBase * 0.75) + 5}, ${32 + breath * 8}, ${0.35 + breath * 0.18})`);
        mossGrad.addColorStop(1, `rgba(18, ${Math.floor(gBase * 0.4)}, 25, 0)`);

        ctx.fillStyle = mossGrad;
        ctx.beginPath();
        ctx.ellipse(mx, my, mr, mr * (0.35 + rng() * 0.25), rot, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    // Fern tendrils — delicate curved lines
    ctx.save();
    const fernRng = seedRandom(321);
    for (let i = 0; i < 10; i++) {
        const sx = fernRng() * w;
        const sy = stepY - 4 + fernRng() * 35;
        ctx.strokeStyle = `rgba(${45 + breath * 28}, ${100 + breath * 45}, ${50 + breath * 22}, ${0.35 + breath * 0.2})`;
        ctx.lineWidth = 1.2 + fernRng() * 0.8;
        ctx.beginPath();
        const len = 22 + fernRng() * 35;
        for (let t = 0; t <= len; t += 2) {
            const px = sx + t * 0.7 + Math.sin(t * 0.15 + i * 0.5) * 4;
            const py = sy + Math.sin(t * 0.18 + i) * 3 - t * 0.35;
            if (t === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
    }
    ctx.restore();
}

// -- Fractured geode -------------------------------------------------------
function drawGeode(ctx: CanvasRenderingContext2D, w: number, h: number, breath: number, time: number): void {
    const cx = w * 0.45;
    const cy = h * 0.45;
    const baseR = Math.min(w, h) * 0.17;

    ctx.save();

    // Shadow beneath geode
    const shadowGrad = ctx.createRadialGradient(cx + 5, cy + baseR * 0.8, 0, cx + 5, cy + baseR * 0.8, baseR * 1.2);
    shadowGrad.addColorStop(0, 'rgba(5, 5, 12, 0.35)');
    shadowGrad.addColorStop(1, 'rgba(5, 5, 12, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(cx + 5, cy + baseR * 0.8, baseR * 1.2, baseR * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outer rock body — irregular polygon with subtle color variation
    const rockRng = seedRandom(17);
    const points = 20;
    const rockPts: { x: number; y: number }[] = [];
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = baseR * (1.1 + rockRng() * 0.45) * (i % 3 === 0 ? 0.85 : 1);
        rockPts.push({
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r * 0.82,
        });
    }

    const rockGrad = ctx.createRadialGradient(cx - baseR * 0.2, cy - baseR * 0.15, baseR * 0.1, cx, cy, baseR * 1.4);
    rockGrad.addColorStop(0, `rgba(${75 + breath * 20}, ${68 + breath * 15}, ${82 + breath * 12}, 0.92)`);
    rockGrad.addColorStop(0.5, `rgba(${52 + breath * 15}, ${48 + breath * 12}, ${62 + breath * 10}, 0.88)`);
    rockGrad.addColorStop(1, `rgba(${32 + breath * 8}, ${29 + breath * 6}, ${42 + breath * 6}, 0.8)`);
    ctx.fillStyle = rockGrad;
    ctx.beginPath();
    ctx.moveTo(rockPts[0].x, rockPts[0].y);
    for (let i = 1; i < rockPts.length; i++) {
        const prev = rockPts[i - 1];
        const curr = rockPts[i];
        const cpx = (prev.x + curr.x) / 2 + (rockRng() - 0.5) * 12;
        const cpy = (prev.y + curr.y) / 2 + (rockRng() - 0.5) * 8;
        ctx.quadraticCurveTo(cpx, cpy, curr.x, curr.y);
    }
    ctx.closePath();
    ctx.fill();

    // Inner crystalline core — amethyst tones bloom with breath
    const coreGrad = ctx.createRadialGradient(cx, cy - baseR * 0.1, 0, cx, cy, baseR * 0.65);
    const coreAlpha = 0.4 + breath * 0.6;
    coreGrad.addColorStop(0, `rgba(${150 + breath * 70}, ${110 + breath * 50}, ${190 + breath * 35}, ${coreAlpha})`);
    coreGrad.addColorStop(0.3, `rgba(${130 + breath * 55}, ${90 + breath * 42}, ${170 + breath * 28}, ${coreAlpha * 0.85})`);
    coreGrad.addColorStop(0.65, `rgba(${105 + breath * 42}, ${72 + breath * 38}, ${150 + breath * 22}, ${coreAlpha * 0.5})`);
    coreGrad.addColorStop(1, 'rgba(80, 58, 125, 0)');

    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, baseR * 0.62, baseR * 0.52, -0.08, 0, Math.PI * 2);
    ctx.fill();

    // Crystal shard highlights — warm amber streaks
    const shardRng = seedRandom(99);
    for (let i = 0; i < 8; i++) {
        const angle = shardRng() * Math.PI * 2 - Math.PI / 2;
        const dist = baseR * (0.15 + shardRng() * 0.38);
        const sx = cx + Math.cos(angle) * dist;
        const sy = cy + Math.sin(angle) * dist * 0.82;
        const sLen = 10 + shardRng() * 25;
        const sW = 1.2 + shardRng() * 2.2;
        const pulse = 0.4 + 0.6 * Math.sin(time * 1.8 + i * 0.9);
        const alpha = (0.25 + breath * 0.65) * pulse;

        const shardGrad = ctx.createLinearGradient(sx, sy, sx + Math.cos(angle + 0.25) * sLen, sy + Math.sin(angle + 0.25) * sLen);
        shardGrad.addColorStop(0, `rgba(220, 195, 155, ${alpha})`);
        shardGrad.addColorStop(0.5, `rgba(${185 + breath * 45}, ${165 + breath * 32}, ${200 + breath * 25}, ${alpha * 0.7})`);
        shardGrad.addColorStop(1, `rgba(${160 + breath * 35}, ${140 + breath * 28}, ${180 + breath * 22}, ${alpha * 0.2})`);

        ctx.strokeStyle = shardGrad;
        ctx.lineWidth = sW;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(angle + 0.25) * sLen, sy + Math.sin(angle + 0.25) * sLen);
        ctx.stroke();
    }

    // Facet highlights — small bright spots on crystals
    const facetRng = seedRandom(222);
    for (let i = 0; i < 5; i++) {
        const fAngle = facetRng() * Math.PI * 2;
        const fDist = baseR * (0.1 + facetRng() * 0.4);
        const fx = cx + Math.cos(fAngle) * fDist;
        const fy = cy + Math.sin(fAngle) * fDist * 0.82;
        const fSize = 2 + facetRng() * 5;
        const fPulse = 0.5 + 0.5 * Math.sin(time * 3 + i * 1.7);

        const facetGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, fSize * 2);
        facetGrad.addColorStop(0, `rgba(245, 230, 200, ${(0.2 + breath * 0.5) * fPulse})`);
        facetGrad.addColorStop(1, 'rgba(245, 230, 200, 0)');
        ctx.fillStyle = facetGrad;
        ctx.beginPath();
        ctx.arc(fx, fy, fSize * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Fracture lines — crack pattern on outer rock
    ctx.globalCompositeOperation = 'source-over';
    const fracRng = seedRandom(77);
    for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = `rgba(${20 - breath * 8}, ${17 - breath * 6}, ${28 - breath * 5}, ${0.55 - breath * 0.2})`;
        ctx.lineWidth = 1.2 + fracRng() * 0.6;
        ctx.beginPath();
        let fx = cx + (fracRng() - 0.5) * baseR * 1.4;
        let fy = cy + (fracRng() - 0.5) * baseR * 1.1;
        ctx.moveTo(fx, fy);
        const segs = 3 + Math.floor(fracRng() * 5);
        for (let j = 0; j < segs; j++) {
            fx += (fracRng() - 0.45) * 28;
            fy += (fracRng() - 0.4) * 18;
            ctx.lineTo(fx, fy);
        }
        ctx.stroke();
    }

    ctx.restore();

    // Warm amber morning glow bloom around geode — breath-intensified
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const bloomR = baseR * (2.0 + breath * 0.6);
    const bloom = ctx.createRadialGradient(cx, cy, baseR * 0.2, cx, cy, bloomR);
    const warmthRed = Math.floor(215 + breath * 30);
    const warmthGrn = Math.floor(165 + breath * 35);
    const warmthBlu = Math.floor(110 + breath * 30);
    const breatheAlpha = breath * 0.38;
    const breatheAlpha2 = breath * 0.16;
    bloom.addColorStop(0, `rgba(${warmthRed}, ${warmthGrn}, ${warmthBlu}, ${breatheAlpha})`);
    bloom.addColorStop(0.35, `rgba(${warmthRed - 15}, ${warmthGrn - 10}, ${warmthBlu - 2}, ${breatheAlpha2})`);
    bloom.addColorStop(0.7, `rgba(${warmthRed - 40}, ${warmthGrn - 28}, ${warmthBlu - 22}, ${breatheAlpha * 0.25})`);
    bloom.addColorStop(1, 'rgba(160, 110, 60, 0)');
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.ellipse(cx, cy, bloomR * 1.05, bloomR * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// -- Glass vial -------------------------------------------------------------
function drawVial(ctx: CanvasRenderingContext2D, w: number, h: number, breath: number, time: number): void {
    const vx = w * 0.68;
    const vy = h * 0.52;
    const vW = 20;
    const vH = 58;

    ctx.save();

    // Vial shadow
    const vialShadow = ctx.createRadialGradient(vx + 4, vy + vH * 0.35, 0, vx + 4, vy + vH * 0.35, vW * 1.8);
    vialShadow.addColorStop(0, 'rgba(4, 4, 10, 0.25)');
    vialShadow.addColorStop(1, 'rgba(4, 4, 10, 0)');
    ctx.fillStyle = vialShadow;
    ctx.beginPath();
    ctx.ellipse(vx + 4, vy + vH * 0.35, vW * 1.8, vW * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'screen';

    // Vial body — elongated flask shape with rounded bottom
    const neckH = vH * 0.22;
    const neckW = vW * 0.42;
    const bodyTop = vy - neckH;
    const bodyBottom = vy + vH * 0.32;

    // Glass fill
    const glassGrad = ctx.createLinearGradient(vx - vW, bodyTop, vx + vW, bodyBottom);
    const glassAlpha = 0.12 + breath * 0.35;
    glassGrad.addColorStop(0, `rgba(${175 + breath * 35}, ${195 + breath * 25}, ${205 + breath * 22}, ${glassAlpha})`);
    glassGrad.addColorStop(0.5, `rgba(${195 + breath * 28}, ${208 + breath * 22}, ${218 + breath * 18}, ${glassAlpha * 0.7})`);
    glassGrad.addColorStop(1, `rgba(${168 + breath * 32}, ${190 + breath * 24}, ${202 + breath * 20}, ${glassAlpha * 0.8})`);
    ctx.fillStyle = glassGrad;

    ctx.beginPath();
    // Neck top
    ctx.moveTo(vx - neckW, bodyTop - neckH * 0.5);
    ctx.lineTo(vx - neckW, bodyTop);
    // Left body curve
    ctx.quadraticCurveTo(vx - vW - 4, bodyTop + (bodyBottom - bodyTop) * 0.3, vx - vW, (bodyTop + bodyBottom) / 2);
    // Rounded bottom
    ctx.quadraticCurveTo(vx - vW - 2, bodyBottom + 4, vx, bodyBottom + 5);
    ctx.quadraticCurveTo(vx + vW + 2, bodyBottom + 4, vx + vW, (bodyTop + bodyBottom) / 2);
    // Right body curve
    ctx.quadraticCurveTo(vx + vW + 4, bodyTop + (bodyBottom - bodyTop) * 0.3, vx + neckW, bodyTop);
    // Neck right
    ctx.lineTo(vx + neckW, bodyTop - neckH * 0.5);
    // Lip
    ctx.quadraticCurveTo(vx + neckW + 3, bodyTop - neckH * 0.7, vx, bodyTop - neckH * 0.8);
    ctx.quadraticCurveTo(vx - neckW - 3, bodyTop - neckH * 0.7, vx - neckW, bodyTop - neckH * 0.5);
    ctx.closePath();
    ctx.fill();

    // Vial outline
    ctx.strokeStyle = `rgba(${155 + breath * 40}, ${175 + breath * 35}, ${190 + breath * 30}, ${0.28 + breath * 0.32})`;
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Warm liquid inside — amber glow that breathes
    const liquidH = vH * 0.38 * (0.35 + breath * 0.65);
    const liquidTop = bodyBottom - 2 - liquidH;
    const liqGrad = ctx.createLinearGradient(vx, bodyBottom - 2, vx, liquidTop);
    const pulse = 0.5 + 0.5 * Math.sin(time * 1.3 + 0.5);
    liqGrad.addColorStop(0, `rgba(218, ${168 + pulse * 10}, ${118 + pulse * 8}, ${0.35 + breath * 0.4 + pulse * 0.1})`);
    liqGrad.addColorStop(0.6, `rgba(195, ${145 + pulse * 8}, ${95 + pulse * 6}, ${0.25 + breath * 0.3})`);
    liqGrad.addColorStop(1, `rgba(172, ${125 + pulse * 5}, ${78 + pulse * 4}, ${0.15 + breath * 0.2})`);

    ctx.fillStyle = liqGrad;
    ctx.beginPath();
    // Fill liquid shape matching the vial body
    const liqWidth = vW * (0.92 - (bodyBottom - liquidTop) / vH * 0.15);
    ctx.moveTo(vx - liqWidth, bodyBottom - 1);
    ctx.quadraticCurveTo(vx - liqWidth - 1, bodyBottom - (bodyBottom - liquidTop) * 0.45, vx - liqWidth * 0.85, liquidTop + 2);
    ctx.quadraticCurveTo(vx, liquidTop - 1, vx + liqWidth * 0.85, liquidTop + 2);
    ctx.quadraticCurveTo(vx + liqWidth + 1, bodyBottom - (bodyBottom - liquidTop) * 0.45, vx + liqWidth, bodyBottom - 1);
    ctx.closePath();
    ctx.fill();

    // Liquid surface shimmer
    ctx.strokeStyle = `rgba(235, 195, 150, ${(0.15 + breath * 0.25) * (0.5 + 0.5 * Math.sin(time * 2))})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(vx, liquidTop + 1, liqWidth * 0.85, 1.2, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Specular highlight arc on glass
    ctx.strokeStyle = `rgba(255, 248, 238, ${0.08 + breath * 0.2})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(vx - vW * 0.45, bodyTop - neckH * 0.1);
    ctx.quadraticCurveTo(vx - vW * 0.22, bodyTop + (bodyBottom - bodyTop) * 0.2, -(0), 0);
    // Simpler arc
    ctx.moveTo(vx - vW * 0.5, bodyTop - neckH * 0.3);
    ctx.quadraticCurveTo(vx - vW * 0.28, (bodyTop + bodyBottom) * 0.5, vx - vW * 0.45, bodyBottom - 6);
    ctx.stroke();

    // Secondary highlight
    ctx.strokeStyle = `rgba(255, 248, 238, ${(0.04 + breath * 0.08)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(vx + vW * 0.35, bodyTop + 2);
    ctx.quadraticCurveTo(vx + vW * 0.42, bodyBottom * 0.5, vx + vW * 0.3, bodyBottom - 8);
    ctx.stroke();

    // Vial glow — soft amber halo
    const vialGlow = ctx.createRadialGradient(vx, vy, vW * 0.5, vx, vy, vW * 2.8);
    vialGlow.addColorStop(0, `rgba(225, 180, 130, ${breath * 0.18})`);
    vialGlow.addColorStop(0.5, `rgba(210, 160, 110, ${breath * 0.07})`);
    vialGlow.addColorStop(1, 'rgba(190, 140, 90, 0)');
    ctx.fillStyle = vialGlow;
    ctx.beginPath();
    ctx.arc(vx, vy, vW * 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// -- Coral chime bloom particles --------------------------------------------
interface ChimeParticle {
    x: number; y: number; vx: number; vy: number;
    life: number; maxLife: number; size: number; hue: number;
}

const chimeParticles: ChimeParticle[] = [];

function spawnChimeParticle(x: number, y: number, intensity: number): void {
    const count = Math.max(2, Math.floor(intensity * 5));
    for (let i = 0; i < count; i++) {
        chimeParticles.push({
            x: x + (Math.random() - 0.5) * 100,
            y: y + (Math.random() - 0.5) * 100,
            vx: (Math.random() - 0.5) * 40 * intensity,
            vy: -25 - Math.random() * 55,
            life: 0,
            maxLife: 1.8 + Math.random() * 2.2,
            size: 2.5 + Math.random() * 7,
            hue: 22 + Math.random() * 40,
        });
    }
}

function updateChimeParticles(dt: number): void {
    for (let i = chimeParticles.length - 1; i >= 0; i--) {
        const p = chimeParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy -= 6 * dt;
        p.vx *= 0.975;
        p.life += dt;
        if (p.life >= p.maxLife) {
            chimeParticles.splice(i, 1);
        }
    }
}

function drawChimeBloom(ctx: CanvasRenderingContext2D, breath: number): void {
    if (chimeParticles.length === 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (const p of chimeParticles) {
        const progress = p.life / p.maxLife;
        const fadeIn = Math.min(progress * 4, 1);
        const fadeOut = 1 - progress * progress;
        const alpha = fadeIn * fadeOut * (0.25 + breath * 0.55);
        const r = p.size * (1 + progress * 2.5);

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        grad.addColorStop(0, `hsla(${p.hue}, 72%, 82%, ${alpha})`);
        grad.addColorStop(0.4, `hsla(${p.hue - 5}, 55%, 70%, ${alpha * 0.55})`);
        grad.addColorStop(1, `hsla(${p.hue - 10}, 40%, 55%, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// -- Radial gradient edge mask ----------------------------------------------
function drawEdgeMask(ctx: CanvasRenderingContext2D, w: number, h: number, breath: number): void {
    const cx = w / 2, cy = h / 2;
    const innerR = Math.min(w, h) * (0.22 + breath * 0.04);
    const outerR = Math.max(w, h) * 0.72;

    const maskGrad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
    const midAlpha = 0.12 - breath * 0.08;
    const edgeAlpha = 0.55 + breath * 0.18;
    maskGrad.addColorStop(0, 'rgba(0,0,0,0)');
    maskGrad.addColorStop(0.6, `rgba(0,0,0,${Math.max(0.02, midAlpha)})`);
    maskGrad.addColorStop(0.85, `rgba(3,2,8,${(midAlpha + edgeAlpha) * 0.5})`);
    maskGrad.addColorStop(1, `rgba(5,4,12,${edgeAlpha})`);
    ctx.fillStyle = maskGrad;
    ctx.fillRect(0, 0, w, h);
}

// -- Water ripples on the moss step ----------------------------------------
function drawRipples(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, breath: number): void {
    const poolCx = w * 0.32;
    const poolCy = h * 0.78;

    ctx.save();

    // Shallow reflection pool
    const poolGrad = ctx.createRadialGradient(poolCx, poolCy, 0, poolCx, poolCy, w * 0.18);
    poolGrad.addColorStop(0, `rgba(55, ${82 + breath * 12}, ${92 + breath * 10}, ${0.1 + breath * 0.08})`);
    poolGrad.addColorStop(0.6, `rgba(40, ${65 + breath * 8}, ${78 + breath * 7}, ${0.05 + breath * 0.03})`);
    poolGrad.addColorStop(1, 'rgba(25, 45, 58, 0)');
    ctx.fillStyle = poolGrad;
    ctx.beginPath();
    ctx.ellipse(poolCx, poolCy, w * 0.18, h * 0.045, 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Animated ripple rings
    ctx.strokeStyle = `rgba(${90 + breath * 20}, ${120 + breath * 18}, ${112 + breath * 15}, ${0.18 + breath * 0.15})`;
    ctx.lineWidth = 0.7 + breath * 0.3;
    for (let ring = 0; ring < 5; ring++) {
        const rCx = poolCx + ring * w * 0.032;
        const phase = time * 0.55 + ring * 1.3;
        const r = (16 + 10 * Math.sin(phase)) * (0.65 + breath * 0.5);
        ctx.beginPath();
        ctx.ellipse(rCx, poolCy + ring * 4, r * 2.0, r * 0.32, 0.05, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

// -- Dust motes / rain remnants --------------------------------------------
function drawDustMotes(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, breath: number): void {
    const rng = seedRandom(123);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < 24; i++) {
        const s = rng();
        const drift = rng() * 60 - 30;
        const fall = (s * 20 + 3) * (((i + 1) % 4) / 4);
        const x = ((s * 7919 + time * (6 + drift * 0.1)) % w + w) % w;
        const y = ((s * 104729 + time * (3 + fall * 0.05)) % h + h) % h;
        const size = 1 + s * 2.2;
        const flicker = 0.08 + 0.22 * Math.sin(time * (1.2 + s * 0.8) + i * 2.1);
        const alpha = flicker * (0.25 + breath * 0.5);

        const grad = ctx.createRadialGradient(x, y, 0, x, y, size * 3.5);
        grad.addColorStop(0, `rgba(${195 + breath * 30}, ${190 + breath * 25}, ${175 + breath * 22}, ${alpha})`);
        grad.addColorStop(1, 'rgba(195, 190, 175, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, size * 3.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// -- State A base opacity overlay ------------------------------------------
function drawStateAOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, breath: number): void {
    const baseOpacity = 0.7 * (1 - breath);
    if (baseOpacity > 0.001) {
        ctx.fillStyle = `rgba(6, 5, 12, ${baseOpacity})`;
        ctx.fillRect(0, 0, w, h);
    }
}

// -- Main draw entry -------------------------------------------------------
export function drawScene(
    ctx: CanvasRenderingContext2D,
    w: number, h: number,
    time: number,
    breath: number,
    inputX: number, inputY: number,
    inputIntensity: number,
): void {
    ctx.clearRect(0, 0, w, h);

    drawBackground(ctx, w, h, time, breath);
    drawDustMotes(ctx, w, h, time, breath);
    drawRipples(ctx, w, h, time, breath);
    drawMossStep(ctx, w, h, breath);
    drawGeode(ctx, w, h, breath, time);
    drawVial(ctx, w, h, breath, time);

    // Coral chime bloom particles
    if (inputIntensity > 0.08) {
        spawnChimeParticle(inputX, inputY, inputIntensity);
    }
    updateChimeParticles(1 / 60);
    drawChimeBloom(ctx, breath);

    // State A overlay (30% opacity base when breath ~ 0)
    drawStateAOverlay(ctx, w, h, breath);

    // Morning glow edge falloff
    drawEdgeMask(ctx, w, h, breath);
}
