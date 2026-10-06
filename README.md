# Bouncing Ball Simulation

A small canvas-based physics demo in plain JavaScript. A red ball drops from the top of the canvas, is pulled down by gravity, slowed by air resistance, and bounces off the floor, losing energy with each bounce.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page with the `<canvas>` element; loads the script |
| `projectpage.css` | Style sheet for the page
| `projectpage.js` | The simulation (physics and drawing) |

Both files must be in the same folder.

## Running it

1. Put `index.html` and `projectpage.js` in the same folder.
2. Open `index.html` in a browser (double-click it), or right-click it in VS Code and choose **Open with Live Server** if you have that extension.

If the canvas is blank, open the browser console (Cmd+Option+J in Chrome on Mac) and check for errors.

## How it works

Each frame (every `dt` seconds), the simulation:

1. Calculates the **weight force** (`m * 9.81`).
2. Subtracts the **air drag force** (`0.5 * rho * C_d * A * v²`).
3. Updates the ball's position and velocity using **Verlet-style integration**.
4. Checks for **floor collision**. On impact, velocity is multiplied by the coefficient of restitution `e` (negative, so the direction flips) and the ball is moved back above the floor.
5. Clears and redraws the canvas.

Units are SI (meters, kg, seconds) in the math, with 1 pixel = 1 cm for display, so positions are scaled by 100 when applied.

## Settings to experiment with

All of these are variables at the top of `projectpage.js`:

| Variable | Default | Effect |
| --- | --- | --- |
| `m` |  Ball mass in kg |
| `r` |  Ball radius in pixels (cm) |
| `dt` |  Time step in seconds |
| `e` |  Bounciness. Closer to `-1` bounces higher; closer to `0` barely bounces |
| `rho` |  Fluid density. Try `1000` to simulate water |
| `C_d` | Drag coefficient (about 0.47 for a sphere) |
| `x`, `y` |  Starting position |

The canvas size in `index.html` should match `width` and `height` in the script (both 400 by default).

## Known simplifications

- Uses `setInterval` for timing. A more robust version would use `requestAnimationFrame` and pass the measured frame time into the physics step.
- Only the vertical axis is simulated. There is no horizontal motion and no wall collisions.
- Collision detection is a simple floor check.
