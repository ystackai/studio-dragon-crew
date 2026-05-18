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

  let toastTimer = 0;
  let shake = 0;

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
          {x: 240, y: 260, type: 'skitter'},
          {x: 440, y: 420, type: 'skitter'},
          {x: 880, y: 310, type: 'archer'},
          {x: 780, y: 540, type: 'skitter'}
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
        id: 'boss',
        name: 'The Maw of Ash',
        theme: 'boss',
        w: 1360, h: 860,
        walls: [
          {x: 160, y: 140, w: 100, h: 100}, {x: 1080, y: 160, w: 120, h: 80},
          {x: 220, y: 620, w: 140, h: 80}, {x: 920, y: 580, w: 160, h: 110}
        ],
        doors: [],
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

    // spawn enemies from definition
    room.spawns.forEach(s => {
      enemies.push(createEnemy(s.x, s.y, s.type));
    });

    if (room.isBoss) {
      enemies.push(createBoss(room.w * 0.5, room.h * 0.38));
    }

    // camera start centered
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
      radius: 14,
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
      radius: 11,
      type: type.id,
      color: type.color,
      followDist: 58,
      attackCd: 0,
      passiveTimer: 0,
      breathAngle: 0,
      breathActive: 0
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
      elite: true
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
      // Frost bolt
      const bolt = createProjectile(px, py, Math.cos(dir) * 5.8, Math.sin(dir) * 5.8, 'p1', 9, '#a5e0ff', 5, 58, 'bolt');
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

    // active ability
    d.attackCd -= dt;
    if (d.attackCd <= 0) {
      d.attackCd = (d.type === 'cinder' ? 78 : (d.type === 'rime' ? 66 : 82));
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
        // spawn a shrine for choice
        const sx = room.w * 0.5 + rand(-80, 80);
        const sy = room.h * 0.5 + rand(-60, 60);
        shrines.push({ x: sx, y: sy, isShrine: true, life: 9999 });
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
        // apply immediate
        if (r.id === 'vigor') {
          player1.maxHp += 15; player1.hp += 15;
          if (player2) { player2.maxHp += 15; player2.hp += 15; }
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
    const players = [p1, p2].filter(Boolean).filter(pl => !pl.downed);
    enemies.forEach(en => {
      if (en.hp <= 0) return;
      en.hitFlash = Math.max(0, (en.hitFlash || 0) - 1);
      en.slowed = Math.max(0, (en.slowed || 0) - 1);
      const speedMul = en.slowed ? 0.35 : 1.0;

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
        const spd = (en.speed || 1.2) * speedMul * (en.stunned ? 0.2 : 1);
        en.vx = lerp(en.vx, Math.cos(a) * spd, 0.2);
        en.vy = lerp(en.vy, Math.sin(a) * spd, 0.2);

        if (en.ranged && en.shootCd-- <= 0 && best < 420) {
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
            if (pr.kind === 'spear' && pr.pierce) dmg = 10;
            damageEnemy(en, dmg, pr.x, pr.y);
            if (pr.kind === 'spear' && pr.pierce > 0) pr.pierce--; else pr.hit = true;
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

    let avgX = 0, avgY = 0;
    alive.forEach(pl => { avgX += pl.x; avgY += pl.y; });
    avgX /= alive.length;
    avgY /= alive.length;

    const targetZoom = room.isBoss ? 0.82 : (alive.length > 1 ? 0.94 : 1.06);
    camera.zoom = lerp(camera.zoom, targetZoom, 0.08);

    // soft bounds so players don't vanish off edges
    const viewW = canvas.width / camera.zoom;
    const viewH = canvas.height / camera.zoom;
    let cx = lerp(camera.x, avgX, 0.12);
    let cy = lerp(camera.y, avgY, 0.12);

    cx = clamp(cx, viewW * 0.5 - 40, room.w - viewW * 0.5 + 40);
    cy = clamp(cy, viewH * 0.5 - 40, room.h - viewH * 0.5 + 40);

    camera.x = cx;
    camera.y = cy;
  }

  // ==================== DRAW ====================
  function draw() {
    if (!ctx || !room) return;
    ctx.save();
    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // camera transform
    const scale = camera.zoom;
    const ox = canvas.width * 0.5 - camera.x * scale;
    const oy = canvas.height * 0.5 - camera.y * scale;
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

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
        ctx.fillStyle = '#d4af77';
        ctx.beginPath(); ctx.arc(pu.x, pu.y + bob, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff6';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(pu.x, pu.y + bob, 9, 0, Math.PI * 2); ctx.stroke();
      }
    });

    // shrines / traps / patches
    shrines.forEach(s => {
      if (s.isShrine) {
        ctx.fillStyle = '#3a2a5a';
        ctx.beginPath(); ctx.arc(s.x, s.y, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d4af77';
        ctx.beginPath(); ctx.arc(s.x, s.y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(212,175,119,0.3)';
        ctx.beginPath(); ctx.arc(s.x, s.y, 28, 0, Math.PI * 2); ctx.fill();
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

    // enemies (with character)
    enemies.forEach(en => {
      if (en.hp <= 0) return;
      const flash = en.hitFlash > 0 ? 1 : 0;
      ctx.save();
      if (flash) ctx.fillStyle = '#fff';

      if (en.type === 'boss') {
        // Big ash maw dragon-boss
        ctx.fillStyle = flash ? '#fff' : '#2a1f18';
        ctx.beginPath(); ctx.ellipse(en.x, en.y, en.radius * 1.1, en.radius * 0.72, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = flash ? '#fff' : '#4a2f22';
        ctx.beginPath(); ctx.arc(en.x + 16, en.y - 6, 15, 0, Math.PI * 2); ctx.fill();
        // horns
        ctx.fillStyle = '#1a140f';
        ctx.beginPath(); ctx.moveTo(en.x + 22, en.y - 14); ctx.lineTo(en.x + 36, en.y - 28); ctx.lineTo(en.x + 28, en.y - 11); ctx.fill();
        ctx.beginPath(); ctx.moveTo(en.x + 22, en.y + 4); ctx.lineTo(en.x + 34, en.y + 19); ctx.lineTo(en.x + 26, en.y + 6); ctx.fill();
        // eyes
        ctx.fillStyle = en.phase === 2 ? '#ff4a3a' : '#ff9a5a';
        ctx.beginPath(); ctx.arc(en.x + 24, en.y - 4, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(en.x + 26, en.y - 5, 1.8, 0, Math.PI * 2); ctx.fill();
        // health rim
        ctx.strokeStyle = '#ff6b4a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const pct = en.hp / en.maxHp;
        ctx.arc(en.x, en.y, en.radius + 10, -1.8, -1.8 + pct * 3.6);
        ctx.stroke();
      } else if (en.type === 'skitter') {
        ctx.fillStyle = flash ? '#fff' : '#3a2a22';
        ctx.beginPath(); ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5a4638';
        ctx.fillRect(en.x - 4, en.y - 2, 8, 4);
        // legs
        ctx.strokeStyle = '#2a2118';
        ctx.lineWidth = 1.5;
        for (let k = 0; k < 4; k++) {
          const la = (k - 1.5) * 0.7 + (en.vx * 0.3);
          ctx.beginPath(); ctx.moveTo(en.x, en.y); ctx.lineTo(en.x + Math.cos(la) * 16, en.y + Math.sin(la) * 9); ctx.stroke();
        }
      } else if (en.type === 'archer') {
        ctx.fillStyle = flash ? '#fff' : '#2f3a2a';
        ctx.beginPath(); ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1f2a1f';
        ctx.fillRect(en.x - 3, en.y - 8, 6, 16);
        ctx.strokeStyle = '#8a9a7a';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(en.x + 9, en.y - 6); ctx.lineTo(en.x + 18, en.y + 2); ctx.stroke();
      } else if (en.type === 'brute') {
        ctx.fillStyle = flash ? '#fff' : '#3f3a32';
        ctx.beginPath(); ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2a2620';
        ctx.fillRect(en.x - 10, en.y - 4, 20, 8); // shield plate
        ctx.fillStyle = '#5a5548';
        ctx.beginPath(); ctx.arc(en.x - 4, en.y, 5, 0, Math.PI * 2); ctx.fill();
      } else if (en.type === 'wisp') {
        ctx.fillStyle = flash ? '#fff' : '#5a3a6a';
        ctx.beginPath(); ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(190, 140, 255, 0.6)';
        ctx.beginPath(); ctx.arc(en.x, en.y, en.radius * 1.6, 0, Math.PI * 2); ctx.fill();
      } else if (en.type === 'burrow') {
        if (!en.underground) {
          ctx.fillStyle = flash ? '#fff' : '#4a3a2a';
          ctx.beginPath(); ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#2a2118';
          ctx.fillRect(en.x - 3, en.y - 2, 6, 4);
        } else {
          ctx.fillStyle = 'rgba(60, 40, 30, 0.3)';
          ctx.beginPath(); ctx.arc(en.x, en.y, en.radius * 0.7, 0, Math.PI * 2); ctx.fill();
        }
      } else if (en.type === 'drake') {
        ctx.fillStyle = flash ? '#fff' : '#2f3a3a';
        ctx.beginPath(); ctx.ellipse(en.x, en.y, en.radius * 1.3, en.radius * 0.7, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1f2a2a';
        ctx.beginPath(); ctx.arc(en.x + 8, en.y - 3, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#6a8a7a';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(en.x - 6, en.y); ctx.lineTo(en.x - 16, en.y - 8); ctx.stroke();
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

    // projectiles
    projectiles.forEach(pr => {
      ctx.fillStyle = pr.color || '#fff';
      if (pr.kind === 'spear') {
        ctx.save();
        ctx.translate(pr.x, pr.y);
        ctx.rotate(Math.atan2(pr.vy, pr.vx));
        ctx.fillRect(-7, -1.5, 14, 3);
        ctx.fillStyle = '#fff8';
        ctx.fillRect(3, -2.5, 5, 5);
        ctx.restore();
      } else {
        ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath(); ctx.arc(pr.x - pr.vx * 0.3, pr.y - pr.vy * 0.3, pr.radius * 0.5, 0, Math.PI * 2); ctx.fill();
      }
    });

    // particles (expressive)
    particles.forEach(pt => {
      const alpha = pt.life / pt.maxLife;
      ctx.globalAlpha = alpha * 0.95 + 0.05;
      if (pt.type === 'dmg' && pt.dmg) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px system-ui';
        ctx.fillText(pt.dmg, pt.x, pt.y);
      } else {
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * (0.6 + alpha * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;

    ctx.restore();

    // screen shake
    if (shake > 0) {
      const ox = (Math.random() - 0.5) * shake;
      const oy = (Math.random() - 0.5) * shake * 0.7;
      ctx.translate(ox, oy);
      shake *= 0.82;
    }

    // vignette + atmospheric overlay
    const grd = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.48, 180, canvas.width * 0.5, canvas.height * 0.5, 620);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(4, 7, 14, 0.55)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawRoomBackground(ctx, r) {
    // base floor
    ctx.fillStyle = r.theme === 'crystal' ? '#112233' : (r.theme === 'sanctum' ? '#18122a' : '#121a2a');
    ctx.fillRect(0, 0, r.w, r.h);

    // tile / texture suggestion
    ctx.fillStyle = r.theme === 'crystal' ? 'rgba(140, 190, 255, 0.035)' : 'rgba(212, 175, 119, 0.025)';
    for (let x = 36; x < r.w; x += 58) {
      for (let y = 28; y < r.h; y += 58) {
        ctx.fillRect(x, y, 42, 42);
      }
    }

    // theme accents
    if (r.theme === 'grove') {
      ctx.fillStyle = 'rgba(70, 110, 70, 0.18)';
      ctx.fillRect(80, 80, 180, 220);
      ctx.fillRect(920, 480, 140, 160);
    }
    if (r.theme === 'crystal') {
      ctx.fillStyle = 'rgba(120, 180, 255, 0.12)';
      ctx.fillRect(200, 120, 80, 160);
      ctx.fillRect(880, 300, 110, 90);
      // crystal spikes
      ctx.fillStyle = 'rgba(170, 210, 255, 0.25)';
      ctx.beginPath(); ctx.moveTo(340, 90); ctx.lineTo(380, 210); ctx.lineTo(310, 210); ctx.fill();
    }
    if (r.theme === 'sanctum') {
      ctx.fillStyle = 'rgba(120, 90, 160, 0.14)';
      ctx.fillRect(160, 300, 120, 200);
    }
    if (r.theme === 'boss') {
      ctx.fillStyle = 'rgba(80, 30, 20, 0.3)';
      ctx.fillRect(120, 100, r.w - 240, r.h - 200);
      // lava seams
      ctx.strokeStyle = 'rgba(255, 90, 50, 0.25)';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(180, 200); ctx.quadraticCurveTo(400, 480, 820, 310); ctx.stroke();
    }
    if (r.theme === 'fissure') {
      ctx.fillStyle = 'rgba(120, 50, 30, 0.22)';
      ctx.fillRect(140, 180, 200, 120);
      ctx.fillRect(780, 320, 160, 90);
      ctx.strokeStyle = 'rgba(255, 110, 40, 0.3)';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(90, 300); ctx.quadraticCurveTo(320, 520, 680, 380); ctx.stroke();
      ctx.fillStyle = 'rgba(255, 140, 50, 0.18)';
      ctx.beginPath(); ctx.arc(420, 410, 38, 0, Math.PI * 2); ctx.fill();
    }

    // boundary glow
    ctx.strokeStyle = 'rgba(212, 175, 119, 0.08)';
    ctx.lineWidth = 18;
    ctx.strokeRect(22, 22, r.w - 44, r.h - 44);
  }

  function drawPlayer(ctx, p, hero) {
    if (!p) return;
    const flash = p.hitFlash > 0;
    ctx.save();
    if (flash) ctx.globalAlpha = 0.4 + Math.random() * 0.3;

    const r = p.radius;
    // body
    ctx.fillStyle = flash ? '#fff' : (p.downed ? '#4a3a38' : hero.color);
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();

    // helm / hood detail
    ctx.fillStyle = p.downed ? '#2f2522' : '#1a2233';
    ctx.beginPath(); ctx.arc(p.x - Math.cos(p.facing) * 2, p.y - Math.sin(p.facing) * 2, r * 0.78, 0, Math.PI * 2); ctx.fill();

    // weapon / staff hint
    ctx.strokeStyle = p.downed ? '#3a2f28' : hero.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(p.facing) * 9, p.y + Math.sin(p.facing) * 9);
    ctx.lineTo(p.x + Math.cos(p.facing) * 23, p.y + Math.sin(p.facing) * 23);
    ctx.stroke();

    // downed indicator
    if (p.downed) {
      ctx.fillStyle = 'rgba(200, 80, 60, 0.6)';
      ctx.fillRect(p.x - 12, p.y + 18, 24, 4);
    }

    // P label
    ctx.fillStyle = '#fff8';
    ctx.font = 'bold 9px system-ui';
    ctx.fillText(p.isP2 ? 'P2' : 'P1', p.x - 5, p.y - r - 4);

    ctx.restore();

    // hp bar above
    const hpPct = p.hp / p.maxHp;
    ctx.fillStyle = '#1a2233';
    ctx.fillRect(p.x - 16, p.y - r - 12, 32, 5);
    ctx.fillStyle = p.isP2 ? '#7fd4ff' : '#ff8a5a';
    ctx.fillRect(p.x - 15, p.y - r - 11, 30 * hpPct, 3);
  }

  function drawDragon(ctx, d) {
    ctx.save();
    const bob = Math.sin(performance.now() / 280) * 1.4;
    ctx.translate(d.x, d.y + bob);

    // body
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 8.5, d.vx * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // head
    const hx = 15;
    ctx.beginPath();
    ctx.arc(hx, -1.5, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // wing
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(-4, -2);
    ctx.quadraticCurveTo(-17, -18, -3, -11);
    ctx.stroke();

    // eye
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(hx + 3, -2, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a2233';
    ctx.beginPath(); ctx.arc(hx + 4, -2, 1.1, 0, Math.PI * 2); ctx.fill();

    // breath active
    if (d.breathActive > 0) {
      const ba = d.breathAngle || 0;
      ctx.fillStyle = d.type === 'cinder' ? 'rgba(255, 120, 60, 0.45)' : (d.type === 'rime' ? 'rgba(140, 210, 255, 0.4)' : 'rgba(190, 240, 170, 0.35)');
      for (let i = 0; i < 3; i++) {
        const spread = (i - 1) * 0.35;
        ctx.beginPath();
        ctx.moveTo(hx + 4, -1);
        ctx.lineTo(hx + 22 + Math.cos(ba + spread) * 26, -1 + Math.sin(ba + spread) * 26);
        ctx.lineTo(hx + 22 + Math.cos(ba - spread) * 26, -1 + Math.sin(ba - spread) * 26);
        ctx.fill();
      }
    }

    // tail
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-14, 1);
    ctx.quadraticCurveTo(-26, 9, -32, 4);
    ctx.stroke();

    ctx.restore();
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

    // minimap simple
    const mini = document.getElementById('minimap');
    if (mini && room) {
      mini.innerHTML = '';
      const mctx = document.createElement('canvas');
      mctx.width = 106; mctx.height = 66;
      const m = mctx.getContext('2d');
      m.fillStyle = '#0d1320';
      m.fillRect(0, 0, 106, 66);
      m.strokeStyle = '#3a455c';
      m.lineWidth = 1;
      m.strokeRect(2, 2, 102, 62);

      // scale
      const sx = 102 / room.w, sy = 62 / room.h;
      m.fillStyle = '#d4af77';
      [player1, player2].filter(Boolean).forEach(pl => {
        m.fillRect(2 + pl.x * sx - 1.5, 2 + pl.y * sy - 1.5, 3, 3);
      });
      m.fillStyle = '#ff6b4a55';
      enemies.forEach(en => {
        if (en.hp > 0) m.fillRect(2 + en.x * sx - 1, 2 + en.y * sy - 1, 2, 2);
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
      nGain.gain.value = vol * 0.25;
      nGain.gain.linearRampToValueAtTime(0.0001, t + 0.22);

      const master = audioCtx.createGain();
      master.gain.value = muted ? 0 : 0.9;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      noise.connect(nGain);
      nGain.connect(master);
      master.connect(audioCtx.destination);

      osc.start(t);
      noise.start(t);
      osc.stop(t + 0.9);
      noise.stop(t + 0.9);
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

    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d', { alpha: true });

    rooms = createRooms();
    relics = [];
    runStats = { kills: 0, rooms: 0, relics: [], startTime: Date.now() };

    player1 = createPlayer(180, 260, false, selectedHero);
    if (p2Enabled) {
      player2 = createPlayer(230, 310, true, selectedHero);
    } else {
      player2 = null;
    }
    dragon = createDragon(player1.x - 46, player1.y - 32, selectedDragon);

    loadRoom(0);

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
    const time = Math.floor((Date.now() - runStats.startTime) / 1000);
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('overlay-title').textContent = 'The Depths Claimed You';
    document.getElementById('overlay-body').innerHTML = `
      Rooms reached: <b>${runStats.rooms}</b> &nbsp; • &nbsp; Kills: <b>${runStats.kills}</b> &nbsp; • &nbsp; Time: <b>${time}s</b><br>
      Relics found: ${runStats.relics.length ? runStats.relics.join(', ') : 'none'}
    `;
    document.getElementById('overlay-actions').innerHTML = `
      <button class="primary" onclick="restartRun()">Try Again</button>
      <button onclick="quitToTitle()">Back to Selection</button>
    `;
    playSound('hurt', 0.9);
  }

  function triggerVictory() {
    gameState = 'victory';
    const time = Math.floor((Date.now() - runStats.startTime) / 1000);
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('overlay-title').textContent = 'The Maw Falls — Victory';
    document.getElementById('overlay-body').innerHTML = `
      You and your dragon companion have cleared the Depths.<br>
      Rooms: <b>${runStats.rooms}</b> &nbsp; Kills: <b>${runStats.kills}</b> &nbsp; Time: <b>${time}s</b><br>
      Relics: ${runStats.relics.length ? runStats.relics.join(' • ') : '—'}
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
