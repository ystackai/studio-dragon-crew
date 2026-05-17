/**
 * Lava Dragon - Name the New Star
 * Three small rotating word rings: adjective, creature/place, vow.
 * Click any ring to cycle its word. The final phrase becomes the blessing title.
 * Interactive writing, not form fields. Poetic but short options.
 */
(function (global) {
  let chosen = { adj: 'Luminous', place: 'Sanctuary', vow: 'Remembers' };
  let onCompleteRef = null;

  function init(container, onComplete) {
    onCompleteRef = onComplete;
    const rings = window.SanctuaryDragons.wordRings;
    chosen = {
      adj: rings.adj[0],
      place: rings.place[0],
      vow: rings.vow[0]
    };
    window._lavaChosen = { ...chosen };

    container.innerHTML = `
      <div style="text-align:center;">
        <p style="margin:0 0 8px;color:#9aa8b8;font-size:13px;">Click each ring to choose. The three words become the sanctuary's name and your blessing.</p>
        <div id="word-rings">
          <div class="word-ring" data-key="adj">
            <div class="label">ADJECTIVE</div>
            <div class="words" id="ring-adj">${chosen.adj}</div>
          </div>
          <div class="word-ring" data-key="place">
            <div class="label">PLACE / CREATURE</div>
            <div class="words" id="ring-place">${chosen.place}</div>
          </div>
          <div class="word-ring" data-key="vow">
            <div class="label">VOW / PROMISE</div>
            <div class="words" id="ring-vow">${chosen.vow}</div>
          </div>
        </div>
        <div style="margin-top:12px;font-size:11px;color:#d46a3a;">Your name: <span id="lava-preview" style="color:#f4d9a8;font-weight:600;">${chosen.adj} ${chosen.place} ${chosen.vow}</span></div>
      </div>
    `;

    function cycle(key) {
      const arr = rings[key];
      let idx = arr.indexOf(chosen[key]);
      idx = (idx + 1) % arr.length;
      chosen[key] = arr[idx];
      document.getElementById(`ring-${key}`).textContent = chosen[key];
      document.getElementById('lava-preview').textContent = `${chosen.adj} ${chosen.place} ${chosen.vow}`;
      if (window.SanctuaryAudio && window.SanctuaryAudio.playRotateClick) window.SanctuaryAudio.playRotateClick();
      window._lavaChosen = { ...chosen }; // for claim handler to use latest words
    }

    ['adj','place','vow'].forEach(k => {
      const el = container.querySelector(`[data-key="${k}"]`);
      el.addEventListener('click', () => cycle(k));
      el.style.cursor = 'pointer';
      // keyboard: Enter on the ring
      el.setAttribute('tabindex', '0');
      el.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); cycle(k); }
      });
    });

    // auto-claim hint
    const claim = document.getElementById('trial-complete');
    if (claim) claim.style.display = 'inline-block';
    // wire the Claim handler immediately so user can finish without tapping preview first
    if (onCompleteRef) onCompleteRef();
    // also allow click on preview to set blessing early + trigger claim path
    const preview = document.getElementById('lava-preview');
    if (preview) preview.addEventListener('click', () => {
      const b = window.SanctuaryDragons.makeBlessing(chosen);
      window.SanctuaryState.setBlessing(b);
      if (onCompleteRef) onCompleteRef();
    });

    return () => {};
  }

  function cleanup() {}

  global.SanctuaryTrials = global.SanctuaryTrials || {};
  global.SanctuaryTrials.lava = { init, cleanup };
})(window);

