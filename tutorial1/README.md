# Couple - A Two-Player Maze Game

A cooperative maze game where two players must meet at the goal while avoiding hazards.

## How to Run

1. Open `index.html` in a web browser

   **Option A:** Double-click `index.html` to open in your default browser

   **Option B:** Start a local server:
   ```bash
   # Python 3
   python3 -m http.server 8080

   # Then open http://localhost:8080 in your browser
   ```

## Controls

| Key | Player A | Player B |
|-----|----------|----------|
| W / ↑ | Up | Down |
| S / ↓ | Down | Up |
| A / ← | Left | Right |
| D / → | Right | Left |
| SPACE | Start game | |
| ENTER | Restart / Next stage | |

## Gameplay

- Two players start in opposite corners of the maze
- Both players move simultaneously in **opposite directions**
- Avoid water hazards (blue tiles) - they will end the game
- Reach the **goal together** before time runs out
- Complete all 4 stages to win!

## Files

```
├── index.html    # Main game file
├── images/       # Game assets (sprites, backgrounds)
└── README.md     # This file
```
