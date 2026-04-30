class Dragon {
  constructor() {
    // Position
    this.x = 0;
    this.y = 400;
    this.z = 0;

    // Velocity (world space)
    this.vx = 3;
    this.vy = 0;
    this.vz = 0;

    // Orientation
    this.roll = 0;    // radians, banks left/right
    this.pitch = 0;    // radians, nose up/down
    this.yaw = 0;      // radians, heading left/right

    // Stamina
    this.stamina = 100;
    this.maxStamina = 100;
    this.staminaRate = 8;      // drain per second when climbing/flapping
    this.regenRate = 5;        // regen per second when gliding/diving
    this.forcedGlide = false;

    // Wing animation
    this.wingPhase = 0;
    this.flapSpeed = 0;

    // Speed magnitude (derived)
    this.speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy + this.vz * this.vz);

    // Config
    this.gravity = 12;         // downward acceleration
    this.liftCoeff = 0.18;     // lift per unit speed
    this.dragCoeff = 0.04;     // drag deceleration per speed^2
    this.thrustForce = 18;     // upward thrust when flapping
    this.thrustRate = 10;      // stamina drain rate during thrust
    this.turnCoeff = 2.5;      // roll-into-turn rate
    this.pitchRate = 2.0;      // max pitch/rate
    this.rollRate = 3.0;       // max roll rate
    this.rollDamping = 4.0;    // auto level roll
    this.glideBoost = 0.02;    // extra regen when gliding

    this._wingAccel = 0;
  }

  update(dt, input) {
    // Clamp dt to prevent physics explosions
    dt = Math.min(dt, 0.05);

    // Recompute speed
    this.speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy + this.vz * this.vz);

    // Forced glide when stamina depleted
    if (this.stamina <= 0) {
      this.forcedGlide = true;
    } else {
      this.forcedGlide = false;
    }

    // --- Orientation ---
    // Roll input: manual roll control
    let targetRoll = 0;
    if (input.rollLeft) targetRoll -= 1;
    if (input.rollRight) targetRoll += 1;

    // Roll from yaw (auto-bank into turns)
    if (input.yawLeft) targetRoll -= 0.6;
    if (input.yawRight) targetRoll += 0.6;

    // Smooth roll toward target, with damping back to 0 if no input
    if (Math.abs(targetRoll) < 0.1) {
      // Auto-level
      this.roll -= this.roll * this.rollDamping * dt;
    } else {
      const rollDir = Math.sign(targetRoll);
      const rollDiff = targetRoll - this.roll;
      if (Math.abs(rollDiff) > 0.05) {
        this.roll += Math.sign(rollDiff) * this.rollRate * dt;
        // Clamp
        this.roll = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.roll));
      }
    }

    // Yaw: roll into turn (aerodynamic turn)
    const turnRate = this.turnCoeff * Math.sin(this.roll) * Math.min(this.speed / 5, 1);
    if (input.yawLeft && !this.forcedGlide) {
      this.yaw -= this.turnRate * dt;
    }
    if (input.yawRight && !this.forcedGlide) {
      this.yaw += this.turnRate * dt;
    }

    // Pitch
    if (input.pitchUp && !this.forcedGlide) {
      this.pitch = Math.min(this.pitch + this.pitchRate * dt, Math.PI / 3);
    } else if (input.pitchDown) {
      this.pitch = Math.max(this.pitch - this.pitchRate * dt, -Math.PI / 3);
    } else {
      // Slowly level pitch
      this.pitch -= this.pitch * 1.5 * dt;
    }

    // --- Forces ---
    // Gravity
    let forcesY = -this.gravity;

    // Lift: proportional to speed squared, stronger when pitched up
    const lift = this.liftCoeff * this.speed * this.speed;
    forcesY += lift * Math.cos(this.pitch);

    // Drag: oppose velocity
    if (this.speed > 0.1) {
      const dragMag = this.dragCoeff * this.speed * this.speed;
      const invSpeed = 1 / this.speed;
      this.vx -= this.vx * invSpeed * dragMag * dt;
      this.vy -= this.vy * invSpeed * dragMag * dt;
      this.vz -= this.vz * invSpeed * dragMag * dt;
    }

    // Thrust (flap): upward and forward push
    if (input.thrust && !this.forcedGlide) {
      const thrustDir = Math.cos(this.pitch);
      forcesY += this.thrustForce * thrustDir;
      // Also add forward boost slightly
      this.vx += Math.cos(this.yaw) * this.thrustForce * 0.3 * dt;
      this.vz += Math.sin(this.yaw) * this.thrustForce * 0.3 * dt;
    }

    // Glide: reduced drag, gentle descent recovery
    if (input.glide || this.forcedGlide) {
      forcesY += 2; // slight lift assist
    }

    // Apply vertical forces
    this.vy += forcesY * dt;

    // Minimum forward speed to prevent stalling
    const minSpeed = 1.5;
    const currentForward = Math.sqrt(this.vx * this.vx + this.vz * this.vz);
    if (currentForward < minSpeed && this.speed > 0.5) {
      const boost = (minSpeed - currentForward) * 0.5 * dt;
      this.vx += Math.cos(this.yaw) * boost;
      this.vz += Math.sin(this.yaw) * boost;
    }

    // Clamp vertical speed
    this.vy = Math.max(-15, Math.min(15, this.vy));

    // Update position
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.z += this.vz * dt;

    // Keep dragon above ground (y = 0)
    if (this.y < 5) {
      this.y = 5;
      this.vy = Math.max(0, this.vy);
    }

    // Ceiling
    if (this.y > 800) {
      this.y = 800;
      this.vy = Math.min(0, this.vy);
    }

    // --- Stamina ---
    if (input.thrust && !this.forcedGlide) {
      this.stamina -= this.thrustRate * dt;
    }
    // Climbing (pitchUp with upward velocity) drains stamina
    if (input.pitchUp && this.vy > 1) {
      this.stamina -= this.staminaRate * dt;
    }
    // Gliding or diving regenerates
    if (input.glide) {
      this.stamina += (this.regenRate + this.glideBoost * this.speed) * dt;
    } else if (this.vy < -2) {
      // Diving recovery
      this.stamina += (this.regenRate * 0.7) * dt;
    } else if (!input.thrust && !input.pitchUp) {
      // Passive slow regen when cruising
      this.stamina += this.regenRate * 0.2 * dt;
    }

    this.stamina = Math.max(0, Math.min(this.maxStamina, this.stamina));

    // Recompute speed
    this.speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy + this.vz * this.vz);

    // --- Wing animation ---
    if (input.thrust && !this.forcedGlide) {
      this._wingAccel += (12 - this._wingAccel) * dt * 5;
    } else if (this.speed > 3) {
      this._wingAccel += (5 - this._wingAccel) * dt * 3;
    } else {
      this._wingAccel += (2 - this._wingAccel) * dt * 3;
    }
    this.wingPhase += this._wingAccel * dt;
    this.flapSpeed = this._wingAccel;
  }

  reset() {
    this.x = 0;
    this.y = 400;
    this.z = 0;
    this.vx = 3;
    this.vy = 0;
    this.vz = 0;
    this.roll = 0;
    this.pitch = 0;
    this.yaw = 0;
    this.stamina = this.maxStamina;
    this.forcedGlide = false;
    this.wingPhase = 0;
    this.speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy + this.vz * this.vz);
    this._wingAccel = 0;
  }
}
