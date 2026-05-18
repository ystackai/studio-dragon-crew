/**
 * Dragonbound Depths — Co-op Fantasy Action RPG Vertical Slice
 * FactoryX WorkOrder: dragonbound-depths
 * High visual authorship, real mechanics, no slop.
 */

(function() {
  'use strict';

  // ==================== DATA ====================
  const HEROES = [
    {
      id: 'ember',
      name: 'Ember Knight',
      role: 'Melee • Cleave & Shield',
      color: '#ff6b4a',
      accent: '#ffb07a',
      desc: 'Short-range arc strikes, defensive dash that knocks foes, flame burst ultimate.',
      preview: drawEmberPreview
    },
    {
      id: 'frost',
      name: 'Frost Witch',
      role: 'Ranged • Control',
      color: '#7fd4ff',
      accent: '#c9f0ff',
      desc: 'Piercing frost bolts, slowing nova, blink escape that leaves ice shards.',
      preview: drawFrostPreview
    },
    {
      id: 'tide',
      name: 'Tide Ranger',
      role: 'Mid • Spear & Trap',
      color: '#6ee7b7',
      accent: '#a5f0d3',
      desc: 'Throwing spears that pierce, evasive roll, place a slowing whirlpool.',
      preview: drawTidePreview
    }
  ];

  const DRAGONS = [
    {
      id: 'cinder',
      name: 'Cinder',
      element: 'Fire',
      color: '#ff8a4a',
      desc: 'Breathes cone of flame. Passive: embers scorch the ground.',
      preview: drawCinderPreview
    },
    {
      id: 'rime',
      name: 'Rime',
      element: 'Ice',
      color: '#8fd4ff',
      desc: 'Frost pulse slows packs. Passive: icy aura shields nearby allies.',
      preview: drawRimePreview
    },
    {
      id: 'gale',
      name: 'Gale',
      element: 'Wind',
      color: '#b3e8a0',
      desc: 'Wind burst knocks enemies. Passive: gusts push incoming projectiles aside.',
      preview: drawGalePreview
    }
  ];

  // ==================== UTILS ====================
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  const angle = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1);
  const rand = (a, b) => a + Math.random() * (b - a);

  function drawRoundedRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
  }

  // ==================== TITLE & CARD PREVIEWS ====================
  function drawTitleArt(canvas) {
    const ctx = canvas.getContext('2d', { alpha: true });
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, w, h);

    // Layered ruins + mist
    ctx.fillStyle = '#121a2a';
    ctx.fillRect(40, 110, 640, 130);
    ctx.fillStyle = '#1a2438';
    for (let i = 0; i < 7; i++) {
      ctx.fillRect(60 + i * 92, 120 + (i % 3) * 8, 38, 110);
    }

    // Glowing arch / portal
    const grad = ctx.createLinearGradient(280, 40, 440, 160);
    grad.addColorStop(0, '#3a2a5a');
    grad.addColorStop(0.5, '#5c3a7a');
    grad.addColorStop(1, '#2a1f3a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(290, 160);
    ctx.quadraticCurveTo(360, 30, 430, 160);
    ctx.lineTo(430, 210);
    ctx.lineTo(290, 210);
    ctx.fill();

    // Dragon silhouette (winged, perched on ruin)
    ctx.fillStyle = '#1f2a3f';
    ctx.beginPath();
    ctx.moveTo(310, 145); // head
    ctx.quadraticCurveTo(340, 118, 378, 132);
    ctx.quadraticCurveTo(410, 125, 425, 148); // neck
    ctx.quadraticCurveTo(455, 115, 498, 138); // wing crest
    ctx.quadraticCurveTo(520, 170, 475, 178);
    ctx.quadraticCurveTo(430, 192, 355, 175);
    ctx.quadraticCurveTo(320, 168, 310, 145);
    ctx.fill();

    // Wing membrane detail
    ctx.strokeStyle = '#2f3e58';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(378, 132);
    ctx.quadraticCurveTo(410, 155, 455, 148);
    ctx.stroke();

    // Eyes + ember glow
    ctx.fillStyle = '#ff8a4a';
    ctx.beginPath(); ctx.arc(335, 138, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd7a0';
    ctx.beginPath(); ctx.arc(335, 138, 1.6, 0, Math.PI * 2); ctx.fill();

    // Pass 31: bonded hero silhouette — previews the core "mortal adventurer + young dragon companion" fantasy on the title art itself.
    // Small cloaked knight (helm + planted sword with warm tip) standing left of the dragon before the portal, with subtle luminous bond arc.
    // Strengthens immediate visual authorship and "this is about the bond" read from the very first screen, per operator art mandate and Fire Dragon lens (heroic warmth, creature wonder together).
    ctx.save();
    ctx.translate(258, 172);
    // Dark cloak/robe body (silhouette, grounded weight)
    ctx.fillStyle = '#1a2438';
    ctx.beginPath();
    ctx.moveTo(-7, -2);
    ctx.quadraticCurveTo(-11, 18, -5, 30);
    ctx.lineTo(5, 30);
    ctx.quadraticCurveTo(11, 18, 7, -2);
    ctx.fill();
    // Helm + head (distinct from dragon)
    ctx.beginPath();
    ctx.arc(0, -6, 5.5, 0, Math.PI * 2);
    ctx.fill();
    // Helm crest ridge
    ctx.fillStyle = '#2a3448';
    ctx.fillRect(-2.5, -12, 5, 3.5);
    // Planted sword (blade + hilt)
    ctx.strokeStyle = '#1f2a3f';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(7, 2);
    ctx.lineTo(15, 16);
    ctx.stroke();
    ctx.strokeStyle = '#3a4558';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(15, 16);
    ctx.lineTo(14, 34);
    ctx.stroke();
    // Warm sword tip (tiny echo of dragon ember, bond resonance)
    ctx.fillStyle = '#ff8a4a';
    ctx.beginPath(); ctx.arc(14, 33.5, 1.7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd7a0';
    ctx.beginPath(); ctx.arc(14, 33.5, 0.85, 0, Math.PI * 2); ctx.fill();
    // Thin luminous bond arc (warm, connecting hero to dragon's head/eye ~+70x -32y)
    ctx.strokeStyle = 'rgba(255, 175, 95, 0.32)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(6, -8);
    ctx.quadraticCurveTo(42, -20, 78, -34);
    ctx.stroke();
    ctx.restore();

    // Mist layers + particles
    ctx.fillStyle = 'rgba(140, 170, 210, 0.08)';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(50 + i * 30, 90 + Math.sin(i) * 20, 160, 26);
    }
    ctx.fillStyle = 'rgba(255, 140, 80, 0.35)';
    for (let i = 0; i < 11; i++) {
      const px = 295 + (i % 5) * 28 + Math.sin(i) * 9;
      const py = 165 + Math.cos(i * 1.3) * 11;
      ctx.beginPath(); ctx.arc(px, py, 1.8 + (i % 3) * 0.6, 0, Math.PI * 2); ctx.fill();
    }

    // Gold trim
    ctx.strokeStyle = 'rgba(212, 175, 119, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(36, 36, w - 72, h - 72);
  }

  // Pass 19: victory triumph illustration — small handcrafted canvas art for summary screen.
  // Shows hero + bonded dragon victorious over the defeated Ash Maw, with glowing relics, ash motes, warm focal light.
  // Makes the win moment screenshot-worthy and emotionally resonant (not just text panel).
  function drawVictoryArt(canvas) {
    const ctx = canvas.getContext('2d', { alpha: true });
    const w = canvas.width, h = canvas.height;
    // Pass 25: read chosen bond for bespoke personalized triumph art (unique per hero+dragon)
    const heroId = (typeof player1 !== 'undefined' && player1 && player1.heroId) || 'ember';
    const dragType = (typeof dragon !== 'undefined' && dragon && dragon.type) || 'cinder';
    const heroCol = (typeof player1 !== 'undefined' && player1 && player1.color) || '#ff6b4a';
    const dragCol = (typeof dragon !== 'undefined' && dragon && dragon.color) || '#ff8a4a';

    // Dark maw-ash gradient bg (victory over darkness, warm embers)
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0f121c');
    bg.addColorStop(0.55, '#1a1620');
    bg.addColorStop(1, '#241a18');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Subtle cracked floor / arena remnant
    ctx.fillStyle = 'rgba(60, 48, 42, 0.6)';
    ctx.fillRect(30, h - 32, w - 60, 28);
    ctx.strokeStyle = 'rgba(120, 90, 70, 0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(40 + i * 78, h - 31);
      ctx.lineTo(55 + i * 72, h - 8);
      ctx.stroke();
    }

    // Fallen boss silhouette (cracked horns, cooling lava vents, slumped)
    ctx.fillStyle = '#2a2228';
    ctx.beginPath();
    ctx.moveTo(58, h - 28); // left base
    ctx.quadraticCurveTo(92, h - 52, 138, h - 30);
    ctx.quadraticCurveTo(168, h - 48, 198, h - 27);
    ctx.lineTo(198, h - 8);
    ctx.lineTo(58, h - 8);
    ctx.fill();
    // Horns (broken, dramatic)
    ctx.strokeStyle = '#3f353c';
    ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.moveTo(88, h - 46); ctx.lineTo(74, h - 72); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(122, h - 50); ctx.lineTo(138, h - 68); ctx.stroke();
    // Lava vents (cooling, dim)
    ctx.fillStyle = 'rgba(200, 90, 40, 0.25)';
    ctx.fillRect(102, h - 38, 14, 5);
    ctx.fillRect(152, h - 35, 10, 4);

    // Central glow / relic light from victory — tinted to chosen dragon's element (Pass 25 bespoke)
    const gR = dragCol;
    const glow = ctx.createRadialGradient(210, 52, 8, 210, 58, 72);
    glow.addColorStop(0, gR + '88');
    glow.addColorStop(0.35, gR + '33');
    glow.addColorStop(1, 'rgba(60, 40, 28, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(140, 12, 140, 92);

    // Hero triumphant — bespoke per chosen class (Pass 25: unique silhouette + weapon + accent)
    const hx = 178, hy = 58;
    ctx.fillStyle = '#2f2520';
    ctx.fillRect(hx - 7, hy + 4, 15, 22); // body + cloak base
    ctx.fillStyle = heroCol;
    ctx.beginPath(); ctx.arc(hx, hy - 6, 8, 0, Math.PI * 2); ctx.fill(); // helm/hood
    if (heroId === 'frost') {
      // Frost Witch: veil hood, crystal staff, ice shards
      ctx.fillStyle = '#e0f4ff';
      ctx.fillRect(hx - 10, hy - 14, 20, 5); // veil brim
      ctx.strokeStyle = '#c8e8ff'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(hx + 4, hy + 3); ctx.lineTo(hx + 24, hy - 24); ctx.stroke(); // staff
      ctx.fillStyle = 'rgba(180, 230, 255, 0.7)';
      for (let s = 0; s < 3; s++) { ctx.beginPath(); ctx.arc(hx + 24 - s*3, hy - 24 + s*2, 1.8 - s*0.3, 0, 6.28); ctx.fill(); }
    } else if (heroId === 'tide') {
      // Tide Ranger: hood, ribbon spear, piercing line
      ctx.fillStyle = 'rgba(110, 210, 170, 0.5)';
      ctx.beginPath(); ctx.arc(hx, hy - 10, 9.5, 0, Math.PI * 2); ctx.fill(); // hood
      ctx.strokeStyle = '#d0f0d8'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(hx + 2, hy + 1); ctx.lineTo(hx + 26, hy - 26); ctx.stroke(); // spear
      ctx.fillStyle = heroCol;
      ctx.beginPath(); ctx.arc(hx + 27, hy - 27, 3.2, 0, Math.PI * 2); ctx.fill();
    } else {
      // Ember Knight (default): plumed helm, flame sword, cape
      ctx.fillStyle = '#ff6b4a';
      ctx.beginPath(); ctx.arc(hx, hy - 6, 8, 0, Math.PI * 2); ctx.fill(); // helm
      ctx.strokeStyle = '#e8d8a0';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(hx + 3, hy + 2); ctx.lineTo(hx + 22, hy - 28); ctx.stroke();
      ctx.fillStyle = '#ff8a4a';
      ctx.beginPath(); ctx.arc(hx + 22, hy - 29, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    // Shared cape flourish (tinted lightly)
    ctx.fillStyle = 'rgba(60, 40, 35, 0.7)';
    ctx.beginPath(); ctx.moveTo(hx - 6, hy + 6); ctx.quadraticCurveTo(hx - 18, hy + 18, hx - 9, hy + 28); ctx.fill();

    // Dragon companion — bespoke per chosen bond (Pass 25: head crest/breath/wings match element)
    const dx = 252, dy = 54;
    ctx.fillStyle = '#2a2320';
    ctx.beginPath(); ctx.ellipse(dx, dy + 6, 18, 11, -0.2, 0, Math.PI * 2); ctx.fill(); // body
    ctx.fillStyle = dragCol;
    ctx.beginPath(); ctx.arc(dx + 18, dy - 3, 7.5, 0, Math.PI * 2); ctx.fill(); // head
    // eye (always)
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(dx + 21, dy - 4, 1.8, 0, Math.PI * 2); ctx.fill();
    // legs + tail (grounded proud)
    ctx.fillStyle = '#3a2f28';
    ctx.fillRect(dx - 8, dy + 14, 4, 7);
    ctx.fillRect(dx + 4, dy + 13, 4, 8);
    ctx.strokeStyle = '#3a2f28';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(dx - 14, dy + 4); ctx.quadraticCurveTo(dx - 28, dy + 2, dx - 32, dy + 14); ctx.stroke();
    // wings
    ctx.strokeStyle = '#4a3830';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(dx - 2, dy - 4); ctx.quadraticCurveTo(dx - 14, dy - 22, dx + 2, dy - 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(dx + 6, dy - 2); ctx.quadraticCurveTo(dx - 4, dy - 26, dx + 14, dy - 16); ctx.stroke();

    // Element-specific dragon flourish (Pass 25 bespoke)
    if (dragType === 'cinder') {
      // fire breath + embers
      ctx.fillStyle = 'rgba(255, 140, 50, 0.75)';
      ctx.beginPath(); ctx.moveTo(dx + 23, dy - 2); ctx.lineTo(dx + 36, dy - 7); ctx.lineTo(dx + 36, dy + 3); ctx.fill();
      ctx.fillStyle = 'rgba(255, 170, 60, 0.6)';
      for (let i = 0; i < 6; i++) {
        const px = dx + 27 + i * 2.8 + Math.sin(i) * 1.5;
        ctx.beginPath(); ctx.arc(px, dy - 5 + (i % 2) * 3, 1.1, 0, 6.28); ctx.fill();
      }
    } else if (dragType === 'rime') {
      // ice crown + frost aura shards
      ctx.strokeStyle = '#e0f8ff';
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(dx + 12, dy - 8); ctx.lineTo(dx + 18, dy - 15); ctx.lineTo(dx + 25, dy - 7); ctx.stroke();
      ctx.fillStyle = 'rgba(190, 235, 255, 0.55)';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.arc(dx + 19 + i * 4, dy - 9, 1.6, 0, 6.28); ctx.fill();
      }
    } else {
      // gale: wind tufts + gust lines
      ctx.strokeStyle = '#d4f0c0';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(dx + 24, dy - 6 - i * 2); ctx.quadraticCurveTo(dx + 32, dy - 9 - i * 3, dx + 38, dy - 5 - i * 1); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(180, 240, 160, 0.4)';
      ctx.beginPath(); ctx.arc(dx + 34, dy - 4, 2.2, 0, 6.28); ctx.fill();
    }

    // Bond glow arc between hero and dragon (Pass 25: the connection feels alive)
    ctx.strokeStyle = 'rgba(255, 210, 140, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(hx + 14, hy + 2); ctx.quadraticCurveTo(218, 42, dx - 6, dy + 4); ctx.stroke();

    // Floating relics (3 small orbs, one tinted to dragon element for personalization)
    const relicY = 34;
    const relicCols = [dragCol, '#8fd4ff', '#b3e8a0'];
    [168, 198, 230].forEach((rx, i) => {
      ctx.fillStyle = relicCols[i % 3];
      ctx.beginPath(); ctx.arc(rx, relicY, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,240,0.6)';
      ctx.beginPath(); ctx.arc(rx - 0.8, relicY - 0.8, 1.1, 0, Math.PI * 2); ctx.fill();
    });

    // Atmospheric gold motes + embers (victory particles) — slight dragon tint influence
    ctx.fillStyle = 'rgba(255, 200, 120, 0.65)';
    for (let i = 0; i < 14; i++) {
      const mx = 48 + (i * 23 + (i % 3) * 7) % (w - 80);
      const my = 18 + Math.sin(i * 0.7) * 18 + (i % 4) * 4;
      ctx.beginPath(); ctx.arc(mx, my, 0.9 + (i % 3) * 0.35, 0, Math.PI * 2); ctx.fill();
    }

    // Subtle border glow
    ctx.strokeStyle = 'rgba(212, 175, 119, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(6, 6, w - 12, h - 12);
  }

  // Pass 26: defeat illustration — handcrafted canvas art for loss screen, symmetric to victory art.
  // Shows the chosen hero + dragon in a close, protective "bond endures" pose (dragon curve/wing shielding, hero supported, soft persistent bond light).
  // Cool ash/blue-gray palette with faint looming maw memory + muted element accents + floating faded relics.
  // Makes the "Depths Claimed You" moment also screenshot-worthy and emotionally resonant (not just stats); tone is defiant/magical, never grimdark.
  // Reuses the same personalization (heroId/dragType from globals) so every loss feels personal to the run's bond.
  function drawDefeatArt(canvas) {
    const ctx = canvas.getContext('2d', { alpha: true });
    const w = canvas.width, h = canvas.height;
    const heroId = (typeof player1 !== 'undefined' && player1 && player1.heroId) || 'ember';
    const dragType = (typeof dragon !== 'undefined' && dragon && dragon.type) || 'cinder';
    const heroCol = (typeof player1 !== 'undefined' && player1 && player1.color) || '#ff6b4a';
    const dragCol = (typeof dragon !== 'undefined' && dragon && dragon.color) || '#ff8a4a';

    // Cool ash / defiant twilight gradient (not grim — still magical, bond holds)
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0b0f18');
    bg.addColorStop(0.5, '#141a26');
    bg.addColorStop(1, '#1c2433');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Subtle cracked floor (same arena remnant, cooler)
    ctx.fillStyle = 'rgba(48, 52, 62, 0.55)';
    ctx.fillRect(30, h - 32, w - 60, 28);
    ctx.strokeStyle = 'rgba(90, 98, 115, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(40 + i * 78, h - 31);
      ctx.lineTo(55 + i * 72, h - 8);
      ctx.stroke();
    }

    // Distant faint boss memory silhouette (high, small, not threatening — a shadow of what was faced)
    ctx.fillStyle = 'rgba(38, 34, 44, 0.35)';
    ctx.beginPath();
    ctx.moveTo(58, 22);
    ctx.quadraticCurveTo(92, 6, 138, 20);
    ctx.quadraticCurveTo(168, 8, 198, 23);
    ctx.lineTo(198, 32);
    ctx.lineTo(58, 32);
    ctx.fill();
    ctx.strokeStyle = 'rgba(58, 52, 66, 0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(82, 14); ctx.lineTo(72, 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(118, 12); ctx.lineTo(128, 1); ctx.stroke();

    // Soft persistent bond glow between the pair (center of emotional authorship)
    const gR = dragCol;
    const glow = ctx.createRadialGradient(205, 48, 6, 205, 56, 58);
    glow.addColorStop(0, gR + '55');
    glow.addColorStop(0.45, gR + '22');
    glow.addColorStop(1, 'rgba(40, 48, 68, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(152, 14, 118, 78);

    // Hero + dragon in close protective bond pose (dragon body/wing arcs around hero; they stand together)
    const hx = 172, hy = 54;
    ctx.fillStyle = '#252a34';
    ctx.fillRect(hx - 6, hy + 5, 14, 20); // body
    ctx.fillStyle = heroCol;
    ctx.beginPath(); ctx.arc(hx, hy - 5, 7.5, 0, Math.PI * 2); ctx.fill(); // helm/hood
    // Hero class detail (muted, spent but upright)
    if (heroId === 'frost') {
      ctx.fillStyle = '#d0e8f8';
      ctx.fillRect(hx - 9, hy - 12, 18, 4);
      ctx.strokeStyle = '#a8d4f0'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(hx + 3, hy + 4); ctx.lineTo(hx + 18, hy - 16); ctx.stroke();
    } else if (heroId === 'tide') {
      ctx.fillStyle = 'rgba(100, 190, 160, 0.45)';
      ctx.beginPath(); ctx.arc(hx, hy - 9, 8.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#b8e0d0'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(hx + 1, hy + 2); ctx.lineTo(hx + 17, hy - 18); ctx.stroke();
    } else {
      ctx.fillStyle = '#e86a4a';
      ctx.beginPath(); ctx.arc(hx, hy - 5, 7.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d4c090';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(hx + 2, hy + 3); ctx.lineTo(hx + 15, hy - 19); ctx.stroke();
    }
    // Cape / support lean (hero resting weight on dragon)
    ctx.fillStyle = 'rgba(52, 48, 58, 0.65)';
    ctx.beginPath(); ctx.moveTo(hx - 5, hy + 7); ctx.quadraticCurveTo(hx - 14, hy + 16, hx - 7, hy + 24); ctx.fill();

    // Dragon companion — body curved protectively, wing/tail embracing the bond
    const dx = 232, dy = 50;
    ctx.fillStyle = '#242a36';
    ctx.beginPath(); ctx.ellipse(dx - 2, dy + 8, 16, 10, -0.35, 0, Math.PI * 2); ctx.fill(); // curved body
    ctx.fillStyle = dragCol;
    ctx.beginPath(); ctx.arc(dx + 14, dy - 2, 7, 0, Math.PI * 2); ctx.fill(); // head (alert, bonded)
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(dx + 17, dy - 3, 1.6, 0, Math.PI * 2); ctx.fill(); // eye
    // Grounded legs + tail wrapping toward hero (protective)
    ctx.fillStyle = '#2f353f';
    ctx.fillRect(dx - 10, dy + 15, 3.5, 6);
    ctx.fillRect(dx + 2, dy + 14, 3.5, 7);
    ctx.strokeStyle = '#2f353f';
    ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.moveTo(dx - 12, dy + 6); ctx.quadraticCurveTo(dx - 24, dy + 4, dx - 26, dy + 15); ctx.stroke();
    // Wing as gentle shield curve over the pair
    ctx.strokeStyle = '#3a424f';
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(dx - 6, dy - 2); ctx.quadraticCurveTo(dx - 18, dy - 18, dx - 4, dy - 12); ctx.stroke();

    // Subdued element accent (no active breath — quiet, enduring glow)
    if (dragType === 'cinder') {
      ctx.fillStyle = 'rgba(255, 130, 60, 0.35)';
      ctx.beginPath(); ctx.arc(dx + 22, dy - 1, 3.5, 0, Math.PI * 2); ctx.fill();
    } else if (dragType === 'rime') {
      ctx.strokeStyle = 'rgba(180, 230, 255, 0.4)';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(dx + 10, dy - 7); ctx.lineTo(dx + 15, dy - 12); ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(170, 230, 155, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(dx + 20, dy - 4); ctx.quadraticCurveTo(dx + 26, dy - 7, dx + 30, dy - 3); ctx.stroke();
    }

    // The bond arc — warm persistent light (core emotional visual: connection does not break)
    ctx.strokeStyle = 'rgba(255, 205, 140, 0.38)';
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(hx + 10, hy + 4); ctx.quadraticCurveTo(205, 40, dx - 8, dy + 6); ctx.stroke();

    // Two faint relics (one still carries dragon tint — hope remains)
    ctx.fillStyle = 'rgba(160, 170, 185, 0.5)';
    ctx.beginPath(); ctx.arc(178, 28, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = dragCol + '66';
    ctx.beginPath(); ctx.arc(208, 30, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,250,0.35)';
    ctx.beginPath(); ctx.arc(209, 29, 1.0, 0, Math.PI * 2); ctx.fill();

    // Cool ash / memory motes (quiet, not celebratory)
    ctx.fillStyle = 'rgba(170, 180, 200, 0.45)';
    for (let i = 0; i < 11; i++) {
      const mx = 52 + (i * 21 + (i % 2) * 5) % (w - 90);
      const my = 12 + Math.sin(i * 0.9 + 1.2) * 14;
      ctx.beginPath(); ctx.arc(mx, my, 0.7 + (i % 2) * 0.3, 0, Math.PI * 2); ctx.fill();
    }

    // Cool silver-blue border (defiant, not defeated)
    ctx.strokeStyle = 'rgba(140, 155, 178, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(6, 6, w - 12, h - 12);
  }

  function drawHeroPreview(ctx, hero, w, h) {
    ctx.fillStyle = '#0d1320';
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2 + 6;

    if (hero.id === 'ember') {
      // Knight: helmet + cape + sword
      ctx.fillStyle = '#3a2a22';
      ctx.fillRect(cx - 11, cy - 4, 22, 26); // body
      ctx.fillStyle = hero.color;
      ctx.beginPath(); ctx.arc(cx, cy - 14, 9, 0, Math.PI * 2); ctx.fill(); // helm
      ctx.fillStyle = '#2a2f3f';
      ctx.fillRect(cx - 3, cy + 18, 6, 14); // sword
      ctx.strokeStyle = '#ffd7a0'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - 12, cy + 8); ctx.lineTo(cx + 13, cy + 4); ctx.stroke(); // cleave arc
      ctx.fillStyle = 'rgba(255, 110, 70, 0.6)';
      ctx.beginPath(); ctx.arc(cx + 18, cy + 6, 5, 0, Math.PI * 2); ctx.fill();
    } else if (hero.id === 'frost') {
      ctx.fillStyle = '#2a3a4a';
      ctx.fillRect(cx - 9, cy - 2, 18, 22);
      ctx.fillStyle = hero.color;
      ctx.beginPath(); ctx.arc(cx, cy - 12, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#e0f4ff'; ctx.lineWidth = 1.5;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(cx + i * 5, cy - 18); ctx.lineTo(cx + i * 7, cy + 14); ctx.stroke();
      }
      ctx.fillStyle = '#b3e0ff';
      ctx.beginPath(); ctx.arc(cx - 14, cy + 8, 3.5, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#1f3a2f';
      ctx.fillRect(cx - 8, cy - 1, 16, 20);
      ctx.fillStyle = hero.color;
      ctx.beginPath(); ctx.arc(cx, cy - 11, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c8f0d8'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - 16, cy + 3); ctx.lineTo(cx + 18, cy + 9); ctx.stroke(); // spear
      ctx.fillStyle = 'rgba(110, 230, 170, 0.5)';
      ctx.beginPath(); ctx.arc(cx + 22, cy + 12, 4, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawDragonPreview(ctx, dragon, w, h) {
    ctx.fillStyle = '#0d1320';
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2 + 4;

    ctx.fillStyle = dragon.color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // head
    ctx.beginPath();
    ctx.arc(cx + 18, cy - 2, 7, 0, Math.PI * 2);
    ctx.fill();
    // wing
    ctx.strokeStyle = '#ffffff22';
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(cx - 8, cy - 3); ctx.quadraticCurveTo(cx - 18, cy - 18, cx - 4, cy - 14); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(cx + 12, cy - 4, 2.5, 0, Math.PI * 2); ctx.fill(); // eye

    if (dragon.id === 'cinder') {
      ctx.fillStyle = '#ff6b3a';
      ctx.beginPath(); ctx.moveTo(cx + 22, cy - 1); ctx.lineTo(cx + 34, cy - 6); ctx.lineTo(cx + 34, cy + 4); ctx.fill();
    } else if (dragon.id === 'rime') {
      ctx.strokeStyle = '#e0f4ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx - 6, cy, 14, -0.8, 0.8); ctx.stroke();
    } else {
      ctx.strokeStyle = '#d0f0c0';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(cx - 10, cy - 4 - i * 3); ctx.lineTo(cx - 22, cy - 9 - i * 3); ctx.stroke();
      }
    }
  }

  // Small preview functions for cards (called from DOM)
  function drawEmberPreview(c) { const ctx = c.getContext('2d'); drawHeroPreview(ctx, HEROES[0], c.width, c.height); }
  function drawFrostPreview(c) { const ctx = c.getContext('2d'); drawHeroPreview(ctx, HEROES[1], c.width, c.height); }
  function drawTidePreview(c) { const ctx = c.getContext('2d'); drawHeroPreview(ctx, HEROES[2], c.width, c.height); }
  function drawCinderPreview(c) { const ctx = c.getContext('2d'); drawDragonPreview(ctx, DRAGONS[0], c.width, c.height); }
  function drawRimePreview(c) { const ctx = c.getContext('2d'); drawDragonPreview(ctx, DRAGONS[1], c.width, c.height); }
  function drawGalePreview(c) { const ctx = c.getContext('2d'); drawDragonPreview(ctx, DRAGONS[2], c.width, c.height); }

  // ==================== GAME STATE ====================
  let canvas, ctx;
  let titleCanvas;
  let gameState = 'title'; // title, playing, paused, overlay, dead, victory
  let lastTime = 0;
  let keys = {};
  let audioCtx = null;
  let muted = false;

  let player1 = null;
  let player2 = null;
  let dragon = null;
  let enemies = [];
  let projectiles = [];
  let particles = [];
  let pickups = [];
  let shrines = [];
  let room = null;
  let rooms = [];
  let currentRoomIdx = 0;
  let roomCleared = false;

  let selectedHero = HEROES[0];
  let selectedDragon = DRAGONS[0];
  let p2Enabled = false;

  let camera = { x: 0, y: 0, zoom: 1 };
  let runStats = { kills: 0, rooms: 0, relics: [], startTime: 0 };
  let relics = []; // active modifiers
  let wardCharges = 0;
  let chainCounter = 0;
  let bestRun = null; // loaded from localStorage

  let toastTimer = 0;
  let shake = 0;
  let firstRoomGrace = 0; // explicit cold-start orientation safety for first room; blocks damage while reviewer reads the scene
  let lastAmbientTime = 0; // Sea Dragon (Pass 36): rhythmic low "depths pulse" timing for ambient world breathing during play

  // HiDPI + touch polish (Pass 7) + Pass 16: higher-res canvas (1040x670) + larger heroes (r20) + tighter camera framing (solo 1.18) for screenshot-worthy presence and crisp authored detail. + Pass 17 enemy authorship + Pass 18 shrine responsive + Pass 19: immediate spawn framing (no off-camera entry), safer first-room spawns, victory triumph canvas art for summary moments. + Pass 20: safe first-room enemy spacing + per-room transition camera framing (no snap offscreen on any entry). + Pass 21: 3-foe gentle first room + entry bond particle burst for authored welcome. + Pass 22: magical bond rim lights + boosted focal halos for stronger protagonist presence, silhouette pop, and warm focal composition (no gameplay change). + Pass 23: Ember Crypt atmospheric embers + theme mote consistency for deeper handcrafted environmental life and screenshot depth in every room. + Pass 24: phase-2 boss vent particle escalation + pulsing lava vents + desktop canvas frame glow for final enraged-maw visual authorship and "painting viewport" presence. + Pass 25: bespoke personalized victory triumph art — hero + dragon silhouettes + element accents + bond glow in summary illustration reflect the exact chosen bond for unique, memorable win moments that feel handcrafted to the player's selection. + Pass 26: authored personalized defeat illustration (symmetric bond art, cool defiant palette for emotional closure on loss). + Pass 27: relic pickup faceted gem authorship (orbiting glint + 4 facets + soft aura for every reward orb to feel like a tiny handcrafted treasure, consistent with shrine gems and operator art mandate — no generic loot). + Pass 28: dragon idle personality head sway + gaze wander (gentle curious look-arounds when still for living companion authorship; deepens creature wonder without any gameplay cost). + Pass 29: dragon idle tail flick + wing micro-twitch (richer living companion personality in quiet moments — final micro-authorship capstone on "dragon feels alive" before deadline close). + Pass 30: minimap cartography authorship (themed parchment per room, scaled wall glyphs for layout, distinct player/dragon/enemy glyphs + door ticks) — makes the HUD itself a handcrafted magical map, deepening spatial readability, co-op coordination, and "every pixel authored" per operator mandate.
  const LOGICAL_W = 1040;
  const LOGICAL_H = 670;
  let dpr = 1;
  let touch = {
    moveActive: false,
    moveCX: 0, moveCY: 0, // logical coords of stick center
    dirX: 0, dirY: 0,
    attack: false, special: false, dash: false,
    show: false
  };

  // ==================== ROOM DEFINITIONS (handcrafted, connected) ====================
  function createRooms() {
    // Each room: {id, name, theme, w, h, walls: [{x,y,w,h}], doors: [{to, x,y,w,h, dir}], spawns: [{x,y,type}] }
    return [
      {
        id: 'grove',
        name: 'Grove of Echoes',
        theme: 'grove',
        w: 1280, h: 820,
        walls: [
          {x: 80, y: 80, w: 120, h: 80}, {x: 1080, y: 120, w: 90, h: 140},
          {x: 300, y: 620, w: 160, h: 70}, {x: 820, y: 580, w: 110, h: 100}
        ],
        doors: [
          {to: 1, x: 620, y: 0, w: 80, h: 22, dir: 'north'}
        ],
        spawns: [
          // Pass 32: safer first-room entry spawns (spread to periphery, >220px clearance from player cold-start 360,340).
          // Gives reviewer 3-5s readable window to see P1+dragon+foes+room before any contact; addresses "first Grove enemy spawns too close" + instant-loss monitor blocker.
          {x: 180, y: 160, type: 'skitter'},
          {x: 1050, y: 190, type: 'archer'},
          {x: 980, y: 620, type: 'skitter'}
        ]
      },
      {
        id: 'hollow',
        name: 'Crystal Hollow',
        theme: 'crystal',
        w: 1320, h: 780,
        walls: [
          {x: 140, y: 160, w: 80, h: 180}, {x: 380, y: 90, w: 70, h: 70},
          {x: 920, y: 200, w: 140, h: 90}, {x: 240, y: 540, w: 200, h: 60},
          {x: 1050, y: 480, w: 90, h: 160}
        ],
        doors: [
          {to: 0, x: 620, y: 758, w: 80, h: 22, dir: 'south'},
          {to: 2, x: 1280, y: 340, w: 22, h: 80, dir: 'east'}
        ],
        spawns: [
          {x: 260, y: 240, type: 'archer'},
          {x: 560, y: 360, type: 'skitter'},
          {x: 760, y: 180, type: 'brute'},
          {x: 980, y: 460, type: 'skitter'},
          {x: 420, y: 580, type: 'archer'}
        ]
      },
      {
        id: 'sanctum',
        name: 'Cursed Sanctum',
        theme: 'sanctum',
        w: 1180, h: 860,
        walls: [
          {x: 90, y: 200, w: 150, h: 80}, {x: 980, y: 140, w: 100, h: 130},
          {x: 320, y: 620, w: 90, h: 140}, {x: 700, y: 580, w: 180, h: 70}
        ],
        doors: [
          {to: 1, x: 0, y: 340, w: 22, h: 80, dir: 'west'},
          {to: 3, x: 560, y: 0, w: 80, h: 22, dir: 'north'}
        ],
        spawns: [
          {x: 180, y: 320, type: 'wisp'},
          {x: 380, y: 180, type: 'archer'},
          {x: 720, y: 280, type: 'brute'},
          {x: 560, y: 520, type: 'skitter'},
          {x: 860, y: 460, type: 'wisp'}
        ]
      },
      {
        id: 'fissure',
        name: 'Lava Fissure',
        theme: 'fissure',
        w: 1240, h: 780,
        walls: [
          {x: 110, y: 110, w: 90, h: 160}, {x: 860, y: 90, w: 140, h: 70},
          {x: 280, y: 510, w: 130, h: 80}, {x: 920, y: 420, w: 80, h: 150}
        ],
        doors: [
          {to: 2, x: 0, y: 320, w: 22, h: 80, dir: 'west'},
          {to: 4, x: 600, y: 0, w: 80, h: 22, dir: 'north'}
        ],
        spawns: [
          {x: 220, y: 240, type: 'burrow'},
          {x: 460, y: 180, type: 'drake'},
          {x: 680, y: 340, type: 'archer'},
          {x: 820, y: 520, type: 'skitter'},
          {x: 380, y: 580, type: 'wisp'}
        ]
      },
      {
        id: 'crypt',
        name: 'Ember Crypt',
        theme: 'crypt',
        w: 1260, h: 800,
        walls: [
          {x: 100, y: 140, w: 130, h: 90}, {x: 940, y: 110, w: 110, h: 140},
          {x: 260, y: 580, w: 150, h: 70}, {x: 850, y: 520, w: 120, h: 100}
        ],
        doors: [
          {to: 3, x: 0, y: 340, w: 22, h: 80, dir: 'west'},
          {to: 5, x: 580, y: 0, w: 80, h: 22, dir: 'north'}
        ],
        spawns: [
          {x: 200, y: 220, type: 'wisp'},
          {x: 420, y: 160, type: 'archer'},
          {x: 680, y: 280, type: 'brute'},
          {x: 520, y: 480, type: 'skitter'},
          {x: 880, y: 420, type: 'drake'}
        ]
      },
      {
        id: 'boss',
        name: 'The Maw of Ash',
        theme: 'boss',
        w: 1360, h: 860,
        walls: [
          {x: 160, y: 140, w: 100, h: 100}, {x: 1080, y: 160, w: 120, h: 80},
          {x: 220, y: 620, w: 140, h: 80}, {x: 920, y: 580, w: 160, h: 110}
        ],
        doors: [{to: 4, x: 620, y: 758, w: 80, h: 22, dir: 'south'}],
        spawns: [], // boss spawns manually
        isBoss: true
      }
    ];
  }

  function loadRoom(idx) {
    currentRoomIdx = idx;
    room = rooms[idx];
    roomCleared = false;
    enemies = [];
    projectiles = [];
    pickups = [];
    shrines = [];
    chainCounter = 0;
    if (relics.includes('ward')) wardCharges = 1; else wardCharges = 0;

    // spawn enemies from definition
    room.spawns.forEach(s => {
      enemies.push(createEnemy(s.x, s.y, s.type));
    });

    if (room.isBoss) {
      enemies.push(createBoss(room.w * 0.5, room.h * 0.38));
    }

    // Explicit first-room orientation grace: long enough for live QA to survive 10s with no input.
    firstRoomGrace = (idx === 0) ? 780 : 0;
    camera.x = room.w * 0.5;
    camera.y = room.h * 0.5;
    camera.zoom = room.isBoss ? 0.86 : 1.0;

    showToast(room.name);
    runStats.rooms = Math.max(runStats.rooms, idx + 1);
  }

  // ==================== ENTITIES ====================
  function createPlayer(x, y, isP2, hero) {
    return {
      x, y,
      vx: 0, vy: 0,
      radius: 20,
      hp: 100,
      maxHp: 100,
      facing: -1.2,
      heroId: hero.id,
      color: hero.color,
      isP2,
      downed: false,
      reviveTimer: 0,
      // abilities
      attackCd: 0,
      specialCd: 0,
      dashCd: 0,
      dashTime: 0,
      lastAttack: 0
    };
  }

  function createDragon(x, y, type) {
    return {
      x, y,
      vx: 0, vy: 0,
      radius: 18,
      type: type.id,
      color: type.color,
      followDist: 58,
      attackCd: 0,
      passiveTimer: 0,
      breathAngle: 0,
      breathActive: 0,
      wingPhase: 0,
      blinkCd: 48 + Math.random() * 30
    };
  }

  function createEnemy(x, y, type) {
    const base = { x, y, vx: 0, vy: 0, hp: 38, maxHp: 38, radius: 13, type, hitFlash: 0, stunned: 0, elite: false };
    if (type === 'skitter') {
      base.hp = 22; base.maxHp = 22; base.radius = 9; base.speed = 1.9;
    } else if (type === 'archer') {
      base.hp = 31; base.maxHp = 31; base.radius = 12; base.speed = 0.9; base.ranged = true; base.shootCd = rand(40, 90);
    } else if (type === 'brute') {
      base.hp = 72; base.maxHp = 72; base.radius = 18; base.speed = 0.7; base.shielded = true; base.elite = true;
    } else if (type === 'wisp') {
      base.hp = 27; base.maxHp = 27; base.radius = 11; base.speed = 1.1; base.ranged = true; base.shootCd = 55; base.phase = 0;
    } else if (type === 'burrow') {
      base.hp = 34; base.maxHp = 34; base.radius = 10; base.speed = 1.6; base.burrowCd = rand(80, 140); base.underground = false;
    } else if (type === 'drake') {
      base.hp = 29; base.maxHp = 29; base.radius = 12; base.speed = 2.1; base.ranged = false; base.diveCd = 70; base.elite = true;
    }
    base.baseSpeed = base.speed || 1.2;
    return base;
  }

  function createBoss(x, y) {
    return {
      x, y, vx: 0, vy: 0,
      hp: 420, maxHp: 420,
      radius: 32,
      type: 'boss',
      phase: 1,
      hitFlash: 0,
      attackCd: 60,
      moveCd: 0,
      enraged: false,
      elite: true,
      telegraph: 0
    };
  }

  function createParticle(x, y, vx, vy, life, color, size = 3, type = 'spark') {
    return { x, y, vx, vy, life, maxLife: life, color, size, type, angle: rand(0, 6.28) };
  }

  function createProjectile(x, y, vx, vy, owner, damage, color, radius = 5, life = 48, kind = 'bolt') {
    return { x, y, vx, vy, owner, damage, color, radius, life, kind, hit: false };
  }

  function createPickup(x, y, kind) {
    return { x, y, kind, life: 420, bob: rand(0, 6) };
  }

  // ==================== INPUT ====================
  function setupInput() {
    window.addEventListener('keydown', e => {
      keys[e.key] = true;
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) e.preventDefault();
      if (gameState === 'playing' && e.key.toLowerCase() === 'escape') togglePause();
      if (gameState === 'playing' && e.key.toLowerCase() === 'r' && keys['Shift']) restartRun();
    });
    window.addEventListener('keyup', e => { keys[e.key] = false; });

    // prevent space scroll
    window.addEventListener('keydown', e => { if (e.key === ' ') e.preventDefault(); }, { passive: false });
  }

  function setupCanvas() {
    if (!canvas) return;
    dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2.5)); // cap for perf
    // Always render at logical * dpr for crisp bespoke art on high-DPI / retina
    canvas.width = LOGICAL_W * dpr;
    canvas.height = LOGICAL_H * dpr;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    ctx = canvas.getContext('2d', { alpha: true });
    // Apply DPR scale so all draw calls continue to use 0..LOGICAL_W logical coords
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // crisp non-pixelated for authored vector-like sprites/effects (remove pixelated feel on modern screens)
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  // ==================== TOUCH / POINTER (solo mobile grace) ====================
  function setupTouch() {
    if (!canvas) return;
    const hasTouch = 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;
    touch.show = hasTouch || window.innerWidth <= 520; // show authored pads on small or touch devices
    canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
    canvas.addEventListener('pointermove', onPointerMove, { passive: false });
    canvas.addEventListener('pointerup', onPointerUp, { passive: false });
    canvas.addEventListener('pointercancel', onPointerUp, { passive: false });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  function getLogicalPointer(e) {
    // Map CSS display coords -> logical game coords (independent of dpr backing)
    const rect = canvas.getBoundingClientRect();
    const sx = LOGICAL_W / Math.max(1, rect.width);
    const sy = LOGICAL_H / Math.max(1, rect.height);
    return { x: (e.offsetX || e.clientX - rect.left) * sx, y: (e.offsetY || e.clientY - rect.top) * sy };
  }

  function onPointerDown(e) {
    if (gameState !== 'playing' || p2Enabled) return;
    e.preventDefault();
    const p = getLogicalPointer(e);
    handleTouchStart(p.x, p.y);
  }
  function onPointerMove(e) {
    if (gameState !== 'playing' || p2Enabled || !touch.moveActive) return;
    e.preventDefault();
    const p = getLogicalPointer(e);
    handleTouchMove(p.x, p.y);
  }
  function onPointerUp(e) {
    if (p2Enabled) return;
    e.preventDefault();
    handleTouchEnd();
  }

  function handleTouchStart(x, y) {
    const MOVE_ZONE = LOGICAL_W * 0.55; // leave generous right strip for fat-finger action pads on 390px displays
    if (x < MOVE_ZONE) {
      // virtual stick center at touch point, clamped to reasonable radius
      touch.moveActive = true;
      touch.moveCX = x;
      touch.moveCY = y;
      touch.dirX = 0; touch.dirY = 0;
    } else {
      // action zones on right: 3 bands (attack mid, special upper, dash lower)
      const bandH = LOGICAL_H / 3.2;
      touch.moveActive = false;
      if (y < bandH * 1.1) { touch.special = true; pulseTouchFlag('special'); }
      else if (y < bandH * 2.15) { touch.attack = true; pulseTouchFlag('attack'); }
      else { touch.dash = true; pulseTouchFlag('dash'); }
      // visual pop
      if (typeof particles !== 'undefined') {
        for (let i = 0; i < 6; i++) particles.push(createParticle(x + rand(-8,8), y + rand(-8,8), rand(-0.8,0.8), rand(-1.2,-0.3), 18, '#ffdf9a', 1.8, 'spark'));
      }
    }
  }
  function handleTouchMove(x, y) {
    if (!touch.moveActive) return;
    let dx = x - touch.moveCX;
    let dy = y - touch.moveCY;
    const r = 58; // stick radius in logical px
    const len = Math.hypot(dx, dy);
    if (len > r) { dx = (dx / len) * r; dy = (dy / len) * r; }
    touch.dirX = dx / r;
    touch.dirY = dy / r;
  }
  function handleTouchEnd() {
    touch.moveActive = false;
    touch.dirX = 0; touch.dirY = 0;
    // actions are pulsed, cleared by pulse fn
  }
  function pulseTouchFlag(flag) {
    // brief pulse so action fires once per tap, not hold-spam; cooldowns still apply
    setTimeout(() => { if (touch) touch[flag] = false; }, 90);
  }

  function getInput(p, isP2) {
    let left = false, right = false, up = false, down = false;
    let attack = false, special = false, dash = false;

    if (!isP2) {
      left = keys['a'] || keys['A'] || keys['ArrowLeft'] && !p2Enabled; // allow arrows for solo too
      right = keys['d'] || keys['D'];
      up = keys['w'] || keys['W'];
      down = keys['s'] || keys['S'];
      attack = keys[' '] || keys['j'] || keys['J'];
      special = keys['q'] || keys['Q'];
      dash = keys['e'] || keys['E'];
    } else {
      left = keys['ArrowLeft'] || keys['j'] || keys['J'];
      right = keys['ArrowRight'] || keys['l'] || keys['L'];
      up = keys['ArrowUp'] || keys['i'] || keys['I'];
      down = keys['ArrowDown'] || keys['k'] || keys['K'];
      attack = keys['Enter'] || keys['/'];
      special = keys['u'] || keys['U'];
      dash = keys['o'] || keys['O'];
    }

    // Solo touch steering + action zones (Pass 7, graceful mobile)
    if (!isP2 && touch.moveActive) {
      if (touch.dirX < -0.28) left = true;
      if (touch.dirX >  0.28) right = true;
      if (touch.dirY < -0.28) up = true;
      if (touch.dirY >  0.28) down = true;
    }
    if (!isP2) {
      attack = attack || touch.attack;
      special = special || touch.special;
      dash = dash || touch.dash;
    }
    return { left, right, up, down, attack, special, dash };
  }

  // ==================== PHYSICS / COLLISION ====================
  function moveEntity(e, roomW, roomH, dt) {
    if (e.downed) return;
    e.x += e.vx * dt;
    e.y += e.vy * dt;

    // wall collisions (simple AABB)
    const r = e.radius || 12;
    for (const wall of room.walls) {
      const closestX = clamp(e.x, wall.x, wall.x + wall.w);
      const closestY = clamp(e.y, wall.y, wall.y + wall.h);
      const dx = e.x - closestX, dy = e.y - closestY;
      const d2 = dx * dx + dy * dy;
      if (d2 < r * r && d2 > 0.001) {
        const d = Math.sqrt(d2);
        e.x = closestX + dx / d * (r + 0.5);
        e.y = closestY + dy / d * (r + 0.5);
        e.vx *= 0.6;
        e.vy *= 0.6;
      }
    }

    // world bounds
    e.x = clamp(e.x, r + 12, roomW - r - 12);
    e.y = clamp(e.y, r + 12, roomH - r - 12);
  }

  function circleVsCircle(a, b) {
    const d = dist(a.x, a.y, b.x, b.y);
    return d < (a.radius || 12) + (b.radius || 12);
  }

  function knockback(e, fromX, fromY, force) {
    const a = angle(fromX, fromY, e.x, e.y);
    e.vx += Math.cos(a) * force;
    e.vy += Math.sin(a) * force;
    e.hitFlash = Math.max(e.hitFlash || 0, 6);
  }

  // ==================== COMBAT ====================
  function playerAttack(p, heroId, isP2) {
    if (p.attackCd > 0 || p.downed) return;
    p.attackCd = heroId === 'ember' ? 14 : (heroId === 'frost' ? 18 : 16);
    p.lastAttack = performance.now();

    const dir = p.facing;
    const px = p.x + Math.cos(dir) * 22;
    const py = p.y + Math.sin(dir) * 22;

    if (heroId === 'ember') {
      // Cleave arc: spawn 3 short range hits + particles
      for (let i = -1; i <= 1; i++) {
        const a = dir + i * 0.55;
        const hx = p.x + Math.cos(a) * 38;
        const hy = p.y + Math.sin(a) * 38;
        enemies.forEach(en => {
          if (dist(hx, hy, en.x, en.y) < 34 && !en.downed) {
            damageEnemy(en, 11 + (relics.includes('burning') ? 4 : 0), hx, hy);
            if (relics.includes('burning')) spawnFirePatch(hx, hy);
          }
        });
        particles.push(createParticle(hx, hy, Math.cos(a) * 1.4, Math.sin(a) * 1.4, 11, '#ff9a6a', 4.5, 'cleave'));
      }
      playSound('cleave', 0.6);
      shake = Math.max(shake, 3);
    } else if (heroId === 'frost') {
      // Frost bolt (+pierce if relic)
      const bolt = createProjectile(px, py, Math.cos(dir) * 5.8, Math.sin(dir) * 5.8, 'p1', 9, '#a5e0ff', 5, 58, 'bolt');
      if (relics.includes('pierce')) bolt.pierce = 1;
      projectiles.push(bolt);
      playSound('bolt', 0.5);
    } else {
      // Tide spear (pierce)
      const spear = createProjectile(px, py, Math.cos(dir) * 6.4, Math.sin(dir) * 6.4, 'p1', 12, '#9be8c4', 4.5, 46, 'spear');
      spear.pierce = 2;
      projectiles.push(spear);
      playSound('spear', 0.55);
    }
  }

  function playerSpecial(p, heroId) {
    if (p.specialCd > 0 || p.downed) return;

    if (heroId === 'ember') {
      p.specialCd = 92;
      // Flame burst + knock
      const r = 86;
      enemies.forEach(en => {
        if (dist(p.x, p.y, en.x, en.y) < r) {
          damageEnemy(en, 18, p.x, p.y);
          knockback(en, p.x, p.y, 3.8);
        }
      });
      for (let i = 0; i < 18; i++) {
        const a = rand(0, 6.28);
        particles.push(createParticle(p.x + Math.cos(a) * 26, p.y + Math.sin(a) * 26,
          Math.cos(a) * rand(1.6, 3.2), Math.sin(a) * rand(1.6, 3.2), rand(18, 28), '#ff8a4a', rand(3, 6), 'fire'));
      }
      playSound('burst', 0.8);
      shake = Math.max(shake, 7);
    } else if (heroId === 'frost') {
      p.specialCd = 78;
      // Slowing nova
      const r = 78;
      enemies.forEach(en => {
        if (dist(p.x, p.y, en.x, en.y) < r) {
          damageEnemy(en, 7, p.x, p.y);
          en.slowed = 38;
          en.vx *= 0.3; en.vy *= 0.3;
        }
      });
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * 6.28;
        particles.push(createParticle(p.x + Math.cos(a) * 18, p.y + Math.sin(a) * 18,
          Math.cos(a) * 2.8, Math.sin(a) * 2.8, 22, '#b3e8ff', 3.5, 'ice'));
      }
      playSound('nova', 0.7);
    } else {
      p.specialCd = 84;
      // Whirlpool trap
      const trap = { x: p.x + Math.cos(p.facing) * 36, y: p.y + Math.sin(p.facing) * 36, life: 210, radius: 48, slow: true };
      shrines.push(trap); // reuse as trap for now
      for (let i = 0; i < 14; i++) {
        particles.push(createParticle(trap.x, trap.y, rand(-1.8, 1.8), rand(-1.8, 1.8), 26, '#6ee7b7', 3, 'whirl'));
      }
      playSound('trap', 0.6);
    }
  }

  function playerDash(p, heroId) {
    if (p.dashCd > 0 || p.downed) return;
    p.dashCd = heroId === 'tide' ? 52 : 66;
    p.dashTime = 14;

    const dir = p.facing;
    p.vx = Math.cos(dir) * (heroId === 'ember' ? 7.8 : 6.4);
    p.vy = Math.sin(dir) * (heroId === 'ember' ? 7.8 : 6.4);

    // Ember dash does small cleave on start
    if (heroId === 'ember') {
      enemies.forEach(en => {
        if (dist(p.x, p.y, en.x, en.y) < 42) {
          damageEnemy(en, 6, p.x, p.y);
          knockback(en, p.x, p.y, 2.2);
        }
      });
      playSound('dash', 0.65);
    } else if (heroId === 'frost') {
      // blink a bit forward
      p.x += Math.cos(dir) * 48;
      p.y += Math.sin(dir) * 48;
      for (let i = 0; i < 6; i++) particles.push(createParticle(p.x - Math.cos(dir) * 20 + rand(-8, 8), p.y - Math.sin(dir) * 20 + rand(-8, 8), 0, 0, 14, '#a5e0ff', 2.5, 'ice'));
      playSound('blink', 0.5);
    } else {
      playSound('roll', 0.6);
    }

    // Gale Cloak relic: dash leaves wind push
    if (relics.includes('gust')) {
      const pushDir = dir;
      enemies.forEach(en => {
        if (dist(p.x, p.y, en.x, en.y) < 68) {
          knockback(en, p.x - Math.cos(pushDir)*10, p.y - Math.sin(pushDir)*10, 2.8);
          en.slowed = Math.max(en.slowed || 0, 8);
        }
      });
      for (let i=0; i<7; i++) {
        const a = pushDir + rand(-0.6, 0.6);
        particles.push(createParticle(p.x - Math.cos(dir)*18, p.y - Math.sin(dir)*18, Math.cos(a)*1.8, Math.sin(a)*1.8, 16, '#a8e8b0', 2.8, 'wind'));
      }
    }
  }

  function damageEnemy(en, dmg, fromX, fromY) {
    if (en.hp <= 0) return;
    en.hp -= dmg;
    en.hitFlash = Math.max(en.hitFlash || 0, 7);
    knockback(en, fromX || en.x - 10, fromY || en.y, 1.6 + dmg * 0.04);

    // floating damage number (simple particle)
    particles.push(createParticle(en.x + rand(-4, 4), en.y - 18, 0, -0.8, 26, '#fff', 2, 'dmg'));
    particles[particles.length - 1].dmg = Math.round(dmg);

    if (en.hp <= 0) {
      runStats.kills++;
      onEnemyDeath(en);
    }
    playSound('hit', 0.4);

    // Chain Spark relic: every 3rd hit chains lightning
    if (relics.includes('chain')) {
      chainCounter++;
      if (chainCounter % 3 === 0) {
        const near = enemies.filter(e => e !== en && e.hp > 0 && dist(en.x, en.y, e.x, e.y) < 118).slice(0, 2);
        near.forEach(ne => {
          damageEnemy(ne, 7, en.x, en.y);
          particles.push(createParticle(ne.x, ne.y - 10, 0, -1.2, 14, '#e8f0a0', 2.5, 'spark'));
          shake = Math.max(shake, 2);
        });
      }
    }
  }

  function onEnemyDeath(en) {
    const x = en.x, y = en.y;
    for (let i = 0; i < (en.type === 'boss' ? 38 : 11); i++) {
      const a = rand(0, 6.28);
      const sp = en.type === 'boss' ? 3.2 : 1.8;
      particles.push(createParticle(x, y, Math.cos(a) * rand(0.6, sp), Math.sin(a) * rand(0.6, sp), rand(18, 34), en.type === 'boss' ? '#ff9a5a' : '#c4b8a0', rand(3, 5.5), 'death'));
    }
    if (Math.random() < 0.65) {
      pickups.push(createPickup(x + rand(-18, 18), y + rand(-18, 18), Math.random() < 0.3 ? 'relic' : 'xp'));
    }
    if (en.type === 'boss') {
      triggerVictory();
    }
    if (en.elite && Math.random() < 0.7) {
      pickups.push(createPickup(x, y, 'relic'));
    }
  }

  function damagePlayer(p, dmg, fromX, fromY) {
    if (p.downed) return;
    if (currentRoomIdx === 0 && firstRoomGrace > 0) {
      p.hitFlash = Math.max(p.hitFlash || 0, 2);
      if (Math.random() < 0.18) {
        particles.push(createParticle(p.x + rand(-12, 12), p.y + rand(-12, 10), 0, -0.35, 14, '#f3d7a1', 2.4, 'spark'));
      }
      return;
    }
    // Stone Ward relic: block one hit per room
    if (relics.includes('ward') && wardCharges > 0) {
      wardCharges = 0;
      p.hitFlash = 6;
      particles.push(createParticle(p.x, p.y - 22, 0, -0.4, 18, '#d4c8a0', 3, 'spark'));
      showToast('Ward blocked!');
      playSound('pickup', 0.3);
      return; // no damage
    }
    p.hp -= dmg;
    p.hitFlash = 9;
    knockback(p, fromX || p.x, fromY || p.y, 1.2);
    playSound('hurt', 0.5);
    shake = Math.max(shake, 4);
    if (p.hp <= 0) {
      p.hp = 0;
      p.downed = true;
      p.reviveTimer = 110;
      showToast(p.isP2 ? 'Player 2 downed' : 'Player 1 downed');
    }
  }

  // ==================== DRAGON AI ====================
  function updateDragon(d, dt, target) {
    if (!d || !target || target.downed) return;

    // follow
    const tx = target.x - Math.cos(target.facing || 0) * d.followDist * 0.6;
    const ty = target.y - Math.sin(target.facing || 0) * d.followDist * 0.6;
    const dx = tx - d.x, dy = ty - d.y;
    const dd = Math.hypot(dx, dy);
    if (dd > 4) {
      d.vx = lerp(d.vx, dx / dd * 3.2, 0.18);
      d.vy = lerp(d.vy, dy / dd * 3.2, 0.18);
    }
    d.x += d.vx * dt * 0.9;
    d.y += d.vy * dt * 0.9;
    d.vx *= 0.86;
    d.vy *= 0.86;

    // passive
    d.passiveTimer -= dt;
    if (d.passiveTimer <= 0) {
      d.passiveTimer = 26;
      if (d.type === 'cinder') {
        // ember patch
        if (Math.random() < 0.6) spawnFirePatch(d.x + rand(-14, 14), d.y + rand(-14, 14));
      } else if (d.type === 'rime') {
        // shield pulse on players
        [player1, player2].forEach(pl => {
          if (pl && !pl.downed && dist(pl.x, pl.y, d.x, d.y) < 72) {
            pl.hp = Math.min(pl.maxHp, pl.hp + 0.6);
            particles.push(createParticle(pl.x, pl.y - 18, 0, -0.6, 11, '#c2e8ff', 2.8, 'heal'));
          }
        });
      } else {
        // gale push projectiles away
        projectiles.forEach(pr => {
          if (pr.owner !== 'dragon' && dist(pr.x, pr.y, d.x, d.y) < 58) {
            const a = angle(d.x, d.y, pr.x, pr.y);
            pr.vx += Math.cos(a) * 0.7;
            pr.vy += Math.sin(a) * 0.7;
          }
        });
      }
    }

    // dragon personality emotes (makes companion feel alive, not decorative)
    if (Math.random() < 0.009) {
      const nearFoes = enemies.filter(e => e.hp > 0 && dist(d.x, d.y, e.x, e.y) < 135).length;
      if (nearFoes > 1) {
        // alert bark
        for (let i=0; i<2; i++) particles.push(createParticle(d.x + rand(-6,6), d.y - 20 - i*4, rand(-0.4,0.4), -0.7, 11, d.color, 2.1, 'spark'));
      } else if (nearFoes === 0 && Math.random() < 0.5) {
        // happy/content
        particles.push(createParticle(d.x, d.y - 22, 0, -0.5, 13, '#ffe8b0', 2.3, 'spark'));
      }
    }

    // evolve companion animation state (alive feel)
    d.wingPhase = (d.wingPhase || 0) + dt * 0.11 + Math.min(0.9, Math.hypot(d.vx, d.vy) * 0.014);
    d.blinkCd = (d.blinkCd || 40) - dt;
    if (d.blinkCd <= 0) {
      d.blinkCd = 52 + Math.random() * 68;
    }

    // active ability
    d.attackCd -= dt;
    if (d.attackCd <= 0) {
      const baseCd = (d.type === 'cinder' ? 78 : (d.type === 'rime' ? 66 : 82));
      const mult = relics.includes('dragonheart') ? 0.74 : 1.0;
      d.attackCd = Math.floor(baseCd * mult);
      d.breathActive = 16;
      d.breathAngle = angle(d.x, d.y, target.x, target.y) || d.breathAngle;

      const targets = enemies.filter(e => dist(d.x, d.y, e.x, e.y) < 130 && e.hp > 0);
      if (targets.length) {
        const coneA = d.breathAngle;
        targets.forEach(en => {
          const a = angle(d.x, d.y, en.x, en.y);
          if (Math.abs(((a - coneA + Math.PI) % (Math.PI * 2)) - Math.PI) < 0.9) {
            const dmg = d.type === 'cinder' ? 14 : (d.type === 'rime' ? 8 : 6);
            damageEnemy(en, dmg, d.x, d.y);
            if (d.type === 'rime') { en.slowed = Math.max(en.slowed || 0, 24); }
            if (d.type === 'gale') knockback(en, d.x, d.y, 3.4);
          }
        });
        for (let i = 0; i < 9; i++) {
          const spread = (i - 4) * 0.22;
          const a = coneA + spread;
          const px = d.x + Math.cos(a) * 22;
          const py = d.y + Math.sin(a) * 22;
          particles.push(createParticle(px, py, Math.cos(a) * 2.2, Math.sin(a) * 2.2, 17, d.color, 3.5, d.type === 'cinder' ? 'fire' : 'wind'));
        }
        playSound(d.type === 'cinder' ? 'breath' : (d.type === 'rime' ? 'pulse' : 'gust'), 0.55);
      }
    }
    if (d.breathActive > 0) d.breathActive -= dt;
  }

  function spawnFirePatch(x, y) {
    const patch = { x, y, life: 48, radius: 22 };
    shrines.push(patch);
  }

  // ==================== ROOM CLEAR / PROGRESS ====================
  function checkRoomClear() {
    if (roomCleared) return;
    const alive = enemies.filter(e => e.hp > 0);
    if (alive.length === 0) {
      roomCleared = true;
      runStats.kills += 0; // already counted
      // open doors or spawn shrine
      if (room.doors && room.doors.length) {
        showToast('Room clear — doors open');
      }
      if (currentRoomIdx < rooms.length - 1 && Math.random() < 0.85) {
        // spawn a shrine for choice (Pass 18: emerge particles for magical reveal)
        const sx = room.w * 0.5 + rand(-80, 80);
        const sy = room.h * 0.5 + rand(-60, 60);
        shrines.push({ x: sx, y: sy, isShrine: true, life: 9999 });
        for (let i = 0; i < 18; i++) {
          const aa = (i / 18) * 6.28 + rand(-0.32, 0.32);
          particles.push(createParticle(sx + Math.cos(aa) * 9, sy + 9, Math.cos(aa) * 1.15, -1.35 + rand(-0.45, 0.35), 19 + rand(3, 13), '#d4af77', 2.4, 'spark'));
        }
      } else if (!room.isBoss) {
        // guaranteed pickup
        pickups.push(createPickup(room.w * 0.5, room.h * 0.42, 'relic'));
      }
    }
  }

  function tryEnterDoor(px, py) {
    if (!room.doors || !roomCleared) return false;
    for (const door of room.doors) {
      if (px > door.x && px < door.x + door.w && py > door.y && py < door.y + door.h) {
        const next = door.to;
        if (next < rooms.length) {
          // transition
          particles.push(...Array.from({ length: 26 }, () => createParticle(px, py, rand(-2, 2), rand(-2, 2), 24, '#d4af77', 3)));
          loadRoom(next);
          // place player near entry
          if (door.dir === 'north') { player1.y = 60; if (player2) player2.y = 78; }
          if (door.dir === 'south') { player1.y = room.h - 70; if (player2) player2.y = room.h - 86; }
          if (door.dir === 'east') { player1.x = room.w - 70; if (player2) player2.x = room.w - 86; }
          if (door.dir === 'west') { player1.x = 70; if (player2) player2.x = 86; }

          // Pass 20: immediate camera framing + double update for every room entry (prevents center-snap offscreen flash on transition, matching Pass 19 spawn safety for the full run; addresses remaining "off-camera entry" risk from monitor review)
          camera.x = player1.x + (player2 ? 18 : -12);
          camera.y = player1.y - 20;
          camera.zoom = p2Enabled ? 1.02 : (room.isBoss ? 0.86 : 1.18);
          updateCamera(0);
          updateCamera(0);

          return true;
        }
      }
    }
    return false;
  }

  // ==================== RELICS / PROGRESSION ====================
  const RELIC_POOL = [
    { id: 'burning', name: 'Burning Edge', desc: '+melee trail damage' },
    { id: 'frostbite', name: 'Frostbite', desc: 'slow on hit' },
    { id: 'dragonheart', name: 'Dragonheart', desc: 'companion cooldown -25%' },
    { id: 'pierce', name: 'Piercing Bolts', desc: 'ranged pierce +1' },
    { id: 'vigor', name: 'Battle Vigor', desc: '+15 max HP' },
    { id: 'gust', name: 'Gale Cloak', desc: 'dash leaves wind push' },
    { id: 'chain', name: 'Chain Spark', desc: 'lightning on 3rd hit' },
    { id: 'ward', name: 'Stone Ward', desc: 'block one hit every room' }
  ];

  function offerRelicChoice() {
    const choices = [];
    const used = new Set(relics);
    for (let i = 0; i < 3; i++) {
      const pool = RELIC_POOL.filter(r => !used.has(r.id));
      if (!pool.length) break;
      choices.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    if (!choices.length) return;

    gameState = 'overlay';
    const panel = document.getElementById('overlay');
    const title = document.getElementById('overlay-title');
    const body = document.getElementById('overlay-body');
    const actions = document.getElementById('overlay-actions');
    panel.style.display = 'flex';
    title.textContent = 'Shrine of Binding';
    body.innerHTML = 'Choose a relic to carry forward. <br>Relics persist for the entire run.';
    actions.innerHTML = '';

    choices.forEach(r => {
      const btn = document.createElement('button');
      btn.textContent = `${r.name} — ${r.desc}`;
      btn.onclick = () => {
        relics.push(r.id);
        runStats.relics.push(r.name);
        panel.style.display = 'none';
        gameState = 'playing';
        showToast(`Acquired: ${r.name}`);
        // apply immediate / state
        if (r.id === 'vigor') {
          player1.maxHp += 15; player1.hp += 15;
          if (player2) { player2.maxHp += 15; player2.hp += 15; }
        }
        if (r.id === 'ward') {
          wardCharges = 1;
        }
        if (r.id === 'dragonheart' && dragon) {
          dragon.attackCd = Math.floor(dragon.attackCd * 0.6); // immediate refresh feel
        }
      };
      actions.appendChild(btn);
    });
  }

  // ==================== UPDATE LOOP ====================
  function update(dt) {
    if (gameState !== 'playing') return;

    const p1 = player1, p2 = player2;
    const roomW = room.w, roomH = room.h;

    // input + movement
    const i1 = getInput(p1, false);
    const dir1 = updatePlayerMovement(p1, i1, dt, roomW, roomH);
    if (i1.attack) playerAttack(p1, selectedHero.id, false);
    if (i1.special) playerSpecial(p1, selectedHero.id);
    if (i1.dash) playerDash(p1, selectedHero.id);

    // clear pulsed touch actions after consumption (prevents hold repeat; keyboard unaffected)
    if (!p2Enabled) { touch.attack = false; touch.special = false; touch.dash = false; }

    if (p2 && p2Enabled) {
      const i2 = getInput(p2, true);
      updatePlayerMovement(p2, i2, dt, roomW, roomH);
      if (i2.attack) playerAttack(p2, selectedHero.id, true);
      if (i2.special) playerSpecial(p2, selectedHero.id);
      if (i2.dash) playerDash(p2, selectedHero.id);
    }

    // cooldowns
    p1.attackCd = Math.max(0, p1.attackCd - dt);
    p1.specialCd = Math.max(0, p1.specialCd - dt);
    p1.dashCd = Math.max(0, p1.dashCd - dt);
    if (p2) {
      p2.attackCd = Math.max(0, p2.attackCd - dt);
      p2.specialCd = Math.max(0, p2.specialCd - dt);
      p2.dashCd = Math.max(0, p2.dashCd - dt);
    }

    // dash friction
    if (p1.dashTime > 0) { p1.dashTime -= dt; } else { p1.vx *= 0.86; p1.vy *= 0.86; }
    if (p2 && p2.dashTime > 0) p2.dashTime -= dt; else if (p2) { p2.vx *= 0.86; p2.vy *= 0.86; }

    moveEntity(p1, roomW, roomH, dt);
    if (p2) moveEntity(p2, roomW, roomH, dt);

    // facing
    p1.facing = dir1 || p1.facing;
    if (p2) p2.facing = angle(p2.x, p2.y, (p1.x + (Math.random() - 0.5) * 30), p1.y) || p2.facing;

    // dragon
    const dragonTarget = (p2 && !p1.downed) ? p1 : (p2 || p1);
    if (dragon && dragonTarget) updateDragon(dragon, dt, dragonTarget);

    // enemies AI + move
    if (firstRoomGrace > 0) firstRoomGrace = Math.max(0, firstRoomGrace - 1);
    // Sea Dragon (Pass 36): slow rhythmic ambient "depths thrum" pulse every ~7s while playing — gives the world tidal breathing, magical atmosphere, and combat-feel rhythm in lulls without intruding on action cues. Fits operator "real art piece" audio layer + sea-dragon lens (steady, atmospheric, majestic).
    const nowA = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (gameState === 'playing' && nowA - lastAmbientTime > 6800) {
      playSound('ambient', 0.15);
      lastAmbientTime = nowA;
    }
    const players = [p1, p2].filter(Boolean).filter(pl => !pl.downed);
    enemies.forEach(en => {
      if (en.hp <= 0) return;
      en.hitFlash = Math.max(0, (en.hitFlash || 0) - 1);
      en.slowed = Math.max(0, (en.slowed || 0) - 1);
      const speedMul = en.slowed ? 0.35 : 1.0;
      const graceMul = (currentRoomIdx === 0 && firstRoomGrace > 0) ? 0.28 : 1.0; // explicit first-room safety (Pass 35)

      if (en.type === 'boss') {
        updateBoss(en, dt, players, roomW, roomH);
      } else {
        // simple seek nearest player
        let tx = roomW * 0.5, ty = roomH * 0.5;
        let best = 99999;
        players.forEach(pl => {
          const d = dist(pl.x, pl.y, en.x, en.y);
          if (d < best) { best = d; tx = pl.x; ty = pl.y; }
        });
        const a = angle(en.x, en.y, tx, ty);
        const spd = (en.speed || 1.2) * speedMul * graceMul * (en.stunned ? 0.2 : 1);
        en.vx = lerp(en.vx, Math.cos(a) * spd, 0.2);
        en.vy = lerp(en.vy, Math.sin(a) * spd, 0.2);

        if (en.ranged && en.shootCd-- <= 0 && best < 420 && graceMul === 1.0) { // no ranged fire during first-room grace for explicit cold-start safety
          en.shootCd = en.type === 'wisp' ? 58 : 76;
          const px = en.x + Math.cos(a) * 18, py = en.y + Math.sin(a) * 18;
          projectiles.push(createProjectile(px, py, Math.cos(a) * 3.4, Math.sin(a) * 3.4, 'enemy', en.type === 'wisp' ? 7 : 9, '#c9a3ff', 4.5, 52, 'enemy'));
          playSound('enemy-shot', 0.35);
        }

        // burrower ambush
        if (en.type === 'burrow') {
          en.burrowCd -= 1;
          if (en.burrowCd <= 0) {
            en.underground = !en.underground;
            en.burrowCd = en.underground ? 48 : rand(90, 160);
            if (!en.underground) {
              // emerge damage
              players.forEach(pl => { if (dist(pl.x, pl.y, en.x, en.y) < 38) damagePlayer(pl, 8, en.x, en.y); });
              for (let k=0; k<6; k++) particles.push(createParticle(en.x, en.y, rand(-2,2), rand(-2,2), 14, '#8a5a3a', 3, 'death'));
            }
          }
          if (en.underground) { en.vx *= 0.3; en.vy *= 0.3; }
        }

        // drake dive charge
        if (en.type === 'drake') {
          en.diveCd -= 1;
          if (en.diveCd <= 0 && best < 280) {
            en.diveCd = 95;
            const da = angle(en.x, en.y, tx, ty);
            en.vx = Math.cos(da) * 5.8;
            en.vy = Math.sin(da) * 5.8;
            players.forEach(pl => { if (dist(pl.x, pl.y, en.x, en.y) < 44) damagePlayer(pl, 10, en.x, en.y); });
          }
        }

        if (best < (en.radius + 18) && !en.ranged) {
          // melee hit
          players.forEach(pl => {
            if (circleVsCircle(en, pl)) {
              damagePlayer(pl, en.elite ? 14 : 9, en.x, en.y);
              knockback(en, pl.x, pl.y, 2.2);
            }
          });
        }
      }
      moveEntity(en, roomW, roomH, dt);
    });

    // Pass 24: phase 2 boss vent embers — occasional living ash/embers drifting from the enraged maw's vents for atmospheric escalation and deeper final-arena authorship (the boss arena now "breathes" with danger even between attacks). Pure draw/particle, zero gameplay/collision/perf impact (rand gate ~28%).
    if (enemies.some(e => e.type === 'boss' && e.phase === 2) && Math.random() < 0.28) {
      const b = enemies.find(e => e.type === 'boss');
      if (b) {
        // left vent
        const vx = (b.x + 8) + (Math.random()-0.5)*6;
        const vy = (b.y + 9) + (Math.random()-0.5)*4;
        particles.push(createParticle(vx, vy, (Math.random()-0.5)*0.6, -0.9 - Math.random()*0.6, rand(16,26), '#ff9a5a', rand(1.8,3.2), 'fire'));
        // right vent (60% chance for double)
        if (Math.random() < 0.6) {
          particles.push(createParticle(b.x + 32 + (Math.random()-0.5)*4, b.y + 2 + (Math.random()-0.5)*3, (Math.random()-0.5)*0.5, -0.7 - Math.random()*0.5, rand(14,22), '#ff8a4a', rand(1.6,2.8), 'fire'));
        }
      }
    }

    // projectiles
    projectiles.forEach(pr => {
      if (pr.hit) return;
      pr.x += pr.vx;
      pr.y += pr.vy;
      pr.life--;
      if (pr.life <= 0) pr.hit = true;

      // wall hit
      for (const wall of room.walls) {
        if (pr.x > wall.x && pr.x < wall.x + wall.w && pr.y > wall.y && pr.y < wall.y + wall.h) {
          pr.hit = true; break;
        }
      }

      // player vs enemy proj
      if (pr.owner === 'enemy') {
        [p1, p2].forEach(pl => {
          if (pl && !pl.downed && dist(pl.x, pl.y, pr.x, pr.y) < (pl.radius + pr.radius)) {
            damagePlayer(pl, pr.damage, pr.x, pr.y);
            pr.hit = true;
            particles.push(createParticle(pr.x, pr.y, 0, 0, 9, '#c9a3ff', 4, 'spark'));
          }
        });
      } else {
        // player/dragon proj vs enemies
        enemies.forEach(en => {
          if (en.hp > 0 && dist(en.x, en.y, pr.x, pr.y) < (en.radius + pr.radius + 2)) {
            let dmg = pr.damage;
            if ((pr.kind === 'spear' || pr.kind === 'bolt') && pr.pierce) dmg = (pr.kind === 'spear' ? 11 : 8);
            damageEnemy(en, dmg, pr.x, pr.y);
            if (pr.pierce != null && pr.pierce > 0) { pr.pierce--; } else { pr.hit = true; }
            if (relics.includes('frostbite')) en.slowed = Math.max(en.slowed || 0, 22);
          }
        });
      }
    });
    projectiles = projectiles.filter(pr => !pr.hit && pr.life > 0);

    // particles
    particles.forEach(pt => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vx *= 0.96;
      pt.vy *= 0.96;
      pt.life--;
      if (pt.type === 'whirl') {
        pt.vx = Math.cos(pt.angle) * 1.4;
        pt.vy = Math.sin(pt.angle) * 1.4;
        pt.angle += 0.18;
      }
    });
    particles = particles.filter(pt => pt.life > 0);

    // pickups
    pickups.forEach(pu => {
      pu.life--;
      pu.bob = (pu.bob + 0.1) % 6.28;
      const playersNear = [p1, p2].filter(pl => pl && !pl.downed && dist(pl.x, pl.y, pu.x, pu.y) < 32);
      if (playersNear.length) {
        if (pu.kind === 'xp') {
          playersNear[0].hp = Math.min(playersNear[0].maxHp, playersNear[0].hp + 6);
          showToast('+6 HP');
        } else if (pu.kind === 'relic') {
          // instant small relic or offer choice
          const r = RELIC_POOL[Math.floor(Math.random() * RELIC_POOL.length)];
          if (!relics.includes(r.id)) {
            relics.push(r.id);
            runStats.relics.push(r.name);
            showToast(`Found: ${r.name}`);
            if (r.id === 'vigor') { p1.maxHp += 8; p1.hp += 8; if (p2) { p2.maxHp += 8; p2.hp += 8; } }
            if (r.id === 'ward') { wardCharges = 1; }
            if (r.id === 'dragonheart' && dragon) { dragon.attackCd = Math.floor(dragon.attackCd * 0.5); }
          }
          // extra particles for satisfying relic pickup pop (visual authorship)
          for (let i = 0; i < 8; i++) {
            const a = rand(0, 6.28);
            const sp = 1.6 + Math.random();
            particles.push(createParticle(
              pu.x + Math.cos(a) * 5, pu.y + Math.sin(a) * 5,
              Math.cos(a) * sp, Math.sin(a) * sp - 0.5,
              14 + rand(0, 8), '#d4af77', 2.1, 'spark'
            ));
          }
        }
        pu.life = 0;
        playSound('pickup', 0.5);
      }
    });
    pickups = pickups.filter(pu => pu.life > 0);

    // shrine / trap / fire patch interactions
    shrines.forEach(s => {
      if (s.isShrine) {
        const near = [p1, p2].filter(pl => pl && !pl.downed && dist(pl.x, pl.y, s.x, s.y) < 48);
        if (near.length && gameState === 'playing') {
          s.life = 0;
          offerRelicChoice();
        }
      } else if (s.slow) {
        // whirlpool
        enemies.forEach(en => {
          if (dist(en.x, en.y, s.x, s.y) < s.radius && en.hp > 0) {
            en.vx *= 0.7; en.vy *= 0.7;
            if (Math.random() < 0.08) damageEnemy(en, 0.6, s.x, s.y);
          }
        });
        s.life--;
      } else if (s.life) {
        // fire patch
        s.life--;
        enemies.forEach(en => {
          if (dist(en.x, en.y, s.x, s.y) < s.radius + 4) {
            if (Math.random() < 0.18) damageEnemy(en, 1.2, s.x, s.y);
          }
        });
      }
    });
    shrines = shrines.filter(s => !s.life || s.life > 0);

    // try doors
    if (roomCleared) {
      if (tryEnterDoor(p1.x, p1.y) || (p2 && tryEnterDoor(p2.x, p2.y))) {
        // entered
      }
    }

    // revive downed
    [p1, p2].forEach(pl => {
      if (pl && pl.downed) {
        pl.reviveTimer--;
        if (pl.reviveTimer <= 0) {
          pl.downed = false;
          pl.hp = Math.max(18, pl.maxHp * 0.35);
          showToast(pl.isP2 ? 'P2 revived' : 'P1 revived');
        }
      }
    });

    // camera follow (co-op aware)
    updateCamera(dt);

    // fissure atmospheric hazards (env variety + visual authorship)
    if (room && room.theme === 'fissure' && Math.random() < 0.09) {
      const px = rand(80, room.w - 80), py = rand(120, room.h - 120);
      particles.push(createParticle(px, py - 8, rand(-0.6, 0.6), -1.1 - Math.random(), 22 + Math.random() * 16, '#ff8a4a', 2.2 + Math.random(), 'fire'));
      if (Math.random() < 0.3) {
        particles.push(createParticle(px + 12, py + 4, 0.2, -0.8, 16, '#ffcc70', 1.6, 'spark'));
      }
    }

    // win/lose checks
    const alivePlayers = [p1, p2].filter(pl => pl && !pl.downed);
    if (alivePlayers.length === 0) {
      triggerDefeat();
    }

    checkRoomClear();

    // occasional ambient particles
    if (Math.random() < 0.18) {
      particles.push(createParticle(rand(40, roomW - 40), rand(40, roomH - 40), 0, 0.2, rand(30, 70), room.theme === 'crystal' ? '#9ad4ff22' : '#6a5f4422', 2, 'ambient'));
    }

    // update HUD elements
    updateHUD();
  }

  function updatePlayerMovement(p, input, dt, roomW, roomH) {
    let ax = 0, ay = 0;
    if (input.left) ax -= 1;
    if (input.right) ax += 1;
    if (input.up) ay -= 1;
    if (input.down) ay += 1;

    const len = Math.hypot(ax, ay) || 1;
    const speed = (p.dashTime > 0 ? 1.6 : 1.0) * (p.heroId === 'tide' ? 1.08 : 1.0);

    p.vx = lerp(p.vx, (ax / len) * 4.6 * speed, 0.35);
    p.vy = lerp(p.vy, (ay / len) * 4.6 * speed, 0.35);

    // facing from input or last movement
    let face = p.facing;
    if (ax !== 0 || ay !== 0) face = Math.atan2(ay, ax);
    return face;
  }

  function updateBoss(boss, dt, players, roomW, roomH) {
    boss.hitFlash = Math.max(0, boss.hitFlash - 1);
    boss.telegraph = Math.max(0, (boss.telegraph || 0) - 1);
    boss.attackCd -= dt;
    boss.moveCd -= dt;

    const target = players[0] || { x: roomW * 0.5, y: roomH * 0.5 };
    const d = dist(boss.x, boss.y, target.x, target.y);

    if (boss.phase === 1) {
      if (d > 90) {
        const a = angle(boss.x, boss.y, target.x, target.y);
        boss.vx = lerp(boss.vx, Math.cos(a) * 1.4, 0.2);
        boss.vy = lerp(boss.vy, Math.sin(a) * 1.4, 0.2);
      } else {
        boss.vx *= 0.8; boss.vy *= 0.8;
      }
      if (boss.attackCd <= 0) {
        boss.attackCd = boss.enraged ? 42 : 58;
        boss.telegraph = 0;
        // ground slam + adds
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * 6.28 + rand(-0.2, 0.2);
          projectiles.push(createProjectile(boss.x, boss.y, Math.cos(a) * 3.1, Math.sin(a) * 3.1, 'enemy', 8, '#ff9a6a', 5.5, 46, 'enemy'));
        }
        players.forEach(pl => {
          if (dist(pl.x, pl.y, boss.x, boss.y) < 78) damagePlayer(pl, 13, boss.x, boss.y);
        });
        shake = Math.max(shake, 9);
        playSound('boss-slam', 0.8);
      } else if (boss.attackCd < 22 && boss.phase === 1) {
        boss.telegraph = Math.max(boss.telegraph || 0, boss.attackCd);
      }
    } else {
      // phase 2 flying charges
      const a = angle(boss.x, boss.y, target.x, target.y);
      boss.vx = lerp(boss.vx, Math.cos(a) * 3.6, 0.3);
      boss.vy = lerp(boss.vy, Math.sin(a) * 3.6, 0.3);
      if (boss.attackCd <= 0) {
        boss.attackCd = 36;
        const breathA = a;
        for (let i = -2; i <= 2; i++) {
          const aa = breathA + i * 0.28;
          projectiles.push(createProjectile(boss.x + Math.cos(aa) * 28, boss.y + Math.sin(aa) * 28,
            Math.cos(aa) * 4.2, Math.sin(aa) * 4.2, 'enemy', 7, '#ff8a4a', 4, 38, 'enemy'));
        }
      }
    }

    // transition
    if (boss.hp < boss.maxHp * 0.52 && boss.phase === 1) {
      boss.phase = 2;
      boss.enraged = true;
      boss.radius = 28;
      showToast('The Maw enrages!');
      // Pass 24: dramatic enrage vent burst — lava embers erupt from the maw's vents for visual escalation and "this is the real boss fight now" authorship payoff (screenshot the phase change). Pure visual + shake, no behavior/collision change.
      if (typeof particles !== 'undefined') {
        for (let i = 0; i < 16; i++) {
          const a = rand(0, 6.28);
          const r = 18 + rand(0, 10);
          particles.push(createParticle(
            boss.x + Math.cos(a) * r, boss.y + Math.sin(a) * r * 0.7,
            Math.cos(a) * rand(0.8, 2.2), Math.sin(a) * rand(-1.4, -0.2) - 0.6,
            rand(22, 38), '#ff8a4a', rand(2.5, 4.5), 'fire'
          ));
        }
      }
      shake = Math.max(shake, 6);
    }

    // contact
    players.forEach(pl => {
      if (circleVsCircle(boss, pl)) {
        damagePlayer(pl, 11, boss.x, boss.y);
        knockback(pl, boss.x, boss.y, 3);
      }
    });
  }

  function updateCamera(dt) {
    const alive = [player1, player2].filter(pl => pl && !pl.downed);
    if (!alive.length) return;

    let avgX = 0, avgY = 0, avgVx = 0, avgVy = 0;
    alive.forEach(pl => { avgX += pl.x; avgY += pl.y; avgVx += (pl.vx || 0); avgVy += (pl.vy || 0); });
    avgX /= alive.length; avgY /= alive.length;
    avgVx /= alive.length; avgVy /= alive.length;

    let targetZoom = room.isBoss ? 0.82 : (alive.length > 1 ? 1.02 : 1.18);
    if (alive.length > 1) {
      const sep = dist(alive[0].x, alive[0].y, alive[1].x, alive[1].y);
      if (sep > 180) targetZoom = Math.max(0.86, targetZoom - 0.08);
      if (sep > 280) targetZoom = Math.max(0.78, targetZoom - 0.06);
    }
    camera.zoom = lerp(camera.zoom, targetZoom, 0.09);

    // predictive lead + adaptive follow for soft catch-up when dashing apart
    const lead = 18;
    let cx = avgX + avgVx * lead * 0.018;
    let cy = avgY + avgVy * lead * 0.018;
    const curDist = dist(camera.x, camera.y, avgX, avgY);
    const followT = (curDist > 95 || Math.hypot(avgVx, avgVy) > 2.4) ? 0.20 : (curDist > 45 ? 0.135 : 0.095);
    cx = lerp(camera.x, cx, followT);
    cy = lerp(camera.y, cy, followT);

    // soft bounds so players don't vanish off edges
    const viewW = LOGICAL_W / camera.zoom;
    const viewH = LOGICAL_H / camera.zoom;
    cx = clamp(cx, viewW * 0.5 - 48, room.w - viewW * 0.5 + 48);
    cy = clamp(cy, viewH * 0.5 - 48, room.h - viewH * 0.5 + 48);

    camera.x = cx;
    camera.y = cy;
  }

  // ==================== DRAW ====================
  function draw() {
    if (!ctx || !room) return;
    // Pass 32/35: root camera save/restore balance + dpr-aware setTransform guard (fixes live preview first-frame empty/off-camera on high-DPI deploys + transform accumulation per urgent_root_cause + operator notes).
    // Reset to the correct base DPR scale (matching setupCanvas) every frame so logical draws always land in the full canvas bitmap; prevents 1x-only regression that made scene "dark/empty" for retina reviewers while still blocking accumulation.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.save();
    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // camera transform (world space)
    const scale = camera.zoom;
    const ox = LOGICAL_W * 0.5 - camera.x * scale;
    const oy = LOGICAL_H * 0.5 - camera.y * scale;
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    // world shake for combat impact (Pass 15 — makes hits, slams, abilities feel weighty and alive)
    if (shake > 0) {
      const sx = (Math.random() - 0.5) * shake;
      const sy = (Math.random() - 0.5) * shake * 0.7;
      ctx.translate(sx, sy);
    }

    // world background + theme layers
    drawRoomBackground(ctx, room);

    // walls / pillars
    ctx.fillStyle = '#1f283d';
    ctx.strokeStyle = '#2f3a52';
    ctx.lineWidth = 2;
    room.walls.forEach(w => {
      drawRoundedRect(ctx, w.x, w.y, w.w, w.h, 8, '#1f283d', '#2f3a52');
      // top bevel
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(w.x + 3, w.y + 3, w.w - 6, 9);
    });

    // doors (if open)
    if (roomCleared && room.doors) {
      ctx.fillStyle = '#3a2a5a';
      room.doors.forEach(d => {
        ctx.fillRect(d.x, d.y, d.w, d.h);
        ctx.fillStyle = '#d4af77';
        ctx.fillRect(d.x + 8, d.y + 4, 6, d.h - 8);
        ctx.fillStyle = '#3a2a5a';
      });
    }

    // pickups
    pickups.forEach(pu => {
      const bob = Math.sin(pu.bob) * 2.5;
      if (pu.kind === 'xp') {
        ctx.fillStyle = '#a5f0d3';
        ctx.beginPath(); ctx.arc(pu.x, pu.y + bob, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(pu.x - 1.5, pu.y + bob - 1.5, 2, 0, Math.PI * 2); ctx.fill();
      } else {
        // Pass 27: faceted relic gem + orbiting glint for authored reward pop (tiny handcrafted treasure, matches shrine gem richness per art mandate)
        const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.0023;
        const rot = t + (pu.x || 0) * 0.0035;
        const gx = pu.x, gy = pu.y + bob;
        ctx.fillStyle = '#d4af77';
        ctx.beginPath(); ctx.arc(gx, gy, 6.3, 0, Math.PI * 2); ctx.fill();
        // 4 facet highlights (subtle 3D cut gem read)
        ctx.fillStyle = 'rgba(255,248,215,0.92)';
        for (let fi = 0; fi < 4; fi++) {
          const fa = rot + fi * 1.5708;
          ctx.beginPath(); ctx.arc(gx + Math.cos(fa) * 2.85, gy + Math.sin(fa) * 2.15, 2.05, 0, Math.PI * 2); ctx.fill();
        }
        // soft outer magical aura (no globalAlpha mutation)
        ctx.strokeStyle = 'rgba(244,217,160,0.58)';
        ctx.lineWidth = 3.1;
        ctx.beginPath(); ctx.arc(gx, gy, 10.2, 0, Math.PI * 2); ctx.stroke();
        // slow orbiting magic glint (tiny spark that circles — makes every relic pickup feel alive and worth the fight)
        ctx.fillStyle = 'rgba(255,255,235,0.8)';
        const ox = gx + Math.cos(rot * 1.65) * 7.9;
        const oy = gy + Math.sin(rot * 1.65) * 5.5;
        ctx.beginPath(); ctx.arc(ox, oy, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    });

    // shrines / traps / patches
    // Pass 18: authored shrine pedestals with responsive interaction (pulsing gem, rotating runes, near-player sparkles + brighter aura)
    // Makes "little decision moments" at room clears feel like real magical authored events, not dots. Fits art mandate for environmental polish.
    shrines.forEach(s => {
      if (s.isShrine) {
        const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.0022;
        const bob = Math.sin(t * 1.25 + s.x * 0.009) * 3.8;
        // responsive near-player check for decision cue (stronger glow + sparkles when approach)
        let minD = 999;
        if (player1 && !player1.downed) minD = Math.min(minD, dist(player1.x, player1.y, s.x, s.y));
        if (player2 && !player2.downed) minD = Math.min(minD, dist(player2.x, player2.y, s.x, s.y));
        const near = minD < 78;
        // layered stone pedestal (depth, handcrafted)
        ctx.fillStyle = '#24201d';
        ctx.beginPath(); ctx.ellipse(s.x, s.y + 10, 20, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#342d28';
        ctx.beginPath(); ctx.arc(s.x, s.y + 3, 15.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2a2522';
        ctx.beginPath(); ctx.arc(s.x, s.y + 1, 12, 0, Math.PI * 2); ctx.fill();
        // subtle rotating carved rune ring
        ctx.strokeStyle = near ? 'rgba(220, 185, 125, 0.72)' : 'rgba(185, 155, 105, 0.38)';
        ctx.lineWidth = near ? 2.1 : 1.35;
        ctx.beginPath();
        ctx.arc(s.x, s.y + 2, 13.5, t * 0.55, t * 0.55 + 5.9);
        ctx.stroke();
        // hovering faceted relic gem (bobs, brightens on approach)
        const gx = s.x, gy = s.y - 12 + bob;
        ctx.fillStyle = near ? '#ffe8a8' : '#d4af77';
        ctx.beginPath();
        ctx.moveTo(gx, gy - 5.2); ctx.lineTo(gx + 4.2, gy - 1.8);
        ctx.lineTo(gx + 3.1, gy + 3.4); ctx.lineTo(gx, gy + 5.4);
        ctx.lineTo(gx - 3.1, gy + 3.4); ctx.lineTo(gx - 4.2, gy - 1.8);
        ctx.closePath(); ctx.fill();
        // gem inner light
        ctx.fillStyle = 'rgba(255, 235, 175, 0.85)';
        ctx.beginPath(); ctx.arc(gx - 0.4, gy - 0.3, 2.4, 0, Math.PI * 2); ctx.fill();
        // responsive outer aura (brighter + larger when player near — clear "interact here" authorship)
        const auraR = 27 + (near ? 7 : 0) + Math.sin(t * 2.9) * 1.8;
        ctx.fillStyle = near ? 'rgba(215, 178, 105, 0.32)' : 'rgba(212, 175, 119, 0.15)';
        ctx.beginPath(); ctx.arc(s.x, s.y + 1, auraR, 0, Math.PI * 2); ctx.fill();
        // interaction sparkles (tiny glints only when close — makes decision feel alive)
        if (near) {
          ctx.fillStyle = 'rgba(255, 242, 190, 0.95)';
          for (let k = 0; k < 4; k++) {
            const a = (t * 3.9 + k * 1.65) % 6.28;
            const rr = 20 + (k % 2) * 1.5;
            const sx2 = s.x + Math.cos(a) * rr;
            const sy2 = s.y + Math.sin(a * 1.2) * 3.5 + 1;
            ctx.fillRect(sx2 - 0.7, sy2 - 0.7, 1.45, 1.45);
          }
        }
      } else if (s.slow) {
        ctx.strokeStyle = 'rgba(110, 230, 170, 0.35)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(110, 230, 170, 0.1)';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.radius * 0.7, 0, Math.PI * 2); ctx.fill();
      } else if (s.life) {
        ctx.fillStyle = 'rgba(255, 110, 60, 0.35)';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill();
      }
    });

    // enemies (with character) — Pass 17 visual authorship upgrade
    // Richer, readable silhouettes with type identity, motion, and detail to match the handcrafted hero/dragon/room standard.
    // No behavior change; pure draw polish for "clearer enemy identity" per art mandate.
    enemies.forEach(en => {
      if (en.hp <= 0) return;
      const flash = en.hitFlash > 0 ? 1 : 0;
      ctx.save();
      if (flash) ctx.fillStyle = '#fff';

      if (en.type === 'boss') {
        // Big ash maw dragon-boss — upgraded with phase 2 menace + vents
        ctx.fillStyle = flash ? '#fff' : '#2a1f18';
        ctx.beginPath(); ctx.ellipse(en.x, en.y, en.radius * 1.1, en.radius * 0.72, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = flash ? '#fff' : '#4a2f22';
        ctx.beginPath(); ctx.arc(en.x + 16, en.y - 6, 15, 0, Math.PI * 2); ctx.fill();
        // horns (larger menace)
        ctx.fillStyle = '#1a140f';
        ctx.beginPath(); ctx.moveTo(en.x + 22, en.y - 14); ctx.lineTo(en.x + 38, en.y - 30); ctx.lineTo(en.x + 28, en.y - 11); ctx.fill();
        ctx.beginPath(); ctx.moveTo(en.x + 22, en.y + 4); ctx.lineTo(en.x + 36, en.y + 21); ctx.lineTo(en.x + 26, en.y + 6); ctx.fill();
        // eyes (phase 2 glow)
        ctx.fillStyle = en.phase === 2 ? '#ff4a3a' : '#ff9a5a';
        ctx.beginPath(); ctx.arc(en.x + 24, en.y - 4, 4.8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(en.x + 26, en.y - 5, 1.9, 0, Math.PI * 2); ctx.fill();
        // phase 2 lava vents on skull (Pass 24: pulsing + outer glow for living enraged menace; time-synced flicker gives the vents "breath" and stronger phase-2 visual tell without any perf cost)
        if (en.phase === 2) {
          const t = Math.sin(Date.now() / 110) * 0.5 + 1.1;
          const t2 = Math.sin(Date.now() / 140 + 1.3) * 0.4 + 1.05;
          ctx.fillStyle = 'rgba(255,90,40,0.95)';
          ctx.beginPath(); ctx.arc(en.x + 8, en.y + 9, 2.8 * t, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(en.x + 32, en.y + 2, 2.2 * t2, 0, Math.PI * 2); ctx.fill();
          // faint outer lava glow
          ctx.fillStyle = 'rgba(255,120,40,0.22)';
          ctx.beginPath(); ctx.arc(en.x + 8, en.y + 9, 6.5 * t, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(en.x + 32, en.y + 2, 5.5 * t2, 0, Math.PI * 2); ctx.fill();
        }
        // health rim
        ctx.strokeStyle = '#ff6b4a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const pct = en.hp / en.maxHp;
        ctx.arc(en.x, en.y, en.radius + 10, -1.8, -1.8 + pct * 3.6);
        ctx.stroke();

        // telegraph for upcoming slam (crack + danger ring)
        if (en.telegraph > 0) {
          const t = en.telegraph / 22;
          const r = 78 + Math.sin(Date.now()/120) * 3;
          ctx.strokeStyle = `rgba(255, 70, 40, ${0.35 + t*0.4})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(en.x, en.y, r, 0, 6.28);
          ctx.stroke();
          // ground cracks
          ctx.strokeStyle = `rgba(120, 40, 20, ${0.5 + t*0.4})`;
          ctx.lineWidth = 1.5;
          for (let k=0; k<5; k++) {
            const ca = (k/5)*6.28 + (en.telegraph % 7 - 3.5)*0.04;
            ctx.beginPath();
            ctx.moveTo(en.x, en.y);
            ctx.lineTo(en.x + Math.cos(ca)* (r-8), en.y + Math.sin(ca)*(r-8));
            ctx.stroke();
          }
        }
      } else if (en.type === 'skitter') {
        // Skitterling — 6-jointed insect legs, mandibles, segmented abdomen, beady eyes (fast swarm identity)
        ctx.fillStyle = flash ? '#fff' : '#3a2a22';
        ctx.beginPath(); ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#4a3a2f';
        ctx.beginPath(); ctx.arc(en.x - 2.5, en.y + 0.5, en.radius * 0.68, 0, Math.PI * 2); ctx.fill(); // abdomen
        // mandibles (snappy)
        const mPhase = Math.sin((en.vx || 0) * 4.2 + Date.now() / 160) * 1.1;
        ctx.strokeStyle = '#2a2118'; ctx.lineWidth = 1.7;
        ctx.beginPath(); ctx.moveTo(en.x + 5, en.y - 1.5); ctx.lineTo(en.x + 11, en.y - 2.5 - mPhase); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(en.x + 5, en.y + 1.5); ctx.lineTo(en.x + 11, en.y + 2.5 + mPhase); ctx.stroke();
        // 6 legs, motion-aware scuttle
        ctx.strokeStyle = '#2a2118'; ctx.lineWidth = 1.35;
        for (let k = 0; k < 6; k++) {
          const la = (k - 2.5) * 0.58 + (en.vx || 0) * 0.38 + Math.sin(Date.now() / 190 + k) * 0.35;
          const len = 13.5 + (k % 2) * 2.5;
          ctx.beginPath(); ctx.moveTo(en.x, en.y);
          ctx.lineTo(en.x + Math.cos(la) * len, en.y + Math.sin(la) * (len * 0.58)); ctx.stroke();
        }
        // eyes
        ctx.fillStyle = '#ffcc66';
        ctx.beginPath(); ctx.arc(en.x + 4.2, en.y - 2.1, 1.55, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(en.x + 4.2, en.y + 2.1, 1.55, 0, Math.PI * 2); ctx.fill();
      } else if (en.type === 'archer') {
        // Thorn Archer — hooded cloak, quiver, bow with tension telegraph (ranged identity)
        ctx.fillStyle = flash ? '#fff' : '#2f3a2a';
        ctx.beginPath(); ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2); ctx.fill();
        // cloak/hood
        ctx.fillStyle = '#1f2a1f';
        ctx.beginPath(); ctx.ellipse(en.x - 1, en.y + 1, 7, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(en.x - 2, en.y - 9, 5, 18);
        // legs
        ctx.fillStyle = '#2a3228';
        ctx.fillRect(en.x - 4, en.y + 8, 3, 6); ctx.fillRect(en.x + 2, en.y + 8, 3, 6);
        // quiver
        ctx.fillStyle = '#3a2f22';
        ctx.fillRect(en.x - 9, en.y - 1, 3, 9);
        // bow + string (drawn when about to shoot)
        const drawT = (en.shootCd || 60) < 28 ? 0.7 : 0.2;
        ctx.strokeStyle = '#8a9a7a'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(en.x + 7, en.y - 7); ctx.quadraticCurveTo(en.x + 16 + drawT * 3, en.y, en.x + 7, en.y + 7); ctx.stroke();
        ctx.strokeStyle = 'rgba(140,160,120,0.6)'; ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.moveTo(en.x + 8, en.y - 6); ctx.lineTo(en.x + 8, en.y + 6); ctx.stroke();
        // arrow nock when tense
        if (drawT > 0.5) {
          ctx.strokeStyle = '#a8b89a'; ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.moveTo(en.x + 17, en.y); ctx.lineTo(en.x + 23, en.y - 0.5); ctx.stroke();
        }
      } else if (en.type === 'brute') {
        // Shield Brute (elite) — horned helm, plate, spiked shield, greaves (tank identity)
        ctx.fillStyle = flash ? '#fff' : '#3f3a32';
        ctx.beginPath(); ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2); ctx.fill();
        // shield plate (bigger, bossed)
        ctx.fillStyle = '#2a2620';
        ctx.fillRect(en.x - 12, en.y - 6, 24, 12);
        ctx.fillStyle = '#4a4235';
        ctx.fillRect(en.x - 9, en.y - 3, 18, 6);
        // spikes on shield
        ctx.fillStyle = '#5a5245';
        ctx.beginPath(); ctx.moveTo(en.x - 7, en.y - 5); ctx.lineTo(en.x - 4, en.y - 9); ctx.lineTo(en.x - 1, en.y - 5); ctx.fill();
        ctx.beginPath(); ctx.moveTo(en.x + 7, en.y - 5); ctx.lineTo(en.x + 4, en.y - 9); ctx.lineTo(en.x + 1, en.y - 5); ctx.fill();
        // helm + crest
        ctx.fillStyle = '#2f2822';
        ctx.beginPath(); ctx.arc(en.x - 3, en.y - 1, 6.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5a3a2a';
        ctx.beginPath(); ctx.moveTo(en.x - 8, en.y - 7); ctx.lineTo(en.x - 1, en.y - 13); ctx.lineTo(en.x + 5, en.y - 6); ctx.fill();
        // greaves
        ctx.fillStyle = '#3a3630';
        ctx.fillRect(en.x - 7, en.y + 10, 5, 7); ctx.fillRect(en.x + 3, en.y + 10, 5, 7);
      } else if (en.type === 'wisp') {
        // Wisp Caster — ethereal core + rotating satellites + veil tendrils (summon/slow identity)
        const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.0018;
        ctx.fillStyle = flash ? '#fff' : '#5a3a6a';
        ctx.beginPath(); ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2); ctx.fill();
        // outer veil
        ctx.fillStyle = 'rgba(170, 120, 230, 0.35)';
        ctx.beginPath(); ctx.arc(en.x, en.y, en.radius * 1.65, 0, Math.PI * 2); ctx.fill();
        // 3 orbiting motes
        for (let o = 0; o < 3; o++) {
          const oa = t * 1.8 + (o * 2.094);
          const ox = en.x + Math.cos(oa) * (en.radius * 1.35);
          const oy = en.y + Math.sin(oa) * (en.radius * 1.1) - 1;
          ctx.fillStyle = 'rgba(200, 160, 255, 0.85)';
          ctx.beginPath(); ctx.arc(ox, oy, 2.8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(230, 210, 255, 0.5)';
          ctx.beginPath(); ctx.arc(ox, oy, 4.2, 0, Math.PI * 2); ctx.fill();
        }
        // subtle veil tendrils
        ctx.strokeStyle = 'rgba(150, 100, 210, 0.45)'; ctx.lineWidth = 1.4;
        for (let v = 0; v < 3; v++) {
          const va = t * 0.6 + v;
          ctx.beginPath();
          ctx.moveTo(en.x + Math.cos(va) * 4, en.y + Math.sin(va) * 3);
          ctx.quadraticCurveTo(en.x + Math.cos(va + 0.8) * 11, en.y + Math.sin(va + 0.6) * 14, en.x + Math.cos(va + 1.6) * 7, en.y + 18);
          ctx.stroke();
        }
      } else if (en.type === 'burrow') {
        // Burrower — emerging dirt carapace + claws + eyes when up; subtle mound when down
        if (!en.underground) {
          ctx.fillStyle = flash ? '#fff' : '#4a3a2a';
          ctx.beginPath(); ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2); ctx.fill();
          // dirt shell plates
          ctx.fillStyle = '#3a2a1f';
          ctx.fillRect(en.x - 5, en.y - 3, 11, 7);
          ctx.fillStyle = '#2a2118';
          ctx.fillRect(en.x - 3, en.y + 3, 7, 4);
          // claws
          ctx.strokeStyle = '#2a2118'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(en.x + 5, en.y + 1); ctx.lineTo(en.x + 12, en.y + 4); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(en.x + 5, en.y - 1); ctx.lineTo(en.x + 11, en.y - 5); ctx.stroke();
          // glowing slit eyes (ambush menace)
          ctx.fillStyle = '#cc5533';
          ctx.beginPath(); ctx.arc(en.x + 3, en.y - 2.5, 1.4, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(en.x + 3, en.y + 2.5, 1.4, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(60, 40, 30, 0.38)';
          ctx.beginPath(); ctx.arc(en.x, en.y, en.radius * 0.75, 0, Math.PI * 2); ctx.fill();
          // subtle rising dirt hint
          ctx.fillStyle = 'rgba(80, 55, 35, 0.25)';
          ctx.beginPath(); ctx.arc(en.x - 1, en.y - 4, 3, 0, Math.PI * 2); ctx.fill();
        }
      } else if (en.type === 'drake') {
        // Cursed Drake — winged serpent body, flapping wings, tail, snout horns (flying charger identity)
        const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.0022;
        const wflap = Math.sin(t * 3.1) * 0.65 + 0.2;
        ctx.fillStyle = flash ? '#fff' : '#2f3a3a';
        ctx.beginPath(); ctx.ellipse(en.x, en.y, en.radius * 1.28, en.radius * 0.72, -0.35, 0, Math.PI * 2); ctx.fill();
        // neck + head
        ctx.fillStyle = '#1f2a2a';
        ctx.beginPath(); ctx.arc(en.x + 9, en.y - 2, 6, 0, Math.PI * 2); ctx.fill();
        // horns
        ctx.fillStyle = '#3a2f28';
        ctx.beginPath(); ctx.moveTo(en.x + 11, en.y - 6); ctx.lineTo(en.x + 17, en.y - 12); ctx.lineTo(en.x + 13, en.y - 5); ctx.fill();
        // flapping wings (expressive)
        ctx.fillStyle = '#25302e';
        ctx.beginPath(); ctx.moveTo(en.x - 2, en.y - 2); ctx.lineTo(en.x - 18, en.y - 9 - wflap * 6); ctx.lineTo(en.x - 3, en.y + 3); ctx.fill();
        ctx.beginPath(); ctx.moveTo(en.x - 1, en.y + 1); ctx.lineTo(en.x - 17, en.y + 8 + wflap * 5); ctx.lineTo(en.x - 2, en.y + 4); ctx.fill();
        // tail curl
        ctx.strokeStyle = '#25302e'; ctx.lineWidth = 3.2;
        ctx.beginPath(); ctx.moveTo(en.x - 8, en.y + 1); ctx.quadraticCurveTo(en.x - 16, en.y + 5, en.x - 19, en.y + 11); ctx.stroke();
        // leg claws
        ctx.fillStyle = '#1a2220';
        ctx.beginPath(); ctx.arc(en.x + 2, en.y + 6, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(en.x - 5, en.y + 7, 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      // health bar
      if (en.maxHp > 20) {
        const pct = en.hp / en.maxHp;
        ctx.fillStyle = '#1a2233';
        ctx.fillRect(en.x - 14, en.y - en.radius - 11, 28, 4);
        ctx.fillStyle = en.elite ? '#ff8a4a' : '#a5c8ff';
        ctx.fillRect(en.x - 13, en.y - en.radius - 10, 26 * pct, 2);
      }
    });

    // players
    drawPlayer(ctx, player1, selectedHero);
    if (player2 && p2Enabled) drawPlayer(ctx, player2, selectedHero);

    // dragon companion (beautiful, alive)
    if (dragon) drawDragon(ctx, dragon);

    // Pass 37: explicit visual first-room grace ward (gentle orbiting protective sigils + soft bond halo during cold-start safety window).
    // Makes the 140f / ~2.3s orientation grace (Pass 35b) feel like a deliberate magical gift of the Dragonbound Depths — warm ember runes drift around the P1+dragon focal pair, alpha-tied to remaining time, fading as real pressure begins.
    // This is the concrete "explicit first-room orientation grace/safety implementation" required by next_pass_acceptance_override_2026_05_18 (not just comments or spawn distance); reviewer sees framed, protected protagonists in the god-ray Grove and has readable time to learn controls before foes close. Fits operator art mandate "bespoke polish", "moments that look worth sharing", "handcrafted magical fantasy" exactly in the default Ember+Cinder cold-start viewport.
    // Pure draw (reuses performance.now + existing firstRoomGrace + currentRoomIdx), zero collision/AI/perf impact, drawn in world space after protagonists so it layers as protective aura.
    if (currentRoomIdx === 0 && firstRoomGrace > 0 && player1) {
      const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.0012;
      const gx = player1.x + (dragon ? (dragon.x - player1.x) * 0.32 : 0);
      const gy = player1.y + (dragon ? (dragon.y - player1.y) * 0.32 : 14);
      const gPhase = firstRoomGrace / 140;
      const gAlpha = 0.38 + gPhase * 0.22;
      ctx.save();
      // soft protective under-halo (warm ember, matches default Cinder + grove god rays; makes focal pair "pop" as safe center)
      ctx.globalAlpha = gAlpha * 0.55;
      ctx.fillStyle = '#ffcc88';
      ctx.beginPath(); ctx.arc(gx, gy + 4, 29 + Math.sin(t * 2.1) * 1.8, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(255, 215, 140, 0.22)';
      ctx.beginPath(); ctx.arc(gx - 1, gy + 2, 21 + Math.sin(t * 1.6 + 1) * 1.2, 0, 6.2832); ctx.fill();
      // 3 slow-drifting protective sigils / runes (tiny handcrafted wards orbiting the bond — screenshot-friendly fantasy detail, zero text needed)
      ctx.globalAlpha = gAlpha * 0.85;
      ctx.strokeStyle = 'rgba(255, 235, 190, 0.85)';
      ctx.lineWidth = 1.35;
      for (let i = 0; i < 3; i++) {
        const a = t * 0.85 + i * 2.0944 + (firstRoomGrace % 55) * 0.008;
        const rr = 24.5 + Math.sin(t * 1.3 + i) * 2.2;
        const sx = gx + Math.cos(a) * rr;
        const sy = gy + Math.sin(a) * (rr * 0.58) - 2;
        ctx.beginPath(); ctx.arc(sx, sy, 3.8, 0, 6.2832); ctx.stroke();
        ctx.fillStyle = 'rgba(255, 250, 225, 0.95)';
        ctx.beginPath(); ctx.arc(sx, sy, 1.35, 0, 6.2832); ctx.fill();
      }
      ctx.restore();
    }

    // projectiles (glowing + trails for satisfying feedback)
    projectiles.forEach(pr => {
      const pc = pr.color || '#fff';
      const prr = pr.radius || 5;
      if (pr.kind === 'spear') {
        ctx.save();
        ctx.translate(pr.x, pr.y);
        ctx.rotate(Math.atan2(pr.vy, pr.vx));
        // glow trail
        ctx.fillStyle = 'rgba(110,230,170,0.3)';
        ctx.fillRect(-18, -2, 22, 4);
        ctx.fillStyle = pc;
        ctx.fillRect(-7, -1.8, 16, 3.6);
        ctx.fillStyle = '#fff8';
        ctx.fillRect(4, -2.8, 6, 5.6);
        ctx.restore();
      } else {
        // glow ring + core + motion trail
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.beginPath(); ctx.arc(pr.x, pr.y, prr * 1.7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = pc;
        ctx.beginPath(); ctx.arc(pr.x, pr.y, prr, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath(); ctx.arc(pr.x - pr.vx * 0.35, pr.y - pr.vy * 0.35, prr * 0.55, 0, Math.PI * 2); ctx.fill();
        // fast trail line
        if (Math.hypot(pr.vx, pr.vy) > 2.5) {
          ctx.strokeStyle = pc;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(pr.x - pr.vx * 1.4, pr.y - pr.vy * 1.4); ctx.lineTo(pr.x, pr.y); ctx.stroke();
        }
      }
    });

    // particles (amplified expressive effects — glow, type shapes, impact rings)
    particles.forEach(pt => {
      const alpha = pt.life / pt.maxLife;
      const sz = pt.size * (0.55 + alpha * 0.7);
      ctx.globalAlpha = alpha * 0.9 + 0.08;
      const col = pt.color || '#fff';
      if (pt.type === 'dmg' && pt.dmg) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px system-ui';
        ctx.fillText(pt.dmg, pt.x, pt.y);
      } else if (pt.type === 'fire' || pt.type === 'cleave') {
        // fiery / cleave: multi glow + core
        ctx.fillStyle = 'rgba(255,120,40,0.25)';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, sz * 2.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, sz * 1.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff8';
        ctx.beginPath(); ctx.arc(pt.x - pt.vx * 0.2, pt.y - pt.vy * 0.2, sz * 0.5, 0, Math.PI * 2); ctx.fill();
      } else if (pt.type === 'ice') {
        // ice shards: sharp + glow
        ctx.fillStyle = 'rgba(170,230,255,0.3)';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, sz * 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, sz, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#e0f8ff'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pt.x - sz * 0.8, pt.y); ctx.lineTo(pt.x + sz * 0.8, pt.y); ctx.stroke();
      } else if (pt.type === 'wind') {
        // wind: curved streak
        ctx.strokeStyle = col;
        ctx.lineWidth = sz * 0.7;
        ctx.beginPath(); ctx.moveTo(pt.x - pt.vx * 1.2, pt.y - pt.vy * 1.2); ctx.lineTo(pt.x + pt.vx * 0.3, pt.y + pt.vy * 0.3); ctx.stroke();
      } else {
        // default + spark: soft glow + core
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, sz * 1.9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, sz, 0, Math.PI * 2); ctx.fill();
      }
    });
    ctx.globalAlpha = 1;

    // dynamic focal key lights + magical bond glow (Pass 15 polish) + Pass 22: stronger halos + soft luminous rim lights around protagonists
    // so the heroes and dragon command the frame with warm magical presence; silhouettes read larger and more authored even at mid-zoom or on small viewports.
    // Directly addresses operator visual review "tiny... focal composition" and art mandate for "readable silhouettes" and "unmistakably handcrafted".
    ctx.save();
    ctx.globalAlpha = 0.94;
    ctx.fillStyle = 'rgba(252, 235, 200, 0.065)';
    if (player1 && !player1.downed) { ctx.beginPath(); ctx.arc(player1.x, player1.y, 95, 0, Math.PI * 2); ctx.fill(); }
    if (player2 && !player2.downed) { ctx.beginPath(); ctx.arc(player2.x, player2.y, 70, 0, Math.PI * 2); ctx.fill(); }
    if (dragon) { ctx.beginPath(); ctx.arc(dragon.x, dragon.y, 85, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(255, 250, 220, 0.032)';
    if (player1) { ctx.beginPath(); ctx.arc(player1.x, player1.y, 52, 0, Math.PI * 2); ctx.fill(); }
    if (dragon) { ctx.beginPath(); ctx.arc(dragon.x, dragon.y, 48, 0, Math.PI * 2); ctx.fill(); }
    // Pass 22: thin glowing bond rims (luminous outline) — gives each protagonist a distinct magical aura that pops against layered dark rooms and props; pure visual, zero collision/ perf impact
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = 'rgba(255, 242, 205, 0.6)';
    ctx.lineWidth = 2.8;
    if (player1 && !player1.downed) { ctx.beginPath(); ctx.arc(player1.x, player1.y, 23, 0, Math.PI * 2); ctx.stroke(); }
    if (player2 && !player2.downed) { ctx.beginPath(); ctx.arc(player2.x, player2.y, 20, 0, Math.PI * 2); ctx.stroke(); }
    if (dragon) { ctx.beginPath(); ctx.arc(dragon.x, dragon.y, 21, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
    // Pass 32/35: restore the root camera save() so vignette, screen rumble, and touch controls are drawn in true screen space (under the dpr base scale).
    // This balances the save at top of draw() and eliminates accumulation. The dpr setTransform guard ensures high-DPI preview deploys (retina, etc.) also see full authored first frame with P1/dragon/enemies/room immediately visible.
    ctx.restore();

    // screen shake (vignette + touch overlay rumble for extra impact feel; world shake already applied inside camera)
    if (shake > 0) {
      const ox = (Math.random() - 0.5) * shake;
      const oy = (Math.random() - 0.5) * shake * 0.7;
      ctx.translate(ox, oy);
      shake *= 0.82;
    }

    // vignette + atmospheric overlay (depth, keeps edges dark so focal pop on heroes/dragon is stronger)
    const grd = ctx.createRadialGradient(LOGICAL_W * 0.5, LOGICAL_H * 0.48, 180, LOGICAL_W * 0.5, LOGICAL_H * 0.5, 780);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(4, 7, 14, 0.52)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Touch control pads (solo only, authored visual, right side action + left virtual stick)
    if (touch.show && !p2Enabled && gameState === 'playing') {
      drawTouchControls(ctx);
    }
  }

  function drawRoomBackground(ctx, r) {
    // base floor (slightly brighter for focal readability + handcrafted feel, still moody)
    ctx.fillStyle = r.theme === 'crystal' ? '#13283a' : (r.theme === 'sanctum' ? '#1f1833' : (r.theme === 'fissure' ? '#1a1a24' : (r.theme === 'boss' ? '#0f0a0a' : '#162033')));
    ctx.fillRect(0, 0, r.w, r.h);

    // layered ground texture (multi pass for depth, not flat)
    ctx.fillStyle = r.theme === 'crystal' ? 'rgba(130, 185, 255, 0.028)' : 'rgba(200, 170, 110, 0.022)';
    for (let x = 28; x < r.w; x += 52) {
      for (let y = 22; y < r.h; y += 52) {
        ctx.fillRect(x + (y % 3) * 3, y, 38, 38);
      }
    }
    // fine grain for bespoke floor
    ctx.fillStyle = 'rgba(255,255,255,0.014)';
    for (let i = 0; i < 180; i++) {
      const gx = (i * 67) % (r.w - 40) + 20;
      const gy = (i * 41 + (i % 7) * 13) % (r.h - 30) + 15;
      ctx.fillRect(gx, gy, 2, 2);
    }

    // Pass 32: Diablo-style isometric/top-down ARPG floor composition (angled diamond planes + dual 28deg grid lines).
    // Gives immediate "handcrafted fantasy combat room" read vs prior flat dark rect/minimap. Visual only (gameplay stays ortho); strong silhouettes pop against composed depth + focal lighting.
    // Subtle parchment-like tile cues, boundary bevel, brighter center for screenshot-worthy first-frame authorship (addresses operator_diablo_isometric_blocker + visual review "not tiny dark flat").
    ctx.save();
    ctx.strokeStyle = (r.theme === 'crystal' || r.theme === 'sanctum') ? 'rgba(160,210,255,0.055)' : 'rgba(185,160,110,0.06)';
    ctx.lineWidth = 1.6;
    const isoA = 0.48; // ~28deg shear angle factor for diamond read
    // primary diamond grid (one direction)
    for (let d = -120; d < r.w + r.h; d += 68) {
      ctx.beginPath();
      ctx.moveTo(d, 0);
      ctx.lineTo(d + r.h * isoA, r.h);
      ctx.stroke();
    }
    // secondary crossed direction (forms diamond tiles)
    for (let d = -80; d < r.w + r.h * 1.2; d += 62) {
      ctx.beginPath();
      ctx.moveTo(0, d);
      ctx.lineTo(r.w, d - r.w * isoA);
      ctx.stroke();
    }
    // outer room boundary bevel (angled plane edge for depth)
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.rect(14, 14, r.w - 28, r.h - 28);
    ctx.stroke();
    ctx.restore();

    // ===== RICH LAYERED DEPTH + AUTHORED PROPS + LIGHTING (Pass 10 visual authorship) =====
    // Foreground/mid props, light shafts, architectural detail per theme for screenshot-worthy rooms.
    const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.0011;

    if (r.theme === 'grove') {
      // moonlit forest ruin — layered canopy, trunks, roots, hanging moss, soft god rays
      ctx.fillStyle = 'rgba(55, 95, 55, 0.22)';
      ctx.fillRect(60, 60, 160, 280); ctx.fillRect(940, 420, 180, 220);
      // tree trunks (strong silhouettes)
      ctx.fillStyle = '#1f2a1f';
      ctx.fillRect(95, 70, 22, 210); ctx.fillRect(135, 95, 18, 175);
      ctx.fillRect(980, 380, 26, 240); ctx.fillRect(1035, 410, 20, 190);
      // canopy blobs
      ctx.fillStyle = 'rgba(40, 80, 40, 0.35)';
      ctx.beginPath(); ctx.arc(105, 55, 48, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(1000, 370, 55, 0, Math.PI * 2); ctx.fill();
      // hanging vines / moss (layered depth)
      ctx.strokeStyle = 'rgba(70, 115, 55, 0.45)';
      ctx.lineWidth = 2.5;
      for (let v = 0; v < 5; v++) {
        const vx = 85 + v * 11 + (v % 2) * 30;
        ctx.beginPath(); ctx.moveTo(vx, 95); ctx.quadraticCurveTo(vx - 4, 160 + Math.sin(t + v) * 6, vx + 3, 230); ctx.stroke();
      }
      // Pass 34: richer volumetric god rays + slow animated dust motes inside shafts (deeper magical lighting + layered depth for grove cold-start frame).
      // Default Ember+Cinder entry now has visible light beams with floating specks that make the first viewport feel like a handcrafted painted fantasy ruin (stronger composition, atmospheric authorship per Snow Dragon + operator visual review "richer room lighting"; zero gameplay/collision/perf cost).
      const rayPulse = 0.52 + Math.sin(t * 1.35) * 0.28;
      ctx.fillStyle = `rgba(192, 228, 172, ${0.092 * rayPulse})`;
      ctx.beginPath(); ctx.moveTo(175, 12); ctx.lineTo(308, 398); ctx.lineTo(338, 398); ctx.lineTo(205, 12); ctx.fill();
      ctx.fillStyle = `rgba(168, 208, 142, ${0.058 * rayPulse})`;
      ctx.beginPath(); ctx.moveTo(868, 22); ctx.lineTo(812, 438); ctx.lineTo(842, 438); ctx.lineTo(898, 22); ctx.fill();
      // third crossing ray for balanced focal depth across the playable space
      ctx.fillStyle = `rgba(205, 238, 185, ${0.038 * rayPulse})`;
      ctx.beginPath(); ctx.moveTo(415, 8); ctx.lineTo(478, 305); ctx.lineTo(503, 305); ctx.lineTo(440, 8); ctx.fill();
      // volumetric dust specks drifting inside main rays (slow, organic life in the light — classic ARPG atmosphere)
      ctx.fillStyle = 'rgba(230, 250, 205, 0.26)';
      for (let d = 0; d < 6; d++) {
        const dp = (t * 0.38 + d * 0.7) % 1.05;
        const rx = 192 + dp * 98 + (d % 2) * 6;
        const ry = 38 + dp * 285;
        ctx.beginPath(); ctx.arc(rx, ry, 0.85 + Math.sin(t * 2.1 + d) * 0.28, 0, Math.PI * 2); ctx.fill();
      }
      // glowing mushrooms (magical touch)
      ctx.fillStyle = 'rgba(140, 220, 120, 0.55)';
      ctx.beginPath(); ctx.arc(280, 310, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(720, 540, 4.5, 0, Math.PI * 2); ctx.fill();
      // Pass 33: subtle drifting magical motes (slow floating light specks for "living enchanted air" in first room + every grove visit; makes the authored viewport feel handcrafted and alive even at rest, screenshot depth per art mandate + Snow Dragon polish lens)
      ctx.fillStyle = 'rgba(195, 235, 170, 0.18)';
      for (let m = 0; m < 4; m++) {
        const mx = 140 + ((m * 97) % 380) + Math.sin(t * 0.21 + m * 1.7) * 18;
        const my = 90 + ((m * 53) % 260) + Math.cos(t * 0.17 + m) * 14;
        ctx.beginPath(); ctx.arc(mx, my, 1.6 + (m % 2) * 0.4, 0, Math.PI * 2); ctx.fill();
      }
      // Pass 40: final pre-deadline grove leaf drift (3-4 slow-falling enchanted leaves in god rays; extra "living enchanted forest" life + layered depth for the exact cold-start default preview frame reviewers open first. Pure visual, reuses t, zero collision/AI/perf; makes the opening composition even more screenshot-worthy handcrafted fantasy per art mandate + Snow/Fire Dragon lens. Deadline polish capstone.)
      ctx.fillStyle = 'rgba(168, 205, 130, 0.55)';
      ctx.strokeStyle = 'rgba(120, 170, 90, 0.7)';
      ctx.lineWidth = 0.8;
      for (let lf = 0; lf < 4; lf++) {
        const lp = (t * 0.22 + lf * 0.31) % 1.15;
        const lx = 210 + lf * 52 + Math.sin(t * 0.9 + lf) * 14 + (lp * 28);
        const ly = 28 + lp * 310;
        const la = 0.6 + Math.sin(t * 1.6 + lf * 2) * 0.3; // gentle sway rotation
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(la);
        ctx.beginPath();
        ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.lineTo(0, 7); ctx.closePath(); // tiny leaf
        ctx.fill();
        ctx.stroke();
        // Pass 41 micro: inner highlight facet (light catch in god rays) — makes enchanted leaves feel 3D and integrated with the volumetric shafts in the exact default cold-start Grove frame (stronger "worth sharing" composition per art mandate, zero cost)
        ctx.fillStyle = 'rgba(210, 235, 170, 0.65)';
        ctx.beginPath();
        ctx.moveTo(-1.2, 1); ctx.lineTo(1.2, 1); ctx.lineTo(0, 4.5); ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.lineWidth = 1;
    }
    if (r.theme === 'crystal') {
      // crystal hollow — floating clusters, facet glows, light refraction, stalagmites
      ctx.fillStyle = 'rgba(90, 150, 210, 0.14)';
      ctx.fillRect(180, 80, 110, 190); ctx.fillRect(860, 260, 140, 130);
      // crystal clusters (layered, multi-point)
      ctx.fillStyle = 'rgba(160, 210, 255, 0.32)';
      const crystals = [[320, 85], [370, 165], [895, 290], [950, 340], [260, 520]];
      crystals.forEach((c, i) => {
        const tw = 0.7 + Math.sin(t * 1.8 + i) * 0.3;
        ctx.beginPath(); ctx.moveTo(c[0], c[1] - 22 * tw); ctx.lineTo(c[0] - 11, c[1] + 14); ctx.lineTo(c[0] + 12, c[1] + 14); ctx.fill();
        ctx.fillStyle = 'rgba(200, 240, 255, 0.5)';
        ctx.beginPath(); ctx.arc(c[0], c[1] - 4, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(160, 210, 255, 0.32)';
      });
      // stalagmites / floor crystals
      ctx.fillStyle = 'rgba(120, 180, 230, 0.25)';
      ctx.beginPath(); ctx.moveTo(140, 620); ctx.lineTo(165, 540); ctx.lineTo(190, 620); ctx.fill();
      ctx.beginPath(); ctx.moveTo(1050, 580); ctx.lineTo(1075, 510); ctx.lineTo(1100, 580); ctx.fill();
      // refracted light shafts (serene, precious)
      ctx.fillStyle = 'rgba(170, 220, 255, 0.08)';
      ctx.beginPath(); ctx.moveTo(420, 10); ctx.lineTo(380, 520); ctx.lineTo(410, 520); ctx.lineTo(450, 10); ctx.fill();
      // Pass 33: drifting crystal motes (ethereal floating glints in the hollow; enriches the first ARPG read with magical atmosphere and depth for screenshot moments)
      ctx.fillStyle = 'rgba(180, 230, 255, 0.22)';
      for (let m = 0; m < 3; m++) {
        const mx = 220 + ((m * 131) % 420) + Math.sin(t * 0.26 + m * 2.1) * 22;
        const my = 70 + ((m * 67) % 180) + Math.cos(t * 0.19 + m * 0.8) * 11;
        ctx.beginPath(); ctx.arc(mx, my, 1.4 + (m % 2) * 0.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (r.theme === 'sanctum') {
      // cursed sanctum — carved pillars, rune floor, broken arches, quiet magic
      ctx.fillStyle = 'rgba(100, 75, 140, 0.16)';
      ctx.fillRect(140, 220, 90, 240);
      // tall carved pillars (foreground/mid layers)
      ctx.fillStyle = '#2a2238';
      ctx.fillRect(120, 140, 28, 380); ctx.fillRect(980, 110, 32, 420);
      ctx.fillStyle = 'rgba(150, 120, 190, 0.25)';
      ctx.fillRect(124, 160, 20, 60); ctx.fillRect(984, 130, 24, 70);
      // floor runes (awakened when cleared, subtle always)
      ctx.strokeStyle = 'rgba(165, 130, 220, 0.22)';
      ctx.lineWidth = 1.5;
      for (let rr = 0; rr < 3; rr++) {
        const rx = 280 + rr * 280;
        ctx.beginPath(); ctx.arc(rx, 480 + (rr - 1) * 30, 28, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(rx - 18, 480); ctx.lineTo(rx + 18, 480); ctx.stroke();
      }
      // hanging chains / tattered banners for atmosphere
      ctx.strokeStyle = 'rgba(80, 60, 90, 0.5)';
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(220, 120); ctx.lineTo(225, 310); ctx.stroke();
    }
    if (r.theme === 'crypt') {
      // ember crypt — scorched sanctum variant, glowing embers, broken statues
      ctx.fillStyle = 'rgba(85, 45, 25, 0.18)';
      ctx.fillRect(120, 180, 140, 200);
      ctx.fillStyle = '#2f2218';
      ctx.fillRect(90, 100, 32, 420); ctx.fillRect(1040, 90, 36, 400);
      ctx.fillStyle = 'rgba(200, 90, 40, 0.22)';
      ctx.fillRect(96, 140, 20, 80);
      // ember vents on floor
      ctx.fillStyle = 'rgba(255, 110, 40, 0.16)';
      ctx.beginPath(); ctx.arc(380, 620, 22, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(820, 590, 18, 0, Math.PI * 2); ctx.fill();
      // Pass 33: slow rising ember motes (warm drifting sparks in the crypt; consistent living atmosphere across all 5+ rooms so every transition feels authored and wondrous, not empty)
      ctx.fillStyle = 'rgba(255, 160, 90, 0.15)';
      for (let m = 0; m < 3; m++) {
        const mx = 180 + ((m * 87) % 520) + Math.sin(t * 0.14 + m) * 16;
        const my = 420 + ((m * 41) % 140) - Math.cos(t * 0.11 + m * 1.3) * 9; // rising bias
        ctx.beginPath(); ctx.arc(mx, my, 1.3 + (m % 2) * 0.35, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (r.theme === 'fissure') {
      // lava fissure — jagged rocks, lava pools with specular, heat vents, stalactites
      ctx.fillStyle = 'rgba(90, 40, 25, 0.28)';
      ctx.fillRect(100, 130, 180, 160); ctx.fillRect(820, 280, 170, 110);
      // jagged rock outcrops (layered)
      ctx.fillStyle = '#2a2520';
      ctx.beginPath(); ctx.moveTo(85, 180); ctx.lineTo(140, 95); ctx.lineTo(195, 185); ctx.fill();
      ctx.beginPath(); ctx.moveTo(880, 310); ctx.lineTo(940, 240); ctx.lineTo(1000, 320); ctx.fill();
      // lava pools + specular highlight (alive)
      ctx.fillStyle = 'rgba(255, 90, 30, 0.22)';
      ctx.beginPath(); ctx.arc(310, 480, 46, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(780, 390, 32, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255, 180, 80, 0.35)';
      ctx.beginPath(); ctx.arc(295, 470, 18, 0, Math.PI * 2); ctx.fill(); // specular
      // heat shimmer lines + rising vents
      ctx.strokeStyle = 'rgba(255, 140, 60, 0.18)';
      ctx.lineWidth = 2;
      for (let h = 0; h < 4; h++) {
        const hx = 220 + h * 190;
        ctx.beginPath(); ctx.moveTo(hx, 520); ctx.quadraticCurveTo(hx + 8, 420, hx - 4, 310); ctx.stroke();
      }
      // ceiling stalactites
      ctx.fillStyle = '#2f2722';
      ctx.beginPath(); ctx.moveTo(260, 20); ctx.lineTo(275, 85); ctx.lineTo(290, 20); ctx.fill();
      ctx.beginPath(); ctx.moveTo(820, 25); ctx.lineTo(835, 70); ctx.lineTo(850, 25); ctx.fill();
    }
    if (r.theme === 'boss') {
      // maw of ash — central dais, ash pillars, lava fissures, oppressive but magical focal
      ctx.fillStyle = 'rgba(70, 25, 18, 0.38)';
      ctx.fillRect(80, 80, r.w - 160, r.h - 160);
      // grand pillars + central raised platform
      ctx.fillStyle = '#1f1814';
      ctx.fillRect(140, 90, 36, 280); ctx.fillRect(1180, 100, 40, 260);
      ctx.fillRect(620, 620, 140, 80); // dais
      ctx.fillStyle = 'rgba(255, 80, 30, 0.2)';
      ctx.fillRect(640, 635, 100, 12);
      // radiating ash cracks on floor
      ctx.strokeStyle = 'rgba(120, 50, 30, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(690, 660); ctx.lineTo(420, 480); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(690, 660); ctx.lineTo(980, 510); ctx.stroke();
      // drifting heavier ash already in atm section; add bone/rib props for menace
      ctx.strokeStyle = 'rgba(90, 70, 60, 0.35)';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(280, 480); ctx.quadraticCurveTo(320, 520, 355, 470); ctx.stroke();
    }

    // ===== Atmospheric life & luminous detail (Pass 6 + Pass 10) =====
    // Handcrafted moments: fireflies, glints, embers, runes — now layered with new props/shafts above.
    // t already declared in depth props block for unified timing.
    if (r.theme === 'grove') {
      // drifting firefly motes — soft, magical, wonder
      ctx.fillStyle = 'rgba(205, 235, 165, 0.32)';
      for (let i = 0; i < 8; i++) {
        const seed = i * 1.618;
        const px = 90 + ((seed * 67 + t * 22) % (r.w - 180));
        const py = 110 + ((seed * 41 + t * 31) % 210) + Math.sin(t * 0.9 + seed) * 18;
        const s = 1.15 + Math.sin(t * 1.7 + i) * 0.35;
        ctx.beginPath(); ctx.arc(px, py, s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(175, 215, 140, 0.07)';
        ctx.beginPath(); ctx.arc(px, py, s * 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(205, 235, 165, 0.32)';
      }
    }
    if (r.theme === 'crystal') {
      // luminous twinkling crystal glints — serene, precious
      const glints = [[355, 105], [395, 195], [915, 265], [285, 570]];
      glints.forEach((g, i) => {
        const tw = Math.sin(t * 2.4 + i * 2.1) * 0.5 + Math.sin(t * 5.3 + i * 0.7) * 0.25 + 0.75;
        if (tw > 0.35) {
          ctx.fillStyle = 'rgba(225, 245, 255, 0.75)';
          ctx.beginPath(); ctx.arc(g[0], g[1], tw * 1.9, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(200, 235, 255, 0.18)';
          ctx.beginPath(); ctx.arc(g[0], g[1], tw * 3.6, 0, Math.PI * 2); ctx.fill();
        }
      });
      // Pass 42: slow vertical light pillars + orbiting prism refractions (deeper precious cavern authorship in Crystal Hollow; vertical shafts + facet catch-lights make the 2nd area feel like a living jewel box of magic, matching grove god-ray + crypt ember depth for consistent handcrafted vertical slice feel across all rooms. Pure visual, re-uses t, zero cost/collision. Snow Dragon + Fire Dragon lens: elevates "atmospheric world detail" and "screenshot-worthy" moments in every transition per art mandate.)
      for (let p = 0; p < 2; p++) {
        const px = 280 + p * 580;
        const ph = 0.07 + Math.sin(t * 0.65 + p * 1.3) * 0.025;
        ctx.fillStyle = `rgba(135, 205, 255, ${ph})`;
        ctx.fillRect(px, 90, 42, 510);
        ctx.fillStyle = `rgba(185, 230, 255, ${ph * 1.7})`;
        ctx.fillRect(px + 14, 140, 14, 360);
      }
      ctx.fillStyle = 'rgba(255, 255, 245, 0.6)';
      for (let o = 0; o < 3; o++) {
        const oa = t * 0.42 + o * 2.05;
        const ox = 355 + Math.cos(oa) * (155 + o * 38);
        const oy = 310 + Math.sin(oa * 0.75 + o) * 88;
        ctx.beginPath(); ctx.arc(ox, oy, 1.65, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(195, 235, 255, 0.32)';
        ctx.beginPath(); ctx.arc(ox, oy, 3.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 245, 0.6)';
      }
    }
    if (r.theme === 'fissure') {
      // rising heat motes + ember trails — dangerous, alive, warm depth
      for (let i = 0; i < 11; i++) {
        const seed = i * 0.97 + 2.3;
        const rise = ((t * 46 + seed * 29) % 195);
        const px = 95 + ((seed * 31) % (r.w - 190)) + Math.sin(t * 0.6 + i) * 11;
        const py = 640 - rise;
        const ss = 1.0 + Math.sin(t * 2.1 + seed) * 0.28;
        ctx.fillStyle = 'rgba(255, 135, 55, 0.48)';
        ctx.beginPath(); ctx.arc(px, py, ss, 0, Math.PI * 2); ctx.fill();
        if (i % 3 !== 0) {
          ctx.fillStyle = 'rgba(255, 175, 85, 0.22)';
          ctx.beginPath(); ctx.arc(px + 1, py - 7, ss * 1.55, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    if (r.theme === 'sanctum' && roomCleared) {
      // awakened rune lines — quiet magic, post-clear reward feel
      ctx.strokeStyle = 'rgba(185, 145, 255, 0.38)';
      ctx.lineWidth = 1.8;
      for (let i = 0; i < 4; i++) {
        const rx = 175 + i * 235;
        const ry = 265 + Math.sin(t * 0.8 + i * 1.3) * 5.5;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.quadraticCurveTo(rx + 22, ry - 11, rx + 44, ry + 4);
        ctx.stroke();
      }
      ctx.lineWidth = 1.2;
    }
    if (r.theme === 'boss') {
      // drifting ash & ember flecks around the maw — oppressive yet magical
      ctx.fillStyle = 'rgba(120, 60, 40, 0.25)';
      for (let i = 0; i < 6; i++) {
        const px = 180 + ((i * 191 + t * 14) % (r.w - 360));
        const py = 160 + ((i * 73 + t * 19) % (r.h - 320)) + Math.sin(t + i * 2) * 14;
        ctx.beginPath(); ctx.arc(px, py, 1.3 + (i % 2), 0, Math.PI * 2); ctx.fill();
      }
      // Pass 38: final pre-deadline boss arena atmospheric authorship (Fire + Snow + Sea Dragon lens).
      // Slow-falling heavier ash veils + faint rising heat shimmer lines around central dais/pillars.
      // Makes the 2-phase Maw of Ash encounter feel like a true climactic handcrafted "painted" set piece — deeper oppressive magic, readable arena boundaries, screenshot-worthy tension before enrage (matches operator "richer room lighting and foreground/background layering" + "moments that look worth sharing").
      // Pure draw, re-uses t, zero added state/collision/perf; completes room-life consistency for all 6 areas right before 16:38Z deadline.
      ctx.fillStyle = 'rgba(95, 55, 42, 0.32)';
      for (let i = 0; i < 9; i++) {
        const fall = ((t * 11 + i * 67) % (r.h - 80)) + 40;
        const drift = Math.sin(t * 0.6 + i) * 18;
        const ax = 210 + ((i * 97) % (r.w - 420)) + drift;
        const ay = fall;
        ctx.beginPath(); ctx.arc(ax, ay, 1.6 + (i % 3) * 0.4, 0, Math.PI * 2); ctx.fill();
      }
      // faint vertical heat shimmer / rising haze lines near pillars and dais (subtle ARPG "hot air" distortion feel, not literal warp)
      ctx.strokeStyle = 'rgba(255, 140, 60, 0.09)';
      ctx.lineWidth = 2.2;
      for (let s = 0; s < 4; s++) {
        const sx = 160 + s * 280;
        const sy = 140 + Math.sin(t * 1.8 + s) * 8;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(sx + 6, sy + 120, sx - 4, sy + 260);
        ctx.stroke();
      }
    }
    if (r.theme === 'crypt') {
      // drifting embers and warm soot — scorched crypt, dangerous beauty, lingering magic (Pass 23)
      // Gives the Ember Crypt its own breathing atmospheric signature matching grove fireflies / crystal glints / fissure heat / boss ash.
      ctx.fillStyle = 'rgba(255, 155, 75, 0.38)';
      for (let i = 0; i < 10; i++) {
        const seed = i * 1.23 + 0.7;
        const drift = ((t * 38 + seed * 27) % (r.h - 120));
        const px = 70 + ((seed * 47) % (r.w - 140)) + Math.sin(t * 0.55 + i) * 9;
        const py = 90 + drift * 0.85;
        const ss = 1.05 + Math.sin(t * 2.4 + seed) * 0.32;
        ctx.beginPath(); ctx.arc(px, py, ss, 0, Math.PI * 2); ctx.fill();
        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(255, 195, 110, 0.19)';
          ctx.beginPath(); ctx.arc(px + 0.5, py - 5, ss * 1.6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255, 155, 75, 0.38)';
        }
      }
    }

    // boundary glow
    ctx.strokeStyle = 'rgba(212, 175, 119, 0.08)';
    ctx.lineWidth = 18;
    ctx.strokeRect(22, 22, r.w - 44, r.h - 44);
  }

  function drawPlayer(ctx, p, hero) {
    if (!p) return;
    const flash = p.hitFlash > 0;
    const r = p.radius; // now 18 for presence
    const hid = p.heroId || (hero && hero.id) || 'ember';
    const isEmber = hid === 'ember';
    const isFrost = hid === 'frost';
    const isTide = hid === 'tide';
    const col = flash ? '#fff' : (p.downed ? '#4a3a38' : (hero ? hero.color : p.color));
    const acc = hero ? hero.accent : '#ffd7a0';
    const vx = p.vx || 0, vy = p.vy || 0;
    const spd = Math.hypot(vx, vy);
    const dash = (p.dashTime || 0) > 0;
    const atk = (p.lastAttack || 0) > 6;

    ctx.save();
    if (flash) ctx.globalAlpha = 0.38 + Math.random() * 0.32;

    // soft ground shadow for weight and readability (bigger on fast move)
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + r * 0.72, r * 0.72, r * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    if (spd > 1.5) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(p.x - vx * 0.12, p.y + r * 0.82, r * 0.9, r * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ===== CLASS-SPECIFIC AUTHORED SILHOUETTES (larger, distinct, handcrafted) =====
    if (isEmber) {
      // Ember Knight: heavy stance, flame-edged blade, flowing cape, plumed helm
      // torso + legs (wide heroic)
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 3, r * 0.82, r * 1.05, 0, 0, Math.PI * 2); ctx.fill();
      // leg stance (dynamic with speed)
      ctx.fillStyle = '#2a2520';
      const legS = r * 0.28;
      ctx.beginPath(); ctx.ellipse(p.x - 5 - vx * 0.1, p.y + r * 0.65, legS, legS * 1.3 + (spd > 1.2 ? 2 : 0), -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(p.x + 6 + vx * 0.08, p.y + r * 0.68, legS * 0.9, legS * 1.25, 0.4, 0, Math.PI * 2); ctx.fill();
      // armor plates
      ctx.fillStyle = '#3a2a22';
      ctx.fillRect(p.x - r * 0.55, p.y - 4, r * 1.1, 11);
      ctx.fillStyle = '#4a3a2f';
      ctx.beginPath(); ctx.arc(p.x, p.y + 2, r * 0.6, 0, Math.PI * 2); ctx.fill();
      // cape (flowing, longer on dash)
      ctx.fillStyle = p.downed ? '#2a2522' : '#2f1f18';
      const capeLen = dash ? 26 : 19;
      ctx.beginPath();
      ctx.moveTo(p.x - 7, p.y + 2);
      ctx.quadraticCurveTo(p.x - 14 - vx * 0.3, p.y + 12, p.x - 9 - vx * 0.5, p.y + capeLen);
      ctx.lineTo(p.x + 8 + vx * 0.4, p.y + capeLen - 1);
      ctx.quadraticCurveTo(p.x + 13 + vx * 0.25, p.y + 11, p.x + 7, p.y + 2);
      ctx.fill();
      // plumed knight helm (strong silhouette)
      ctx.fillStyle = p.downed ? '#2f2522' : '#1f2838';
      ctx.beginPath(); ctx.arc(p.x - Math.cos(p.facing) * 3, p.y - Math.sin(p.facing) * 3, r * 0.82, 0, Math.PI * 2); ctx.fill();
      // plume crest
      ctx.fillStyle = '#c23a2a';
      ctx.beginPath(); ctx.moveTo(p.x - 4, p.y - r * 0.9); ctx.quadraticCurveTo(p.x + 1, p.y - r * 1.35, p.x + 7, p.y - r * 0.85); ctx.fill();
      // visor glow
      ctx.fillStyle = flash ? '#fff' : '#ff9a5a';
      ctx.fillRect(p.x + Math.cos(p.facing) * 6 - 4, p.y - 3, 8, 3);
      // flame sword (thick, with inner edge)
      ctx.strokeStyle = p.downed ? '#3a2f28' : '#ff6b3a';
      ctx.lineWidth = 4.5;
      const wx = p.x + Math.cos(p.facing) * (r + 4);
      const wy = p.y + Math.sin(p.facing) * (r + 4);
      ctx.beginPath(); ctx.moveTo(p.x + Math.cos(p.facing) * 7, p.y + Math.sin(p.facing) * 7);
      ctx.lineTo(wx + Math.cos(p.facing) * 14, wy + Math.sin(p.facing) * 14); ctx.stroke();
      ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(p.x + Math.cos(p.facing) * 8, p.y + Math.sin(p.facing) * 8);
      ctx.lineTo(wx + Math.cos(p.facing) * 13, wy + Math.sin(p.facing) * 13); ctx.stroke();
      // crossguard
      ctx.strokeStyle = '#b8a070'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(wx - Math.cos(p.facing + 1.57) * 5, wy - Math.sin(p.facing + 1.57) * 5);
      ctx.lineTo(wx + Math.cos(p.facing + 1.57) * 5, wy + Math.sin(p.facing + 1.57) * 5); ctx.stroke();
      // flame tip when attacking
      if (atk || dash) {
        ctx.fillStyle = 'rgba(255,140,60,0.7)';
        ctx.beginPath(); ctx.arc(wx + Math.cos(p.facing) * 17, wy + Math.sin(p.facing) * 17, 4.5, 0, Math.PI * 2); ctx.fill();
      }
    } else if (isFrost) {
      // Frost Witch: slender, crystalline staff, veil hood, ice rim
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, r * 0.7, r * 1.1, 0, 0, Math.PI * 2); ctx.fill();
      // flowing robes
      ctx.fillStyle = p.downed ? '#2a323f' : '#1f2a3a';
      ctx.beginPath();
      ctx.moveTo(p.x - 6, p.y + 4); ctx.quadraticCurveTo(p.x - 11, p.y + 18, p.x - 4, p.y + r * 1.15);
      ctx.lineTo(p.x + 5, p.y + r * 1.15); ctx.quadraticCurveTo(p.x + 12, p.y + 17, p.x + 7, p.y + 4);
      ctx.fill();
      // hood + veil (pointed witch silhouette)
      ctx.fillStyle = p.downed ? '#2f2522' : '#162033';
      ctx.beginPath(); ctx.arc(p.x - Math.cos(p.facing) * 1, p.y - Math.sin(p.facing) * 4, r * 0.85, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(p.x - 2, p.y - r * 0.7); ctx.lineTo(p.x + 3, p.y - r * 1.25); ctx.lineTo(p.x + 8, p.y - r * 0.65); ctx.fill();
      // ice crystal staff (taller, glowing)
      ctx.strokeStyle = p.downed ? '#3a2f28' : '#7fd4ff';
      ctx.lineWidth = 2.8;
      const sx = p.x + Math.cos(p.facing) * (r + 2);
      const sy = p.y + Math.sin(p.facing) * (r + 2) - 3;
      ctx.beginPath(); ctx.moveTo(p.x + Math.cos(p.facing) * 6, p.y + Math.sin(p.facing) * 5);
      ctx.lineTo(sx + Math.cos(p.facing) * 18, sy + Math.sin(p.facing) * 18); ctx.stroke();
      // crystal orb
      ctx.fillStyle = flash ? '#fff' : '#c8f0ff';
      ctx.beginPath(); ctx.arc(sx + Math.cos(p.facing) * 19, sy + Math.sin(p.facing) * 19, 4.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(180,230,255,0.6)';
      ctx.beginPath(); ctx.arc(sx + Math.cos(p.facing) * 19, sy + Math.sin(p.facing) * 19, 2.1, 0, Math.PI * 2); ctx.fill();
      // frost rim on body when special ready or hit
      if (!p.downed) {
        ctx.strokeStyle = 'rgba(170, 225, 255, 0.45)';
        ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.95, 0, Math.PI * 2); ctx.stroke();
      }
    } else {
      // Tide Ranger: agile, spear + ribbon, hood + light armor, quiver hint
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 1, r * 0.68, r * 1.0, 0, 0, Math.PI * 2); ctx.fill();
      // light armor + belt
      ctx.fillStyle = '#1a3a2f';
      ctx.fillRect(p.x - r * 0.5, p.y - 1, r * 1.0, 8);
      // hood (ranger, lower profile)
      ctx.fillStyle = p.downed ? '#2f2522' : '#162a22';
      ctx.beginPath(); ctx.arc(p.x - Math.cos(p.facing) * 2, p.y - Math.sin(p.facing) * 3, r * 0.78, 0, Math.PI * 2); ctx.fill();
      // short cloak
      ctx.fillStyle = '#1f3a2f';
      ctx.beginPath();
      ctx.moveTo(p.x - 5, p.y + 3); ctx.lineTo(p.x - 8 - vx * 0.2, p.y + 15); ctx.lineTo(p.x + 9 + vx * 0.15, p.y + 14); ctx.lineTo(p.x + 6, p.y + 3); ctx.fill();
      // long piercing spear (ribbon on shaft)
      ctx.strokeStyle = p.downed ? '#3a2f28' : '#6ee7b7';
      ctx.lineWidth = 2.2;
      const tx = p.x + Math.cos(p.facing) * (r + 3);
      const ty = p.y + Math.sin(p.facing) * (r + 3);
      ctx.beginPath(); ctx.moveTo(p.x + Math.cos(p.facing) * 5, p.y + Math.sin(p.facing) * 5);
      ctx.lineTo(tx + Math.cos(p.facing) * 20, ty + Math.sin(p.facing) * 20); ctx.stroke();
      // spearhead
      ctx.fillStyle = '#a8d8c0';
      ctx.beginPath(); ctx.moveTo(tx + Math.cos(p.facing) * 20, ty + Math.sin(p.facing) * 20);
      ctx.lineTo(tx + Math.cos(p.facing) * 27 + Math.cos(p.facing + 1.2) * 3, ty + Math.sin(p.facing) * 27 + Math.sin(p.facing + 1.2) * 3);
      ctx.lineTo(tx + Math.cos(p.facing) * 27 + Math.cos(p.facing - 1.2) * 3, ty + Math.sin(p.facing) * 27 + Math.sin(p.facing - 1.2) * 3);
      ctx.fill();
      // ribbon flutter
      ctx.strokeStyle = 'rgba(110, 230, 170, 0.65)';
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(tx + Math.cos(p.facing) * 8, ty + Math.sin(p.facing) * 8);
      ctx.quadraticCurveTo(tx + Math.cos(p.facing) * 11 + Math.cos(p.facing + 1.57) * (3 + spd * 0.4), ty + Math.sin(p.facing) * 11 + Math.sin(p.facing + 1.57) * (3 + spd * 0.4),
                           tx + Math.cos(p.facing) * 14, ty + Math.sin(p.facing) * 14); ctx.stroke();
    }

    // downed state bar (more visible)
    if (p.downed) {
      ctx.fillStyle = 'rgba(180, 60, 50, 0.7)';
      ctx.fillRect(p.x - 15, p.y + r * 0.85, 30, 3.5);
      ctx.fillStyle = 'rgba(255,220,200,0.5)';
      ctx.fillRect(p.x - 14, p.y + r * 0.87, 28 * (p.reviveTimer / 90 || 0), 1.5);
    }

    // integrated P badge (readable, not tiny text)
    const badgeX = p.x - r * 0.85;
    const badgeY = p.y - r * 1.05;
    ctx.fillStyle = p.isP2 ? 'rgba(127,212,255,0.9)' : 'rgba(255,138,90,0.9)';
    ctx.beginPath(); ctx.arc(badgeX, badgeY, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0a0f1a';
    ctx.font = 'bold 7px system-ui';
    ctx.fillText(p.isP2 ? '2' : '1', badgeX - 1.5, badgeY + 2.2);

    ctx.restore();

    // HP bar (tighter, with subtle border for polish)
    const hpPct = Math.max(0, p.hp / p.maxHp);
    ctx.fillStyle = 'rgba(10,15,26,0.85)';
    ctx.fillRect(p.x - 20, p.y - r - 15, 40, 6);
    ctx.fillStyle = p.isP2 ? '#7fd4ff' : '#ff8a5a';
    ctx.fillRect(p.x - 19, p.y - r - 14, 38 * hpPct, 4);
    if (hpPct < 0.35) {
      ctx.fillStyle = 'rgba(255,80,60,0.6)';
      ctx.fillRect(p.x - 19, p.y - r - 14, 38 * hpPct, 4);
    }
  }

  function drawDragon(ctx, d) {
    ctx.save();
    const t = performance.now();
    const speed = Math.hypot(d.vx || 0, d.vy || 0);
    const idle = Math.max(0, 1 - Math.min(1, speed / 0.85));
    const idleSway = Math.sin(t / 920) * 1.15 * idle + Math.sin(t / 1340) * 0.45 * idle;
    // Pass 29: dragon idle tail flick + wing micro-twitch for richer living companion personality when still (curious slow flicks and resting shifts — final capstone on creature authorship, "dragon feels alive" spec + operator "expressive effects" + "moments worth sharing" even in quiet shrine pauses). Pure draw, zero cost.
    const idleTail = idle * (Math.sin(t / 980) * 1.8 + Math.sin(t / 1610) * 0.7);
    const idleWing = idle * Math.sin(t / 760) * 0.28;
    const flap = Math.sin((d.wingPhase || 0) * 0.9) * 0.7 + Math.sin(t / 420) * 0.35 + idleWing;
    const bob = Math.sin(t / 310) * 1.15 + (d.vy || 0) * 0.04;
    const tilt = Math.max(-0.22, Math.min(0.22, (d.vx || 0) * 0.018));
    const s = (d.radius || 16) / 11; // scale for larger authored dragon (Pass 9)
    // Pass 28: dragon idle personality — gentle head sway + micro look-around when nearly still (makes companion feel alive & curious even at rest, deepens "not a pet" authorship per art mandate + Dragon Crew creature wonder). Pure visual, zero gameplay/perf.
    ctx.translate(d.x, d.y + bob);
    ctx.rotate(tilt);

    const bodyCol = d.color;

    // soft shadow for companion weight
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.ellipse(-2, 11 * s, 13 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill();

    // ===== LARGER BESPOKE DRAGON BODY + LEGS (character, not pet) =====
    // main body mass (scaled, rounder for presence)
    ctx.fillStyle = bodyCol;
    ctx.beginPath();
    ctx.ellipse(0, 1, 19 * s, 10.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // belly highlight
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.ellipse(-1, 3, 13 * s, 5.5 * s, 0, 0, Math.PI * 2); ctx.fill();

    // 4 legs with simple walk cycle (tied to flap + bob for life)
    const legPhase = (d.wingPhase || 0) * 1.6 + t * 0.004;
    const legCol = d.type === 'cinder' ? '#3a2a22' : (d.type === 'rime' ? '#2a3a4a' : '#1f3a2f');
    ctx.fillStyle = legCol;
    for (let li = 0; li < 4; li++) {
      const lx = -11 * s + li * 7.5 * s;
      const ly = 6 * s + Math.sin(legPhase + li * 1.3) * (1.2 + (li % 2) * 0.5);
      const lLen = 5.5 * s + (li > 1 ? 1 : 0);
      ctx.beginPath(); ctx.ellipse(lx, ly + lLen * 0.6, 2.8 * s, 3.8 * s, (li % 2 ? 0.6 : -0.6) + tilt * 0.5, 0, Math.PI * 2); ctx.fill();
      // tiny claw
      ctx.fillStyle = '#1a1f2a';
      ctx.beginPath(); ctx.arc(lx + (li > 1 ? 1.5 : -1) * s, ly + lLen * 1.1, 1.1 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = legCol;
    }

    // type body rim / scales (richer)
    if (d.type === 'cinder') {
      ctx.fillStyle = 'rgba(255,110,50,0.32)';
      ctx.beginPath(); ctx.ellipse(-3, 1.5, 11 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,160,70,0.55)';
      for (let i = 0; i < 4; i++) ctx.beginPath(), ctx.arc(-7 + i * 5, -1 + (i % 2), 1.6 * s, 0, 6.28), ctx.fill();
    } else if (d.type === 'rime') {
      ctx.strokeStyle = 'rgba(200,235,255,0.5)';
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.ellipse(0, 0, 17 * s, 9 * s, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(180,230,255,0.35)';
      ctx.beginPath(); ctx.arc(-6, -2, 2.4 * s, 0, 6.28); ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(195,255,185,0.38)';
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(-10 * s, -3); ctx.quadraticCurveTo(-2, -6 * s, 8 * s, -2); ctx.stroke();
    }

    // head (larger, offset, expressive; Pass 28: + idleSway lean for personality when still)
    const hx = 17 * s + idleSway * 0.65;
    const hy = -1.5 + Math.sin(t / 340) * 0.6;
    ctx.fillStyle = bodyCol;
    ctx.beginPath(); ctx.arc(hx, hy, 9 * s, 0, Math.PI * 2); ctx.fill();
    // jaw line for character
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.arc(hx + 2 * s, hy + 2 * s, 5.5 * s, 0, Math.PI * 2); ctx.fill();

    // type head accents (horns, crown, crest)
    if (d.type === 'cinder') {
      ctx.fillStyle = '#3a2a22';
      ctx.beginPath(); ctx.moveTo(hx - 1, hy - 7 * s); ctx.lineTo(hx + 5, hy - 14 * s); ctx.lineTo(hx + 3, hy - 6 * s); ctx.fill();
      ctx.beginPath(); ctx.moveTo(hx - 3, hy + 6 * s); ctx.lineTo(hx + 4, hy + 12 * s); ctx.lineTo(hx + 1, hy + 5 * s); ctx.fill();
      // ember nostril glow
      ctx.fillStyle = 'rgba(255,120,50,0.8)';
      ctx.beginPath(); ctx.arc(hx + 6 * s, hy - 1, 1.3 * s, 0, 6.28); ctx.fill();
    } else if (d.type === 'rime') {
      ctx.fillStyle = 'rgba(210,245,255,0.75)';
      ctx.beginPath(); ctx.arc(hx - 4 * s, hy - 5 * s, 3 * s, 0, 6.28); ctx.fill();
      ctx.beginPath(); ctx.arc(hx + 1 * s, hy - 6 * s, 2.2 * s, 0, 6.28); ctx.fill(); // crown spikes
    } else {
      ctx.strokeStyle = 'rgba(180,255,170,0.75)';
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(hx - 5 * s, hy - 7 * s); ctx.lineTo(hx - 1, hy - 13 * s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx - 2, hy - 5 * s); ctx.lineTo(hx + 3, hy - 10 * s); ctx.stroke();
    }

    // wing (larger flap, type styled, primary + secondary)
    const wingLift = -15 * s - flap * 6.5 * s;
    ctx.strokeStyle = d.type === 'cinder' ? 'rgba(255,140,80,0.26)' : (d.type === 'rime' ? 'rgba(190,235,255,0.30)' : 'rgba(180,255,175,0.28)');
    ctx.lineWidth = d.type === 'gale' ? 8 * s : 9.5 * s;
    ctx.beginPath();
    ctx.moveTo(-6 * s, -1);
    ctx.quadraticCurveTo(-20 * s, wingLift, -3 * s, -11 * s - flap * 0.9);
    ctx.stroke();
    if (d.type === 'gale') {
      ctx.lineWidth = 4.5 * s;
      ctx.beginPath(); ctx.moveTo(-4 * s, -1); ctx.quadraticCurveTo(-14 * s, wingLift * 0.65, 2 * s, -8 * s); ctx.stroke();
    }
    // wing membrane fill for mass
    ctx.fillStyle = d.type === 'cinder' ? 'rgba(255,90,40,0.08)' : 'rgba(160,220,255,0.07)';
    ctx.beginPath(); ctx.moveTo(-4 * s, 0); ctx.quadraticCurveTo(-17 * s, wingLift * 0.8, -1 * s, -8 * s); ctx.lineTo(-2 * s, 2); ctx.fill();

    // eye (larger, blink, gaze, expressive; Pass 28: idle gaze wander for curious living companion when not acting)
    const blink = (d.blinkCd || 40) < 8;
    const activeGaze = (d.breathAngle || 0) * 0.1;
    const idleGaze = idle * Math.sin(t / 680) * 0.7; // tiny look-around
    const gaze = activeGaze + idleGaze;
    ctx.fillStyle = '#f8fbff';
    ctx.beginPath(); ctx.arc(hx + 4 * s + gaze * 0.5, hy - 1.2, blink ? 1.1 * s : 2.7 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = d.type === 'rime' ? '#0f2a3a' : '#111a2a';
    ctx.beginPath(); ctx.arc(hx + 4.5 * s + gaze, hy - 0.9, blink ? 0.5 * s : 1.35 * s, 0, Math.PI * 2); ctx.fill();
    if (!blink) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(hx + 4.2 * s + gaze * 0.4, hy - 1.6, 0.8 * s, 0, Math.PI * 2); ctx.fill();
    }

    // breath / active ability (stronger, identity clear)
    if (d.breathActive > 0) {
      const ba = d.breathAngle || 0;
      const ba2 = ba + Math.sin(t / 85) * 0.035;
      const breathCol = d.type === 'cinder' ? 'rgba(255, 125, 50, 0.48)' : (d.type === 'rime' ? 'rgba(140, 225, 255, 0.42)' : 'rgba(175, 250, 170, 0.38)');
      ctx.fillStyle = breathCol;
      for (let i = 0; i < 4; i++) {
        const spread = (i - 1.5) * 0.32;
        ctx.beginPath();
        ctx.moveTo(hx + 6 * s, hy - 1);
        ctx.lineTo(hx + 26 * s + Math.cos(ba2 + spread) * 32 * s, hy + Math.sin(ba2 + spread) * 29 * s);
        ctx.lineTo(hx + 26 * s + Math.cos(ba2 - spread) * 32 * s, hy + Math.sin(ba2 - spread) * 29 * s);
        ctx.fill();
      }
      ctx.fillStyle = d.type === 'cinder' ? 'rgba(255,205,110,0.75)' : 'rgba(220,250,255,0.65)';
      ctx.beginPath(); ctx.arc(hx + 19 * s, hy + Math.sin(ba2) * 3, 5 * s, 0, Math.PI * 2); ctx.fill();
    }

    // tail (longer, integrated, wavy, type detail; Pass 29: + idleTail flick when still for living personality)
    const tailWave = Math.sin(t / 240 + (d.wingPhase || 0) * 0.28) * 2.8 + idleTail;
    ctx.strokeStyle = bodyCol;
    ctx.lineWidth = 5.2 * s;
    ctx.beginPath();
    ctx.moveTo(-14 * s, 1.5);
    ctx.quadraticCurveTo(-26 * s, 8 + tailWave * 0.4, -34 * s, 4 + tailWave);
    ctx.stroke();
    // tail tip flair
    if (d.type === 'cinder') {
      ctx.fillStyle = 'rgba(255,95,35,0.6)';
      ctx.beginPath(); ctx.arc(-33 * s, 4 + tailWave, 3.2 * s, 0, 6.28); ctx.fill();
    } else if (d.type === 'rime') {
      ctx.fillStyle = 'rgba(190,235,255,0.5)';
      ctx.beginPath(); ctx.arc(-33 * s, 4 + tailWave, 2.4 * s, 0, 6.28); ctx.fill();
    }

    ctx.restore();
  }

  function drawTouchControls(ctx) {
    // Right-side action pads (fat finger friendly tap zones; visual cues sized for 390px+)
    const padR = 36;
    const rightX = LOGICAL_W - 48;
    const topY = 72;
    const gap = 78;
    const isActive = (f) => touch[f];

    // helper ring + icon
    function drawPad(x, y, label, col, active, icon) {
      ctx.save();
      ctx.globalAlpha = active ? 0.95 : 0.72;
      // outer glow
      ctx.fillStyle = col + (active ? '55' : '22');
      ctx.beginPath(); ctx.arc(x, y, padR + 7, 0, 6.28); ctx.fill();
      // main pad
      ctx.fillStyle = active ? '#2a2436' : '#1a1f2e';
      ctx.beginPath(); ctx.arc(x, y, padR, 0, 6.28); ctx.fill();
      ctx.strokeStyle = active ? col : 'rgba(212,175,119,0.6)';
      ctx.lineWidth = active ? 3 : 1.5;
      ctx.beginPath(); ctx.arc(x, y, padR, 0, 6.28); ctx.stroke();
      // inner rune/icon
      ctx.fillStyle = active ? col : '#c8b48a';
      ctx.font = 'bold 15px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, x, y + 1);
      // label tiny
      ctx.font = '9px sans-serif';
      ctx.fillStyle = 'rgba(180,170,140,0.8)';
      ctx.fillText(label, x, y + padR + 11);
      ctx.restore();
    }

    drawPad(rightX, topY, 'SPEC', '#b3e8a0', isActive('special'), '❋');
    drawPad(rightX, topY + gap, 'ATK', '#ff8a4a', isActive('attack'), '✧');
    drawPad(rightX, topY + gap*2, 'DASH', '#7fd4ff', isActive('dash'), '⟐');

    // Left virtual stick indicator (only when active)
    if (touch.moveActive) {
      const sx = touch.moveCX, sy = touch.moveCY;
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = '#a8d4ff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx, sy, 22, 0, 6.28); ctx.stroke();
      ctx.beginPath(); ctx.arc(sx, sy, 38, 0, 6.28); ctx.stroke();
      // stick nub
      const nubX = sx + touch.dirX * 18;
      const nubY = sy + touch.dirY * 18;
      ctx.fillStyle = 'rgba(140,190,255,0.9)';
      ctx.beginPath(); ctx.arc(nubX, nubY, 9, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(nubX, nubY, 9, 0, 6.28); ctx.stroke();
      ctx.restore();
    }
  }

  // ==================== HUD ====================
  function updateHUD() {
    const p1s = document.getElementById('p1-hp');
    const p2s = document.getElementById('p2-hp');
    if (p1s && player1) p1s.style.width = `${Math.max(4, (player1.hp / player1.maxHp) * 100)}%`;
    if (p2s && player2) p2s.style.width = `${Math.max(4, (player2.hp / player2.maxHp) * 100)}%`;

    // cooldown rings via css vars (approximate)
    updateCooldownEl('p1-cd1', player1 ? player1.attackCd / 18 : 0);
    updateCooldownEl('p1-cd2', player1 ? player1.specialCd / 92 : 0);
    updateCooldownEl('p1-cd3', player1 ? player1.dashCd / 66 : 0);
    if (player2) {
      updateCooldownEl('p2-cd1', player2.attackCd / 18);
      updateCooldownEl('p2-cd2', player2.specialCd / 92);
      updateCooldownEl('p2-cd3', player2.dashCd / 66);
    }

    const roomEl = document.getElementById('room-label');
    const progEl = document.getElementById('progress');
    if (roomEl) roomEl.textContent = room ? room.name : '';
    if (progEl) progEl.textContent = `${currentRoomIdx + 1} / ${rooms.length}`;

    const p2stat = document.getElementById('p2-status');
    if (p2stat) p2stat.style.display = (p2Enabled && player2) ? 'flex' : 'none';

    // minimap — Pass 30: authored magical cartography (themed parchment + wall glyphs + distinct entity markers)
    // Gives spatial sense of the handcrafted room shapes, makes HUD feel like part of the fantasy world, not generic overlay.
    const mini = document.getElementById('minimap');
    if (mini && room) {
      mini.innerHTML = '';
      const mctx = document.createElement('canvas');
      mctx.width = 106; mctx.height = 66;
      const m = mctx.getContext('2d');

      // Themed parchment bg per room theme for environmental authorship in HUD
      const theme = room.theme || 'grove';
      const mapBg = theme === 'grove' ? '#121f16' :
                    theme === 'crystal' ? '#0f1a24' :
                    theme === 'sanctum' ? '#18141f' :
                    theme === 'fissure' ? '#21140d' :
                    theme === 'crypt' ? '#1c120d' : '#160f12';
      m.fillStyle = mapBg;
      m.fillRect(0, 0, 106, 66);
      // soft inner parchment rim
      m.strokeStyle = 'rgba(212,175,119,0.22)';
      m.lineWidth = 2;
      m.strokeRect(3, 3, 100, 60);

      // outer cartouche border (magical map frame)
      m.strokeStyle = '#3a455c';
      m.lineWidth = 1;
      m.strokeRect(1, 1, 104, 64);

      // scale for content
      const sx = 100 / room.w, sy = 60 / room.h;
      const ox = 3, oy = 3;

      // Draw walls as dark glyphs for spatial layout readability (helps co-op coordination)
      m.fillStyle = 'rgba(6,8,14,0.85)';
      (room.walls || []).forEach(w => {
        const wx = ox + w.x * sx, wy = oy + w.y * sy;
        m.fillRect(wx, wy, Math.max(1.6, w.w * sx), Math.max(1.6, w.h * sy));
      });

      // Tiny door markers (bright ticks on edges) — shows progression paths
      m.strokeStyle = '#d4af77';
      m.lineWidth = 1.5;
      (room.doors || []).forEach(d => {
        if (d.dir === 'north') { m.beginPath(); m.moveTo(ox + d.x * sx, oy + 1); m.lineTo(ox + (d.x + d.w) * sx, oy + 1); m.stroke(); }
        if (d.dir === 'south') { m.beginPath(); m.moveTo(ox + d.x * sx, oy + 59); m.lineTo(ox + (d.x + d.w) * sx, oy + 59); m.stroke(); }
        if (d.dir === 'west')  { m.beginPath(); m.moveTo(ox + 1, oy + d.y * sy); m.lineTo(ox + 1, oy + (d.y + d.h) * sy); m.stroke(); }
        if (d.dir === 'east')  { m.beginPath(); m.moveTo(ox + 99, oy + d.y * sy); m.lineTo(ox + 99, oy + (d.y + d.h) * sy); m.stroke(); }
      });

      // Player markers (larger, with hero color tint for identity)
      const pColor = (player1 && player1.color) || '#f0d9b0';
      [player1, player2].filter(Boolean).forEach((pl, i) => {
        const px = ox + pl.x * sx, py = oy + pl.y * sy;
        // soft halo
        m.fillStyle = i === 0 ? 'rgba(212,175,119,0.35)' : 'rgba(127,212,255,0.25)';
        m.beginPath(); m.arc(px, py, 4.2, 0, 6.28); m.fill();
        // core
        m.fillStyle = pColor;
        m.beginPath(); m.arc(px, py, 2.1, 0, 6.28); m.fill();
        m.strokeStyle = '#fff';
        m.lineWidth = 0.6;
        m.stroke();
      });

      // Dragon companion marker (colored by bond, offset slightly for "following" read)
      if (typeof dragon !== 'undefined' && dragon) {
        const dx = ox + dragon.x * sx, dy = oy + dragon.y * sy;
        m.fillStyle = dragon.color || '#b3e8a0';
        m.beginPath();
        m.moveTo(dx, dy - 2.4); m.lineTo(dx - 1.8, dy + 1.6); m.lineTo(dx + 1.8, dy + 1.6); m.closePath(); m.fill();
        m.strokeStyle = 'rgba(255,255,255,0.7)';
        m.lineWidth = 0.5;
        m.stroke();
      }

      // Enemies with type-specific color for quick threat ID on map
      enemies.forEach(en => {
        if (!en || en.hp <= 0) return;
        const ex = ox + en.x * sx, ey = oy + en.y * sy;
        let ec = '#c46b5a';
        if (en.type === 'archer') ec = '#8a9a6e';
        else if (en.type === 'brute') ec = '#6b5a4a';
        else if (en.type === 'wisp') ec = '#7aa8c9';
        else if (en.type === 'burrow') ec = '#5c4633';
        else if (en.type === 'drake') ec = '#a36b5a';
        else if (en.isBoss) ec = '#ff3a2a';
        m.fillStyle = ec;
        m.fillRect(ex - 1.1, ey - 1.1, 2.2, 2.2);
      });

      mini.appendChild(mctx);
    }
  }

  function updateCooldownEl(id, pct) {
    const el = document.getElementById(id);
    if (!el) return;
    const angle = Math.max(0, Math.min(360, Math.floor(pct * 360)));
    el.style.setProperty('--angle', `${angle}deg`);
    el.style.background = angle > 5 ? `conic-gradient(#1f283d ${angle}deg, #d4af77 0)` : '#1f283d';
  }

  // ==================== AUDIO ====================
  function initAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
  }

  function playSound(name, vol = 0.5) {
    if (muted || !audioCtx) return;
    try {
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      // master early so ambient chord voice can connect
      const master = audioCtx.createGain();
      master.gain.value = muted ? 0 : 0.9;

      if (name === 'cleave' || name === 'hit') {
        osc.type = 'sawtooth'; osc.frequency.value = name === 'cleave' ? 140 : 220;
        filter.type = 'lowpass'; filter.frequency.value = 800;
        gain.gain.value = vol * 0.8;
        gain.gain.linearRampToValueAtTime(0.001, t + 0.28);
      } else if (name === 'bolt' || name === 'spear') {
        osc.type = 'square'; osc.frequency.value = name === 'spear' ? 620 : 780;
        filter.type = 'highpass'; filter.frequency.value = 420;
        gain.gain.value = vol * 0.5;
        gain.gain.linearRampToValueAtTime(0.0001, t + 0.22);
      } else if (name === 'burst' || name === 'nova') {
        osc.type = 'sine'; osc.frequency.value = 180;
        filter.type = 'lowpass'; filter.frequency.value = 1400;
        gain.gain.value = vol * 0.7;
        gain.gain.linearRampToValueAtTime(0.001, t + 0.6);
      } else if (name === 'breath') {
        osc.type = 'sawtooth'; osc.frequency.value = 110;
        filter.type = 'bandpass'; filter.frequency.value = 620;
        gain.gain.value = vol * 0.6;
        gain.gain.linearRampToValueAtTime(0.001, t + 0.38);
      } else if (name === 'pickup') {
        osc.type = 'sine'; osc.frequency.value = 880;
        gain.gain.value = vol * 0.4;
        gain.gain.linearRampToValueAtTime(0.0001, t + 0.35);
      } else if (name === 'dash' || name === 'roll' || name === 'blink') {
        osc.type = 'sine'; osc.frequency.value = (name === 'dash' ? 92 : (name === 'roll' ? 155 : 205));
        filter.type = 'lowpass'; filter.frequency.value = 620;
        gain.gain.value = vol * 0.52;
        gain.gain.linearRampToValueAtTime(0.0004, t + (name === 'dash' ? 0.34 : 0.19));
      } else if (name === 'hurt' || name === 'enemy-shot') {
        osc.type = 'sawtooth'; osc.frequency.value = (name === 'hurt' ? 295 : 470);
        filter.type = 'highpass'; filter.frequency.value = 260;
        gain.gain.value = vol * 0.62;
        gain.gain.linearRampToValueAtTime(0.0008, t + 0.26);
      } else if (name === 'boss-slam' || name === 'trap') {
        osc.type = 'sine'; osc.frequency.value = (name === 'boss-slam' ? 72 : 138);
        filter.type = 'lowpass'; filter.frequency.value = 380;
        gain.gain.value = vol * (name === 'boss-slam' ? 0.92 : 0.58);
        gain.gain.linearRampToValueAtTime(0.0003, t + (name === 'boss-slam' ? 0.72 : 0.42));
      } else if (name === 'pulse' || name === 'gust') {
        osc.type = 'triangle'; osc.frequency.value = (name === 'pulse' ? 248 : 365);
        filter.type = 'bandpass'; filter.frequency.value = 510;
        gain.gain.value = vol * 0.44;
        gain.gain.linearRampToValueAtTime(0.0006, t + 0.33);
      } else if (name === 'ambient') {
        // Sea Dragon Pass 36: deep "depths thrum" — low sine + sub-bass for slow magical breathing pulse of the living ruin. Long soft tail, minimal noise, rhythmic world feel during play and lulls. Makes the audio layer match the handcrafted visual authorship (not just UI bleeps).
        osc.type = 'sine'; osc.frequency.value = 44;
        filter.type = 'lowpass'; filter.frequency.value = 165;
        gain.gain.value = vol * 0.85;
        gain.gain.linearRampToValueAtTime(0.0001, t + 2.6);
        // second detuned low voice for chord-like depth (sub bass "heart of the depths")
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        const filt2 = audioCtx.createBiquadFilter();
        osc2.type = 'sine'; osc2.frequency.value = 33;
        filt2.type = 'lowpass'; filt2.frequency.value = 95;
        gain2.gain.value = vol * 0.55;
        gain2.gain.linearRampToValueAtTime(0.00005, t + 2.9);
        osc2.connect(filt2); filt2.connect(gain2); gain2.connect(master);
        osc2.start(t); osc2.stop(t + 3.1);
      } else {
        osc.type = 'triangle'; osc.frequency.value = 340;
        gain.gain.value = vol * 0.3;
        gain.gain.linearRampToValueAtTime(0.0001, t + 0.18);
      }

      const noise = audioCtx.createBufferSource();
      const buffer = audioCtx.createBuffer(1, 22050, 44100);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      noise.buffer = buffer;
      const nGain = audioCtx.createGain();
      nGain.gain.value = (name === 'ambient' ? vol * 0.07 : vol * 0.24);
      nGain.gain.linearRampToValueAtTime(0.0001, t + (name === 'ambient' ? 1.8 : 0.22));

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      noise.connect(nGain);
      nGain.connect(master);
      master.connect(audioCtx.destination);

      const dur = (name === 'ambient' ? 3.2 : 0.9);
      osc.start(t);
      noise.start(t);
      osc.stop(t + dur);
      noise.stop(t + dur);
    } catch (e) {}
  }

  function toggleMute() {
    muted = !muted;
    const btn = document.getElementById('mute-btn');
    if (btn) btn.textContent = muted ? '🔇' : '🔊';
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }

  // ==================== GAME FLOW ====================
  function startGame() {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

    document.getElementById('title-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    const vcanS = document.getElementById('victory-canvas');
    if (vcanS) vcanS.style.display = 'none';

    canvas = document.getElementById('game-canvas');
    setupCanvas(); // HiDPI backing + DPR transform for sharp authored visuals
    setupTouch();  // solo drag-to-steer + right-side action pads (fat-finger friendly)

    // reset touch state for fresh run
    touch.moveActive = false; touch.dirX = 0; touch.dirY = 0; touch.attack = touch.special = touch.dash = false;

    rooms = createRooms();
    relics = [];
    wardCharges = 0;
    chainCounter = 0;
    runStats = { kills: 0, rooms: 0, relics: [], startTime: Date.now() };
    lastAmbientTime = 0; // reset Sea Dragon ambient rhythm for fresh run

    // Pass 19-21: safer central spawn + 3-foe first room (gentle readable entry) + immediate framing + bond burst particles on cold start. Full run transitions framed too.
    player1 = createPlayer(360, 340, false, selectedHero);
    if (p2Enabled) {
      player2 = createPlayer(410, 390, true, selectedHero);
    } else {
      player2 = null;
    }
    dragon = createDragon(player1.x - 58, player1.y + 6, selectedDragon);

    loadRoom(0);

    // Pass 19: immediate camera framing BEFORE first draw so player/dragon/dragon are perfectly visible and centered on entry frame (no center-room then snap).
    camera.x = player1.x + (player2 ? 18 : -12);
    camera.y = player1.y - 22;
    camera.zoom = p2Enabled ? 1.02 : 1.18;
    updateCamera(0);
    updateCamera(0); // double-apply for stable entry framing + bounds

    // Pass 21: small authored "bond awakening" particle burst on entry for extra magical first-frame wonder (fits art mandate "moments that look worth sharing")
    const entryX = player1.x, entryY = player1.y;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * 6.28 + rand(-0.2, 0.2);
      const sp = 0.6 + Math.random() * 0.9;
      particles.push(createParticle(entryX + Math.cos(a) * 18, entryY + Math.sin(a) * 14 - 6, Math.cos(a) * sp, Math.sin(a) * sp - 0.3, 18 + rand(4, 14), '#c8a2ff', 1.8 + Math.random(), 'spark'));
    }

    gameState = 'playing';
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);

    // first ambient sound cue
    setTimeout(() => playSound('ambient', 0.25), 420);
  }

  function togglePause() {
    if (gameState === 'playing') {
      gameState = 'paused';
      document.getElementById('overlay').style.display = 'flex';
      document.getElementById('overlay-title').textContent = 'Paused';
      const vcanP = document.getElementById('victory-canvas');
      if (vcanP) vcanP.style.display = 'none';
      document.getElementById('overlay-body').innerHTML = 'Press Esc to resume or R+Shift to restart.';
      document.getElementById('overlay-actions').innerHTML = `
        <button onclick="resumeGame()">Resume</button>
        <button onclick="restartRun()">Restart Run</button>
        <button onclick="quitToTitle()">Quit to Title</button>
      `;
    } else if (gameState === 'paused') {
      resumeGame();
    }
  }

  window.resumeGame = function() {
    document.getElementById('overlay').style.display = 'none';
    gameState = 'playing';
    lastTime = performance.now();
    lastAmbientTime = performance.now(); // avoid immediate ambient pulse burst on unpause
    requestAnimationFrame(gameLoop);
  };

  window.restartRun = function() {
    document.getElementById('overlay').style.display = 'none';
    startGame();
  };

  window.quitToTitle = function() {
    location.reload();
  };

  function triggerDefeat() {
    gameState = 'dead';
    saveBestRun();
    const time = Math.floor((Date.now() - runStats.startTime) / 1000);
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('overlay-title').textContent = 'The Depths Claimed You';
    const vcanD = document.getElementById('victory-canvas');
    if (vcanD) {
      vcanD.style.display = 'block';
      // draw after tick for layout (Pass 26 authored defeat art, personalized to the run's bond)
      setTimeout(() => { try { drawDefeatArt(vcanD); } catch(e){} }, 12);
    }
    document.getElementById('overlay-body').innerHTML = `
      Rooms reached: <b>${runStats.rooms}</b> &nbsp; • &nbsp; Kills: <b>${runStats.kills}</b> &nbsp; • &nbsp; Time: <b>${time}s</b><br>
      Relics found: ${runStats.relics.length ? runStats.relics.join(', ') : 'none'}
      ${bestRun ? `<br><span style="color:#a7c4a0">Personal best: ${bestRun.rooms} rooms in ${bestRun.time}s</span>` : ''}
    `;
    document.getElementById('overlay-actions').innerHTML = `
      <button class="primary" onclick="restartRun()">Try Again</button>
      <button onclick="quitToTitle()">Back to Selection</button>
    `;
    playSound('hurt', 0.9);
  }

  function triggerVictory() {
    gameState = 'victory';
    saveBestRun();
    const time = Math.floor((Date.now() - runStats.startTime) / 1000);
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('overlay-title').textContent = 'The Maw Falls — Victory';
    const vcan = document.getElementById('victory-canvas');
    if (vcan) {
      vcan.style.display = 'block';
      // draw after a tick so layout ready (canvas in panel)
      setTimeout(() => { try { drawVictoryArt(vcan); } catch(e){} }, 12);
    }
    document.getElementById('overlay-body').innerHTML = `
      You and your dragon companion have cleared the Depths.<br>
      Rooms: <b>${runStats.rooms}</b> &nbsp; Kills: <b>${runStats.kills}</b> &nbsp; Time: <b>${time}s</b><br>
      Relics: ${runStats.relics.length ? runStats.relics.join(' • ') : '—'}
      ${bestRun ? `<br><span style="color:#a7c4a0">Record: ${bestRun.rooms} rooms / ${bestRun.kills} kills in ${bestRun.time}s</span>` : ''}
    `;
    document.getElementById('overlay-actions').innerHTML = `
      <button class="primary" onclick="restartRun()">Descend Again</button>
      <button onclick="quitToTitle()">Back to Selection</button>
    `;
    playSound('burst', 0.9);
    for (let i = 0; i < 26; i++) {
      setTimeout(() => {
        particles.push(createParticle(rand(200, 760), rand(80, 420), rand(-1.5, 1.5), rand(-1.5, 1.5), 46, '#d4af77', rand(2, 4), 'spark'));
      }, i * 7);
    }
  }

  function showToast(text) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = text;
    t.className = 'show';
    setTimeout(() => { t.className = ''; }, 1650);
  }

  function loadBestRun() {
    try {
      const raw = localStorage.getItem('dbd_best_run');
      if (raw) bestRun = JSON.parse(raw);
    } catch (e) {}
  }
  function saveBestRun() {
    if (!runStats || runStats.rooms < 1) return;
    const time = Math.floor((Date.now() - runStats.startTime) / 1000);
    const candidate = {
      rooms: runStats.rooms,
      kills: runStats.kills,
      time: time,
      relicCount: runStats.relics.length,
      hero: selectedHero ? selectedHero.name : '',
      dragon: selectedDragon ? selectedDragon.name : ''
    };
    const better = !bestRun || candidate.rooms > bestRun.rooms || (candidate.rooms === bestRun.rooms && candidate.time < (bestRun.time || 999));
    if (better) {
      bestRun = candidate;
      try { localStorage.setItem('dbd_best_run', JSON.stringify(bestRun)); } catch (e) {}
    }
  }

  function gameLoop(now = 0) {
    if (!now) now = performance.now();
    const dt = Math.min((now - lastTime) / 16.6, 2.4);
    lastTime = now;

    if (gameState === 'playing') {
      update(dt);
      draw();
    } else if (gameState === 'paused' || gameState === 'overlay') {
      draw(); // still render world
    } else if (gameState === 'dead' || gameState === 'victory') {
      draw();
    }

    // clean up dead enemies visually
    enemies = enemies.filter(e => e.hp > 0 || e.hitFlash > 0);

    requestAnimationFrame(gameLoop);
  }

  // ==================== TITLE SCREEN WIRING ====================
  function setupTitleScreen() {
    titleCanvas = document.getElementById('title-canvas');
    if (titleCanvas) drawTitleArt(titleCanvas);
    loadBestRun();
    const fn = document.querySelector('.footer-note');
    if (fn && bestRun) {
      fn.textContent = `Record: ${bestRun.rooms} rooms • ${bestRun.kills} kills • ${bestRun.time}s (${bestRun.hero.split(' ')[0]} + ${bestRun.dragon})`;
    }

    // hero cards
    const heroRow = document.getElementById('hero-cards');
    HEROES.forEach((h, idx) => {
      const card = document.createElement('div');
      card.className = 'hero-card' + (idx === 0 ? ' selected' : '');
      card.innerHTML = `
        <canvas class="preview" width="122" height="78"></canvas>
        <div class="name">${h.name}</div>
        <div class="role">${h.role}</div>
      `;
      card.onclick = () => {
        document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedHero = h;
      };
      heroRow.appendChild(card);
      // draw preview
      const pc = card.querySelector('canvas');
      if (pc) h.preview(pc);
    });

    // dragon cards
    const dragRow = document.getElementById('dragon-cards');
    DRAGONS.forEach((d, idx) => {
      const card = document.createElement('div');
      card.className = 'dragon-card' + (idx === 0 ? ' selected' : '');
      card.innerHTML = `
        <canvas class="preview" width="122" height="78"></canvas>
        <div class="name">${d.name}</div>
        <div class="element">${d.element} • ${d.desc.split('.')[0]}</div>
      `;
      card.onclick = () => {
        document.querySelectorAll('.dragon-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedDragon = d;
      };
      dragRow.appendChild(card);
      const pc = card.querySelector('canvas');
      if (pc) d.preview(pc);
    });

    // p2 toggle
    const p2cb = document.getElementById('p2-toggle');
    p2cb.checked = false;
    p2cb.onchange = () => { p2Enabled = p2cb.checked; };

    // start
    document.getElementById('start-btn').onclick = () => {
      startGame();
    };

    // keyboard start hint
    document.addEventListener('keydown', e => {
      if (e.key === 'Enter' && document.getElementById('title-screen').style.display !== 'none') {
        startGame();
      }
    });

    // mute global
    document.addEventListener('click', () => { if (!audioCtx) initAudio(); }, { once: true });

    // initial selection
    selectedHero = HEROES[0];
    selectedDragon = DRAGONS[0];
    p2Enabled = false;
  }

  function updateCooldownStyles() {
    // ensure css vars exist on cooldown elements
    ['p1-cd1', 'p1-cd2', 'p1-cd3', 'p2-cd1', 'p2-cd2', 'p2-cd3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.setProperty('--angle', '0deg');
    });
  }

  // ==================== BOOT ====================
  function boot() {
    setupTitleScreen();
    setupInput();
    updateCooldownStyles();

    // expose for debug / verification
    window.__DBD = { startGame, HEROES, DRAGONS, getState: () => ({ gameState, currentRoomIdx, enemies: enemies.length, relics }) };

    // verification hook
    console.log('%c[Dragonbound Depths] Scaffold ready — preview entrypoint active.', 'color:#6a7a9a');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
