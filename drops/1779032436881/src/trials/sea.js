(function (global) {
  global.SanctuaryTrials = global.SanctuaryTrials || {};
  global.SanctuaryTrials.sea = {
    init(c, onComplete) {
      c.innerHTML = `<div style="padding:20px;text-align:center;color:#3aa8a8;">Tide motif (3 notes, visual + audio) — stub. <button onclick="this.closest('#trial-overlay').querySelector('#trial-complete').click()" style="margin-top:10px;padding:6px 14px;border:1px solid #3aa8a8;color:#3aa8a8;background:none;border-radius:999px;cursor:pointer;">Hear the tide (temp)</button></div>`;
    },
    cleanup() {}
  };
})(window);
