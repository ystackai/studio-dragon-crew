// ============================================================
//  DRAGON FLIGHT - Volcanic Canyon Vertical Slice
//  Three.js-based 3D browser game
// ============================================================

(function () {
   "use strict";

   // ---- Constants ----
   const TRACK_LENGTH = 600;
   const CANYON_WIDTH = 40;
   const WALL_HEIGHT = 60;
   const DRAGON_SCALE = 1.0;
   const MAX_HEAT = 100;
   const FIRE_BREATH_DRAIN_RATE = 8;
   const WALL_COLLISION_HEAT_LOSS = 15;
   const WALL_COLLISION_VEL_PENALTY = 0.4;
   const HEAT_REGEN_RATE = 2;
   const UPDRAFT_HEAT_GAIN = 25;
   const BOOST_HEAT_COST = 2;
   const FLIGHT_SPEED_BASE = 15;
   const FLIGHT_SPEED_BOOST = 35;
   const FLIGHT_SPEED_MIN = 5;
   const DRAG_COEFFICIENT = 0.97;
   const INERTIA_FACTOR = 0.92;
   const PITCH_RATE = 1.5;
   const ROLL_RATE = 2.0;
   const YAW_RATE = 1.2;
   const LIFT_FORCE = 9.8;
   const GRAVITY = 9.8;
   const DIVE_ACCELERATION = 20;
   const BOOST_DURATION = 1.5;
   const UPDRAFT_COUNT = 20;
   const RUNE_COUNT = 8;
   const BASALT_COLUMN_COUNT = 80;
   const MAGMA_VEIN_COUNT = 30;
   const EMBER_COUNT = 200;

    // ---- State ----
   let scene, camera, renderer;
   let dragon, dragonGroup;
   let velocity = new THREE.Vector3(0, 0, 0);
   let heat = MAX_HEAT;
   let fireBreathActive = false;
   let boostActive = false;
   let boostTimer = 0;
   let sequenceStarted = false;
   let sequenceComplete = false;
   let dragonPosition = new THREE.Vector3(0, 20, 0);
   let dragonRotation = { pitch: 0, roll: 0, yaw: Math.PI };
   let distanceTraveled = 0;
   let lastTime = 0;
   let updrafts = [];
   let runes = [];
   let wallSegments = [];
   let embers = [];
   let fireBreathParticles = [];
   let audioCtx = null;
   let bgMusicGain = null;
   let wingFlapAudio = {};
   let inputs = { w: false, a: false, s: false, d: false, space: false, shift: false, arrowUp: false, arrowDown: false, arrowLeft: false, arrowRight: false };
   let collisionCooldown = 0;

   // ---- Camera System ----
   const cameraSystem = {
     baseFov: 60,
     currentFov: 60,
     targetFov: 60,
     offset: new THREE.Vector3(0, 3, -8),
     lookOffset: new THREE.Vector3(0, 1, 10),
     damping: 8,
     update(dt) {
       const speed = velocity.length();
       const speedRatio = Math.min(speed / FLIGHT_SPEED_BOOST, 1);

       this.targetFov = this.baseFov - speedRatio * 20;
       if (boostActive) this.targetFov -= 10;

       this.currentFov += (this.targetFov - this.currentFov) * this.damping * dt;
       camera.fov = this.currentFov;
       camera.updateProjectionMatrix();

       const targetCamPos = dragonPosition.clone();
       const dragonEuler = new THREE.Euler(dragonRotation.pitch, dragonRotation.yaw, 0, 'XYZ');
       const camOffset = this.offset.clone().applyEuler(dragonEuler);
       targetCamPos.add(camOffset);

       camera.position.lerp(targetCamPos, this.damping * dt * 2);

       const lookTarget = dragonPosition.clone();
       const lookOffset = this.lookOffset.clone().applyEuler(dragonEuler);
       lookTarget.add(lookOffset);
       camera.lookAt(lookTarget);
     },
   };

   // ---- DragonFlightController ----
   const flightController = {
     wingFlapTimer: 0,
     handleInput(dt) {
       const pitchInput = (inputs.w || inputs.arrowUp ? -1 : 0) + (inputs.s || inputs.arrowDown ? 1 : 0);
       const rollInput = (inputs.a || inputs.arrowLeft ? -1 : 0) + (inputs.d || inputs.arrowRight ? 1 : 0);
       const yawInput = (inputs.a || inputs.arrowLeft ? 1 : 0) + (inputs.d || inputs.arrowRight ? -1 : 0);

       // Pitch: W/Up = nose up (negative), S/Down = nose down (positive)
       dragonRotation.pitch += pitchInput * PITCH_RATE * dt;
       dragonRotation.pitch = THREE.MathUtils.clamp(dragonRotation.pitch, -Math.PI / 3, Math.PI / 3);

       // Roll: A/Left = left roll, D/Right = right roll
       dragonRotation.roll += rollInput * ROLL_RATE * dt;
       dragonRotation.roll = THREE.MathUtils.clamp(dragonRotation.roll, -Math.PI / 3, Math.PI / 3);

       // Yaw: gentle turn based on roll and explicit yaw input
       const autoYaw = dragonRotation.roll * 0.3;
       dragonRotation.yaw += autoYaw * dt + yawInput * YAW_RATE * dt * 0.3;

       // Boost
       if (inputs.space && heat > 0) {
         if (!boostActive) {
           boostActive = true;
           boostTimer = BOOST_DURATION;
         }
         boostTimer -= dt;
         if (boostTimer <= 0) {
           boostActive = false;
           boostTimer = 0;
         }
         heat = Math.max(0, heat - BOOST_HEAT_COST * dt);
       } else {
         boostActive = false;
         boostTimer = 0;
       }

       // Fire breath
       fireBreathActive = inputs.shift && heat > 0;
       if (fireBreathActive) {
         heat = Math.max(0, heat - FIRE_BREATH_DRAIN_RATE * dt);
         spawnFireBreath(dt);
       }

       // Wing flap sound on pitch/roll input
       this.wingFlapTimer -= dt;
       if ((pitchInput !== 0 || rollInput !== 0) && this.wingFlapTimer <= 0) {
         playWingFlap();
         this.wingFlapTimer = 0.12;
       }
     },
   };

   // ---- ThermalSystem ----
   const thermalSystem = {
     update(dt) {
       // Natural heat regeneration (very slow when not collecting)
       if (!fireBreathActive && !boostActive && heat < MAX_HEAT) {
         heat = Math.min(MAX_HEAT, heat + HEAT_REGEN_RATE * dt);
       }

       this.checkUpdraftCollisions();
       this.checkWallCollisions(dt);
       this.checkRuneCollisions();
       this.updateHUD();
     },

     checkUpdraftCollisions() {
       for (let i = updrafts.length - 1; i >= 0; i--) {
         const ud = updrafts[i];
         if (ud.collected) continue;
         const dist = dragonPosition.distanceTo(ud.position);
         if (dist < 5) {
           ud.collected = true;
           heat = Math.min(MAX_HEAT, heat + UPDRAFT_HEAT_GAIN);
           playThermalChime();
           velocity.add(new THREE.Vector3(0, 5, 0));

           // Fade out the updraft
           const particleMesh = ud.mesh;
           if (particleMesh) {
             particleMesh.material.opacity = 0;
             particleMesh.material.transparent = true;
           }
         }
       }
     },

      checkWallCollisions(dt) {
        collisionCooldown -= dt;
        const x = dragonPosition.x;
        const halfWidth = CANYON_WIDTH / 2;

        if (Math.abs(x) > halfWidth - 2) {
          if (collisionCooldown <= 0) {
            if (heat >= WALL_COLLISION_HEAT_LOSS) {
              heat -= WALL_COLLISION_HEAT_LOSS;
              velocity.multiplyScalar(WALL_COLLISION_VEL_PENALTY);
              showHeatLossFlash();
              playCollisionSound();
             }
            collisionCooldown = 0.5;
          }
          dragonPosition.x = THREE.MathUtils.clamp(x, -halfWidth + 1, halfWidth - 1);
         }

        // Floor collision
       if (dragonPosition.y < 2) {
         if (collisionCooldown <= 0) {
           if (heat >= WALL_COLLISION_HEAT_LOSS) {
             heat -= WALL_COLLISION_HEAT_LOSS;
             showHeatLossFlash();
             playCollisionSound();
            }
            collisionCooldown = 0.5;
          }
         dragonPosition.y = 2;
         if (velocity.y < 0) velocity.y = 0;
        }

        // Ceiling
       if (dragonPosition.y > WALL_HEIGHT) {
         dragonPosition.y = WALL_HEIGHT;
         if (velocity.y > 0) velocity.y = 0;
        }
      },

     checkRuneCollisions() {
       for (let i = runes.length - 1; i >= 0; i--) {
         const rune = runes[i];
         if (rune.activated) continue;
         const dist = dragonPosition.distanceTo(rune.position);
         if (dist < 4 && fireBreathActive) {
           rune.activated = true;
           rune.mesh.material.emissive.setHex(0xffdd88);
           rune.mesh.material.emissiveIntensity = 2;
           playRuneActivation();
         }
       }
     },

     updateHUD() {
       const heatRatio = heat / MAX_HEAT;
       const canvas = document.getElementById("heatGaugeCanvas");
       if (!canvas) return;
       const ctx = canvas.getContext("2d");
       const w = canvas.width, h = canvas.height;
       const cx = w / 2, cy = h / 2, r = w * 0.4;

       ctx.clearRect(0, 0, w, h);

       // Background circle
       ctx.beginPath();
       ctx.arc(cx, cy, r, 0, Math.PI * 2);
       ctx.strokeStyle = "rgba(100, 60, 40, 0.5)";
       ctx.lineWidth = 8;
       ctx.stroke();

       // Heat arc
       const startAngle = -Math.PI / 2;
       const endAngle = startAngle + heatRatio * Math.PI * 2;
       ctx.beginPath();
       ctx.arc(cx, cy, r, startAngle, endAngle);

       const heatColor = heatRatio > 0.5 ? `rgb(${Math.floor(255 * heatRatio + 50)}, ${Math.floor(100 * heatRatio)}, ${Math.floor(30 * heatRatio)})` : `rgb(${Math.floor(150 + 100 * heatRatio)}, ${Math.floor(40 + 60 * heatRatio)}, 20)`;
       ctx.strokeStyle = heatColor;
       ctx.lineWidth = 10;
       ctx.lineCap = 'round';
       ctx.stroke();

       // Center glow
       const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.6);
       gradient.addColorStop(0, `rgba(255, ${Math.floor(120 * heatRatio)}, ${Math.floor(30 * heatRatio)}, 0.3)`);
       gradient.addColorStop(1, "rgba(0,0,0,0)");
       ctx.fillStyle = gradient;
       ctx.beginPath();
       ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
       ctx.fill();

       // Heat text
       ctx.fillStyle = "#ffcc88";
       ctx.font = "bold 28px monospace";
       ctx.textAlign = "center";
       ctx.textBaseline = "middle";
       ctx.fillText(Math.floor(heat), cx, cy);

       // Update distance
       const distEl = document.getElementById("distanceIndicator");
       if (distEl) {
         const remaining = Math.max(0, Math.floor(TRACK_LENGTH - distanceTraveled));
         distEl.textContent = remaining + "m to the guardian";
       }
     },
   };

   // ---- PhysicsEngine ----
   const physicsEngine = {
     update(dt) {
       const speed = boostActive ? FLIGHT_SPEED_BOOST : FLIGHT_SPEED_BASE;
       const forward = new THREE.Vector3(
         Math.sin(dragonRotation.yaw) * Math.cos(dragonRotation.pitch),
         Math.sin(dragonRotation.pitch),
         -Math.cos(dragonRotation.yaw) * Math.cos(dragonRotation.pitch)
       );

       // Apply thrust / glide
       const thrustScale = speed * dt;
       velocity.x += forward.x * thrustScale * 0.3;
       velocity.y += forward.y * thrustScale * 0.3;
       velocity.z += forward.z * thrustScale * 0.3;

       // Dive acceleration
       if (dragonRotation.pitch > 0.2) {
         velocity.y -= DIVE_ACCELERATION * dragonRotation.pitch * dt;
       }

       // Lift from updraft check
       for (const ud of updrafts) {
         if (ud.collected) continue;
         const dist = dragonPosition.distanceTo(ud.position);
         if (dist < 10) {
           const liftStrength = (1 - dist / 10) * 0.5;
           velocity.y += liftStrength;
         }
       }

       // Gravity (gentle)
       velocity.y -= GRAVITY * 0.15 * dt;

       // Drag
       velocity.multiplyScalar(DRAG_COEFFICIENT);

       // Inertia
       velocity.y *= INERTIA_FACTOR;

       // Enforce minimum speed
       const currentSpeed = velocity.length();
       if (currentSpeed < FLIGHT_SPEED_MIN) {
         velocity.normalize().multiplyScalar(FLIGHT_SPEED_MIN);
       }

       // Apply velocity to position
       dragonPosition.add(velocity.clone().multiplyScalar(dt));

       // Track distance (primarily along Z axis forward)
       distanceTraveled = Math.max(distanceTraveled, -dragonPosition.z);

       // Check sequence completion
       if (distanceTraveled >= TRACK_LENGTH && !sequenceComplete) {
         triggerSequenceComplete();
       }
     },
   };

   // ---- Dragon Model (Procedural) ----
   function createDragon() {
     dragonGroup = new THREE.Group();

     // Body - main fuselage
     const bodyGeo = new THREE.CylinderGeometry(0.8, 0.5, 5, 8);
     const bodyMat = new THREE.MeshStandardMaterial({
       color: 0x8B2500, roughness: 0.6, metalness: 0.3,
       emissive: 0x331100, emissiveIntensity: 0.1
     });
     const body = new THREE.Mesh(bodyGeo, bodyMat);
     body.rotation.z = Math.PI / 2;
     body.position.set(0, 0, 0);
     dragonGroup.add(body);

     // Head
     const headGeo = new THREE.SphereGeometry(0.6, 8, 6);
     headGeo.scale(1.5, 1, 1);
     const head = new THREE.Mesh(headGeo, bodyMat);
     head.position.set(0, 0.3, 3);
     dragonGroup.add(head);

     // Jaw
     const jawGeo = new THREE.BoxGeometry(0.8, 0.25, 1.5);
     const jaw = new THREE.Mesh(jawGeo, bodyMat);
     jaw.position.set(0, -0.15, 3.5);
     dragonGroup.add(jaw);

     // Eye glow
     const eyeGeo = new THREE.SphereGeometry(0.08, 6, 6);
     const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
     const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
     eyeL.position.set(0.35, 0.35, 3.5);
     const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
     eyeR.position.set(-0.35, 0.35, 3.5);
     dragonGroup.add(eyeL, eyeR);

     // Horns
     const hornGeo = new THREE.ConeGeometry(0.08, 0.8, 4);
     const hornMat = new THREE.MeshStandardMaterial({ color: 0xddaa66, roughness: 0.5 });
     const hornL = new THREE.Mesh(hornGeo, hornMat);
     hornL.position.set(0.25, 0.7, 2.8);
     hornL.rotation.z = -0.3;
     const hornR = new THREE.Mesh(hornGeo, hornMat);
     hornR.position.set(-0.25, 0.7, 2.8);
     hornR.rotation.z = 0.3;
     dragonGroup.add(hornL, hornR);

     // Neck
     const neckGeo = new THREE.CylinderGeometry(0.4, 0.6, 2, 8);
     const neck = new THREE.Mesh(neckGeo, bodyMat);
     neck.position.set(0, 0.2, 1.5);
     neck.rotation.x = 0.4;
     dragonGroup.add(neck);

     // Wings - left and right
     const wingShape = new THREE.Shape();
     wingShape.moveTo(0, 0);
     wingShape.lineTo(-3, 1.5);
     wingShape.lineTo(-5, 0);
     wingShape.lineTo(-5.5, -0.5);
     wingShape.lineTo(-3, -1);
     wingShape.lineTo(0, -0.5);

     wingShape.lineTo(-0.5, -0.3);
     wingShape.lineTo(-3, 0.5);
     wingShape.lineTo(-4, -0.2);
     wingShape.lineTo(-2, -0.5);
     wingShape.lineTo(0, -0.3);
     wingShape.lineTo(0, 0);

     const wingGeo = new THREE.ShapeGeometry(wingShape);
     const wingMat = new THREE.MeshStandardMaterial({
       color: 0x6B2500, roughness: 0.7, metalness: 0.2,
       side: THREE.DoubleSide,
       emissive: 0x221100, emissiveIntensity: 0.05
     });

     const wingL = new THREE.Mesh(wingGeo, wingMat);
     wingL.position.set(0, 0.3, -0.5);
     wingL.rotation.x = -Math.PI / 2;
     wingL.scale.set(0.8, 0.8, 0.8);
     wingL.name = "wingL";
     dragonGroup.add(wingL);

     const wingR = new THREE.Mesh(wingGeo.clone(), wingMat.clone());
     wingR.position.set(0, 0.3, -0.5);
     wingR.rotation.x = -Math.PI / 2;
     wingR.rotation.y = Math.PI;
     wingR.scale.set(0.8, 0.8, 0.8);
     wingR.name = "wingR";
     dragonGroup.add(wingR);

     // Tail
     const tailGeo = new THREE.CylinderGeometry(0.4, 0.05, 4, 6);
     const tail = new THREE.Mesh(tailGeo, bodyMat);
     tail.rotation.z = Math.PI / 2;
     tail.position.set(0, -0.1, -3);
     dragonGroup.add(tail);

     // Tail flame
     const tailFlameGeo = new THREE.SphereGeometry(0.2, 6, 6);
     const tailFlameMat = new THREE.MeshBasicMaterial({ color: 0xff6633 });
     const tailFlame = new THREE.Mesh(tailFlameGeo, tailFlameMat);
     tailFlame.position.set(0, 0.2, -5.2);
     tailFlame.name = "tailFlame";
     dragonGroup.add(tailFlame);

     // Spines/ridges along back
     for (let i = 0; i < 8; i++) {
       const spineGeo = new THREE.ConeGeometry(0.1, 0.5, 4);
       const spineMat = new THREE.MeshStandardMaterial({ color: 0xaa6633, roughness: 0.4 });
       const spine = new THREE.Mesh(spineGeo, spineMat);
       spine.position.set(0, 0.8, 1.5 - i * 0.6);
       spine.rotation.x = -0.3;
       dragonGroup.add(spine);
     }

     // Fire breath nozzle (at mouth)
     const breathGeo = new THREE.SphereGeometry(0.15, 6, 6);
     const breathMat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0 });
     const breathPos = new THREE.Mesh(breathGeo, breathMat);
     breathPos.position.set(0, 0.1, 4);
     breathPos.name = "breathEmitter";
     dragonGroup.add(breathPos);

     dragon = dragonGroup;
     dragon.scale.setScalar(DRAGON_SCALE);
     scene.add(dragon);
   }

   function animateDragon(dt, time) {
     // Wing flapping
     const wingFlapSpeed = 3 + velocity.length() * 0.1;
     const wingFlapAmount = 0.3;
     const wingL = dragon.getObjectByName("wingL");
     const wingR = dragon.getObjectByName("wingR");

     if (wingL && wingR) {
       const flapAngle = Math.sin(time * wingFlapSpeed) * wingFlapAmount;
       wingL.rotation.x = -Math.PI / 2 + flapAngle;
       wingR.rotation.x = -Math.PI / 2 - flapAngle;
     }

     // Tail flame flicker
     const tailFlame = dragon.getObjectByName("tailFlame");
     if (tailFlame) {
       tailFlame.scale.setScalar(0.8 + Math.sin(time * 8) * 0.3);
     }

     // Body bob
     const speed = velocity.length();
     dragonGroup.position.y = dragonPosition.y + Math.sin(time * speed * 0.1) * 0.1;
     dragonGroup.position.x = dragonPosition.x;
     dragonGroup.position.z = dragonPosition.z;

     // Apply rotations
     dragonGroup.rotation.set(
       dragonRotation.pitch,
       dragonRotation.yaw,
       dragonRotation.roll,
       "XYZ"
     );

     // Animate fire breath particles
     for (let i = fireBreathParticles.length - 1; i >= 0; i--) {
       const p = fireBreathParticles[i];
       p.life -= dt;
       if (p.life <= 0) {
         scene.remove(p.mesh);
         fireBreathParticles.splice(i, 1);
         continue;
       }
       p.mesh.position.lerpVectors(p.startPos, p.endPos, 1 - p.life / p.maxLife);
       p.mesh.material.opacity = (p.life / p.maxLife) * 0.8;
       p.mesh.scale.setScalar(p.life / p.maxLife);
     }
   }

   // ---- Fire Breath Particles ----
   function spawnFireBreath(dt) {
     const breathEmitter = dragon.getObjectByName("breathEmitter");
     if (!breathEmitter) return;

     for (let i = 0; i < 3; i++) {
       const geo = new THREE.SphereGeometry(0.2, 4, 4);
       const mat = new THREE.MeshBasicMaterial({
         color: 0xff5500, transparent: true, opacity: 0.8
       });
       const mesh = new THREE.Mesh(geo, mat);

       const worldPos = new THREE.Vector3();
       breathEmitter.getWorldPosition(worldPos);
       const direction = new THREE.Vector3(0, 0, 1).applyEuler(
         new THREE.Euler(dragonRotation.pitch, dragonRotation.yaw, 0, "XYZ")
       );

       mesh.position.copy(worldPos);
       mesh.position.x += (Math.random() - 0.5) * 0.5;
       mesh.position.y += (Math.random() - 0.5) * 0.5;

       const endPos = worldPos.clone().add(direction.multiplyScalar(15 + Math.random() * 10));
       endPos.x += (Math.random() - 0.5) * 2;
       endPos.y += (Math.random() - 0.5) * 2;

       scene.add(mesh);
       fireBreathParticles.push({
         mesh, startPos: mesh.position.clone(),
         endPos, life: 0.6, maxLife: 0.6
       });
     }
   }

   // ---- Canyon Generator ----
   function generateCanyon() {
     const wallMat = new THREE.MeshStandardMaterial({
       color: 0x2a1a1a, roughness: 0.9, metalness: 0.1
     });
     const magmaMat = new THREE.MeshStandardMaterial({
       color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 0.8, roughness: 0.3
     });

     // Floor and ceiling planes (long strips)
     const floorGeo = new THREE.PlaneGeometry(CANYON_WIDTH, TRACK_LENGTH + 100);
     const floor = new THREE.Mesh(floorGeo, wallMat);
     floor.rotation.x = -Math.PI / 2;
     floor.position.set(0, 0, -TRACK_LENGTH / 2);
     scene.add(floor);

     const ceilGeo = new THREE.PlaneGeometry(CANYON_WIDTH, TRACK_LENGTH + 100);
     const ceil = new THREE.Mesh(ceilGeo, wallMat);
     ceil.rotation.x = Math.PI / 2;
     ceil.position.set(0, WALL_HEIGHT, -TRACK_LENGTH / 2);
     scene.add(ceil);

     // Left and right walls
     const sideGeo = new THREE.PlaneGeometry(TRACK_LENGTH + 100, WALL_HEIGHT);
     const wallL = new THREE.Mesh(sideGeo, wallMat);
     wallL.rotation.y = Math.PI / 2;
     wallL.position.set(-CANYON_WIDTH / 2, WALL_HEIGHT / 2, -TRACK_LENGTH / 2);
     scene.add(wallL);

     const wallR = new THREE.Mesh(sideGeo.clone(), wallMat);
     wallR.rotation.y = -Math.PI / 2;
     wallR.position.set(CANYON_WIDTH / 2, WALL_HEIGHT / 2, -TRACK_LENGTH / 2);
     scene.add(wallR);

     // Basalt columns (procedural instancing)
     const columnGeo = new THREE.CylinderGeometry(1.5, 1.8, WALL_HEIGHT * 0.8, 6);
     for (let i = 0; i < BASALT_COLUMN_COUNT; i++) {
       const column = new THREE.Mesh(columnGeo, wallMat);
       column.position.set(
         (Math.random() > 0.5 ? 1 : -1) * (CANYON_WIDTH / 2 - 3 - Math.random() * 8),
         WALL_HEIGHT / 2,
         -20 - Math.random() * (TRACK_LENGTH - 40)
       );
       column.scale.y = 0.5 + Math.random() * 0.8;
       column.scale.x = 0.7 + Math.random() * 0.6;
       column.scale.z = 0.7 + Math.random() * 0.6;
       scene.add(column);
       wallSegments.push(column);
     }

     // Magma veins along walls
     for (let i = 0; i < MAGMA_VEIN_COUNT; i++) {
       const veinGeo = new THREE.BoxGeometry(0.3, 2 + Math.random() * 4, 10 + Math.random() * 20);
       const vein = new THREE.Mesh(veinGeo, magmaMat);
       vein.position.set(
         (Math.random() > 0.5 ? 1 : -1) * (CANYON_WIDTH / 2 - 0.5),
         Math.random() * WALL_HEIGHT * 0.8,
         -Math.random() * (TRACK_LENGTH - 20)
       );
       vein.rotation.y = Math.PI / 2;
       scene.add(vein);
     }

     // Magma pool lights on floor
     for (let i = 0; i < 10; i++) {
       const poolGeo = new THREE.CylinderGeometry(2, 2.5, 0.2, 8);
       const poolMat = new THREE.MeshStandardMaterial({
         color: 0xff3300, emissive: 0xff2200, emissiveIntensity: 1.0
       });
       const pool = new THREE.Mesh(poolGeo, poolMat);
       pool.position.set(
         (Math.random() - 0.5) * (CANYON_WIDTH - 10),
         0.1,
         -10 - Math.random() * (TRACK_LENGTH - 20)
       );
       scene.add(pool);

       const poolLight = new THREE.PointLight(0xff4400, 2, 15);
       poolLight.position.copy(pool.position);
       poolLight.position.y = 2;
       scene.add(poolLight);
     }
   }

   // ---- Thermal Updrafts ----
   function spawnUpdrafts() {
     const particleMat = new THREE.MeshBasicMaterial({
       color: 0x44ff88, transparent: true, opacity: 0.4
     });

     for (let i = 0; i < UPDRAFT_COUNT; i++) {
       const pos = new THREE.Vector3(
         (Math.random() - 0.5) * (CANYON_WIDTH * 0.6),
         10 + Math.random() * (WALL_HEIGHT - 20),
         -30 - i * (TRACK_LENGTH - 60) / UPDRAFT_COUNT
       );

       // Visual: ring of particles
       const group = new THREE.Group();
       for (let j = 0; j < 8; j++) {
         const pGeo = new THREE.SphereGeometry(0.3, 4, 4);
         const p = new THREE.Mesh(pGeo, particleMat.clone());
         const angle = (j / 8) * Math.PI * 2;
         p.position.set(Math.cos(angle) * 2, 0, Math.sin(angle) * 2);
         group.add(p);
       }
       group.position.copy(pos);
       group.userData = { animOffset: Math.random() * Math.PI * 2 };
       scene.add(group);
       updrafts.push({ position: pos, mesh: group, collected: false });
     }
   }

   // ---- Runes ----
   function spawnRunes() {
     const runeMat = new THREE.MeshStandardMaterial({
       color: 0x664400, emissive: 0x332200, emissiveIntensity: 0.3, roughness: 0.4
     });

     for (let i = 0; i < RUNE_COUNT; i++) {
       // Diamond-shaped rune
       const runeGeo = new THREE.OctahedronGeometry(1.2, 0);
       const rune = new THREE.Mesh(runeGeo, runeMat.clone());
       const posZ = -80 - i * ((TRACK_LENGTH - 100) / RUNE_COUNT);
       rune.position.set(
         (Math.random() - 0.5) * (CANYON_WIDTH * 0.4),
         12 + Math.random() * 20,
         posZ
       );
       rune.userData = { animSpeed: 1 + Math.random() };
       scene.add(rune);
       runes.push({ position: rune.position.clone(), mesh: rune, activated: false });

       // Rune light
       const light = new THREE.PointLight(0xaa8844, 1, 12);
       light.position.copy(rune.position);
       scene.add(light);
       runes[runes.length - 1].light = light;
     }
   }

   // ---- Embers ----
   function spawnEmbers() {
     const emberGeo = new THREE.SphereGeometry(0.05, 3, 3);

     for (let i = 0; i < EMBER_COUNT; i++) {
       const emissive = Math.random();
       const emberMat = new THREE.MeshBasicMaterial({
         color: emissive > 0.5 ? 0xff8833 : 0xffcc44,
         transparent: true, opacity: 0.6 + Math.random() * 0.4
       });
       const ember = new THREE.Mesh(emberGeo, emberMat);
       ember.position.set(
         (Math.random() - 0.5) * CANYON_WIDTH,
         1 + Math.random() * WALL_HEIGHT * 0.9,
         -Math.random() * TRACK_LENGTH
       );
       ember.userData = {
         baseY: ember.position.y,
         speed: 0.5 + Math.random() * 2,
         amplitude: 1 + Math.random() * 3,
         offset: Math.random() * Math.PI * 2,
         drift: (Math.random() - 0.5) * 0.5
       };
       scene.add(ember);
       embers.push(ember);
     }
   }

   // ---- Guardian (End Target) ----
   function createGuardian() {
     const guardianGroup = new THREE.Group();

     // Main body - large crystalline sphere
     const bodyGeo = new THREE.IcosahedronGeometry(4, 1);
     const bodyMat = new THREE.MeshStandardMaterial({
       color: 0xffaa33, emissive: 0xffcc44, emissiveIntensity: 1.5,
       roughness: 0.2, metalness: 0.8
     });
     const mainBody = new THREE.Mesh(bodyGeo, bodyMat);
     guardianGroup.add(mainBody);

     // Inner glow sphere
     const glowGeo = new THREE.SphereGeometry(5, 16, 16);
     const glowMat = new THREE.MeshBasicMaterial({
       color: 0xffdd66, transparent: true, opacity: 0.15
     });
     const glow = new THREE.Mesh(glowGeo, glowMat);
     glow.name = "guardianGlow";
     guardianGroup.add(glow);

     // Orbiting crystal shards
     for (let i = 0; i < 6; i++) {
       const shardGeo = new THREE.OctahedronGeometry(0.8, 0);
       const shardMat = new THREE.MeshStandardMaterial({
         color: 0xddcc55, emissive: 0xaabb33, emissiveIntensity: 1, metalness: 0.6
       });
       const shard = new THREE.Mesh(shardGeo, shardMat);
       const angle = (i / 6) * Math.PI * 2;
       shard.position.set(Math.cos(angle) * 7, 2 + i * 1.5, Math.sin(angle) * 7);
       shard.rotation.x = i * 0.5;
       shard.userData.orbitAngle = angle;
       shard.userData.orbitSpeed = 0.5 + i * 0.1;
       shard.name = "guardianShard";
       guardianGroup.add(shard);
     }

     // Guardian light
     const guardianLight = new THREE.PointLight(0xffdd66, 10, 50);
     guardianLight.position.set(0, 5, 0);
     guardianGroup.add(guardianLight);

     guardianGroup.position.set(0, 30, -TRACK_LENGTH + 10);
     scene.add(guardianGroup);
     return guardianGroup;
   }

   let guardianGroup = null;

   // ---- Lighting ----
   function setupLighting() {
     // Ambient
     const ambient = new THREE.AmbientLight(0x221111, 0.5);
     scene.add(ambient);

     // Main environment light (warm)
     const mainLight = new THREE.DirectionalLight(0xffaa66, 0.8);
     mainLight.position.set(10, 30, -50);
     scene.add(mainLight);

     // Hemisphere light for sky/ground color
     const hemi = new THREE.HemisphereLight(0xcc5533, 0x1a0a0a, 0.4);
     scene.add(hemi);

     // Fog
     scene.fog = new THREE.FogExp2(0x1a0a0a, 0.008);

     // Post-warm tone via camera background
     scene.background = new THREE.Color(0x150808);
   }

   // ---- Volumetric-like Fog Planes ----
   function addFogPlanes() {
     const fogMat = new THREE.MeshBasicMaterial({
       color: 0xcc5533, transparent: true, opacity: 0.03, side: THREE.DoubleSide
     });

     for (let i = 0; i < 30; i++) {
       const fogGeo = new THREE.PlaneGeometry(CANYON_WIDTH * 0.8, 20);
       const fogPlane = new THREE.Mesh(fogGeo, fogMat.clone());
       fogPlane.position.set(
         (Math.random() - 0.5) * 10,
         WALL_HEIGHT * 0.3 + Math.random() * WALL_HEIGHT * 0.4,
         -Math.random() * TRACK_LENGTH
       );
       fogPlane.rotation.y = Math.random() * Math.PI;
       fogPlane.userData = {
         driftSpeed: 0.2 + Math.random() * 0.3,
         driftOffset: Math.random() * Math.PI * 2,
         baseX: fogPlane.position.x
       };
       scene.add(fogPlane);
     }
   }

   // ---- Audio System ----
   function initAudio() {
     try {
       audioCtx = new (window.AudioContext || window.webkitAudioContext)();

       // Master gain
       const masterGain = audioCtx.createGain();
       masterGain.gain.value = 0.5;
       masterGain.connect(audioCtx.destination);

       // Background music gain layer
       bgMusicGain = audioCtx.createGain();
       bgMusicGain.gain.value = 0;
       bgMusicGain.connect(masterGain);

       // Start ambient wind
       playAmbientWind();
     } catch (e) {
       console.warn("Audio init failed:", e);
     }
   }

   function playAmbientWind() {
     if (!audioCtx) return;

     // Pink noise for wind
     const bufferSize = audioCtx.sampleRate * 2;
     const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
     const data = buffer.getChannelData(0);
     let lastOut = 0;
     for (let i = 0; i < bufferSize; i++) {
       const white = Math.random() * 2 - 1;
       data[i] = (lastOut + (0.02 * white)) / 1.02;
       lastOut = data[i];
       data[i] *= 3.5;
     }

     const windSource = audioCtx.createBufferSource();
     windSource.buffer = buffer;
     windSource.loop = true;

     const windFilter = audioCtx.createBiquadFilter();
     windFilter.type = 'lowpass';
     windFilter.frequency.value = 400;

     const windGain = audioCtx.createGain();
     windGain.gain.value = 0.15;

     windSource.connect(windFilter);
     windFilter.connect(windGain);
     windGain.connect(bgMusicGain);
     windSource.start();

     // Low drone for dragon core
     const droneOsc = audioCtx.createOscillator();
     droneOsc.type = 'sine';
     droneOsc.frequency.value = 55;
     const droneGain = audioCtx.createGain();
     droneGain.gain.value = 0.08;
     droneOsc.connect(droneGain);
     droneGain.connect(bgMusicGain);
     droneOsc.start();

     // Glass chimes - periodic
     const chimeInterval = setInterval(() => {
       if (!sequenceStarted || sequenceComplete) return;
       if (Math.random() < 0.3) playGlassChime(1200 + Math.random() * 2000);
     }, 800);

     // Velocity-driven layers (glass chimes become more frequent with speed)
     wingFlapAudio.ctx = audioCtx;
     wingFlapAudio.gain = bgMusicGain;
   }

   function playWingFlap() {
     if (!audioCtx) return;
     const now = audioCtx.currentTime;

     // Leather flap noise
     const bufferSize = audioCtx.sampleRate * 0.08;
     const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
     const data = buffer.getChannelData(0);
     for (let i = 0; i < bufferSize; i++) {
       data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
     }

     const source = audioCtx.createBufferSource();
     source.buffer = buffer;

     const filter = audioCtx.createBiquadFilter();
     filter.type = 'bandpass';
     filter.frequency.value = 800;
     filter.Q.value = 2;

     const gain = audioCtx.createGain();
     gain.gain.setValueAtTime(0.12, now);
     gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

     source.connect(filter);
     filter.connect(gain);
     gain.connect(audioCtx.destination);
     source.start(now);
   }

   function playThermalChime() {
     if (!audioCtx) return;
     const now = audioCtx.currentTime;

     for (let i = 0; i < 3; i++) {
       const osc = audioCtx.createOscillator();
       osc.type = 'sine';
       osc.frequency.value = 1500 + i * 400;
       const g = audioCtx.createGain();
       g.gain.setValueAtTime(0.1, now);
       g.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.15);
       osc.connect(g);
       g.connect(audioCtx.destination);
       osc.start(now + i * 0.08);
       osc.stop(now + 0.7 + i * 0.15);
     }
   }

   function playGlassChime(freq) {
     if (!audioCtx) return;
     const now = audioCtx.currentTime;
     const osc = audioCtx.createOscillator();
     osc.type = 'sine';
     osc.frequency.value = freq;
     const g = audioCtx.createGain();
     g.gain.value = 0.03;
     g.gain.exponentialRampToValueAtTime(0.001, now + 1);
     osc.connect(g);
     g.connect(bgMusicGain);
     osc.start(now);
     osc.stop(now + 1);
   }

   function playCollisionSound() {
     if (!audioCtx) return;
     const now = audioCtx.currentTime;

     // Dull thud
     const osc = audioCtx.createOscillator();
     osc.type = 'sine';
     osc.frequency.setValueAtTime(120, now);
     osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
     const g = audioCtx.createGain();
     g.gain.setValueAtTime(0.2, now);
     g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
     osc.connect(g);
     g.connect(audioCtx.destination);
     osc.start(now);
     osc.stop(now + 0.4);

     // Sizzle
     const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.3, audioCtx.sampleRate);
     const d = buf.getChannelData(0);
     for (let i = 0; i < d.length; i++) {
       d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.1));
     }
     const noise = audioCtx.createBufferSource();
     noise.buffer = buf;
     const filt = audioCtx.createBiquadFilter();
     filt.type = 'highpass';
     filt.frequency.value = 3000;
     const ng = audioCtx.createGain();
     ng.gain.value = 0.06;
     noise.connect(filt);
     filt.connect(ng);
     ng.connect(audioCtx.destination);
     noise.start(now + 0.1);
   }

   function playFireBreathSFX() {
     if (!audioCtx || !fireBreathActive) return;
     const now = audioCtx.currentTime;

     // Sustained crackle - update pitch based on heat
     const heatRatio = heat / MAX_HEAT;
     const pitch = 100 + (1 - heatRatio) * 300;

     const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
     const d = buf.getChannelData(0);
     for (let i = 0; i < d.length; i++) {
       d[i] = (Math.random() * 2 - 1);
     }
     const noise = audioCtx.createBufferSource();
     noise.buffer = buf;
     const filt = audioCtx.createBiquadFilter();
     filt.type = 'bandpass';
     filt.frequency.value = pitch;
     filt.Q.value = 1;
     const g = audioCtx.createGain();
     g.gain.value = 0.08;
     noise.connect(filt);
     filt.connect(g);
     g.connect(audioCtx.destination);
     noise.start(now);
   }

   function playRuneActivation() {
     if (!audioCtx) return;
     const now = audioCtx.currentTime;
     for (let i = 0; i < 5; i++) {
       const osc = audioCtx.createOscillator();
       osc.type = 'triangle';
       osc.frequency.value = 600 + i * 250;
       const g = audioCtx.createGain();
       g.gain.setValueAtTime(0.08, now);
       g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
       osc.connect(g);
       g.connect(audioCtx.destination);
       osc.start(now + i * 0.06);
       osc.stop(now + 0.9);
     }
   }

   function playGuardianAwakening() {
     if (!audioCtx) return;
     const now = audioCtx.currentTime;
     // Triumphant chord
     const freqs = [523, 659, 784, 1047];
     freqs.forEach((f, i) => {
       const osc = audioCtx.createOscillator();
       osc.type = 'sine';
       osc.frequency.value = f;
       const g = audioCtx.createGain();
       g.gain.setValueAtTime(0, now);
       g.gain.linearRampToValueAtTime(0.15, now + 0.5);
       g.gain.linearRampToValueAtTime(0.05, now + 3);
       g.gain.exponentialRampToValueAtTime(0.001, now + 5);
       osc.connect(g);
       g.connect(audioCtx.destination);
       osc.start(now + i * 0.1);
       osc.stop(now + 5);
     });
   }

   // ---- UI Functions ----
   function showHeatLossFlash() {
     const flash = document.getElementById("heatLossFlash");
     if (flash) {
       flash.style.opacity = "1";
       setTimeout(() => { flash.style.opacity = "0"; }, 200);
     }
   }

   function triggerSequenceComplete() {
     sequenceComplete = true;
     sequenceStarted = false;
     playGuardianAwakening();

     // Hide HUD
     document.getElementById("hud").style.display = "none";

     // Show complete screen
     const cs = document.getElementById("completeScreen");
     cs.style.display = "flex";
     setTimeout(() => { cs.style.opacity = "1"; }, 100);

     // Dramatic camera pull-back
     camera.position.set(0, 60, -TRACK_LENGTH + 30);
     camera.lookAt(guardianGroup.position.x, guardianGroup.position.y, guardianGroup.position.z);
   }

   // ---- Input Handling ----
   function setupInput() {
     const keyMap = {
       'KeyW': 'w', 'KeyS': 's', 'KeyA': 'a', 'KeyD': 'd',
       'Space': 'space', 'ShiftLeft': 'shift', 'ShiftRight': 'shift',
       'ArrowUp': 'arrowUp', 'ArrowDown': 'arrowDown',
       'ArrowLeft': 'arrowLeft', 'ArrowRight': 'arrowRight'
     };

     window.addEventListener('keydown', (e) => {
       const key = keyMap[e.code];
       if (key) { inputs[key] = true; e.preventDefault(); }
     });

     window.addEventListener('keyup', (e) => {
       const key = keyMap[e.code];
       if (key) { inputs[key] = false; e.preventDefault(); }
     });
   }

   // ---- Start / Restart ----
   function startGame() {
     document.getElementById("startMenu").style.opacity = "0";
     setTimeout(() => {
       document.getElementById("startMenu").style.display = "none";
       document.getElementById("hud").style.display = "block";
     }, 800);

     initAudio();
     sequenceStarted = true;
     sequenceComplete = false;

     // Reset state
     dragonPosition.set(0, 20, 0);
     dragonRotation = { pitch: 0, roll: 0, yaw: Math.PI };
     velocity.set(0, 0, -FLIGHT_SPEED_BASE);
     heat = MAX_HEAT;
     distanceTraveled = 0;
     fireBreathActive = false;
     boostActive = false;
     boostTimer = 0;
     collisionCooldown = 0;
     camera.fov = cameraSystem.baseFov;

     // Reset updrafts
     updrafts.forEach(ud => {
       ud.collected = false;
       if (ud.mesh) ud.mesh.material.opacity = 0.4;
     });

     // Reset runes
     runes.forEach(r => {
       r.activated = false;
       r.mesh.material.emissive.setHex(0x332200);
       r.mesh.material.emissiveIntensity = 0.3;
       if (r.light) r.light.intensity = 1;
     });
   }

   // ---- Game Update ----
   function update(dt, time) {
     if (!sequenceStarted || sequenceComplete) {
       // Animate guardian slowly when not in game or after completion
       if (guardianGroup) {
         guardianGroup.rotation.y = time * 0.2;
         guardianGroup.children.forEach(child => {
           if (child.name === "guardianGlow") {
             child.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
           }
           if (child.name === "guardianShard") {
             child.rotation.x = time * child.userData.orbitSpeed;
             child.rotation.y = time * child.userData.orbitSpeed * 0.7;
           }
         });
       }
       animateDragon(dt, time);
       return;
     }

     flightController.handleInput(dt);
     physicsEngine.update(dt);
     thermalSystem.update(dt);
     animateDragon(dt, time);
     cameraSystem.update(dt);

     // Animate embers
     embers.forEach(ember => {
       const ud = ember.userData;
       ember.position.y = ud.baseY + Math.sin(time * ud.speed + ud.offset) * ud.amplitude;
       ember.position.x += ud.drift * dt;
       ember.material.opacity = 0.3 + Math.sin(time * ud.speed * 2 + ud.offset) * 0.3;
     });

     // Animate updrafts
     updrafts.forEach(ud => {
       if (!ud.collected && ud.mesh) {
         ud.mesh.rotation.y = time * 0.5 + ud.mesh.userData.animOffset;
         ud.mesh.children.forEach(p => {
           p.position.y = Math.sin(time * 2 + p.position.x) * 1.5;
         });
       }
     });

     // Animate runes
     runes.forEach(r => {
       if (!r.activated) {
         r.mesh.rotation.y = time * r.mesh.userData.animSpeed;
         r.mesh.rotation.x = time * 0.3;
       } else {
         r.mesh.rotation.y = time * 2;
         r.mesh.scale.setScalar(1 + Math.sin(time * 4) * 0.15);
       }
     });

     // Animate guardian
     if (guardianGroup) {
       guardianGroup.rotation.y = time * 0.15;
       guardianGroup.children.forEach(child => {
         if (child.name === "guardianShard") {
           child.rotation.x = time * child.userData.orbitSpeed;
         }
       });
     }

     // Fire breath sound
     if (fireBreathActive) {
       playFireBreathSFX();
     }

     // Music intensity based on velocity
     if (bgMusicGain) {
       const speed = velocity.length();
       const targetVol = Math.min(speed / FLIGHT_SPEED_BOOST, 1) * 0.6 + 0.2;
       bgMusicGain.gain.value += (targetVol - bgMusicGain.gain.value) * dt * 2;
     }

     // Update distance text
     thermalSystem.updateHUD();
   }

   // ---- Scene Setup ----
   function initScene() {
     scene = new THREE.Scene();
     scene.fog = new THREE.FogExp2(0x1a0a0a, 0.008);
     scene.background = new THREE.Color(0x150808);

     // Camera
     camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
     camera.position.set(0, 23, -8);

     // Renderer
     renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
     renderer.setSize(window.innerWidth, window.innerHeight);
     renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
     renderer.shadowMap.enabled = false; // Performance
     document.body.appendChild(renderer.domElement);

     setupLighting();
     createDragon();
     generateCanyon();
     spawnUpdrafts();
     spawnRunes();
     spawnEmbers();
     addFogPlanes();
     guardianGroup = createGuardian();

     // Resize handler
     window.addEventListener('resize', () => {
       camera.aspect = window.innerWidth / window.innerHeight;
       camera.updateProjectionMatrix();
       renderer.setSize(window.innerWidth, window.innerHeight);
     });
   }

   // ---- Main Game Loop ----
   function gameLoop() {
     requestAnimationFrame(gameLoop);

     const now = performance.now();
     let dt = Math.min((now - lastTime) / 1000, 0.05);
     if (lastTime === 0) dt = 0; // first frame
     lastTime = now;

     const time = now / 1000;
     update(dt, time);
     renderer.render(scene, camera);
   }

   // ---- Bootstrap ----
   function init() {
     setupInput();
     initScene();

     // Initially show start menu, camera positioned to look at dragon
     camera.position.set(3, 5, -10);
     camera.lookAt(dragonPosition.x, dragonPosition.y, dragonPosition.z);

     // Start button
     document.getElementById("startBtn").addEventListener("click", () => {
       startGame();
     });

     // Restart button
     document.getElementById("restartBtn").addEventListener("click", () => {
       const cs = document.getElementById("completeScreen");
       cs.style.opacity = "0";
       setTimeout(() => {
         cs.style.display = "none";
         startGame();
       }, 800);
     });

     // Initial render
     gameLoop();
   }

   // Start when DOM ready
   if (document.readyState === "loading") {
     document.addEventListener("DOMContentLoaded", init);
   } else {
     init();
   }
})();
