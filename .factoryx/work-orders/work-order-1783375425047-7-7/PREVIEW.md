# Preview — Bunny Orbit

**Preview URL**: `games/93-bunny-orbit/index.html`
**Preview root**: `games/93-bunny-orbit/`

## How to Play
1. Open `games/93-bunny-orbit/index.html` in a browser
2. Click **Launch!** on the title screen (this also starts audio)
3. **Hold Space or click/tap** to burn thrust — the bunny accelerates in the direction you aim
4. **Release** to drift — the bunny coasts with gradual damping
5. Steer by moving your mouse/finger while burning
6. Land on 6 colorful planets to slingshot and refuel
7. Reach the glowing **Carrot Moon** to complete the journey

## Screenshot Evidence
- **Title screen**: Bunny astronaut floats among planets with title overlay (screenshot captured at `/tmp/bunny-orbit-title.png`)
- **Foundry assets visible**: The bunny astronaut GLB (foundry-generated) renders as the central character with helmet, ears, and spacesuit

## Technical Notes
- Single HTML file, no build step, no server required
- Three.js 3D rendering with GLTF model loading
- Raw WebAudio API for music + SFX (after user gesture)
- Foundry blocks-2d for game loop, input, scenes
- Total payload ~12.7 MB (mostly audio assets)
