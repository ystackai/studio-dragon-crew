// ============================================================
//  DRAGON FLIGHT - Volcanic Canyon Vertical Slice
//  Three.js-based 3D browser game
//  Enhanced: Dragon model, canyon assets, particles, effects
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
    const PITCH_AUTO_LEVEL = 1.8;
    const ROLL_AUTO_LEVEL = 2.8;
    const LIFT_FORCE = 9.8;
    const GRAVITY = 9.8;
    const DIVE_ACCELERATION = 20;
    const BOOST_DURATION = 1.5;
    const UPDRAFT_COUNT = 20;
    const RUNE_COUNT = 8;
    const BASALT_COLUMN_COUNT = 80;
    const MAGMA_VEIN_COUNT = 30;
    const EMBER_COUNT = 200;

    // Warm saturated palette
    const PAL = {
        crimson:   0x8B1A1A,
        deepCrimson: 0x5A0A0A,
        amber:     0xFF8C00,
        gold:      0xDAA520,
        obsidian:  0x1A1A2E,
        darkObs:   0x0D0D1A,
        warmGlow:  0xFF6633,
        magma:     0xFF4400,
        emeraldUpdraft: 0x33DD77,
        darkRed:   0x6B2500,
        scaleGold: 0xCC9944,
        bone:      0xDDAA66,
        eyeGold:   0xFFAA00,
    };

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
    let embers = [];
    let fireBreathParticles = [];
    let magmaVeins = [];
    let audioCtx = null;
    let bgMusicGain = null;
    let wingFlapAudio = {};
    let inputs = { w: false, a: false, s: false, d: false, space: false, shift: false, arrowUp: false, arrowDown: false, arrowLeft: false, arrowRight: false };
    let collisionCooldown = 0;
    let fireBreathSoundTimer = 0;

    // ---- Camera System ----
    const cameraSystem = {
        baseFov: 55,
        currentFov: 55,
        targetFov: 55,
        offset: new THREE.Vector3(0, 2.5, -9),
        lookOffset: new THREE.Vector3(0, 0.5, 12),
        damping: 6,
        smoothPos: new THREE.Vector3(),
        smoothLook: new THREE.Vector3(),
        update(dt) {
            const speed = velocity.length();
            const speedRatio = Math.min(speed / FLIGHT_SPEED_BOOST, 1);

            this.targetFov = this.baseFov - speedRatio * 25;
            if (boostActive) this.targetFov -= 12;

            this.currentFov += (this.targetFov - this.currentFov) * this.damping * dt;
            camera.fov = this.currentFov;
            camera.updateProjectionMatrix();

            const targetCamPos = dragonPosition.clone();
            const dragonEuler = new THREE.Euler(dragonRotation.pitch, dragonRotation.yaw, 0, 'XYZ');
            const camOffset = this.offset.clone().applyEuler(dragonEuler);
            targetCamPos.add(camOffset);

            this.smoothPos.lerp(targetCamPos, Math.min(this.damping * dt * 2.5, 1));
            camera.position.copy(this.smoothPos);

            const lookTarget = dragonPosition.clone();
            const lookOff = this.lookOffset.clone().applyEuler(dragonEuler);
            lookTarget.add(lookOff);

            this.smoothLook.lerp(lookTarget, Math.min(this.damping * dt * 1.8, 1));
            camera.lookAt(this.smoothLook);
        },
    };

    // ---- DragonFlightController ----
    const flightController = {
        wingFlapTimer: 0,
        handleInput(dt) {
            // Aircraft-style pitch: W/Up pushes the nose down, S/Down pulls up.
            const pitchInput = (inputs.w || inputs.arrowUp ? -1 : 0) + (inputs.s || inputs.arrowDown ? 1 : 0);
            const turnInput = (inputs.a || inputs.arrowLeft ? -1 : 0) + (inputs.d || inputs.arrowRight ? 1 : 0);
            const yawInput = -turnInput;

            dragonRotation.pitch += pitchInput * PITCH_RATE * dt;
            if (pitchInput === 0) {
                dragonRotation.pitch = THREE.MathUtils.damp(dragonRotation.pitch, 0, PITCH_AUTO_LEVEL, dt);
            }
            dragonRotation.pitch = THREE.MathUtils.clamp(dragonRotation.pitch, -Math.PI / 3, Math.PI / 3);

            dragonRotation.roll += turnInput * ROLL_RATE * dt;
            if (turnInput === 0) {
                dragonRotation.roll = THREE.MathUtils.damp(dragonRotation.roll, 0, ROLL_AUTO_LEVEL, dt);
            }
            dragonRotation.roll = THREE.MathUtils.clamp(dragonRotation.roll, -Math.PI / 3, Math.PI / 3);

            const autoYaw = -dragonRotation.roll * 0.3;
            dragonRotation.yaw += autoYaw * dt + yawInput * YAW_RATE * dt * 0.3;

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

            fireBreathActive = inputs.shift && heat > 0;
            if (fireBreathActive) {
                heat = Math.max(0, heat - FIRE_BREATH_DRAIN_RATE * dt);
                spawnFireBreath(dt);
            }

            this.wingFlapTimer -= dt;
            if ((pitchInput !== 0 || turnInput !== 0) && this.wingFlapTimer <= 0) {
                playWingFlap();
                this.wingFlapTimer = 0.12;
            }
        },
    };

    // ---- ThermalSystem ----
    const thermalSystem = {
        update(dt) {
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

                    // Fade out the updraft particles
                    if (ud.particles) {
                        ud.particles.forEach(p => {
                            if (p.material) {
                                p.material.opacity = 0;
                                p.material.transparent = true;
                            }
                        });
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
                    rune.mesh.material.emissiveIntensity = 2.5;
                    if (rune.light) rune.light.intensity = 5;
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
            const cx = w / 2, cy = h / 2, r = w * 0.38;

            ctx.clearRect(0, 0, w, h);

            // Outer ring
            ctx.beginPath();
            ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(80, 40, 20, 0.3)";
            ctx.lineWidth = 3;
            ctx.stroke();

            // Background circle
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(100, 60, 40, 0.4)";
            ctx.lineWidth = 8;
            ctx.stroke();

            // Heat arc (bright warm colors)
            const startAngle = -Math.PI / 2;
            const endAngle = startAngle + heatRatio * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(cx, cy, r, startAngle, endAngle);

            const heatR = Math.floor(255 * heatRatio + 80);
            const heatG = Math.floor(100 * heatRatio + 20);
            const heatB = Math.floor(20 * heatRatio);
            ctx.strokeStyle = `rgb(${Math.min(heatR, 255)}, ${Math.min(heatG, 255)}, ${Math.min(heatB, 255)})`;
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Inner glow
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.7);
            gradient.addColorStop(0, `rgba(255, ${Math.floor(140 * heatRatio)}, ${Math.floor(40 * heatRatio)}, 0.35)`);
            gradient.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
            ctx.fill();

            // Heat number
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
                -Math.sin(dragonRotation.pitch),
                Math.cos(dragonRotation.yaw) * Math.cos(dragonRotation.pitch)
            );

            const thrustScale = speed * dt;
            velocity.x += forward.x * thrustScale * 0.3;
            velocity.y += forward.y * thrustScale * 0.3;
            velocity.z += forward.z * thrustScale * 0.3;

            if (dragonRotation.pitch > 0.2) {
                velocity.y -= DIVE_ACCELERATION * dragonRotation.pitch * dt;
            }

            for (const ud of updrafts) {
                if (ud.collected) continue;
                const dist = dragonPosition.distanceTo(ud.position);
                if (dist < 10) {
                    const liftStrength = (1 - dist / 10) * 0.5;
                    velocity.y += liftStrength;
                }
            }

            velocity.y -= GRAVITY * 0.15 * dt;
            velocity.multiplyScalar(DRAG_COEFFICIENT);
            velocity.y *= INERTIA_FACTOR;

            const currentSpeed = velocity.length();
            if (currentSpeed < FLIGHT_SPEED_MIN) {
                velocity.normalize().multiplyScalar(FLIGHT_SPEED_MIN);
            }

            dragonPosition.add(velocity.clone().multiplyScalar(dt));
            distanceTraveled = Math.max(distanceTraveled, -dragonPosition.z);

            if (distanceTraveled >= TRACK_LENGTH && !sequenceComplete) {
                triggerSequenceComplete();
            }
        },
    };

    // ---- Hexagonal Basalt Column Geometry ----
    function createHexCylinderGeometry(radiusTop, radiusBottom, height, segmentsH, radialSegments) {
        const positions = [];
        const normals = [];
        const indices = [];
        const rs = 6; // hexagonal

        function ringAt(y, radius) {
            const ring = [];
            for (let i = 0; i < rs; i++) {
                const a = (i / rs) * Math.PI * 2 + Math.PI / rs; // offset for flat-top hex
                ring.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
            }
            return ring;
        }

        const topRing = ringAt(height / 2, radiusTop);
        const bottomRing = ringAt(-height / 2, radiusBottom);

        // Side faces
        for (let i = 0; i < rs; i++) {
            const next = (i + 1) % rs;
            const t0 = topRing[i], t1 = topRing[next];
            const b0 = bottomRing[i], b1 = bottomRing[next];

            const v0 = new THREE.Vector3().subVectors(t1, t0);
            const v1 = new THREE.Vector3().subVectors(b0, t0);
            const faceNormal = new THREE.Vector3().crossVectors(v0, v1).normalize();

            // Two triangles per quad
            const baseIdx = positions.length / 3;
            [t0, t1, b1, t0, b1, b0].forEach(v => {
                positions.push(v.x, v.y, v.z);
                normals.push(faceNormal.x, faceNormal.y, faceNormal.z);
            });
            indices.push(baseIdx, baseIdx + 1, baseIdx + 2, baseIdx, baseIdx + 2, baseIdx + 3);
        }

        // Top cap
        const topCenter = (positions.length / 3);
        positions.push(0, height / 2, 0);
        normals.push(0, 1, 0);
        for (let i = 0; i < rs; i++) {
            const next = (i + 1) % rs;
            positions.push(topRing[i].x, topRing[i].y, topRing[i].z);
            normals.push(0, 1, 0);
            positions.push(topRing[next].x, topRing[next].y, topRing[next].z);
            normals.push(0, 1, 0);
            indices.push(topCenter, topCenter + 1 + i * 2, topCenter + 1 + i * 2 + 1);
        }

        // Bottom cap
        const botCenter = (positions.length / 3);
        positions.push(0, -height / 2, 0);
        normals.push(0, -1, 0);
        for (let i = 0; i < rs; i++) {
            const next = (i + 1) % rs;
            positions.push(bottomRing[next].x, bottomRing[next].y, bottomRing[next].z);
            normals.push(0, -1, 0);
            positions.push(bottomRing[i].x, bottomRing[i].y, bottomRing[i].z);
            normals.push(0, -1, 0);
            indices.push(botCenter, botCenter + 1 + i * 2, botCenter + 1 + i * 2 + 1);
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        return geo;
    }

    // ---- Dragon Model (Enhanced Procedural Low-Poly) ----
    function createDragon() {
        dragonGroup = new THREE.Group();

        // Materials
        const bodyMat = new THREE.MeshStandardMaterial({
            color: PAL.deepCrimson, roughness: 0.65, metalness: 0.25,
            emissive: 0x331100, emissiveIntensity: 0.15
        });

        const bellyMat = new THREE.MeshStandardMaterial({
            color: PAL.amber, roughness: 0.7, metalness: 0.1,
            emissive: 0x553300, emissiveIntensity: 0.1
        });

        const darkPlateMat = new THREE.MeshStandardMaterial({
            color: PAL.crimson, roughness: 0.5, metalness: 0.3,
            emissive: 0x441100, emissiveIntensity: 0.1
        });

        const wingMat = new THREE.MeshStandardMaterial({
            color: PAL.darkRed, roughness: 0.75, metalness: 0.15,
            side: THREE.DoubleSide,
            emissive: 0x221100, emissiveIntensity: 0.05
        });

        const membraneMat = new THREE.MeshStandardMaterial({
            color: 0x4A1500, roughness: 0.8, metalness: 0.05,
            side: THREE.DoubleSide, transparent: true, opacity: 0.7
        });

        const hornMat = new THREE.MeshStandardMaterial({
            color: PAL.bone, roughness: 0.4, metalness: 0.2
        });

        const scaleMat = new THREE.MeshStandardMaterial({
            color: PAL.scaleGold, roughness: 0.35, metalness: 0.4,
            emissive: 0x664400, emissiveIntensity: 0.2
        });

        const eyeMat = new THREE.MeshBasicMaterial({ color: PAL.eyeGold });
        const tailFlameMat = new THREE.MeshBasicMaterial({ color: PAL.warmGlow });
        const breathMat = new THREE.MeshBasicMaterial({ color: PAL.magma, transparent: true, opacity: 0 });

        // ---- Body segments ----
        // Torso - tapered cylinder
        const torsoGeo = new THREE.CylinderGeometry(0.6, 0.9, 4.5, 7);
        const torso = new THREE.Mesh(torsoGeo, bodyMat);
        torso.rotation.z = Math.PI / 2;
        torso.position.set(0, 0, -0.3);
        dragonGroup.add(torso);

        // Chest - slightly larger front
        const chestGeo = new THREE.SphereGeometry(0.85, 7, 5);
        chestGeo.scale(1, 0.9, 0.8);
        const chest = new THREE.Mesh(chestGeo, bodyMat);
        chest.position.set(0, 0, 1.5);
        dragonGroup.add(chest);

        // Belly scales (belly-facing)
        for (let i = 0; i < 5; i++) {
            const scaleGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.6, 5);
            const s = new THREE.Mesh(scaleGeo, scaleMat);
            s.rotation.z = Math.PI / 2;
            s.position.set(0, -0.55, 1.2 - i * 0.8);
            s.rotation.x = 0.2;
            dragonGroup.add(s);
        }

        // ---- Head Group (with jaw) ----
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.4, 3.5);

        // Head main
        const headGeo = new THREE.SphereGeometry(0.55, 7, 5);
        headGeo.scale(1.6, 0.85, 0.9);
        const head = new THREE.Mesh(headGeo, darkPlateMat);
        headGroup.add(head);

        // Snout protrusion
        const snoutGeo = new THREE.ConeGeometry(0.3, 1.2, 6);
        const snout = new THREE.Mesh(snoutGeo, bodyMat);
        snout.rotation.x = Math.PI / 2;
        snout.position.set(0, -0.05, 0.65);
        headGroup.add(snout);

        // Upper jaw
        const upperJawGeo = new THREE.BoxGeometry(0.5, 0.12, 0.8);
        const upperJaw = new THREE.Mesh(upperJawGeo, darkPlateMat);
        upperJaw.position.set(0, -0.1, 0.5);
        headGroup.add(upperJaw);

        // Lower jaw (articulated)
        const lowerJawGeo = new THREE.BoxGeometry(0.45, 0.1, 0.7);
        const lowerJaw = new THREE.Mesh(lowerJawGeo, bellyMat);
        lowerJaw.position.set(0, -0.25, 0.55);
        lowerJaw.name = "lowerJaw";
        headGroup.add(lowerJaw);

        // Teeth along jaw edges
        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < 3; i++) {
                const toothGeo = new THREE.ConeGeometry(0.04, 0.18, 3);
                const tooth = new THREE.Mesh(toothGeo, hornMat);
                tooth.position.set(side * 0.15, -0.02, 0.3 + i * 0.2);
                tooth.rotation.x = 0.3;
                headGroup.add(tooth);
            }
        }

        // Nostril glow
        const nostrilMat = new THREE.MeshBasicMaterial({ color: 0xff6633, transparent: true, opacity: 0.6 });
        for (let side = -1; side <= 1; side += 2) {
            const nostrilGeo = new THREE.SphereGeometry(0.06, 4, 4);
            const nostril = new THREE.Mesh(nostrilGeo, nostrilMat);
            nostril.position.set(side * 0.12, 0.02, 1.1);
            headGroup.add(nostril);
        }

        // Eyes
        for (let side = -1; side <= 1; side += 2) {
            const eyeGeo = new THREE.SphereGeometry(0.09, 5, 5);
            eyeGeo.scale(1.2, 0.8, 0.7);
            const eye = new THREE.Mesh(eyeGeo, eyeMat);
            eye.position.set(side * 0.3, 0.12, 0.25);
            headGroup.add(eye);

            // Eye slit
            const pupilGeo = new THREE.SphereGeometry(0.03, 4, 4);
            pupilGeo.scale(0.4, 1.5, 0.6);
            const pupil = new THREE.Mesh(pupilGeo, new THREE.MeshBasicMaterial({ color: 0x221100 }));
            pupil.position.set(side * 0.3, 0.12, 0.32);
            headGroup.add(pupil);
        }

        // Horns - curved
        for (let side = -1; side <= 1; side += 2) {
            const hornGeo = new THREE.ConeGeometry(0.07, 1.0, 5);
            const horn = new THREE.Mesh(hornGeo, hornMat);
            horn.position.set(side * 0.2, 0.55, 0.1);
            horn.rotation.z = side * 0.4;
            horn.rotation.x = -0.3;
            headGroup.add(horn);
        }

        // Brow ridges / crest
        const crestGeo = new THREE.ConeGeometry(0.12, 0.6, 4);
        const crest = new THREE.Mesh(crestGeo, darkPlateMat);
        crest.position.set(0, 0.55, -0.1);
        crest.rotation.x = -0.4;
        headGroup.add(crest);

        dragonGroup.add(headGroup);

        // ---- Neck (segmented) ----
        const neckMat = bodyMat.clone();
        for (let i = 0; i < 3; i++) {
            const r = 0.45 + i * 0.1;
            const neckSegGeo = new THREE.CylinderGeometry(r, r - 0.05, 0.6, 7);
            const seg = new THREE.Mesh(neckSegGeo, neckMat);
            seg.position.set(0, 0.1 + i * 0.02, 2.2 - i * 0.5);
            seg.rotation.x = 0.35 + i * 0.1;
            dragonGroup.add(seg);
        }

        // ---- Wings (left and right with bone structure and membrane) ----
        for (let side = -1; side <= 1; side += 2) {
            const wingGroup = new THREE.Group();
            wingGroup.position.set(0, 0.4, -0.5);

            // Shoulder joint
            const shoulderGeo = new THREE.SphereGeometry(0.3, 5, 5);
            shoulderGeo.scale(1, 0.8, 0.6);
            const shoulder = new THREE.Mesh(shoulderGeo, darkPlateMat);
            wingGroup.add(shoulder);

            // Wing bones (fingers)
            const boneMat = new THREE.MeshStandardMaterial({ color: PAL.bone, roughness: 0.5 });
            const bonePositions = [
                { dir: new THREE.Vector3(side * 0.5, 1.8, -0.3), len: 4.5, idx: 0 },
                { dir: new THREE.Vector3(side * 0.8, 1.2, -0.5), len: 5.5, idx: 1 },
                { dir: new THREE.Vector3(side * 1.0, 0.5, -0.8), len: 4.0, idx: 2 },
                { dir: new THREE.Vector3(side * 1.2, -0.2, -1.0), len: 3.0, idx: 3 },
            ];

            const boneMeshes = [];
            bonePositions.forEach(bp => {
                const boneGeo = new THREE.CylinderGeometry(0.04, 0.06, bp.len, 4);
                const bone = new THREE.Mesh(boneGeo, boneMat);
                const dir = bp.dir.clone().normalize();
                bone.position.copy(dir.clone().multiplyScalar(bp.len / 2));

                // Orient bone along direction
                const up = new THREE.Vector3(0, 1, 0);
                const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
                bone.quaternion.copy(quat);

                // Jagged tips
                const tipGeo = new THREE.ConeGeometry(0.06, 0.5, 3);
                const tip = new THREE.Mesh(tipGeo, boneMat);
                tip.position.copy(dir.clone().multiplyScalar(bp.len));
                tip.quaternion.copy(quat);
                wingGroup.add(tip);

                wingGroup.add(bone);
                boneMeshes.push(bone);
            });

            // Wing membrane - shape connecting the bone tips
            const membraneShape = new THREE.Shape();
            const outerR = 3.5;
            membraneShape.moveTo(side * 0.1, 0);
            membraneShape.bezierCurveTo(side * 1.0, 1.5 * side, side * 2.0, 2.5 * side, side * outerR, 0.5 * side);
            membraneShape.bezierCurveTo(side * (outerR + 0.5), -0.3, side * (outerR - 0.5), -1.0, side * 0.5, -1.5);
            membraneShape.bezierCurveTo(side * 0.3, -1.0, side * 0.2, -0.5, side * 0.1, 0);

            const membraneGeo = new THREE.ShapeGeometry(membraneShape);
            const membrane = new THREE.Mesh(membraneGeo, membraneMat);
            membrane.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
            membrane.position.set(0, 0, 0);
            wingGroup.add(membrane);

            wingGroup.name = side < 0 ? "wingL" : "wingR";
            wingGroup.userData.bones = boneMeshes;
            dragonGroup.add(wingGroup);
        }

        // ---- Tail (segmented with flame tip) ----
        for (let i = 0; i < 5; i++) {
            const r = 0.35 - i * 0.06;
            const tailGeo = new THREE.CylinderGeometry(r, r + 0.05, 0.8, 6);
            const seg = new THREE.Mesh(tailGeo, i % 2 === 0 ? bodyMat : darkPlateMat);
            seg.rotation.z = Math.PI / 2;
            seg.position.set(0, -0.15 - i * 0.08, -2.5 - i * 0.8);
            dragonGroup.add(seg);
        }

        // Tail flame / crystal tip
        const tailFlameGeo = new THREE.SphereGeometry(0.22, 5, 5);
        tailFlameGeo.scale(1, 1.3, 0.8);
        const tailFlame = new THREE.Mesh(tailFlameGeo, tailFlameMat);
        tailFlame.position.set(0, -0.5, -6.3);
        tailFlame.name = "tailFlame";
        dragonGroup.add(tailFlame);

        // Tail flame glow
        const tailGlowMat = new THREE.MeshBasicMaterial({ color: 0xff8844, transparent: true, opacity: 0.25 });
        const tailGlowGeo = new THREE.SphereGeometry(0.5, 6, 6);
        const tailGlow = new THREE.Mesh(tailGlowGeo, tailGlowMat);
        tailGlow.position.copy(tailFlame.position);
        tailGlow.name = "tailFlameGlow";
        dragonGroup.add(tailGlow);

        // ---- Spines / ridges along back ----
        for (let i = 0; i < 10; i++) {
            const h = 0.4 + Math.sin(i * 0.5) * 0.2;
            const spineGeo = new THREE.ConeGeometry(0.08, h, 4);
            const spine = new THREE.Mesh(spineGeo, scaleMat);
            spine.position.set(0, 0.65 + (i < 3 ? 0.15 : 0), 1.2 - i * 0.55);
            spine.rotation.x = -0.25;
            dragonGroup.add(spine);
        }

        // ---- Claws / legs (decorative, tucked) ----
        for (let side = -1; side <= 1; side += 2) {
            // Hind legs
            const legGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.2, 4);
            const leg = new THREE.Mesh(legGeo, bodyMat);
            leg.position.set(side * 0.5, -0.6, -1.5);
            leg.rotation.x = 0.6;
            leg.rotation.z = side * 0.3;
            dragonGroup.add(leg);

            // Claws
            for (let c = 0; c < 3; c++) {
                const clawGeo = new THREE.ConeGeometry(0.03, 0.3, 3);
                const claw = new THREE.Mesh(clawGeo, hornMat);
                claw.position.set(side * (0.4 + c * 0.08), -1.2, -1.5 + c * 0.15);
                claw.rotation.x = 0.5;
                dragonGroup.add(claw);
            }

            // Front arms
            const armGeo = new THREE.CylinderGeometry(0.06, 0.1, 0.8, 4);
            const arm = new THREE.Mesh(armGeo, bodyMat);
            arm.position.set(side * 0.45, -0.2, 1.8);
            arm.rotation.x = -0.8;
            arm.rotation.z = side * 0.4;
            dragonGroup.add(arm);
        }

        // ---- Fire breath nozzle ----
        const breathGeo = new THREE.SphereGeometry(0.15, 5, 5);
        const breathPos = new THREE.Mesh(breathGeo, breathMat);
        breathPos.position.set(0, 0.35, 4.8);
        breathPos.name = "breathEmitter";
        dragonGroup.add(breathPos);

        dragon = dragonGroup;
        dragon.scale.setScalar(DRAGON_SCALE);
        scene.add(dragon);
    }

    function animateDragon(dt, time) {
        // Wing flapping with bone articulation
        const wingFlapSpeed = 3 + velocity.length() * 0.12;
        const wingFlapAmount = 0.35;
        const wingL = dragon.getObjectByName("wingL");
        const wingR = dragon.getObjectByName("wingR");

        if (wingL && wingR) {
            const flapAngle = Math.sin(time * wingFlapSpeed) * wingFlapAmount;
            const flapBase = -0.15;
            wingL.rotation.x = flapBase + flapAngle;
            wingR.rotation.x = flapBase - flapAngle;

            // Subtle armature bend on wings
            if (wingL.userData.bones) {
                wingL.userData.bones.forEach((bone, i) => {
                    bone.rotation.z = flapAngle * 0.15 * (i + 1) * 0.5;
                });
            }
        }

        // Jaw animation when fire breath active
        const lowerJaw = dragon.getObjectByName("lowerJaw");
        if (lowerJaw) {
            const jawOpen = fireBreathActive ? -0.3 : -0.15 + Math.sin(time * 1.5) * 0.03;
            lowerJaw.position.y = jawOpen;
            lowerJaw.rotation.x = jawOpen * 0.5;
        }

        // Tail flame flicker
        const tailFlame = dragon.getObjectByName("tailFlame");
        const tailGlow = dragon.getObjectByName("tailFlameGlow");
        if (tailFlame) {
            const flicker = 0.7 + Math.sin(time * 9) * 0.2 + Math.sin(time * 13) * 0.1;
            tailFlame.scale.setScalar(flicker);
            tailFlame.material.color.setHSL(0.05, 1, 0.45 + Math.sin(time * 7) * 0.1);
        }
        if (tailGlow) {
            tailGlow.scale.setScalar(0.8 + Math.sin(time * 4) * 0.2);
            tailGlow.material.opacity = 0.2 + Math.sin(time * 5) * 0.1;
        }

        // Body breathing bob
        const speed = velocity.length();
        dragonGroup.position.y = dragonPosition.y + Math.sin(time * speed * 0.08) * 0.12;
        dragonGroup.position.x = dragonPosition.x;
        dragonGroup.position.z = dragonPosition.z;

        // Apply rotations with slight lag on roll for weight feel
        dragonGroup.rotation.set(
            dragonRotation.pitch,
            dragonRotation.yaw,
            dragonRotation.roll,
            "XYZ"
        );

        // Subtle head bob
        const headNode = dragon.children.find(c => c.position && Math.abs(c.position.z - 3.5) < 0.5);
        if (headNode) {
            headNode.rotation.x = Math.sin(time * 2.5) * 0.03;
        }

        // Animate fire breath particles
        for (let i = fireBreathParticles.length - 1; i >= 0; i--) {
            const p = fireBreathParticles[i];
            p.life -= dt;
            if (p.life <= 0) {
                scene.remove(p.mesh);
                fireBreathParticles.splice(i, 1);
                continue;
            }
            const t = 1 - p.life / p.maxLife;
            p.mesh.position.lerpVectors(p.startPos, p.endPos, t);
            p.mesh.material.opacity = (p.life / p.maxLife) * 0.85;
            const s = p.life / p.maxLife;
            p.mesh.scale.setScalar(s * 1.5);
        }

        // Update breath emitter opacity
        const breathEmitter = dragon.getObjectByName("breathEmitter");
        if (breathEmitter) {
            breathEmitter.material.opacity = fireBreathActive ? 0.8 + Math.sin(time * 20) * 0.2 : 0;
            breathEmitter.scale.setScalar(fireBreathActive ? 1.5 + Math.sin(time * 15) * 0.3 : 0.5);
        }
    }

    // ---- Fire Breath Particles (Multi-layered) ----
    function spawnFireBreath(dt) {
        const breathEmitter = dragon.getObjectByName("breathEmitter");
        if (!breathEmitter) return;

        const count = Math.floor(2 + Math.random() * 2);
        for (let i = 0; i < count; i++) {
            // Layered: core (white-hot), mid (amber), edge (crimson)
            const layer = Math.random();
            let color, size;
            if (layer < 0.3) {
                color = 0xFFFFCC; size = 0.15; // core
            } else if (layer < 0.7) {
                color = 0xFF8800; size = 0.25; // mid
            } else {
                color = 0xFF3300; size = 0.35; // edge
            }

            const geo = new THREE.SphereGeometry(size, 4, 4);
            const mat = new THREE.MeshBasicMaterial({
                color: color, transparent: true, opacity: 0.85
            });
            const mesh = new THREE.Mesh(geo, mat);

            const worldPos = new THREE.Vector3();
            breathEmitter.getWorldPosition(worldPos);
            const direction = new THREE.Vector3(0, 0, 1).applyEuler(
                new THREE.Euler(dragonRotation.pitch, dragonRotation.yaw, 0, "XYZ")
            );

            mesh.position.copy(worldPos);
            mesh.position.x += (Math.random() - 0.5) * (0.3 + layer * 0.3);
            mesh.position.y += (Math.random() - 0.5) * (0.3 + layer * 0.3);

            const dist = 12 + Math.random() * (12 + layer * 8);
            const endPos = worldPos.clone().add(direction.clone().multiplyScalar(dist));
            endPos.x += (Math.random() - 0.5) * (2 + layer * 2);
            endPos.y += (Math.random() - 0.5) * (2 + layer * 2);

            scene.add(mesh);
            fireBreathParticles.push({
                mesh, startPos: mesh.position.clone(),
                endPos, life: 0.5 + Math.random() * 0.3, maxLife: 0.5 + Math.random() * 0.3
            });
        }
    }

    // ---- Canyon Generator (Enhanced with procedural geometry) ----
    function generateCanyon() {
        const wallMat = new THREE.MeshStandardMaterial({
            color: PAL.obsidian, roughness: 0.92, metalness: 0.05
        });

        // Floor - vertex-displaced low-poly mesh
        const floorGeo = createDisplacedPlane(CANYON_WIDTH, TRACK_LENGTH + 100, 10, 30, 2);
        const floor = new THREE.Mesh(floorGeo, wallMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, 0, -TRACK_LENGTH / 2);
        scene.add(floor);

        // Ceiling
        const ceilGeo = createDisplacedPlane(CANYON_WIDTH, TRACK_LENGTH + 100, 10, 30, 1.5);
        const ceilMat = wallMat.clone();
        const ceil = new THREE.Mesh(ceilGeo, ceilMat);
        ceil.rotation.x = Math.PI / 2;
        ceil.position.set(0, WALL_HEIGHT, -TRACK_LENGTH / 2);
        scene.add(ceil);

        // Left and right canyon walls
        const wallGeo = createDisplacedPlane(TRACK_LENGTH + 100, WALL_HEIGHT, 25, 8, 3);
        const wallL = new THREE.Mesh(wallGeo, wallMat);
        wallL.rotation.y = Math.PI / 2;
        wallL.position.set(-CANYON_WIDTH / 2, WALL_HEIGHT / 2, -TRACK_LENGTH / 2);
        scene.add(wallL);

        const wallR = new THREE.Mesh(wallGeo.clone(), wallMat);
        wallR.rotation.y = -Math.PI / 2;
        wallR.position.set(CANYON_WIDTH / 2, WALL_HEIGHT / 2, -TRACK_LENGTH / 2);
        scene.add(wallR);

        // Hexagonal basalt columns
        const columnGeo = createHexCylinderGeometry(1.5, 1.8, WALL_HEIGHT * 0.8, 1, 6);
        const columnMat = new THREE.MeshStandardMaterial({
            color: 0x2A2A3E, roughness: 0.85, metalness: 0.1
        });

        for (let i = 0; i < BASALT_COLUMN_COUNT; i++) {
            const column = new THREE.Mesh(columnGeo, columnMat);
            column.position.set(
                (Math.random() > 0.5 ? 1 : -1) * (CANYON_WIDTH / 2 - 3 - Math.random() * 8),
                WALL_HEIGHT / 2,
                -20 - Math.random() * (TRACK_LENGTH - 40)
            );
            column.scale.y = 0.4 + Math.random() * 0.7;
            column.scale.x = 0.6 + Math.random() * 0.5;
            column.scale.z = 0.6 + Math.random() * 0.5;
            column.rotation.y = Math.random() * Math.PI;
            scene.add(column);
        }

        // Magma veins (with dynamic glow)
        const magmaMat = new THREE.MeshStandardMaterial({
            color: PAL.magma, emissive: 0xFF4400, emissiveIntensity: 1.4, roughness: 0.3
        });

        for (let i = 0; i < MAGMA_VEIN_COUNT; i++) {
            const veinGeo = new THREE.BoxGeometry(0.25, 2 + Math.random() * 4, 8 + Math.random() * 20);
            const vein = new THREE.Mesh(veinGeo, magmaMat.clone());
            const sideX = (Math.random() > 0.5 ? 1 : -1) * (CANYON_WIDTH / 2 - 0.3);
            vein.position.set(sideX, Math.random() * WALL_HEIGHT * 0.8, -Math.random() * (TRACK_LENGTH - 20));
            vein.rotation.y = Math.PI / 2;
            vein.userData = {
                baseEmissive: 1.4 + Math.random() * 0.6,
                pulseSpeed: 0.5 + Math.random() * 1.5,
                pulseOffset: Math.random() * Math.PI * 2
            };
            scene.add(vein);
            magmaVeins.push(vein);
        }

        // Magma pools on floor with dynamic lighting
        for (let i = 0; i < 12; i++) {
            const poolGeo = new THREE.CylinderGeometry(1.5 + Math.random(), 2 + Math.random(), 0.15, 7);
            const poolMat = new THREE.MeshStandardMaterial({
                color: 0xFF3300, emissive: 0xFF2200, emissiveIntensity: 1.6,
                roughness: 0.2, metalness: 0.4
            });
            const pool = new THREE.Mesh(poolGeo, poolMat);
            pool.position.set(
                (Math.random() - 0.5) * (CANYON_WIDTH - 10),
                0.15,
                -10 - Math.random() * (TRACK_LENGTH - 20)
            );
            pool.userData = {
                pulseSpeed: 0.8 + Math.random(),
                pulseOffset: Math.random() * Math.PI * 2
            };
            scene.add(pool);
            magmaVeins.push(pool);

            const poolLight = new THREE.PointLight(0xFF4400, 2.5, 15);
            poolLight.position.copy(pool.position);
            poolLight.position.y = 2;
            poolLight.userData = { isMagmaLight: true };
            scene.add(poolLight);
        }
    }

    // Helper: create a displaced plane geometry for organic canyon surface
    function createDisplacedPlane(width, depth, segW, segD, amplitude) {
        const geo = new THREE.PlaneGeometry(width, depth, segW, segD);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const noise = Math.sin(x * 0.3) * Math.cos(y * 0.2) * amplitude
                        + Math.sin(x * 0.7 + y * 0.5) * amplitude * 0.5;
            pos.setZ(i, noise);
        }
        geo.computeVertexNormals();
        return geo;
    }

    // ---- Thermal Updrafts (Enhanced particle streams) ----
    function spawnUpdrafts() {
        for (let i = 0; i < UPDRAFT_COUNT; i++) {
            const pos = new THREE.Vector3(
                (Math.random() - 0.5) * (CANYON_WIDTH * 0.55),
                8 + Math.random() * (WALL_HEIGHT - 20),
                -30 - i * (TRACK_LENGTH - 60) / UPDRAFT_COUNT
            );

            const group = new THREE.Group();
            const particles = [];

            // Core: ring of green particles (warm emerald)
            const particleMat = new THREE.MeshBasicMaterial({
                color: PAL.emeraldUpdraft, transparent: true, opacity: 0.5
            });

            for (let j = 0; j < 12; j++) {
                const pGeo = new THREE.SphereGeometry(0.2 + Math.random() * 0.15, 4, 4);
                const p = new THREE.Mesh(pGeo, particleMat.clone());
                const angle = (j / 12) * Math.PI * 2;
                const radius = 1.5 + Math.random() * 1.0;
                p.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
                p.userData = {
                    angle: angle,
                    radius: radius,
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.8 + Math.random() * 0.6,
                };
                group.add(p);
                particles.push(p);
            }

            // Vertical stream particles (rising columns)
            const streamMat = new THREE.MeshBasicMaterial({
                color: 0x88FFBB, transparent: true, opacity: 0.15
            });
            for (let s = 0; s < 5; s++) {
                const streamGeo = new THREE.CylinderGeometry(0.05, 0.2, 8 + Math.random() * 6, 3, 1, true);
                const stream = new THREE.Mesh(streamGeo, streamMat.clone());
                const a = (s / 5) * Math.PI * 2;
                stream.position.set(Math.cos(a) * 1.5, 4, Math.sin(a) * 1.5);
                stream.userData = { baseOp: 0.15 };
                group.add(stream);
                particles.push(stream);
            }

            // Center glow core
            const coreGlow = new THREE.Mesh(
                new THREE.SphereGeometry(1, 6, 6),
                new THREE.MeshBasicMaterial({ color: 0xAAFFCC, transparent: true, opacity: 0.12 })
            );
            group.add(coreGlow);

            group.position.copy(pos);
            group.userData = { animOffset: Math.random() * Math.PI * 2 };
            group.userData.particles = particles;
            scene.add(group);
            updrafts.push({ position: pos, mesh: group, collected: false, particles: particles });
        }
    }

    // ---- Runes (Enhanced with glow and floating particles) ----
    function spawnRunes() {
        const runeMat = new THREE.MeshStandardMaterial({
            color: 0x664400, emissive: 0x332200, emissiveIntensity: 0.3, roughness: 0.4
        });

        for (let i = 0; i < RUNE_COUNT; i++) {
            const runeGeo = new THREE.OctahedronGeometry(1.2, 0);
            const rune = new THREE.Mesh(runeGeo, runeMat.clone());
            const posZ = -70 - i * ((TRACK_LENGTH - 90) / RUNE_COUNT);
            rune.position.set(
                (Math.random() - 0.5) * (CANYON_WIDTH * 0.35),
                12 + Math.random() * 18,
                posZ
            );
            rune.userData = { animSpeed: 0.8 + Math.random() * 0.5 };
            scene.add(rune);

            // Rune glow aura
            const glowGeo = new THREE.SphereGeometry(2, 6, 6);
            const glowMat = new THREE.MeshBasicMaterial({
                color: 0xCCAA44, transparent: true, opacity: 0.06
            });
            const glowMesh = new THREE.Mesh(glowGeo, glowMat);
            glowMesh.position.copy(rune.position);
            scene.add(glowMesh);

            runes.push({
                position: rune.position.clone(),
                mesh: rune,
                glow: glowMesh,
                activated: false
            });

            const light = new THREE.PointLight(0xAA8844, 1, 12);
            light.position.copy(rune.position);
            scene.add(light);
            runes[runes.length - 1].light = light;
        }
    }

    // ---- Embers (Enhanced with size variation and color palette) ----
    function spawnEmbers() {
        const emberGeo = new THREE.SphereGeometry(0.04, 3, 3);

        for (let i = 0; i < EMBER_COUNT; i++) {
            const r = Math.random();
            let color;
            if (r < 0.25) color = 0xFFFFAA;    // hot white
            else if (r < 0.5) color = 0xFFCC44;   // gold
            else if (r < 0.8) color = 0xFF8833;   // amber
            else color = 0xFF4400;                   // deep red

            const size = 0.02 + Math.random() * 0.06;
            const emberGeoScaled = new THREE.SphereGeometry(size, 3, 3);
            const emberMat = new THREE.MeshBasicMaterial({
                color: color, transparent: true, opacity: 0.5 + Math.random() * 0.5
            });
            const ember = new THREE.Mesh(emberGeoScaled, emberMat);
            ember.position.set(
                (Math.random() - 0.5) * CANYON_WIDTH,
                1 + Math.random() * WALL_HEIGHT * 0.85,
                -Math.random() * TRACK_LENGTH
            );
            ember.userData = {
                baseY: ember.position.y,
                speed: 0.3 + Math.random() * 1.5,
                amplitude: 0.5 + Math.random() * 2.5,
                offset: Math.random() * Math.PI * 2,
                drift: (Math.random() - 0.5) * 0.3,
                baseOpacity: emberMat.opacity
            };
            scene.add(ember);
            embers.push(ember);
        }
    }

    // ---- Guardian (End Target, Enhanced) ----
    function createGuardian() {
        const guardianGroup = new THREE.Group();

        // Main crystalline body
        const bodyGeo = new THREE.IcosahedronGeometry(4, 1);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xFFBB33, emissive: 0xFFDD55, emissiveIntensity: 2,
            roughness: 0.15, metalness: 0.85
        });
        const mainBody = new THREE.Mesh(bodyGeo, bodyMat);
        guardianGroup.add(mainBody);

        // Outer glow shell
        const glowGeo = new THREE.SphereGeometry(5.5, 12, 12);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xFFEE77, transparent: true, opacity: 0.1
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.name = "guardianGlow";
        guardianGroup.add(glow);

        // Second glow ring
        const ringGlowGeo = new THREE.RingGeometry(5, 7, 24);
        const ringGlowMat = new THREE.MeshBasicMaterial({
            color: 0xFFCC44, transparent: true, opacity: 0.08, side: THREE.DoubleSide
        });
        const ringGlow = new THREE.Mesh(ringGlowGeo, ringGlowMat);
        ringGlow.name = "guardianRing";
        ringGlow.rotation.x = Math.PI / 2;
        ringGlow.position.y = 2;
        guardianGroup.add(ringGlow);

        // Orbiting crystal shards
        for (let i = 0; i < 8; i++) {
            const shardGeo = new THREE.OctahedronGeometry(0.6 + Math.random() * 0.4, 0);
            const shardMat = new THREE.MeshStandardMaterial({
                color: 0xDDCC55, emissive: 0xBBAA33, emissiveIntensity: 1.2, metalness: 0.7, roughness: 0.25
            });
            const shard = new THREE.Mesh(shardGeo, shardMat);
            const angle = (i / 8) * Math.PI * 2;
            const orbitR = 6 + Math.random() * 3;
            shard.position.set(Math.cos(angle) * orbitR, 1 + i * 1.2, Math.sin(angle) * orbitR);
            shard.rotation.x = i * 0.4;
            shard.userData.orbitAngle = angle;
            shard.userData.orbitSpeed = 0.3 + Math.random() * 0.4;
            shard.userData.orbitR = orbitR;
            shard.userData.orbitY = 1 + i * 1.2;
            shard.name = "guardianShard";
            guardianGroup.add(shard);
        }

        // Guardian light cone
        const light = new THREE.PointLight(0xFFDD66, 12, 55);
        light.position.set(0, 5, 0);
        guardianGroup.add(light);

        // Secondary light
        const light2 = new THREE.PointLight(0xFFAA33, 5, 35);
        light2.position.set(0, -3, 0);
        light2.name = "guardianLight2";
        guardianGroup.add(light2);

        guardianGroup.position.set(0, 32, -TRACK_LENGTH + 15);
        scene.add(guardianGroup);
        return guardianGroup;
    }

    let guardianGroup = null;

    // ---- Lighting ----
    function setupLighting() {
        const ambient = new THREE.AmbientLight(0x3a2620, 0.85);
        scene.add(ambient);

        // Main environment light (warm sunset direction)
        const mainLight = new THREE.DirectionalLight(0xFFAA66, 1.1);
        mainLight.position.set(10, 30, -50);
        scene.add(mainLight);

        // Hemisphere light
        const hemi = new THREE.HemisphereLight(0xCC5533, 0x1A0A0A, 0.55);
        scene.add(hemi);

        // Subtle fill light from below (magma glow)
        const fillLight = new THREE.DirectionalLight(0xFF3300, 0.25);
        fillLight.position.set(0, -5, -100);
        scene.add(fillLight);

        // Cool rim light from above so obsidian walls catch a highlight against the warm fog
        const rimLight = new THREE.DirectionalLight(0x6688AA, 0.35);
        rimLight.position.set(0, 60, 20);
        scene.add(rimLight);

        scene.fog = new THREE.FogExp2(0x2A1810, 0.003);
        scene.background = new THREE.Color(0x281410);
    }

    // ---- Volumetric Fog Planes ----
    function addFogPlanes() {
        const fogMat = new THREE.MeshBasicMaterial({
            color: 0xCC6633, transparent: true, opacity: 0.025, side: THREE.DoubleSide
        });

        for (let i = 0; i < 35; i++) {
            const fogGeo = new THREE.PlaneGeometry(CANYON_WIDTH * 0.7, 15 + Math.random() * 10);
            const fogPlane = new THREE.Mesh(fogGeo, fogMat.clone());
            fogPlane.position.set(
                (Math.random() - 0.5) * 12,
                WALL_HEIGHT * 0.2 + Math.random() * WALL_HEIGHT * 0.5,
                -Math.random() * TRACK_LENGTH
            );
            fogPlane.rotation.y = Math.random() * Math.PI;
            fogPlane.rotation.z = (Math.random() - 0.5) * 0.2;
            fogPlane.userData = {
                driftSpeed: 0.15 + Math.random() * 0.25,
                driftOffset: Math.random() * Math.PI * 2,
                baseX: fogPlane.position.x,
                rotSpeed: 0.05 + Math.random() * 0.1,
            };
            scene.add(fogPlane);
        }
    }

    // ---- Audio System ----
    function initAudio() {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();

            const masterGain = audioCtx.createGain();
            masterGain.gain.value = 0.5;
            masterGain.connect(audioCtx.destination);

            bgMusicGain = audioCtx.createGain();
            bgMusicGain.gain.value = 0;
            bgMusicGain.connect(masterGain);

            playAmbientWind();
        } catch (e) {
            console.warn("Audio init failed:", e);
        }
    }

    function playAmbientWind() {
        if (!audioCtx) return;

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
        windGain.gain.value = 0.12;

        windSource.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(bgMusicGain);
        windSource.start();

        // Dragon core drone
        const droneOsc = audioCtx.createOscillator();
        droneOsc.type = 'sine';
        droneOsc.frequency.value = 50;
        const droneGain = audioCtx.createGain();
        droneGain.gain.value = 0.06;
        droneOsc.connect(droneGain);
        droneGain.connect(bgMusicGain);
        droneOsc.start();

        // Periodic glass chimes
        const chimeInterval = setInterval(() => {
            if (!sequenceStarted || sequenceComplete) return;
            if (Math.random() < 0.25) playGlassChime(1200 + Math.random() * 2000);
        }, 600);

        wingFlapAudio.ctx = audioCtx;
        wingFlapAudio.gain = bgMusicGain;
    }

    function playWingFlap() {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;

        const bufferSize = Math.floor(audioCtx.sampleRate * 0.08);
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
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        source.start(now);
    }

    function playThermalChime() {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;

        for (let i = 0; i < 4; i++) {
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = 1400 + i * 350;
            const g = audioCtx.createGain();
            g.gain.setValueAtTime(0.09, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.12);
            osc.connect(g);
            g.connect(audioCtx.destination);
            osc.start(now + i * 0.06);
            osc.stop(now + 0.7 + i * 0.12);
        }
    }

    function playGlassChime(freq) {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const g = audioCtx.createGain();
        g.gain.value = 0.025;
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
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.3);
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.18, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(g);
        g.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.4);

        // Steam sizzle
        const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.25, audioCtx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.08));
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buf;
        const filt = audioCtx.createBiquadFilter();
        filt.type = 'highpass';
        filt.frequency.value = 2500;
        const ng = audioCtx.createGain();
        ng.gain.value = 0.05;
        noise.connect(filt);
        filt.connect(ng);
        ng.connect(audioCtx.destination);
        noise.start(now + 0.1);
    }

    function playFireBreathSFX() {
        if (!audioCtx || !fireBreathActive) return;
        fireBreathSoundTimer -= 0.016;
        if (fireBreathSoundTimer > 0) return;
        fireBreathSoundTimer = 0.08;

        const now = audioCtx.currentTime;
        const heatRatio = heat / MAX_HEAT;
        const pitch = 150 + (1 - heatRatio) * 350;

        const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.08, audioCtx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) {
            d[i] = (Math.random() * 2 - 1);
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buf;
        const filt = audioCtx.createBiquadFilter();
        filt.type = 'bandpass';
        filt.frequency.value = pitch;
        filt.Q.value = 1.5;
        const g = audioCtx.createGain();
        g.gain.value = 0.07;
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
            osc.frequency.value = 500 + i * 280;
            const g = audioCtx.createGain();
            g.gain.setValueAtTime(0.07, now);
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
        const freqs = [440, 554, 660, 880, 1108];
        freqs.forEach((f, i) => {
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = f;
            const g = audioCtx.createGain();
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.12, now + 0.6);
            g.gain.linearRampToValueAtTime(0.04, now + 3);
            g.gain.exponentialRampToValueAtTime(0.001, now + 5);
            osc.connect(g);
            g.connect(audioCtx.destination);
            osc.start(now + i * 0.12);
            osc.stop(now + 5.5);
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

        document.getElementById("hud").style.display = "none";

        const cs = document.getElementById("completeScreen");
        cs.style.display = "flex";
        setTimeout(() => { cs.style.opacity = "1"; }, 100);

        camera.position.set(0, 65, -TRACK_LENGTH + 40);
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
        cameraSystem.smoothPos.copy(camera.position);
        cameraSystem.smoothLook.copy(dragonPosition);

        updrafts.forEach(ud => {
            ud.collected = false;
            if (ud.particles) {
                ud.particles.forEach(p => {
                    if (p.material) p.material.opacity = p.userData.baseOp || 0.5;
                });
            }
        });

        runes.forEach(r => {
            r.activated = false;
            r.mesh.material.emissive.setHex(0x332200);
            r.mesh.material.emissiveIntensity = 0.3;
            if (r.light) r.light.intensity = 1;
            if (r.glow) r.glow.material.opacity = 0.06;
        });
    }

    // ---- Game Update ----
    function update(dt, time) {
        if (!sequenceStarted || sequenceComplete) {
            if (guardianGroup) animateGuardian(time);
            animateDragon(dt, time);
            cameraSystem.update(dt);
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
            ember.material.opacity = ud.baseOpacity * (0.5 + Math.sin(time * ud.speed * 2 + ud.offset) * 0.5);
        });

        // Animate updrafts
        updrafts.forEach(ud => {
            if (!ud.collected && ud.particles) {
                ud.mesh.rotation.y = time * 0.4 + ud.mesh.userData.animOffset;
                ud.particles.forEach(p => {
                    const pud = p.userData;
                    if (pud && pud.angle !== undefined) {
                        p.position.y = Math.sin(time * pud.speed + pud.phase) * 2;
                        p.position.x = Math.cos(pud.angle + time * 0.3) * pud.radius;
                        p.position.z = Math.sin(pud.angle + time * 0.3) * pud.radius;
                    }
                });
            }
        });

        // Animate runes
        runes.forEach(r => {
            if (!r.activated) {
                r.mesh.rotation.y = time * (r.mesh.userData.animSpeed || 1);
                r.mesh.rotation.x = Math.sin(time * 0.3) * 0.2;
                if (r.glow) {
                    r.glow.scale.setScalar(1 + Math.sin(time * 1.5) * 0.05);
                    r.glow.material.opacity = 0.06 + Math.sin(time * 1.2) * 0.02;
                }
            } else {
                r.mesh.rotation.y = time * 2.5;
                r.mesh.rotation.x = time * 0.5;
                r.mesh.scale.setScalar(1.2 + Math.sin(time * 4) * 0.15);
                if (r.glow) {
                    r.glow.scale.setScalar(1.5 + Math.sin(time * 3) * 0.2);
                    r.glow.material.opacity = 0.15;
                }
            }
        });

        // Animate magma veins
        magmaVeins.forEach(v => {
            if (v.material) {
                const ud = v.userData;
                if (ud) {
                    v.material.emissiveIntensity = ud.baseEmissive
                        + Math.sin(time * ud.pulseSpeed + ud.pulseOffset) * 0.4;
                }
            }
        });

        // Animate guardian
        if (guardianGroup) animateGuardian(time);

        // Fog plane drift
        scene.children.forEach(child => {
            if (child.userData && child.userData.driftSpeed) {
                child.position.x = child.userData.baseX
                    + Math.sin(time * child.userData.driftSpeed + child.userData.driftOffset) * 4;
                child.rotation.y += child.userData.rotSpeed * dt;
            }
        });

        // Fire breath SFX (throttled)
        if (fireBreathActive) playFireBreathSFX();

        // Music intensity from velocity
        if (bgMusicGain) {
            const speed = velocity.length();
            const targetVol = Math.min(speed / FLIGHT_SPEED_BOOST, 1) * 0.5 + 0.15;
            bgMusicGain.gain.value += (targetVol - bgMusicGain.gain.value) * dt * 2;
        }
    }

    function animateGuardian(time) {
        if (!guardianGroup) return;
        guardianGroup.rotation.y = time * 0.12;
        guardianGroup.children.forEach(child => {
            if (child.name === "guardianGlow") {
                child.scale.setScalar(1 + Math.sin(time * 1.5) * 0.12);
                child.material.opacity = 0.08 + Math.sin(time * 2) * 0.04;
            }
            if (child.name === "guardianRing") {
                child.rotation.z = time * 0.2;
                child.material.opacity = 0.06 + Math.sin(time * 1.8) * 0.03;
            }
            if (child.name === "guardianShard") {
                const ud = child.userData;
                const a = ud.orbitAngle + time * ud.orbitSpeed;
                child.position.x = Math.cos(a) * ud.orbitR;
                child.position.z = Math.sin(a) * ud.orbitR;
                child.position.y = ud.orbitY + Math.sin(time * ud.orbitSpeed + a) * 1.5;
                child.rotation.x = time * ud.orbitSpeed * 2;
                child.rotation.z = time * ud.orbitSpeed;
            }
        });

        // Guardian bob
        guardianGroup.position.y = 32 + Math.sin(time * 0.5) * 2;
    }

    // ---- Scene Setup ----
    function initScene() {
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
        camera.position.set(0, 23, -8);

        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = false;
        document.body.appendChild(renderer.domElement);

        setupLighting();
        createDragon();
        generateCanyon();
        spawnUpdrafts();
        spawnRunes();
        spawnEmbers();
        addFogPlanes();
        guardianGroup = createGuardian();

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
        if (lastTime === 0) dt = 0;
        lastTime = now;

        const time = now / 1000;
        update(dt, time);
        renderer.render(scene, camera);
    }

    // ---- Bootstrap ----
    function init() {
        setupInput();
        initScene();

        camera.position.set(3, 5, -10);
        camera.lookAt(dragonPosition.x, dragonPosition.y, dragonPosition.z);

        document.getElementById("startBtn").addEventListener("click", () => {
            startGame();
        });

        document.getElementById("restartBtn").addEventListener("click", () => {
            const cs = document.getElementById("completeScreen");
            cs.style.opacity = "0";
            setTimeout(() => {
                cs.style.display = "none";
                startGame();
            }, 800);
        });

        gameLoop();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
