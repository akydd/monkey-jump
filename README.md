# Monkey Jump

A vertical platform game where you guide a monkey up a towering tree by leaping between branches. How high can you climb before the branches give way beneath you?

## Gameplay

Branches break after you stand on them too long — they flash orange as a warning. Step off a branch to reset its timer. Broken branches grow back after 5 seconds. Keep moving upward to survive. The game ends if you fall to the bottom.

Two trackers are shown at the top-left of the screen:
- **Current** — your height right now
- **Best** — the highest point reached this run

### Controls

#### Keyboard

| Key | Action |
|-----|--------|
| `←` / `→` | Move left / right |
| `↑` | Jump |
| `Esc` | Pause / resume |

#### Mobile

On-screen buttons are displayed during gameplay:

| Button | Action |
|--------|--------|
| `◀` (bottom-left) | Move left |
| `▶` (bottom-left) | Move right |
| `▲` (bottom-right) | Jump |
| `❚❚` (top-right) | Pause / resume |

## Running locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173/monkey-jump/ in your browser.
