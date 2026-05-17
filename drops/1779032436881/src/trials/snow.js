(function (global) {
  global.SanctuaryTrials = global.SanctuaryTrials || {};
  global.SanctuaryTrials.snow = {
    init(c, onComplete) {
      c.innerHTML = `<div style="padding:20px;text-align:center;color:#e0e8f2;">Snow glyph catcher (calm) — stub for now. <button onclick="this.closest('#trial-overlay').querySelector('#trial-complete').click()" style="margin-top:10px;padding:6px 14px;border:1px solid #e0e8f2;color:#e0e8f2;background:none;border-radius:999px;cursor:pointer;">Catch (temp)</button></div>`;
    },
    cleanup() {}
  };
})(window);
