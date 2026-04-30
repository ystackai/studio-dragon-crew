class InputManager {
  constructor(canvas) {
    this.keys = {
      thrust: false,
      glide: false,
      pitchUp: false,
      pitchDown: false,
      yawLeft: false,
      yawRight: false,
      rollLeft: false,
      rollRight: false,
     };
    this.touchZones = [];
    this.canvas = canvas;
    this.activeTouch = 0;
    this.touchState = {
      thrust: false,
      glide: false,
      left: [],
      right: [],
      breath: false,
     };

    this._bindKeyboard();
    this._bindTouch();
   }

    _bindKeyboard() {
    const keyActions = {
        'KeyW': ['thrust', 'pitchUp'],
        'Space': ['thrust'],
        'KeyS': ['glide', 'pitchDown'],
        'ArrowUp': ['pitchUp'],
        'ArrowDown': ['pitchDown'],
        'KeyA': ['yawLeft'],
        'ArrowLeft': ['yawLeft'],
        'KeyD': ['yawRight'],
        'ArrowRight': ['yawRight'],
        'KeyQ': ['rollLeft'],
        'KeyE': ['rollRight'],
        'BracketLeft': ['rollLeft'],
        'BracketRight': ['rollRight'],
      };

    window.addEventListener('keydown', (e) => {
      const actions = keyActions[e.code];
      if (actions) {
        actions.forEach(a => this.keys[a] = true);
        e.preventDefault();
       }
       // Launch
      if (e.code === 'Enter' || e.code === 'Space') {
        this._launch = true;
       }
      });

    window.addEventListener('keyup', (e) => {
      const actions = keyActions[e.code];
      if (actions) {
        actions.forEach(a => this.keys[a] = false);
       }
      });
   }

   _bindTouch() {
    this.canvas.addEventListener('touchstart', (e) => this._handleTouch(e, true), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this._handleTouch(e, true), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this._handleTouch(e, false), { passive: false });
    this.canvas.addEventListener('touchcancel', (e) => this._handleTouch(e, false), { passive: false });
   }

   _handleTouch(e, active) {
    e.preventDefault();
    const W = this.canvas.width;
    const H = this.canvas.height;

     // Track active touch count
    this.activeTouch = e.touches.length;

     // Reset touch state
    this.touchState.thrust = false;
    this.touchState.glide = false;
    this.touchState.breath = false;
    this.touchState.left = [];
    this.touchState.right = [];

    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i];
      const x = t.clientX;
      const y = t.clientY;
      const nx = x / W;
      const ny = y / H;

       // Top-right zone: breath (mobile)
      if (nx > 0.7 && ny < 0.45) {
        this.touchState.breath = true;
       }

       // Bottom-right zone: thrust (flap)
      else if (nx > 0.6 && ny > 0.65) {
        this.touchState.thrust = true;
       }

       // Bottom-left zone: glide
      else if (nx < 0.4 && ny > 0.65) {
        this.touchState.glide = true;
       }

       // Steering zones: upper area only
      if (ny < 0.65) {
        if (nx < 0.5) {
          this.touchState.left.push({ x: nx, y: ny });
         } else {
          this.touchState.right.push({ x: nx, y: ny });
         }
       }
     }

    if (!active && e.touches.length === 0) {
      this.touchState.thrust = false;
      this.touchState.glide = false;
      this.touchState.breath = false;
      this.activeTouch = 0;
     }
   }

   update() {
    const W = this.canvas.width;
    const H = this.canvas.height;

     // Keyboard always active
    const k = this.keys;

     // Touch steering: map normalized position to control values
    let touchRoll = 0;
    let touchPitch = 0;
    let touchYaw = 0;

     // Dead zone threshold for touch to filter small movements
    const deadZone = 0.12;
    const deadZoneClamp = (v) => {
      if (Math.abs(v) < deadZone) return 0;
      return Math.sign(v) * Math.min(1, (Math.abs(v) - deadZone) / (1 - deadZone));
     };

    if (this.touchState.left.length > 0) {
      const t = this.touchState.left[0];
       // X maps to roll (left edge = max left, center = 0)
      touchRoll = deadZoneClamp((t.x / 0.5 - 0.5) * 2);
       // Y maps to pitch (top = pitch up, bottom of steering zone = pitch down)
      touchPitch = deadZoneClamp(-(t.y / 0.65 - 0.3) * 2.2);
       // Yaw mirrors roll at 50% intensity
      touchYaw = touchRoll * 0.5;
      }

    if (this.touchState.right.length > 0) {
      const t = this.touchState.right[0];
       // Right side: X maps to roll + yaw
      const rawRoll = deadZoneClamp((t.x - 0.5) * 2);
      touchRoll = Math.max(Math.abs(touchRoll), Math.abs(rawRoll)) * Math.sign(rawRoll);
      touchYaw = rawRoll;
      }

    const isTouchActive = this.touchState.left.length > 0 || this.touchState.right.length > 0;

     // Launch flag
    const launch = this._launch || (isTouchActive && !this._hasLaunched);
    this._hasLaunched = this._hasLaunched || this._launch;
    this._launch = false;

     // Reset breath touch state after processing
    const breathPressed = this.touchState.breath;
    this.touchState.breath = false;

    return {
      thrust: k.thrust || this.touchState.thrust,
      glide: k.glide || this.touchState.glide,
      pitchUp: k.pitchUp || (isTouchActive && touchPitch < -0.3),
      pitchDown: k.pitchDown || (isTouchActive && touchPitch > 0.3),
      yawLeft: k.yawLeft || (isTouchActive && touchYaw < -0.3),
      yawRight: k.yawRight || (isTouchActive && touchYaw > 0.3),
      rollLeft: k.rollLeft || (isTouchActive && touchRoll < -0.3),
      rollRight: k.rollRight || (isTouchActive && touchRoll > 0.3),
      launch: launch,
      breath: breathPressed,
     };
   }
}
