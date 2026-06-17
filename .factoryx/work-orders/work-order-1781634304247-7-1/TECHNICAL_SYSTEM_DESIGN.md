# Emberflight Gauntlet Rework — Technical System Design (Art Pass)

**Work Order:** work-order-1781634304247-7-1

## Asset Pipeline (this rework delta)
- Prior: games/92-emberflight-gauntlet/assets/generate.py (pure stdlib PNG raster + WAV PCM synth) + committed outputs. Integrated in index.html with <img> no, actually runtime Image + fetch/decodeAudioData on gesture, with exact osc fallback if !ready.
- Change: attempt real foundry (POST proof-pack or /v1/gen with Emberflight prompts for "weighty mythic fire dragon + small rider witness sprite", "glowing ember collect", "jagged hazard spire/vent with flame", "burning sky parallax haze", short sfx "dash carve", "ember chime", "maw toll", "crash rumble", "weave sigh").
- On success: place smallest files, update load code minimally (same names preferred), add to manifest.
- Fallback/enhance: edit generator for higher fidelity silhouettes + sound (see WORKLOG Pass 1); keep same output names/sizes for zero-risk integration.
- Manifest: new ASSET_MANIFEST.md here records prompts, service attempt result, file sizes, verification, integration points.
- No change to draw* or play* call sites except comments + possible minor scale tweak for new sprite readability.

## Integration points (unchanged behavior)
- Preload: on first pointer/keydown → unlock audio + start Image loads + decodeAudio; set flags.
- Draw: ctx.drawImage(assets.dragon, ...) under the vector crest/eye/wing/rider lean + flame overlays (so improved base + kinetic response preserved).
- Similar for embers (glow base + vector), hazards (decal + vector), bg (haze layer + bands).
- Audio: if (sfxBuffers.xxx) use bufferSource else prior osc/noise code (bit compatible for harnesses).

## Constraints preserved
- Single file + assets/ tree for preview tree copy.
- <2MB total.
- 60fps (no heavy filters).
- House style: fire as hungry/weighty, human small witness, consequence.

See prior TECHNICAL in selected ref for full flight model / particle / maw logic (unchanged).
