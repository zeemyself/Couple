# Couple — Cooperative Mirrored Maze Game

A modern web port of the classic 2014 two-player cooperative maze game **Couple**, built with zero-build **Vanilla ES Modules** and **HTML5 Canvas** (replacing legacy Cocos2d-js).

## How to Run

Start any local HTTP server in the `tutorial1` directory:

```bash
cd tutorial1
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

## Controls

| Input | Player 1 (P1) | Player 2 (P2) |
|-------|---------------|---------------|
| `W` / `↑` / D-Pad `↑` | Up | Down |
| `S` / `↓` / D-Pad `↓` | Down | Up |
| `A` / `←` / D-Pad `←` | Left | Right |
| `D` / `→` / D-Pad `→` | Right | Left |
| `Space` / `Enter` | Start Game / Next Stage / Retry | |
| `P` / `Esc` | Pause / Resume | |
| `R` | Restart Current Stage | |

On mobile and touch devices, use the on-screen **D-Pad** or swipe directly on the maze canvas.

## Gameplay Rules

- **Mirrored Movement**: Player 1 and Player 2 start in opposite corners of the maze and move in **opposite directions** simultaneously.
- **Wall Alignment**: Use maze walls (`#`) to hold one player in place while navigating the other player into alignment.
- **Water Hazards**: Avoid stepping onto blue water tiles (`O`)—if either player falls in, the stage ends!
- **Central Goal**: Bring both players together to the glowing central goal before the 60-second timer runs out across all 4 stages.

## Custom Stage Upload & Solvability Test

Click **+ Upload Stage** in the top HUD bar (or open [http://localhost:8080/upload.html](http://localhost:8080/upload.html)) to create or upload custom stages:

- **Input Methods**: Paint directly on the interactive 20×13 visual grid (with 180° mirror brush), upload a `.txt` or `.json` stage file, or paste a 13-row ASCII map.
- **Pre-Submit Solvability Verification**:
  1. **Automated BFS Solver**: Searches the 2-player mirrored state space to verify a hazard-free path exists from P1/P2 spawns to the central goal.
  2. **Interactive Playtest Arena**: Play and clear the stage on the embedded canvas (or run the BFS solution demo) to unlock the **Submit Verified Stage** button.
- **Run Unit Tests**:
  ```bash
  node --test tutorial1/tests/solver.test.js
  ```

## Project Structure

```text
tutorial1/
├── index.html          # Main game shell, HUD, overlays, and touch D-Pad
├── upload.html         # Stage creator, file uploader, BFS verifier, and playtest arena
├── styles.css          # Modern dark-arcade styling, responsive layout, glassmorphic modals
├── images/             # Original 2014 sprite and banner assets
├── src/
│   ├── main.js         # Application bootstrapper
│   ├── game.js         # Fixed-timestep game loop & state machine
│   ├── config.js       # Grid constants, built-in stage maps, and timings
│   ├── stages.js       # Built-in + localStorage custom stage manager
│   ├── solver.js       # Grid validator & BFS mirrored-movement solvability solver
│   ├── upload.js       # Stage upload page controller & live playtest runner
│   ├── assets.js       # Promise-based image loader with fallbacks
│   ├── maze.js         # Tile collision, floor grid, water shimmer, and goal aura
│   ├── player.js       # Grid-center movement, interpolation, and P1/P2 indicators
│   ├── input.js        # Buffered keyboard stack, touch D-Pad, and swipe controls
│   ├── effects.js      # Particle trails, water ripples, goal celebration, and screen shake
│   └── ui.js           # HUD synchronization, stage selector pills, and modal overlays
└── tests/
    └── solver.test.js  # Automated tests for grid validation, BFS solver, and custom stages
```
