# Neon Runner — How the Code Works (a friendly tour)

This file explains the game's code in plain language. No game-dev experience
needed — if you can follow a recipe, you can follow this.

The whole game lives in **one file**: `src/opencode/static/js/main.js`
(~550 lines). It's a "single-page app" in the truest sense: the Flask server
just sends you one HTML page, and the browser does everything else.

---

## 1. The big picture: a loop, 60 times a second

A game is basically a very fast flipbook. The core of the game is a **game
loop** — a function that runs over and over (roughly 60 times per second) and
does three things each time:

```
1. figure out what the player wants to do (read the keyboard)
2. move everything a tiny bit (physics & collisions)
3. paint the new picture on the canvas (draw)
```

In code, that's `requestAnimationFrame(loop)` calling itself forever:

```js
function loop(ts) {
  const dt = Math.min((ts - last) / 1000 || 0, 1 / 30); // seconds since last frame
  last = ts;
  if (state === "playing") { update(dt); updateCamera(); }
  draw();
  requestAnimationFrame(loop); // do it all again next frame
}
```

`dt` (delta time) is how many **seconds** passed since the last frame. Every
speed in the game (pixels per second) is multiplied by `dt`, so the game runs at
the same speed on a 60 Hz and a 144 Hz monitor. The `Math.min(..., 1/30)` just
caps it so a hiccup doesn't teleport the player.

---

## 2. The world is made of rectangles

The whole level is a list of plain objects. A ground segment, a floating
platform, and a spike are all basically the same thing: `{ x, y, width, height }`.

```js
const ground = (x, w) => platforms.push({ x, y: GROUND_Y, w, h: GROUND_H, kind: "ground" });
const plat   = (x, y, w, h = 26) => platforms.push({ x, y, w, h, kind: "plat" });
```

`GROUND_Y` is the y-coordinate of the top of the ground (the bottom of the
screen minus the ground's height). The level is built by calling these helpers —
each call is one line in the file, so the "level designer" part of the code is
just data:

```js
ground(0, 620);          // ground from x=0, 620px wide
plat(680, 420, 130);     // floating platform at x=680, 130px wide
spike(1660, 46);         // spike trap on the ground
coinArc(1250, 330, 3);   // 3 coins in a little arc
enemy(350, 120, 580, 60);// an enemy that walks back and forth
```

> **Fun fact:** the level is 5,120 px wide but the screen is only 960 px. The
> **camera** follows the player: `camera.x` tracks the player and every drawing
> call is shifted by `-camera.x`, which makes the world scroll past. That's the
> whole secret of "side-scrolling".

---

## 3. The player: physics in ~40 lines

The player is just a rectangle with extra fields: position `(x, y)`, velocity
`(vx, vy)` (speed in the x and y directions), and a flag for whether they're on
the ground.

**Gravity** is the heart of the feel. Every frame, falling speed increases:

```js
player.vy = Math.min(player.vy + GRAV * dt, MAX_FALL);
```

`GRAV` (2,300 px/s²) makes the player speed up as they fall. `MAX_FALL` is the
terminal velocity cap so they never fall absurdly fast.

**Jumping** is a single line — set velocity upward:

```js
if (player.jumpBuffer > 0 && player.coyote > 0) {
  player.vy = -JUMP_V;
  ...
}
```

Two friendly touches make jumping feel good in games:

- **Coyote time** (`COYOTE`): after you walk off a ledge, you can still jump for
  ~0.09s. Named after the cartoon character who runs off a cliff but doesn't
  fall until he looks down.
- **Jump buffering** (`BUFFER`): if you press jump a fraction of a second
  *before* landing, it fires the moment you land. No more "I pressed it but it
  didn't work!"

**Variable jump height**: if you release the jump key while going up, the upward
speed is cut, so the player rises less. Press-tap = small hop, hold = big jump.

**Collision** is the most "gamey" part. After moving horizontally, we check
whether the player rectangle overlaps any platform rectangle, and if so, push
the player back out. Then we do the same for vertical movement. The vertical
pass is **sub-stepped**: the fall is chopped into ≤12 px chunks so a very fast
fall can't tunnel straight through a thin platform between two frames.

---

## 4. Making it feel alive: enemies, coins, spikes, particles

- **Enemies** walk back and forth between `min` and `max` (flip direction at
  each end). If you land on top of one while falling (`player.vy > 120`), it's a
  **stomp**: the enemy dies, you bounce up, +50 points. Otherwise touching it
  hurts you.
- **Coins** are circles; collision uses a "closest point on rectangle to circle"
  check. Collecting sets `taken = true` so it disappears.
- **Spikes** are just rectangles you must not touch.
- **Particles** are tiny colored squares with a velocity and a lifetime. They're
  spawned by `sparkle()`, `burst()`, `dust()`, and `confetti()`, then fade out.
  All of the "juice" — sparkles on coins, confetti on winning — is just lots of
  little squares moving and fading.

---

## 5. Danger, respawning, and fairness

Getting hurt sets `invuln` (invulnerability) to 2.2 seconds, during which you
blink and can't be hurt again — so a hit never chains into a cheap death.

If you fall into a pit, you lose a life and **respawn at the last checkpoint**.
Checkpoints are hard-coded x-positions (`CHECKPOINTS`) that were each verified to
sit on solid ground, so you never respawn over a gap. One subtle bug was caught
in review here: the respawn code used to be skipped while the player was still
invulnerable, which meant falling into a pit during the blink window would soft-
lock the game (you'd fall forever). Now falling into a pit **always** respawns —
invulnerability only protects you from enemies and spikes.

```js
function hurt(fell = false) {
  if (!fell && player.invuln > 0) return; // invuln only blocks contact damage
  lives--;
  ...
}
```

---

## 6. Sound without any audio files

There are no `.mp3` or `.wav` files anywhere. Every sound is **synthesized on
the fly** with the Web Audio API:

```js
function tone(freq, dur, type = "square", vol = 0.14, ...) {
  // create an oscillator (a raw beep), connect it to the speakers,
  // play it for `dur` seconds, fade it out
}
```

A jump is a rising square wave; a coin is two quick sine notes (a little "ding-
ding"); winning plays a four-note arpeggio. Each sound is a one-line call:

```js
sfx.coin();   // tone(880, 0.08) then tone(1318, 0.12) 60ms later
```

Browsers block audio until the user interacts with the page, which is why
sounds only start after you click **Start** (`ensureAudio()`).

---

## 7. Remembering things: localStorage

`localStorage` is the browser's tiny permanent key-value store. The game uses
it twice:

```js
lsGet("opencode-best")     // your best score, restored next visit
lsSet("opencode-best", best)
```

These are wrapped in safe `lsGet`/`lsSet` helpers with `try/catch` so that if
storage is blocked (private browsing, sandboxed iframe) the game just carries on
without it instead of crashing.

---

## 8. The HTML and CSS around it

- **`templates/index.html`** — the game's markup. The `<canvas>` is where the
  game draws; the HUD (score/coins/lives/best/time) is ordinary HTML updated
  every frame by `updateHUD()`; the overlay (menu/pause/win/game-over) is a
  `<div>` that shows/hides via a CSS class.
- **`static/css/main.css`** — the dark neon theme. The canvas wrapper uses
  `aspect-ratio: 16 / 9` so the game scales to any screen width. Touch buttons
  only appear on touch devices via `@media (pointer: coarse)`.

---

## 9. Where to start reading

1. `index.html` — see what's on the page
2. `main.js`, section by section, in this order:
   1. **Level data** (the "world-building" lines)
   2. **update()** (input → physics → collisions → scoring)
   3. **draw()** (painting sky, platforms, player, enemies)
   4. **loop()** (tying it all together)

If you want to change something, the friendliest entry points are:

- **Make the level harder/easier** → edit the `ground()` / `plat()` / `enemy()` lines
- **Change player speed or jump height** → tweak `MOVE` / `JUMP_V` / `GRAV`
- **Add a new sound** → add a `sfx.mySound = () => tone(...)` line
- **Restyle the game** → edit the colors in `draw()` or `main.css`
