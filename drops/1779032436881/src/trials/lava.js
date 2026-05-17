(function (global) {
  global.SanctuaryTrials = global.SanctuaryTrials || {};
  global.SanctuaryTrials.lava = {
    init(c, onComplete) {
      c.innerHTML = `<div style="padding:20px;text-align:center;color:#d46a3a;">Word rings for the sanctuary name — stub for Slice 1. <button onclick="this.closest('#trial-overlay').querySelector('#trial-complete').click()" style="margin-top:10px;padding:6px 14px;border:1px solid #d46a3a;color:#d46a3a;background:none;border-radius:999px;cursor:pointer;">Name it (temp)</button></div>`;
    },
    cleanup() {}
  };
})(window);
