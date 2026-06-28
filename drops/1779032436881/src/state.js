/**
 * Sanctuary of the Six Lights - State & Persistence
 * Ice + Water Dragon ownership: core data structures, save/load, progress runes.
 * Progress survives reload. Reset clears everything.
 */
(function (global) {
  const STORAGE_KEY = 'sanctuary-six-lights-v1';
  const MUTE_KEY = 'sanctuary-mute-v1';

  const DEFAULT_STATE = {
    completed: [], // array of dragon ids: 'fire','ice','water','snow','sea','lava'
    blessing: null, // { title: string, text: string, words: {adj, place, vow} }
    startedAt: Date.now()
  };

  let state = { ...DEFAULT_STATE };
  let listeners = [];

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = { ...DEFAULT_STATE, ...parsed };
        // sanitize
        if (!Array.isArray(state.completed)) state.completed = [];
      }
    } catch (e) { /* ignore corrupt */ }
    return state;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function getMute() {
    try {
      return localStorage.getItem(MUTE_KEY) === '1';
    } catch (e) { return false; }
  }

  function setMute(muted) {
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch (e) {}
    // notify
    window.dispatchEvent(new CustomEvent('sanctuary:mute', { detail: { muted } }));
  }

  function isComplete(id) {
    return state.completed.includes(id);
  }

  function complete(id) {
    if (!isComplete(id)) {
      state.completed.push(id);
      save();
      emit('progress', { completed: [...state.completed] });
    }
  }

  function reset() {
    state = { ...DEFAULT_STATE, startedAt: Date.now() };
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    emit('reset');
  }

  function setBlessing(blessing) {
    state.blessing = blessing;
    save();
    emit('blessing', blessing);
  }

  function getState() {
    return { ...state, completed: [...state.completed] };
  }

  function getProgressCount() {
    return state.completed.length;
  }

  function allDone() {
    return state.completed.length === 6;
  }

  function emit(type, payload) {
    listeners.forEach(fn => fn(type, payload));
  }

  function on(type, fn) {
    listeners.push(fn);
    return () => { listeners = listeners.filter(f => f !== fn); };
  }

  // public API
  global.SanctuaryState = {
    load,
    save,
    get: getState,
    isComplete,
    complete,
    reset,
    setBlessing,
    getProgressCount,
    allDone,
    getMute,
    setMute,
    on
  };

  // auto load on boot
  load();
})(window);
