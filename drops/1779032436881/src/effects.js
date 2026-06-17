/**
 * Canvas 2D procedural effects for sanctuary, particles, finale, etc.
 * Snow Dragon visual ownership.
 */
(function (global) {
  const Effects = {
    emberBurst(el) {
      // simple DOM flash on the meter element
      if (!el) return;
      el.style.transition = 'none';
      el.style.boxShadow = '0 0 30px #ffcc7a, inset 0 0 20px rgba(255,140,66,0.6)';
      setTimeout(() => {
        if (el) el.style.boxShadow = 'none';
      }, 280);
    },
    emberMiss(el) {
      if (!el) return;
      el.style.transition = 'box-shadow 0.2s';
      el.style.boxShadow = '0 0 12px rgba(120,80,60,0.3)';
      setTimeout(() => { if (el) el.style.boxShadow = ''; }, 220);
    },
    // placeholder for future canvas particle systems (sanctuary embers, snow, beams, waves)
    createParticleSystem(ctx, type) { /* later */ return { update(){}, draw(){} }; }
  };

  global.SanctuaryEffects = Effects;
})(window);
