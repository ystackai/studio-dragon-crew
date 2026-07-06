# Asset Manifest — Bunny Orbit

## Foundry Jobs

### Job 1: Bunny Astronaut (3D protagonist)
- **Job ID**: `asset-1783377731271-937a6349`
- **Recipe**: `bunny_companion`
- **Asset Name**: `bunny-astronaut-hero`
- **Request JSON**: `{"recipe":"bunny_companion","asset_name":"bunny-astronaut-hero","prompt":"A cute white bunny wearing a small transparent space helmet and a silver spacesuit, floating in space. Big expressive eyes, long floppy ears visible through the helmet, rounded body. Stylized low-poly game-ready character with clean silhouette. Soft white fur color, light blue spacesuit, warm orange visor tint.","style":"cute stylized low-poly game character"}`
- **State**: succeeded
- **Copied outputs**:
  - `/outputs/asset-1783377731271-937a6349/bunny_companion.glb` → `games/93-bunny-orbit/assets/foundry/bunny_astronaut.glb` (2,038,380 bytes)
  - `/outputs/.../textures/albedo.png` → `games/93-bunny-orbit/assets/foundry/textures/albedo.png` (371,161 bytes)
  - `/outputs/.../textures/height.png` → `games/93-bunny-orbit/assets/foundry/textures/height.png` (237,056 bytes)
  - `/outputs/.../textures/normal.png` → `games/93-bunny-orbit/assets/foundry/textures/normal.png` (1,020,317 bytes)
  - `/outputs/.../textures/roughness.png` → `games/93-bunny-orbit/assets/foundry/textures/roughness.png` (62,743 bytes)
- **Integration**: Loaded as Three.js GLTF model in `game.js` via `loadBunny()`. Scaled 1.5×, serves as the visible player character (the bunny astronaut).

### Job 2: Cozy Audio Pack (Music + SFX)
- **Job ID**: `asset-1783377739793-8003d200`
- **Recipe**: `cozy_audio_pack`
- **Asset Name**: `bunny-orbit-audio`
- **Request JSON**: `{"recipe":"cozy_audio_pack","asset_name":"bunny-orbit-audio","prompt":"Gentle wonder space music and SFX for a cozy space adventure game. Soft ambient loop, thrust rumble, cushioned landing, payoff chime, movement whoosh, danger ping.","style":"gentle wonder, cozy space adventure"}`
- **State**: succeeded
- **Copied outputs**:
  - `/outputs/asset-1783377739793-8003d200/foundry_music_loop.wav` → `games/93-bunny-orbit/assets/foundry/music_loop.wav` (7,362,824 bytes)
  - `/outputs/.../sfx/thrust.wav` → `games/93-bunny-orbit/assets/foundry/sfx/thrust.wav` (130,580 bytes)
  - `/outputs/.../sfx/landing.wav` → `games/93-bunny-orbit/assets/foundry/sfx/landing.wav` (144,692 bytes)
  - `/outputs/.../sfx/payoff.wav` → `games/93-bunny-orbit/assets/foundry/sfx/payoff.wav` (127,052 bytes)
  - `/outputs/.../sfx/movement.wav` → `games/93-bunny-orbit/assets/foundry/sfx/movement.wav` (130,580 bytes)
  - `/outputs/.../sfx/danger.wav` → `games/93-bunny-orbit/assets/foundry/sfx/danger.wav` (109,412 bytes)
  - `/outputs/.../sfx/reveal.wav` → `games/93-bunny-orbit/assets/foundry/sfx/reveal.wav` (185,264 bytes)
  - `/outputs/.../sfx/impact.wav` → `games/93-bunny-orbit/assets/foundry/sfx/impact.wav` (144,692 bytes)
  - `/outputs/.../sfx/interaction.wav` → `games/93-bunny-orbit/assets/foundry/sfx/interaction.wav` (102,356 bytes)
  - `/outputs/.../sfx/nearmiss.wav` → `games/93-bunny-orbit/assets/foundry/sfx/nearmiss.wav` (109,412 bytes)
- **Integration**: Music loop starts on first user interaction (click Launch). SFX triggered in `game.js`: `thrust` during burn, `landing` on planet touch, `payoff` on carrot moon arrival, `movement` on game start.

## Integration Points
- **Bunny GLB**: Player character, loaded in `game.js` `loadBunny()`. Fallback procedural bunny if GLB fails.
- **Music**: `music_loop.wav` loaded via fetch → WebAudio decode → looping buffer source. Starts on "Launch!" click.
- **SFX**: 9 WAV files loaded via fetch → WebAudio decode, played by `playSFX(name)` at various game events.

## Total Payload
- **GLB + textures**: ~3.7 MB
- **Audio (music + 9 SFX)**: ~8.2 MB
- **JS assets (three.min + GLTFLoader + blocks)**: ~825 KB
- **Grand total**: ~12.7 MB

## Verification Evidence
- Title screen screenshot: `/tmp/bunny-orbit-title.png` — bunny astronaut visible with helmet, surrounded by colorful planets, title UI overlay with Launch button
- All 28 game files verified present with non-zero sizes
