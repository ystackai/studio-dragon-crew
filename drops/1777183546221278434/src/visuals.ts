export const PALETTE = {
  deepSlate: '#1a1a2e',
  slateMid: '#2a2a3e',
  mossGreen: '#3a5a3a',
  mossLight: '#5a7a4a',
  warmAmber: '#d4956a',
  coralChime: '#e8735a',
  pearl: '#f0e6d3',
  amberGlow: '#ffb380',
  geodeCore: '#7b4fa0',
  geodeMid: '#9b6fc0',
  geodeEdge: '#c4a0d0',
};

export type SceneConfig = {
  width: number;
  height: number;
  breathIntensity: number;
  time: number;
};

export function drawBackground(ctx: CanvasRenderingContext2D, cfg: SceneConfig) {
  const { width, height } = cfg;

  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, '#0a0a14');
  skyGrad.addColorStop(0.4, '#151528');
  skyGrad.addColorStop(0.7, '#1a2028');
  skyGrad.addColorStop(1, PALETTE.mossGreen);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Storm aftermath: subtle dark moisture streaks
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 8; i++) {
    const x = (width / 9) * (i + 0.5) + Math.sin(cfg.time * 0.1 + i) * 10;
    const grad = ctx.createLinearGradient(x, 0, x + 30, height * 0.6);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.5, '#2a3040');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(x - 15, 0, 30, height * 0.6);
  }
  ctx.globalAlpha = 1;
}

export function drawMossStep(ctx: CanvasRenderingContext2D, cfg: SceneConfig) {
  const { width, height, breathIntensity } = cfg;
  const stepY = height * 0.72;

  // Ground layer
  const groundGrad = ctx.createLinearGradient(0, stepY, 0, height);
  groundGrad.addColorStop(0, '#2a3a2a');
  groundGrad.addColorStop(0.3, '#1e2e1e');
  groundGrad.addColorStop(1, '#141e14');
  ctx.fillStyle = groundGrad;

  ctx.beginPath();
  ctx.moveTo(0, stepY);
  for (let x = 0; x <= width; x += 4) {
    const y = stepY + Math.sin(x * 0.008 + cfg.time * 0.05) * 6 + Math.sin(x * 0.02) * 3;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Moss tufts along the step edge
  ctx.globalAlpha = 0.4 + breathIntensity * 0.3;
  for (let i = 0; i < 25; i++) {
    const x = (width / 26) * (i + 0.5) + Math.sin(i * 1.7) * 15;
    const baseY = stepY + Math.sin(x * 0.008 + cfg.time * 0.05) * 6;
    const radius = 6 + Math.sin(i * 2.3) * 4;

    const mossGrad = ctx.createRadialGradient(x, baseY + radius, 0, x, baseY + radius, radius * 2.5);
    mossGrad.addColorStop(0, PALETTE.mossLight);
    mossGrad.addColorStop(0.6, PALETTE.mossGreen);
    mossGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = mossGrad;

    ctx.beginPath();
    ctx.ellipse(x, baseY + radius * 0.5, radius * 2, radius, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawGeodeCrystal(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, time: number, intensity: number) {
  // Main geode body: irregular polygon
  const vertices: [number, number][] = [];
  const numVerts = 9;
  for (let i = 0; i < numVerts; i++) {
    const angle = (Math.PI * 2 / numVerts) * i + time * 0.01;
    const dist = size * (0.7 + Math.sin(i * 2.7 + 1.3) * 0.3);
    vertices.push([
      cx + Math.cos(angle) * dist,
      cy + Math.sin(angle) * dist * 0.75,
    ]);
  }

  // Geode body gradient
  const geodeGrad = ctx.createRadialGradient(cx, cy, size * 0.1, cx, cy, size);
  geodeGrad.addColorStop(0, PALETTE.geodeCore);
  geodeGrad.addColorStop(0.5, PALETTE.geodeMid);
  geodeGrad.addColorStop(0.85, PALETTE.geodeEdge);
  geodeGrad.addColorStop(1, PALETTE.slateMid);

  ctx.beginPath();
  ctx.moveTo(vertices[0][0], vertices[0][1]);
  for (let i = 1; i < vertices.length; i++) {
    ctx.lineTo(vertices[i][0], vertices[i][1]);
  }
  ctx.closePath();
  ctx.fillStyle = geodeGrad;
  ctx.fill();

  // Fracture lines
  ctx.strokeStyle = 'rgba(240, 230, 211, 0.15)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 5; i++) {
    const startIdx = Math.floor(Math.random() * numVerts);
    ctx.beginPath();
    ctx.moveTo(vertices[startIdx][0], vertices[startIdx][1]);
    for (let j = 1; j < 4; j++) {
      const mx = cx + (Math.cos(i * 3.1 + j * 1.7) * size * 0.3 * j);
      const my = cy + (Math.sin(i * 2.9 + j * 1.3) * size * 0.25 * j);
      ctx.lineTo(mx, my);
    }
    ctx.stroke();
  }

  // Inner crystal facets (screen composite bloom)
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 6; i++) {
    const fx = cx + Math.cos(i * 1.1 + time * 0.03) * size * 0.35;
    const fy = cy + Math.sin(i * 1.3 + time * 0.04) * size * 0.25;
    const facetSize = 8 + Math.sin(time * 0.5 + i) * 4 + intensity * 12;

    const facetGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, facetSize);
    facetGrad.addColorStop(0, `rgba(232, 115, 90, ${0.3 + intensity * 0.4})`);
    facetGrad.addColorStop(0.5, `rgba(212, 149, 106, ${0.15 + intensity * 0.2})`);
    facetGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = facetGrad;

    ctx.beginPath();
    ctx.arc(fx, fy, facetSize, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}

export function drawFracturedGeode(ctx: CanvasRenderingContext2D, cfg: SceneConfig) {
  const { width, height, breathIntensity, time } = cfg;

  // Primary geode
  drawGeodeCrystal(ctx, width * 0.35, height * 0.55, Math.min(width, height) * 0.22, time, breathIntensity);

  // Secondary smaller geode cluster
  drawGeodeCrystal(ctx, width * 0.6, height * 0.62, Math.min(width, height) * 0.12, time + 2, breathIntensity * 0.7);
}

export function drawGlassVial(ctx: CanvasRenderingContext2D, cfg: SceneConfig) {
  const { width, height, breathIntensity, time } = cfg;

  const vx = width * 0.58;
  const vy = height * 0.5;
  const vWidth = 18;
  const vHeight = 55;

  // Slight sway
  const sway = Math.sin(time * 0.15) * 2;

  ctx.save();
  ctx.translate(vx + sway, vy);

  // Vial body
  ctx.beginPath();
  ctx.moveTo(-vWidth, vHeight * 0.3);
  ctx.quadraticCurveTo(-vWidth - 2, 0, -vWidth * 0.4, -vHeight * 0.2);
  ctx.lineTo(vWidth * 0.4, -vHeight * 0.2);
  ctx.quadraticCurveTo(vWidth + 2, 0, vWidth, vHeight * 0.3);
  ctx.quadraticCurveTo(vWidth * 1.1, vHeight * 0.6, 0, vHeight * 0.65);
  ctx.quadraticCurveTo(-vWidth * 1.1, vHeight * 0.6, -vWidth, vHeight * 0.3);
  ctx.closePath();

  // Glass material
  const glassGrad = ctx.createLinearGradient(-vWidth, 0, vWidth, 0);
  glassGrad.addColorStop(0, 'rgba(180, 200, 210, 0.12)');
  glassGrad.addColorStop(0.3, 'rgba(200, 220, 230, 0.2)');
  glassGrad.addColorStop(0.5, 'rgba(220, 240, 250, 0.25)');
  glassGrad.addColorStop(0.7, 'rgba(200, 220, 230, 0.2)');
  glassGrad.addColorStop(1, 'rgba(180, 200, 210, 0.1)');
  ctx.fillStyle = glassGrad;
  ctx.fill();

  ctx.strokeStyle = 'rgba(200, 210, 220, 0.25)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Liquid inside - amber glow
  const liquidLevel = 0.35 + breathIntensity * 0.15;
  const liquidY = vHeight * (0.3 - liquidLevel);

  const liquidGrad = ctx.createLinearGradient(0, liquidY, 0, vHeight * 0.6);
  const amberAlpha = 0.3 + breathIntensity * 0.5;
  liquidGrad.addColorStop(0, `rgba(255, 179, 128, ${amberAlpha})`);
  liquidGrad.addColorStop(0.6, `rgba(212, 149, 106, ${amberAlpha * 0.8})`);
  liquidGrad.addColorStop(1, `rgba(190, 120, 80, ${amberAlpha * 0.6})`);

  ctx.beginPath();
  ctx.moveTo(-vWidth + 2, liquidY);
  ctx.quadraticCurveTo(-vWidth * 1.05, vHeight * 0.55, 0, vHeight * 0.6);
  ctx.quadraticCurveTo(vWidth * 1.05, vHeight * 0.55, vWidth - 2, liquidY);
  ctx.closePath();
  ctx.fillStyle = liquidGrad;
  ctx.fill();

  // Cork
  ctx.fillStyle = '#5a4a3a';
  ctx.beginPath();
  ctx.ellipse(0, -vHeight * 0.22, vWidth * 0.45, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawCoralBlooms(ctx: CanvasRenderingContext2D, cfg: SceneConfig) {
  const { width, height, breathIntensity, time } = cfg;

  if (breathIntensity < 0.01) return;

  ctx.globalCompositeOperation = 'screen';

  const bloomCount = 5 + Math.floor(breathIntensity * 12);
  for (let i = 0; i < bloomCount; i++) {
    const phase = time * (0.08 + i * 0.02);
    const bx = width * 0.3 + Math.cos(phase + i * 2.1) * width * 0.3;
    const by = height * 0.4 + Math.sin(phase * 1.3 + i * 1.7) * height * 0.25;
    const radius = (15 + breathIntensity * 40) * (0.5 + Math.sin(time * 0.3 + i) * 0.3);

    const bloom = ctx.createRadialGradient(bx, by, 0, bx, by, radius);
    const alpha = breathIntensity * (0.2 + Math.sin(time * 0.2 + i * 0.7) * 0.1);
    bloom.addColorStop(0, `rgba(232, 115, 90, ${alpha})`);
    bloom.addColorStop(0.3, `rgba(255, 179, 128, ${alpha * 0.6})`);
    bloom.addColorStop(0.7, `rgba(240, 230, 211, ${alpha * 0.2})`);
    bloom.addColorStop(1, 'transparent');

    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.arc(bx, by, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'source-over';
}

export function drawMorningGlow(ctx: CanvasRenderingContext2D, cfg: SceneConfig) {
  const { width, height, breathIntensity } = cfg;

  // Radial gradient mask for morning glow edge falloff
  const glowCenterX = width * 0.45;
  const glowCenterY = height * 0.4;
  const maxRadius = Math.max(width, height) * 0.8;

  const maskGrad = ctx.createRadialGradient(glowCenterX, glowCenterY, maxRadius * 0.1, glowCenterX, glowCenterY, maxRadius);
  const glowAlpha = 0.08 + breathIntensity * 0.18;
  maskGrad.addColorStop(0, `rgba(255, 200, 140, ${glowAlpha})`);
  maskGrad.addColorStop(0.4, `rgba(255, 180, 120, ${glowAlpha * 0.6})`);
  maskGrad.addColorStop(0.7, `rgba(200, 150, 100, ${glowAlpha * 0.2})`);
  maskGrad.addColorStop(1, 'rgba(0, 0, 0, 0.5)');

  ctx.fillStyle = maskGrad;
  ctx.fillRect(0, 0, width, height);
}

export function drawRestOverlay(ctx: CanvasRenderingContext2D, cfg: SceneConfig) {
  // 30% opacity in rest state, fades with breath
  const { width, height, breathIntensity } = cfg;
  const dimAlpha = (1 - breathIntensity) * 0.55;
  ctx.fillStyle = `rgba(10, 10, 20, ${dimAlpha})`;
  ctx.fillRect(0, 0, width, height);
}

export function render(ctx: CanvasRenderingContext2D, cfg: SceneConfig) {
  ctx.clearRect(0, 0, cfg.width, cfg.height);

  drawBackground(ctx, cfg);
  drawMossStep(ctx, cfg);
  drawFracturedGeode(ctx, cfg);
  drawGlassVial(ctx, cfg);
  drawCoralBlooms(ctx, cfg);
  drawMorningGlow(ctx, cfg);
  drawRestOverlay(ctx, cfg);
}
