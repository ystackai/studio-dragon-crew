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
    this.touchState = {
      thrust: false,
      glide: false,
      left: [],
      right: [],
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

    // Reset touch state
    this.touchState.thrust = false;
    this.touchState.glide = false;
    this.touchState.left = [];
    this.touchState.right = [];

    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i];
      const x = t.clientX;
      const y = t.clientY;

      // Bottom-right zone: thrust (flap)
      if (x > W * 0.6 && y > H * 0.65) {
        this.touchState.thrust = true;
      }
      // Bottom-left zone: glide
      if (x < W * 0.4 && y > H * 0.65) {
        this.touchState.glide = true;
      }
      // Left side: steering
      if (x < W * 0.5) {
        this.touchState.left.push({ x, y });
      } else {
        this.touchState.right.push({ x, y });
      }
    }

    if (!active && e.touches.length === 0) {
      this.touchState.thrust = false;
      this.touchState.glide = false;
    }
  }

  update() {
    const W = this.canvas.width;
    const H = this.canvas.height;

    // Keyboard always active
    const k = this.keys;

    // Merge touch input
    // Touch steering: left touch X maps to roll, Y maps to pitch
    let touchRoll = 0;
    let touchPitch = 0;
    let touchYaw = 0;

    if (this.touchState.left.length > 0) {
      const t = this.touchState.left[0];
      touchRoll = (t.x / (W * 0.5) - 0.5) * 2;
      touchPitch = -(t.y / (H * 0.65) - 0.5) * 2;
      touchYaw = touchRoll * 0.5;
    }
    if (this.touchState.right.length > 0) {
      const t = this.touchState.right[0];
      touchRoll = (t.x / W - 0.5) * 2;
      touchYaw = (t.x / W - 0.5) * 2;
    }

    const isTouchActive = this.touchState.left.length > 0 || this.touchState.right.length > 0;

    // Launch flag
    const launch = this._launch || (isTouchActive && !this._hasLaunched);
    this._hasLaunched = this._hasLaunched || this._launch;
    this._launch = false;

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
    };
  }
}
