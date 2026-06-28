/**
 * Sanctuary of the Six Lights - Dragon Definitions
 * Lava Dragon (narrative) + Snow (visual) ownership.
 * All dialogue, names, colors, portrait paths, trial hints.
 */
(function (global) {
  const PORTRAIT_ROOT = '../../team/avatars/generated/';

  const DRAGONS = [
    {
      id: 'fire',
      name: 'Fire Dragon',
      title: 'Ember Oath',
      element: 'fire',
      color: '#ff8c42',
      accent: '#ffcc7a',
      portrait: PORTRAIT_ROOT + 'fire-dragon.png',
      invite: 'The embers remember courage. Hold the warmth until three lights answer.',
      short: 'Awaken courage',
      success: 'Braziers lit. The sanctuary feels a little warmer.',
      rune: '✧'
    },
    {
      id: 'ice',
      name: 'Ice Dragon',
      title: 'Crystal Refraction',
      element: 'ice',
      color: '#a8d5ff',
      accent: '#d4e9ff',
      portrait: PORTRAIT_ROOT + 'ice-dragon.png',
      invite: 'A hidden path waits for clarity. Turn the mirrors until the beam finds the gate.',
      short: 'Bring clarity',
      success: 'Crystalline bridges form. The stars feel sharper.',
      rune: '❋'
    },
    {
      id: 'water',
      name: 'Water Dragon',
      title: 'River of Memory',
      element: 'water',
      color: '#4fb3d8',
      accent: '#8fd4f0',
      portrait: PORTRAIT_ROOT + 'water-dragon.png',
      invite: 'Flow remembers. Guide the stream through the tiles so the basin fills again.',
      short: 'Restore flow',
      success: 'Water moves again. Reflective pools shimmer under the sanctuary.',
      rune: '≈'
    },
    {
      id: 'snow',
      name: 'Snow Dragon',
      title: 'Quiet Constellation',
      element: 'snow',
      color: '#e0e8f2',
      accent: '#f4f7fc',
      portrait: PORTRAIT_ROOT + 'snow-dragon.png',
      invite: 'Stillness gathers beauty. Catch the drifting glyphs until the constellation settles.',
      short: 'Create through stillness',
      success: 'Soft snow falls. Lanterns bloom with gentle light.',
      rune: '✺'
    },
    {
      id: 'sea',
      name: 'Sea Dragon',
      title: 'Tide Song',
      element: 'sea',
      color: '#3aa8a8',
      accent: '#7fd8d8',
      portrait: PORTRAIT_ROOT + 'sea-dragon.png',
      invite: 'The ocean answers in three notes. Tap the shells in the right order.',
      short: 'Tune the living chord',
      success: 'The tide answers. Waves rise and pearl light answers from below.',
      rune: '⌁'
    },
    {
      id: 'lava',
      name: 'Lava Dragon',
      title: 'Name the New Star',
      element: 'lava',
      color: '#d46a3a',
      accent: '#f4a26b',
      portrait: PORTRAIT_ROOT + 'lava-dragon.png',
      invite: 'Every sanctuary needs a name. Choose three words and speak them into being.',
      short: 'Give the sanctuary its name',
      success: 'The name echoes. The Sky Loom opens.',
      rune: '✶'
    }
  ];

  const DRAGON_BY_ID = Object.fromEntries(DRAGONS.map(d => [d.id, d]));

  // Poetic word rings for Lava trial (Lava Dragon copy)
  const WORD_RINGS = {
    adj: ['Luminous', 'Eternal', 'Gentle', 'Crimson', 'Silver', 'Wandering', 'Hidden', 'Radiant'],
    place: ['Sanctuary', 'Aether', 'Constellation', 'Haven', 'Ember', 'Horizon', 'Veil', 'Nexus'],
    vow: ['Remembers', 'Ascends', 'Protects', 'Sings', 'Endures', 'Illuminates', 'Gathers', 'Dreams']
  };

  // Short blessing templates (Lava)
  function makeBlessing(words) {
    const { adj, place, vow } = words;
    const title = `${adj} ${place} ${vow}`;
    const texts = [
      `The ${adj.toLowerCase()} ${place.toLowerCase()} ${vow.toLowerCase()}. The six lights now travel together.`,
      `Where the ${adj.toLowerCase()} ${place.toLowerCase()} ${vow.toLowerCase()}, the sanctuary wakes and the dragons watch over it.`,
      `In the ${adj.toLowerCase()} ${place.toLowerCase()}, the crew keeps its promise: ${vow.toLowerCase()}.`
    ];
    return { title, text: texts[Math.floor(Math.random() * texts.length)], words };
  }

  global.SanctuaryDragons = {
    list: DRAGONS,
    byId: DRAGON_BY_ID,
    wordRings: WORD_RINGS,
    makeBlessing,
    PORTRAIT_ROOT
  };
})(window);
