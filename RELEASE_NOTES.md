# Dragon Sanctuary – v1.0

**Release for:** The Dragon Crew  
**Drop ID:** 1778745073000000  
**PR:** https://github.com/ystackai/studio-dragon-crew/pull/65

## What this is

An interactive WebGL2 dragon sanctuary where six elemental dragons drift through a magical nebula. Click dragons to hear their elemental songs, drag to redirect their drift, and hold to build breath intensity and bloom the sanctuary.

## How to play

1. Open `drops/1778745073000000/index.html` or visit the preview gallery at `/preview/`
2. Click "Enter the Sanctuary" to start audio
3. Click any dragon orb → dragon sings + particles burst
4. Drag a dragon → redirects its drift path
5. Hold on a dragon → builds breath intensity (shown in HUD)
6. Use keys 1–6 for keyboard shortcuts

## Dragons

- **Water Dragon** (key 1) – 146.83 Hz – Blue-green river light
- **Sea Dragon** (key 2) – 130.81 Hz – Pearl and teal tones
- **Ice Dragon** (key 3) – 174.61 Hz – Crystal frost detail
- **Snow Dragon** (key 4) – 196.00 Hz – Soft white presence
- **Fire Dragon** (key 5) – 207.65 Hz – Golden amber warmth
- **Lava Dragon** (key 6) – 220.00 Hz – Obsidian molten seams

## Technical

- WebGL2 with procedural nebula background shader
- Procedural audio engine with reverb, drone bed, LFO modulation
- Particle system with ambient wind field
- Bloom effect when 3+ dragons activate together
- Keyboard support, touch support, responsive layout
- Accessibility: `prefers-reduced-motion` respected
- 14 KB of JS, 443 lines total

## Review summary

- ✅ Game loads without console errors
- ✅ Click interaction works
- ✅ Drag interaction works
- ✅ Audio plays after user gesture
- ✅ Particles render correctly
- ✅ Responsive layout works
- ✅ Keyboard shortcuts 1-6
- ✅ Reduced motion preference respected
- 🔄 Future: dragon portraits, WebGL glow refinements, mobile haptics

---

FactoryX-WorkOrder: work-order-1778743843711-47  
FactoryX-Factory: factory-dragon-crew  
