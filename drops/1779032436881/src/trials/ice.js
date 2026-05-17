/**
 * Ice Dragon - Crystal Refraction (stub for Slice 1, full later)
 */
(function (global) {
  global.SanctuaryTrials = global.SanctuaryTrials || {};
  global.SanctuaryTrials.ice = {
    init(container, onComplete) {
      container.innerHTML = `<div style="padding:20px;text-align:center;color:#a8d5ff;">
        <p>Mirror puzzle will go here. For now, claim the blessing.</p>
        <button onclick="this.closest('#trial-overlay').querySelector('#trial-complete').click()" style="margin-top:12px;padding:8px 18px;border-radius:999px;background:#1a2a3a;border:1px solid #a8d5ff;color:#a8d5ff;cursor:pointer;">Solve (temp)</button>
      </div>`;
      // onComplete will be wired by main when #trial-complete clicked
    },
    cleanup() {}
  };
})(window);
