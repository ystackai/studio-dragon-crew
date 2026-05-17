(function (global) {
  global.SanctuaryTrials = global.SanctuaryTrials || {};
  global.SanctuaryTrials.water = {
    init(c, onComplete) {
      c.innerHTML = `<div style="padding:20px;text-align:center;color:#4fb3d8;">River flow puzzle coming in next slice. <button onclick="this.closest('#trial-overlay').querySelector('#trial-complete').click()" style="margin-top:10px;padding:6px 14px;border:1px solid #4fb3d8;color:#4fb3d8;background:none;border-radius:999px;cursor:pointer;">Complete for now</button></div>`;
    },
    cleanup() {}
  };
})(window);
