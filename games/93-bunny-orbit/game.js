// ============================================================
// Bunny Orbit — 3D browser game
// Creative intent: "This should feel like a cozy space adventure
//   where you guide a small bunny astronaut through a starry cosmos,
//   orbit-hopping between tiny colorful planets toward a glowing carrot moon."
// ============================================================
(function(){
'use strict';

// --- Constants ---
var PLANET_COUNT = 6;
var BURN_FORCE = 0.018;
var DRIFT_DAMPING = 0.997;
var SLINGSHOT_FORCE = 0.06;
var LANDING_RADIUS_MULT = 2.2;
var CAMERA_SMOOTH = 0.06;
var BURN_FUEL_RATE = 0.4;
var MAX_FUEL = 100;
var REFUEL_AMOUNT = 60;
var STAR_COUNT = 600;

// --- State ---
var scene, camera, renderer, clock;
var bunny, bunnyGroup;
var planets = [];
var carrotMoon;
var thrustParticles = [];
var fuel = MAX_FUEL;
var isBurning = false;
var velocity = new THREE.Vector3();
var planetsVisited = 0;
var gameStarted = false;
var gameFinished = false;
var gameTime = 0;
var currentScene = 'title';
var nearPlanet = null;
var audioStarted = false;
var rawAudioCtx = null;
var musicGainNode = null;
var musicBufferSource = null;
var musicBuffer = null;
var sfxLoaded = {};
var audioKit = null;
var titleBunnyAngle = 0;
var dt = 1/60;
var camTarget = new THREE.Vector3();
var camOffset = new THREE.Vector3(0, 6, 14);

// --- UI refs ---
var messageEl, planetLabelEl, burnFillEl, planetCounterEl, speedEl;

function getUI(){
  messageEl = document.getElementById('message');
  planetLabelEl = document.getElementById('planet-label');
  burnFillEl = document.getElementById('burn-fill');
  planetCounterEl = document.getElementById('planet-counter');
  speedEl = document.getElementById('speed-indicator');
}

function showMessage(text, duration){
  if(!messageEl) return;
  messageEl.textContent = text;
  messageEl.classList.add('visible');
  if(duration){
    setTimeout(function(){ messageEl.classList.remove('visible'); }, duration);
   }
}

function updateHUD(){
  if(!planetCounterEl) return;
  planetCounterEl.textContent = 'Planets: ' + planetsVisited + ' / ' + PLANET_COUNT;
  var speed = velocity.length();
  if(speedEl) speedEl.textContent = speed > 0.01 ? (speed * 100).toFixed(0) + ' km/s' : 'drifting';
  if(burnFillEl) burnFillEl.style.width = (fuel / MAX_FUEL * 100) + '%';
}

// --- Three.js setup ---
function initRenderer(){
  var canvas = document.getElementById('c');
  renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
}

function initScene(){
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x080818, 0.008);

   // Lights
  var ambient = new THREE.AmbientLight(0x334466, 0.6);
  scene.add(ambient);
  var sunLight = new THREE.DirectionalLight(0xfff5e0, 1.8);
  sunLight.position.set(50, 30, 40);
  scene.add(sunLight);
  var fillLight = new THREE.DirectionalLight(0x6688cc, 0.4);
  fillLight.position.set(-30, -10, -20);
  scene.add(fillLight);
  var pointLight = new THREE.PointLight(0xffaa44, 0.8, 200);
  pointLight.position.set(0, 10, 0);
  scene.add(pointLight);

   // Camera
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 8, 18);
  camera.lookAt(0, 0, 0);
}

// --- Starfield ---
function createStars(){
  var geo = new THREE.BufferGeometry();
  var positions = new Float32Array(STAR_COUNT * 3);
  var colors = new Float32Array(STAR_COUNT * 3);
  for(var i = 0; i < STAR_COUNT; i++){
    var r = 80 + Math.random() * 120;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i*3+2] = r * Math.cos(phi);
    var brightness = 0.5 + Math.random() * 0.5;
    var tint = Math.random();
    colors[i*3] = brightness * (tint > 0.7 ? 1.0 : 0.85);
    colors[i*3+1] = brightness * (tint > 0.8 ? 0.9 : 0.85);
    colors[i*3+2] = brightness;
   }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  var mat = new THREE.PointsMaterial({size: 0.8, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: true});
  var starPoints = new THREE.Points(geo, mat);
  scene.add(starPoints);
}

// --- Planet creation ---
var planetNames = ['Aurora', 'Crimson', 'Nebula', 'Emerald', 'Vapor', 'Solstice'];
var planetColors = [0x4fc3f7, 0xef5350, 0xba68c8, 0x66bb6a, 0xffab40, 0xffd54f];
var planetRings = [0x81d4fa, 0xff8a80, 0xce93d8, 0xa5d6a7, 0xffcc80, 0xffee58];

function createPlanet(index, position){
  var group = new THREE.Group();
  group.position.copy(position);
  var radius = 1.2 + Math.random() * 0.8;
  var color = planetColors[index % planetColors.length];

   // Main sphere
  var geo = new THREE.SphereGeometry(radius, 24, 18);
  var mat = new THREE.MeshStandardMaterial({color: color, roughness: 0.6, metalness: 0.1});
  group.add(new THREE.Mesh(geo, mat));

   // Atmosphere glow
  var glowGeo = new THREE.SphereGeometry(radius * 1.15, 20, 14);
  var glowMat = new THREE.MeshBasicMaterial({color: color, transparent: true, opacity: 0.12, side: THREE.BackSide});
  group.add(new THREE.Mesh(glowGeo, glowMat));

   // Ring for some planets
  if(index % 2 === 0){
    var ringGeo = new THREE.RingGeometry(radius * 1.4, radius * 2.0, 48);
    var ringMat = new THREE.MeshBasicMaterial({color: planetRings[index % planetRings.length], transparent: true, opacity: 0.35, side: THREE.DoubleSide});
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI * 0.4 + (Math.random() - 0.5) * 0.4;
    group.add(ring);
   }

   // Surface details
  for(var j = 0; j < 3; j++){
    var craterGeo = new THREE.SphereGeometry(radius * 0.15, 8, 6);
    var craterMat = new THREE.MeshStandardMaterial({color: new THREE.Color(color).multiplyScalar(0.7), roughness: 0.9});
    var crater = new THREE.Mesh(craterGeo, craterMat);
    var angle = (j / 3) * Math.PI * 2 + Math.random() * 0.5;
    var elev = (Math.random() - 0.5) * Math.PI * 0.5;
    crater.position.set(Math.cos(angle)*Math.cos(elev)*radius*0.95, Math.sin(elev)*radius*0.95, Math.sin(angle)*Math.cos(elev)*radius*0.95);
    crater.scale.set(1, 0.3, 1);
    group.add(crater);
   }

  group.userData = {
    name: planetNames[index % planetNames.length],
    radius: radius,
    visited: false,
    rotationSpeed: (0.003 + Math.random() * 0.005) * (Math.random() > 0.5 ? 1 : -1)
   };
  scene.add(group);
  planets.push(group);
  return group;
}

// --- Carrot Moon ---
function createCarrotMoon(){
  var group = new THREE.Group();

   // Carrot body
  var bodyGeo = new THREE.CylinderGeometry(0.5, 1.0, 3.5, 16, 12, false);
  var bodyMat = new THREE.MeshStandardMaterial({
    color: 0xff6600, roughness: 0.5, metalness: 0.05,
    emissive: 0xff3300, emissiveIntensity: 0.15
   });
  group.add(new THREE.Mesh(bodyGeo, bodyMat));

   // Top sphere
  var topGeo = new THREE.SphereGeometry(1.0, 16, 12, 0, Math.PI*2, 0, Math.PI/2);
  group.add(new THREE.Mesh(topGeo, bodyMat).translateY(1.75));

   // Leaves
  var leafMat = new THREE.MeshStandardMaterial({color: 0x4caf50, roughness: 0.7, emissive: 0x2e7d32, emissiveIntensity: 0.1});
  for(var i = 0; i < 3; i++){
    var leaf = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.2, 6), leafMat);
    leaf.position.set((i-1)*0.25, 3.2+Math.random()*0.3, (i-1)*0.15);
    leaf.rotation.z = (i-1)*0.4;
    leaf.rotation.x = -0.3;
    group.add(leaf);
   }

   // Glow halo
  var haloGeo = new THREE.SphereGeometry(3.5, 16, 12);
  var haloMat = new THREE.MeshBasicMaterial({color: 0xff8844, transparent: true, opacity: 0.08, side: THREE.BackSide});
  group.add(new THREE.Mesh(haloGeo, haloMat));

   // Point light
  group.add(new THREE.PointLight(0xff8844, 1.5, 40));

  group.position.set(0, 5, -80);
  group.userData = {radius: 2.0, isGoal: true};
  scene.add(group);
  carrotMoon = group;
}

// --- Bunny ---
var bunnyLoaded = false;

function loadBunny(){
  var loader = new THREE.GLTFLoader();
  var canvas = document.getElementById('c');
  var baseUrl = (renderer && renderer.domElement) ? '' : '';
  loader.load(
    'assets/foundry/bunny_astronaut.glb',
    function(gltf){
      bunnyGroup = new THREE.Group();
      var model = gltf.scene;
      model.scale.set(1.5, 1.5, 1.5);
      bunnyGroup.add(model);
      bunnyGroup.position.set(0, 0, 0);
      bunnyGroup.rotation.y = Math.PI;
      scene.add(bunnyGroup);
      bunny = bunnyGroup;
      bunnyLoaded = true;
    },
    undefined,
    function(err){
      console.warn('Bunny GLB load failed, using fallback', err);
      createFallbackBunny();
    }
   );
}

function createFallbackBunny(){
  bunnyGroup = new THREE.Group();
  var furMat = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.8});
  var body = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 10), furMat);
  bunnyGroup.add(body);
  var head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), furMat);
  head.position.y = 0.85;
  bunnyGroup.add(head);
  var earMat = new THREE.MeshStandardMaterial({color: 0xfff0f5, roughness: 0.7});
  for(var i = -1; i <= 1; i += 2){
    var ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.6, 4, 6), earMat);
    ear.position.set(i*0.2, 1.5, 0);
    ear.rotation.z = i*0.2;
    bunnyGroup.add(ear);
   }
   // Helmet
  var helmMat = new THREE.MeshStandardMaterial({color: 0xccddee, transparent: true, opacity: 0.4, roughness: 0.1});
  var helm = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 8, 0, Math.PI*2, 0, Math.PI*0.6), helmMat);
  helm.position.y = 0.85;
  bunnyGroup.add(helm);
   // Eyes
  var eyeMat = new THREE.MeshStandardMaterial({color: 0x111111});
  for(var i = -1; i <= 1; i += 2){
    var eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), eyeMat);
    eye.position.set(i*0.17, 0.9, 0.35);
    bunnyGroup.add(eye);
   }
   // Nose
  var nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshStandardMaterial({color: 0xffb6c1}));
  nose.position.set(0, 0.78, 0.42);
  bunnyGroup.add(nose);

  bunnyGroup.position.set(0, 0, 0);
  bunnyGroup.rotation.y = Math.PI;
  scene.add(bunnyGroup);
  bunny = bunnyGroup;
  bunnyLoaded = true;
}

// --- Thrust particles ---
function spawnThrustParticle(){
  if(!bunny) return;
  var geo = new THREE.SphereGeometry(0.08 + Math.random()*0.06, 4, 4);
  var mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color().setHSL(0.08+Math.random()*0.04, 1.0, 0.5+Math.random()*0.3),
    transparent: true, opacity: 0.9
   });
  var p = new THREE.Mesh(geo, mat);
  var offset = new THREE.Vector3(0, -0.3, -0.5);
  offset.applyQuaternion(bunny.quaternion);
  p.position.copy(bunny.position).add(offset);
  p.userData = {vel: new THREE.Vector3((Math.random()-0.5)*0.05, -0.08-Math.random()*0.06, (Math.random()-0.5)*0.05), life: 1.0, decay: 0.025+Math.random()*0.02};
  scene.add(p);
  thrustParticles.push(p);
}

function updateParticles(dt){
  for(var i = thrustParticles.length - 1; i >= 0; i--){
    var p = thrustParticles[i];
    p.position.add(p.userData.vel);
    p.userData.life -= p.userData.decay;
    p.material.opacity = Math.max(0, p.userData.life * 0.8);
    p.scale.multiplyScalar(0.97);
    if(p.userData.life <= 0){
      scene.remove(p);
      p.geometry.dispose();
      p.material.dispose();
      thrustParticles.splice(i, 1);
     }
   }
}

// --- Audio ---
function initAudioKit(){
  audioKit = new FoundryAudio();
  audioKit.install();
  audioKit.setVolume(0.35);
}

function initRawAudio(){
  var Ctx = window.AudioContext || window.webkitAudioContext;
  if(!Ctx) return;
  rawAudioCtx = new Ctx();
  musicGainNode = rawAudioCtx.createGain();
  musicGainNode.gain.value = 0.25;
  musicGainNode.connect(rawAudioCtx.destination);
}

function resumeAudio(){
  if(rawAudioCtx && rawAudioCtx.state === 'suspended') rawAudioCtx.resume();
}

function loadMusic(){
  fetch('assets/foundry/music_loop.wav')
    .then(function(r){ return r.arrayBuffer(); })
    .then(function(ab){
      if(!rawAudioCtx) return;
      rawAudioCtx.decodeAudioData(ab, function(buf){ musicBuffer = buf; }, function(){});
    }).catch(function(){});
}

function loadSFX(){
  var sfxMap = {
    thrust: 'assets/foundry/sfx/thrust.wav',
    landing: 'assets/foundry/sfx/landing.wav',
    payoff: 'assets/foundry/sfx/payoff.wav',
    movement: 'assets/foundry/sfx/movement.wav',
    reveal: 'assets/foundry/sfx/reveal.wav',
    danger: 'assets/foundry/sfx/danger.wav'
   };
  for(var key in sfxMap){
    (function(k, path){
      fetch(path).then(function(r){return r.arrayBuffer();}).then(function(ab){
        if(rawAudioCtx) rawAudioCtx.decodeAudioData(ab, function(b){sfxLoaded[k]=b;}, function(){});
       }).catch(function(){});
     })(key, sfxMap[key]);
   }
}

function playSFX(name){
  if(!rawAudioCtx || !sfxLoaded[name]) return;
  try{
    var src = rawAudioCtx.createBufferSource();
    src.buffer = sfxLoaded[name];
    var g = rawAudioCtx.createGain();
    g.gain.value = 0.4;
    src.connect(g); g.connect(rawAudioCtx.destination);
    src.start();
   }catch(e){}
}

function startMusic(){
  if(!musicBuffer || !rawAudioCtx || !musicGainNode) return;
  stopMusic();
  try{
    musicBufferSource = rawAudioCtx.createBufferSource();
    musicBufferSource.buffer = musicBuffer;
    musicBufferSource.loop = true;
    musicBufferSource.connect(musicGainNode);
    musicBufferSource.start();
   }catch(e){}
}

function stopMusic(){
  if(musicBufferSource){ try{musicBufferSource.stop();}catch(e){} musicBufferSource = null; }
}

// --- World setup ---
function setupWorld(){
  createStars();
   // Place planets along a path toward the carrot moon
  var positions = [];
  for(var i = 0; i < PLANET_COUNT; i++){
    var t = (i + 1) / (PLANET_COUNT + 1);
    var x = (Math.random()-0.5)*20;
    var y = 2 + Math.sin(t*Math.PI)*8 + (Math.random()-0.5)*3;
    var z = -15 - t*55 + (Math.random()-0.5)*10;
    positions.push(new THREE.Vector3(x, y, z));
   }
  for(var i = 0; i < PLANET_COUNT; i++){
    createPlanet(i, positions[i]);
   }
  createCarrotMoon();
}

// --- Input ---
var burnPressed = false;
var burnJustPressed = false;

function setupInput(){
  document.addEventListener('keydown', function(e){
    if(e.code === 'Space' || e.code === 'ArrowUp'){
      e.preventDefault();
      if(!burnPressed) burnJustPressed = true;
      burnPressed = true;
     }
   });
  document.addEventListener('keyup', function(e){
    if(e.code === 'Space' || e.code === 'ArrowUp') burnPressed = false;
   });
  var canvas = document.getElementById('c');
  canvas.addEventListener('pointerdown', function(){
    if(!burnPressed) burnJustPressed = true;
    burnPressed = true;
   });
  canvas.addEventListener('pointerup', function(){ burnPressed = false; });
  canvas.addEventListener('pointerleave', function(){ burnPressed = false; });
}

// --- Camera ---
function updateCamera(){
  if(!bunny) return;
  camTarget.copy(bunny.position);
  var desired = camTarget.clone().add(camOffset);
  camera.position.lerp(desired, CAMERA_SMOOTH + dt*2);
  camera.lookAt(bunny.position);
}

// --- Physics ---
function updatePhysics(dt){
  if(!bunny || gameFinished) return;
  gameTime += dt;

   // Burn
  if(burnPressed && fuel > 0){
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(bunny.quaternion);

     // Steering via pointer
    var canvas = document.getElementById('c');
    var mx = 0.5, my = 0.5;
    if(typeof FoundryInput !== 'undefined' && FoundryInput.pointer){
      mx = FoundryInput.pointer.x / canvas.width;
      my = FoundryInput.pointer.y / canvas.height;
     }
    dir.x += (mx - 0.5) * 0.3;
    dir.y += (0.5 - my) * 0.2;
    dir.normalize();

    velocity.addScaledVector(dir, BURN_FORCE);
    fuel = Math.max(0, fuel - BURN_FUEL_RATE * dt * 60);

    if(Math.random() < 0.6) spawnThrustParticle();

     // Lean into thrust
    var lookTarget = bunny.position.clone().add(dir);
    bunny.lookAt(lookTarget);
   }

   // Drift damping
  velocity.multiplyScalar(DRIFT_DAMPING);
  bunny.position.addScaledVector(velocity, dt * 60);

   // Idle rotation
  if(!burnPressed){
    bunny.rotation.y += dt * 0.15;
   }

   // Bobbing
  bunny.position.y += Math.sin(gameTime * 2.5) * 0.002;

   // Planet collision
  nearPlanet = null;
  var nearestDist = Infinity;
  for(var i = 0; i < planets.length; i++){
    var p = planets[i];
    var dist = bunny.position.distanceTo(p.position);
    var landRadius = p.userData.radius * LANDING_RADIUS_MULT;
    if(dist < nearestDist){ nearestDist = dist; nearPlanet = p; }
    if(dist < landRadius && !p.userData.visited){
      p.userData.visited = true;
      planetsVisited++;
      fuel = Math.min(MAX_FUEL, fuel + REFUEL_AMOUNT);
      playSFX('landing');
      showMessage('Landed on ' + p.userData.name + '! Fuel refilled', 2000);

       // Slingshot toward next
      var target = null;
      if(i + 1 < planets.length) target = planets[i+1].position;
      else if(carrotMoon) target = carrotMoon.position;
      if(target){
        var slingDir = target.clone().sub(p.position).normalize();
        velocity.addScaledVector(slingDir, SLINGSHOT_FORCE);
       }
     }
    p.rotation.y += p.userData.rotationSpeed;

     // Planet label
    if(dist < p.userData.radius * 4 && dist < nearestDist){
      if(planetLabelEl){
        planetLabelEl.textContent = '-> ' + p.userData.name;
        planetLabelEl.classList.add('visible');
       }
     }
   }
  if(!nearPlanet && planetLabelEl) planetLabelEl.classList.remove('visible');

   // Carrot moon
  if(carrotMoon && !gameFinished){
    var carrotDist = bunny.position.distanceTo(carrotMoon.position);
    if(carrotDist < carrotMoon.userData.radius * 2){
      gameFinished = true;
      playSFX('payoff');
      showDebrief();
     }
   }
}

// --- Debrief ---
function showDebrief(){
  var overlay = document.getElementById('debrief-overlay');
  var title = document.getElementById('debrief-title');
  var pStat = document.getElementById('debrief-planets');
  var tStat = document.getElementById('debrief-time');
  var rStat = document.getElementById('debrief-rating');

  var allVisited = planetsVisited >= PLANET_COUNT;
  title.textContent = allVisited ? 'Carrot Moon Reached! All Planets Visited!' : 'Carrot Moon Reached!';
  pStat.textContent = 'Planets visited: ' + planetsVisited + ' / ' + PLANET_COUNT;
  tStat.textContent = 'Time: ' + Math.floor(gameTime) + 's';
  rStat.textContent = allVisited ? 'Rating: Excellent Journey!' : 'Rating: Direct Route!';
  overlay.style.display = 'flex';
  stopMusic();
}

function restartGame(){
  document.getElementById('debrief-overlay').style.display = 'none';
  if(bunny){ bunny.position.set(0,0,0); }
  velocity.set(0,0,0);
  fuel = MAX_FUEL;
  planetsVisited = 0;
  gameTime = 0;
  gameFinished = false;
  burnPressed = false;
  for(var i = 0; i < planets.length; i++) planets[i].userData.visited = false;
  startMusic();
}

// --- Scene: Title ---
function titleUpdate(dt){
  titleBunnyAngle += dt * 0.3;
  if(bunny){
    bunny.position.y = Math.sin(titleBunnyAngle * 2) * 0.5;
    bunny.rotation.y = titleBunnyAngle;
   }
  for(var i = 0; i < planets.length; i++){
    planets[i].rotation.y += planets[i].userData.rotationSpeed;
   }
}

function titleRender(){
  updateCamera();
  renderer.render(scene, camera);
}

// --- Scene: Play ---
var lastSFXTime = 0;

function playUpdate(dt){
  if(burnJustPressed && !audioStarted){
    audioStarted = true;
    resumeAudio();
    startMusic();
    playSFX('movement');
   }
  burnJustPressed = false;
  updatePhysics(dt);
  updateParticles(dt);
  updateHUD();

   // Periodic movement SFX
  if(burnPressed && gameTime - lastSFXTime > 2){
    playSFX('thrust');
    lastSFXTime = gameTime;
   }

   // Carrot moon animation
  if(carrotMoon){
    carrotMoon.rotation.y += dt * 0.2;
    var glowChild = null;
    for(var ci = 0; ci < carrotMoon.children.length; ci++){
      var c = carrotMoon.children[ci];
      if(c.material && c.material.opacity > 0.05 && c.material.opacity < 0.12){
        glowChild = c; break;
       }
     }
    if(glowChild){
      glowChild.material.opacity = 0.06 + Math.sin(gameTime * 1.5) * 0.03;
     }
   }
}

function playRender(){
  updateCamera();
  renderer.render(scene, camera);
}

// --- Scene: Debrief ---
function debriefUpdate(dt){
  if(bunny){
    bunny.rotation.y += dt * 0.5;
    bunny.position.y = Math.sin(gameTime * 3) * 0.3;
   }
}

function debriefRender(){
  renderer.render(scene, camera);
}

// === BOOT ===
function boot(){
  initRenderer();
  initScene();
  getUI();
  setupWorld();
  setupInput();
  initAudioKit();

  loadBunny();

   // Title scene render loop
  function titleFrame(now){
    if(currentScene === 'title'){
      titleUpdate(dt);
      titleRender();
     }
    if(currentScene === 'title') requestAnimationFrame(titleFrame);
   }
  requestAnimationFrame(titleFrame);

   // Game loop
  FoundryLoop.start({
    update: function(d){
      if(currentScene === 'play') playUpdate(d);
      else if(currentScene === 'debrief') debriefUpdate(d);
     },
    render: function(alpha){
      if(currentScene === 'play') playRender();
      else if(currentScene === 'debrief') debriefRender();
     }
   });

   // Start button
  document.getElementById('start-btn').addEventListener('click', function(){
    document.getElementById('title-overlay').style.display = 'none';
    initRawAudio();
    loadMusic();
    loadSFX();
    startMusic();
    playSFX('movement');
    currentScene = 'play';
   });

  document.getElementById('replay-btn').addEventListener('click', restartGame);

   // Resize
  window.addEventListener('resize', function(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
   });
}

if(typeof THREE !== 'undefined'){
  boot();
} else {
  window.addEventListener('load', function(){
    if(typeof THREE !== 'undefined') boot();
    else console.error('Three.js not loaded');
   });
}

})();
