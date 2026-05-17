/**
 * Sea Dragon - Tide Song
 * Repeat a short 3-note tide motif by tapping shell notes in sequence.
 * Visual feedback always, WebAudio when unmuted. Success layers ambient waves + pearl.
 */
(function (global) {
  const MOTIF = [0, 1, 2]; // indices into shells
  let sequence = [];
  let onCompleteRef = null;
  let shells = [];

  function init(container, onComplete) {
    onCompleteRef = onComplete;
    sequence = [];
    container.innerHTML = `
      <div style="text-align:center;">
        <p style="margin:0 0 10px;color:#9aa8b8;font-size:13px;">Listen (or watch the pulse) then tap the shells in the same order. Three notes.</p>
        <div class="sea-notes">
          <div class="sea-note" data-i="0" style="border-color:#7fd8d8;">⌁</div>
          <div class="sea-note" data-i="1" style="border-color:#3aa8a8;">≈</div>
          <div class="sea-note" data-i="2" style="border-color:#7fd8d8;">⌁</div>
        </div>
        <div id="sea-status" style="margin-top:8px;font-size:12px;color:#3aa8a8;min-height:18px;">Tap the shells to echo the tide motif.</div>
      </div>
    `;

    shells = Array.from(container.querySelectorAll('.sea-note'));
    const status = container.querySelector('#sea-status');

    function playNote(i, visualOnly = false) {
      const s = shells[i];
      s.classList.add('playing');
      setTimeout(() => s.classList.remove('playing'), 280);

      if (!visualOnly && window.SanctuaryAudio) {
        const freqs = [312, 392, 466];
        window.SanctuaryAudio.playChime(freqs[i], 0.42, 'sine');
      }
    }

    function check() {
      if (sequence.length === 3) {
        const ok = sequence.every((v, i) => v === MOTIF[i]);
        if (ok) {
          status.textContent = 'The tide answers...';
          shells.forEach(s => s.classList.add('correct'));
          setTimeout(() => { if (onCompleteRef) onCompleteRef(); }, 520);
        } else {
          status.textContent = 'The pattern drifts... try again.';
          sequence = [];
          setTimeout(() => { status.textContent = 'Tap the shells to echo the tide motif.'; shells.forEach(s => s.classList.remove('correct')); }, 900);
        }
      }
    }

    shells.forEach((s, i) => {
      const handler = () => {
        sequence.push(i);
        playNote(i);
        check();
      };
      s.addEventListener('click', handler);
      s.addEventListener('touchstart', handler, { passive: true });
      s.setAttribute('tabindex', '0');
      s.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handler(); }
      });
    });

    // demo the motif once on open (visual + sound if enabled)
    setTimeout(() => {
      MOTIF.forEach((note, k) => setTimeout(() => playNote(note, false), k * 520));
    }, 380);

    return () => {};
  }

  function cleanup() {}

  global.SanctuaryTrials = global.SanctuaryTrials || {};
  global.SanctuaryTrials.sea = { init, cleanup };
})(window);

