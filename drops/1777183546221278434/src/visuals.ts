// src/visuals.ts — Procedural canvas drawing (zero external assets)

/** Easing functions */
function easeInCubic(t: number): number { return t * t * t; }
function easeOutExpo(t: number): number { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

/** Seeded pseudo-random */
function seededRandom(seed: number): () => number {
   let s = seed;
   return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

/** Draw the background: deep slate gradient with subtle storm-cloud texture */
function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, breath: number): void {
   const bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
   const baseDark = 8 + breath * 12;
   bg.addColorStop(0, `rgb(${baseDark + 20}, ${baseDark + 15}, ${baseDark + 25})`);
   bg.addColorStop(1, `rgb(${Math.round(baseDark * 0.5)}, ${Math.round(baseDark * 0.45)}, ${Math.round(baseDark * 0.6)})`);
   ctx.fillStyle = bg;
   ctx.fillRect(0, 0, w, h);
}

/** Draw moss-draped step at bottom third */
function drawMossStep(ctx: CanvasRenderingContext2D, w: number, h: number, breath: number): void {
   const rng = seededRandom(42);
   const stepY = h * 0.7;
   const stepH = h * 0.35;

   // Stone base
   ctx.save();
   const stoneGrad = ctx.createLinearGradient(0, stepY, 0, h);
   stoneGrad.addColorStop(0, `rgba(40, 38, 45, ${0.8 + breath * 0.2})`);
   stoneGrad.addColorStop(1, `rgba(25, 23, 30, 0.95)`);
   ctx.fillStyle = stoneGrad;

   ctx.beginPath();
   ctx.moveTo(0, stepY + 20);
   // Organic curved top edge
   for (let x = 0; x <= w; x += 40) {
       const offset = Math.sin(x * 0.008 + 1.5) * 12 + Math.sin(x * 0.02) * 5;
       ctx.lineTo(x, stepY + offset);
   }
   ctx.lineTo(w, h);
   ctx.lineTo(0, h);
   ctx.closePath();
   ctx.fill();
   ctx.restore();

   // Moss patches
   ctx.save();
   for (let i = 0; i < 12; i++) {
       const mx = rng() * w;
       const my = stepY - 10 + rng() * 50;
       const mr = 15 + rng() * 40;

       const mossGrad = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
       const gBase = 80 + breath * 60;
       mossGrad.addColorStop(0, `rgba(${30 + breath * 20}, ${gBase}, ${40 + breath * 15}, ${0.7 + breath * 0.3})`);
       mossGrad.addColorStop(0.6, `rgba(${25 + breath * 15}, ${gBase * 0.7}, ${35 + breath * 10}, ${0.4 + breath * 0.2})`);
       mossGrad.addColorStop(1, 'rgba(25, 60, 35, 0)');

       ctx.fillStyle = mossGrad;
       ctx.beginPath();
       ctx.ellipse(mx, my, mr, mr * 0.5, rng() * Math.PI * 0.5, 0, Math.PI * 2);
       ctx.fill();
   }
   ctx.restore();

   // Small fern tendrils
   ctx.save();
   ctx.strokeStyle = `rgba(${50 + breath * 30}, ${110 + breath * 50}, ${55 + breath * 25}, ${0.4 + breath * 0.2})`;
   ctx.lineWidth = 1.5;
   for (let i = 0; i < 8; i++) {
       const sx = rng() * w;
       const sy = stepY - 5 + rng() * 30;
       ctx.beginPath();
       const len = 20 + rng() * 30;
       for (let t = 0; t < len; t += 3) {
           const dx = t * 0.8;
           const dy = t * Math.sin(t * 0.2 + i) * 0.3 - t * 0.4;
           if (t === 0) ctx.moveTo(sx + dx, sy + dy);
           else ctx.lineTo(sx + dx, sy + dy);
       }
       ctx.stroke();
   }
   ctx.restore();
}

/** Draw fractured geode near center */
function drawGeode(ctx: CanvasRenderingContext2D, w: number, h: number, breath: number, time: number): void {
   const cx = w * 0.45;
   const cy = h * 0.48;
   const baseR = Math.min(w, h) * 0.18;

   ctx.save();

   // Outer rock
   const rockGrad = ctx.createRadialGradient(cx, cy, baseR * 0.3, cx, cy, baseR * 1.4);
   rockGrad.addColorStop(0, `rgba(70, 65, 80, 0.9)`);
   rockGrad.addColorStop(0.6, `rgba(45, 42, 55, 0.85)`);
   rockGrad.addColorStop(1, 'rgba(30, 28, 40, 0)');
   ctx.fillStyle = rockGrad;

   // Irregular rock shape
   ctx.beginPath();
   const rockRng = seededRandom(17);
   const points = 16;
   for (let i = 0; i <= points; i++) {
       const angle = (i / points) * Math.PI * 2;
       const r = baseR * 1.3 * (0.8 + rockRng() * 0.4);
       const px = cx + Math.cos(angle) * r;
       const py = cy + Math.sin(angle) * r * 0.85;
       if (i === 0) ctx.moveTo(px, py);
       else ctx.lineTo(px, py);
   }
   ctx.closePath();
   ctx.fill();

   // Inner crystalline core — amethyst with bloom
   const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 0.7);
   const amberMix = breath * 0.4;
   coreGrad.addColorStop(0, `rgba(${140 + breath * 80}, ${100 + breath * 60}, ${180 + breath * 40}, ${0.5 + breath * 0.5})`);
   coreGrad.addColorStop(0.4, `rgba(${120 + breath * 60}, ${80 + breath * 50}, ${160 + breath * 30}, ${0.4 + breath * 0.4})`);
   coreGrad.addColorStop(0.7, `rgba(${100 + breath * 40}, ${70 + breath * 40}, ${140 + breath * 20}, ${0.25 + breath * 0.3})`);
   coreGrad.addColorStop(1, 'rgba(80, 60, 120, 0)');

   ctx.globalCompositeOperation = 'screen';
   ctx.fillStyle = coreGrad;
   ctx.beginPath();
   ctx.ellipse(cx, cy, baseR * 0.65, baseR * 0.55, 0, 0, Math.PI * 2);
   ctx.fill();

   // Crystal shard highlights
   const shardRng = seededRandom(99);
   for (let i = 0; i < 6; i++) {
       const angle = shardRng() * Math.PI * 2;
       const dist = baseR * 0.2 + shardRng() * baseR * 0.35;
       const sx = cx + Math.cos(angle) * dist;
       const sy = cy + Math.sin(angle) * dist * 0.85;
       const sLen = 8 + shardRng() * 20;
       const sW = 1 + shardRng() * 2;
       const pulse = 0.5 + 0.5 * Math.sin(time * 2 + i);
       const alpha = (0.3 + breath * 0.6) * pulse;

       ctx.strokeStyle = `rgba(${180 + breath * 40}, ${160 + breath * 30}, ${200 + breath * 20}, ${alpha})`;
       ctx.lineWidth = sW;
       ctx.beginPath();
       ctx.moveTo(sx, sy);
       ctx.lineTo(sx + Math.cos(angle + 0.3) * sLen, sy + Math.sin(angle + 0.3) * sLen);
       ctx.stroke();
   }

   // Fracture lines (crack pattern)
   ctx.strokeStyle = `rgba(20, 18, 30, ${0.5 - breath * 0.3})`;
   ctx.lineWidth = 1.5;
   const fracRng = seededRandom(77);
   for (let i = 0; i < 4; i++) {
       ctx.beginPath();
       let fx = cx + (fracRng() - 0.5) * baseR;
       let fy = cy + (fracRng() - 0.5) * baseR * 0.8;
       ctx.moveTo(fx, fy);
       const segs = 3 + Math.floor(fracRng() * 4);
       for (let j = 0; j < segs; j++) {
           fx += (fracRng() - 0.5) * 30;
           fy += (fracRng() - 0.4) * 20;
           ctx.lineTo(fx, fy);
       }
       ctx.stroke();
   }

   ctx.restore();

   // Warm amber bloom (morning glow)
   if (breath > 0.05) {
       ctx.save();
       ctx.globalCompositeOperation = 'screen';
       const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 1.8);
       bloom.addColorStop(0, `rgba(212, 165, 116, ${breath * 0.35})`);
       bloom.addColorStop(0.4, `rgba(200, 150, 100, ${breath * 0.15})`);
       bloom.addColorStop(1, 'rgba(180, 130, 80, 0)');
       ctx.fillStyle = bloom;
       ctx.beginPath();
       ctx.ellipse(cx, cy, baseR * 1.8, baseR * 1.5, 0, 0, Math.PI * 2);
       ctx.fill();
       ctx.restore();
   }
}

/** Draw glass vial to the right */
function drawVial(ctx: CanvasRenderingContext2D, w: number, h: number, breath: number, time: number): void {
   const vx = w * 0.68;
   const vy = h * 0.55;
   const vW = 18;
   const vH = 50;

   ctx.save();
   ctx.globalCompositeOperation = 'screen';

   // Vial body (glass cylinder)
   const glassGrad = ctx.createLinearGradient(vx - vW, vy - vH, vx + vW, vy);
   const highlight = 0.15 + breath * 0.4;
   glassGrad.addColorStop(0, `rgba(${180 + breath * 30}, ${200 + breath * 20}, ${210 + breath * 20}, ${highlight})`);
   glassGrad.addColorStop(0.5, `rgba(${200 + breath * 25}, ${210 + breath * 20}, ${220 + breath * 15}, ${highlight * 0.7})`);
   glassGrad.addColorStop(1, `rgba(${170 + breath * 30}, ${195 + breath * 20}, ${205 + breath * 20}, ${highlight * 0.8})`);

   ctx.fillStyle = glassGrad;

   // Rounded vial shape
   ctx.beginPath();
   const neckH = vH * 0.25;
   const neckW = vW * 0.5;
   // Bottom
   ctx.moveTo(vx - vW, vy - vH * 0.2);
   ctx.quadraticCurveTo(vx - vW - 3, vy, vx, vy + 3);
   ctx.quadraticCurveTo(vx + vW + 3, vy, vx + vW, vy - vH * 0.2);
   // Neck
   ctx.lineTo(vx + neckW, vy - vH * 0.2 - neckH);
   ctx.quadraticCurveTo(vx + neckW, vy - vH, vx, vy - vH - 3);
   ctx.quadraticCurveTo(vx - neckW, vy - vH, vx - neckW, vy - vH * 0.2 - neckH);
   ctx.closePath();
   ctx.fill();

   // Vial outline
   ctx.strokeStyle = `rgba(${160 + breath * 40}, ${180 + breath * 35}, ${195 + breath * 30}, ${0.3 + breath * 0.3})`;
   ctx.lineWidth = 1.2;
   ctx.stroke();

   // Liquid inside — warm amber that pulses with breath
   const liquidH = vH * 0.4 * (0.4 + breath * 0.6);
   const liqGrad = ctx.createLinearGradient(vx, vy - 3, vx, vy - liquidH);
   const liquidPulse = 0.5 + 0.5 * Math.sin(time * 1.5);
   liqGrad.addColorStop(0, `rgba(212, 165, 116, ${0.3 + breath * 0.4 + liquidPulse * 0.15})`);
   liqGrad.addColorStop(1, `rgba(180, 130, 80, ${0.2 + breath * 0.3})`);

   ctx.fillStyle = liqGrad;
   ctx.beginPath();
   const liqY = vy - 3;
   ctx.ellipse(vx, liqY, vW - 2, 2, 0, 0, Math.PI, false);
   ctx.lineTo(vx - vW + 2, liqY - liquidH);
   ctx.ellipse(vx, liqY - liquidH, vW - 2, 1.5, 0, Math.PI, 0, true);
   ctx.lineTo(vx + vW - 2, liqY);
   ctx.closePath();
   ctx.fill();

   // Specular highlight on glass
   ctx.beginPath();
   ctx.moveTo(vx - vW * 0.5, vy - vH * 0.8);
   ctx.quadraticCurveTo(vx - vW * 0.3, vy - vH * 0.3, vx - vW * 0.6, vy - vH * 0.05);
   ctx.strokeStyle = `rgba(255, 250, 245, ${0.1 + breath * 0.2})`;
   ctx.lineWidth = 1.5;
   ctx.stroke();

   ctx.restore();
}

/** Coral chime light blooms — particle system */
interface ChimeParticle {
   x: number; y: number; vx: number; vy: number;
   life: number; maxLife: number; size: number; hue: number;
}

let chimeParticles: ChimeParticle[] = [];

function spawnChimeParticle(x: number, y: number, intensity: number): void {
   const rng = Math.random;
   for (let i = 0; i < Math.ceil(intensity * 3); i++) {
       chimeParticles.push({
           x: x + (rng() - 0.5) * 80,
           y: y + (rng() - 0.5) * 80,
           vx: (rng() - 0.5) * 30 * intensity,
           vy: -20 - rng() * 50,
           life: 0,
           maxLife: 1.5 + rng() * 2,
           size: 2 + rng() * 6,
           hue: 25 + rng() * 35, // amber range
       });
   }
}

function updateChimeParticles(dt: number, breath: number): void {
   for (let i = chimeParticles.length - 1; i >= 0; i--) {
       const p = chimeParticles[i];
       p.x += p.vx * dt;
       p.y += p.vy * dt;
       p.vy -= 8 * dt; // slight upward acceleration
       p.vx *= 0.98;
       p.life += dt;
       if (p.life >= p.maxLife) {
           chimeParticles.splice(i, 1);
       }
   }
}

function drawChimeParticles(ctx: CanvasRenderingContext2D, breath: number): void {
   if (chimeParticles.length === 0) return;
   ctx.save();
   ctx.globalCompositeOperation = 'screen';
   for (const p of chimeParticles) {
       const progress = p.life / p.maxLife;
       const alpha = (1 - progress * progress) * (0.3 + breath * 0.6);
       const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * (1 + progress * 2));
       grad.addColorStop(0, `hsla(${p.hue}, 70%, 80%, ${alpha})`);
       grad.addColorStop(1, `hsla(${p.hue}, 50%, 60%, 0)`);
       ctx.fillStyle = grad;
       ctx.beginPath();
       ctx.arc(p.x, p.y, p.size * (1 + progress * 2), 0, Math.PI * 2);
       ctx.fill();
   }
   ctx.restore();
}

/** Soft radial edge mask — morning glow falloff */
function drawEdgeMask(ctx: CanvasRenderingContext2D, w: number, h: number, breath: number): void {
   const maskGrad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75);
   maskGrad.addColorStop(0, 'rgba(0,0,0,0)');
   maskGrad.addColorStop(0.7, `rgba(0,0,0,${0.15 - breath * 0.1})`);
   maskGrad.addColorStop(1, `rgba(5,4,10,${0.5 + breath * 0.2})`);
   ctx.fillStyle = maskGrad;
   ctx.fillRect(0, 0, w, h);
}

/** Ambient water ripples on step surface */
function drawRipples(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, breath: number): void {
   const stepY = h * 0.78;
   ctx.save();

    // Shallow water reflection pool on the stone
   const poolGrad = ctx.createRadialGradient(w * 0.35, stepY + 30, 0, w * 0.35, stepY + 30, w * 0.25);
   poolGrad.addColorStop(0, `rgba(60, 90, 100, ${0.12 + breath * 0.1})`);
   poolGrad.addColorStop(0.6, `rgba(45, 70, 85, ${0.06 + breath * 0.05})`);
   poolGrad.addColorStop(1, 'rgba(30, 50, 60, 0)');
   ctx.fillStyle = poolGrad;
   ctx.beginPath();
   ctx.ellipse(w * 0.35, stepY + 30, w * 0.25, h * 0.06, 0, 0, Math.PI * 2);
   ctx.fill();

    // Ripple rings
   ctx.globalAlpha = 0.2 + breath * 0.2;
   ctx.strokeStyle = `rgba(100, 130, 120, 0.5)`;
   ctx.lineWidth = 0.8;

   for (let ring = 0; ring < 5; ring++) {
       const cx = w * 0.35 + ring * w * 0.04;
       const phase = time * 0.6 + ring * 1.4;
       const r = (18 + 12 * Math.sin(phase)) * (0.7 + breath * 0.5);

       ctx.beginPath();
       ctx.ellipse(cx, stepY + 25 + ring * 6, r * 2.2, r * 0.35, 0, 0, Math.PI * 2);
       ctx.stroke();
    }

   ctx.restore();
}

/** Tiny dust motes / rain remnants floating */
function drawDustMotes(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, breath: number): void {
   const rng = seededRandom(123);
   ctx.save();
   ctx.globalCompositeOperation = 'screen';

   for (let i = 0; i < 20; i++) {
       const seed = rng();
       const x = ((seed * 7919 + time * 8 * (i % 3 + 1)) % w);
       const y = (((seed * 104729 + time * 5 * ((i + 2) % 4 + 1)) % h));
       const size = 1 + seed * 2;
       const flicker = 0.1 + 0.2 * Math.sin(time * 1.5 + i * 2.3);
       const alpha = flicker * (0.3 + breath * 0.5);

       const grad = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
       grad.addColorStop(0, `rgba(200, 195, 180, ${alpha})`);
       grad.addColorStop(1, 'rgba(200, 195, 180, 0)');
       ctx.fillStyle = grad;
       ctx.beginPath();
       ctx.arc(x, y, size * 3, 0, Math.PI * 2);
       ctx.fill();
   }
   ctx.restore();
}

/** Main visuals draw — called every frame */
export function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, breath: number, inputX: number, inputY: number, inputIntensity: number): void {
   // Clear
   ctx.clearRect(0, 0, w, h);

   // Background
   drawBackground(ctx, w, h, time, breath);

   // Dust motes
   drawDustMotes(ctx, w, h, time, breath);

   // Water ripples
   drawRipples(ctx, w, h, time, breath);

   // Moss step
   drawMossStep(ctx, w, h, breath);

   // Fractured geode
   drawGeode(ctx, w, h, breath, time);

   // Glass vial
   drawVial(ctx, w, h, breath, time);

   // Coral chime particles
   if (inputIntensity > 0.1) {
       spawnChimeParticle(inputX, inputY, inputIntensity);
   }
   updateChimeParticles(1 / 60, breath);
   drawChimeParticles(ctx, breath);

   // Edge mask (vignette)
   drawEdgeMask(ctx, w, h, breath);
}

/** Easing exports */
export { easeInCubic, easeOutExpo, lerp };
