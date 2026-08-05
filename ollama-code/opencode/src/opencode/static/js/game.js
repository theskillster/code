// OpenCode — Game (orchestrator: state machine, flow control, game loop, wiring)
// Side-effect module: imports the other five modules, wires everything
// together, and starts the loop. Imported by main.js and the test runner.

import { Audio } from "./audio.js";
import { Input } from "./input.js";
import { Levels } from "./levels.js";
import { Entities } from "./entities.js";
import { Renderer } from "./renderer.js";

(() => {
  "use strict";

  const { ensureAudio, sfx, isSoundOn, toggleSound, playMusic, pauseMusic, stopMusic } = Audio;
  const { keys, bindInput } = Input;
  const {
    LEVELS, THEMES, LEVEL_MAX_W, clearScene, W, H, GROUND_H, GROUND_Y,
  } = Levels;
  const {
    player, gameState, particles, update, updateCamera, updateParticles,
    resetPlayer, setCallbacks, sparkle, burst, dust, confetti, fmtTime,
  } = Entities;
  const { draw, updateHUD, els, ctx, canvas } = Renderer;

  // --- Sound button state ---
  els.btnSound.textContent = isSoundOn() ? "\uD83D\uDD0A" : "\uD83D\uDD07";

  // --- Local state (not shared with entities) ---
  let best = 0;
  const lsGet = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
  const lsSet = (key, value) => { try { localStorage.setItem(key, value); } catch { /* ignore */ } };

  // Overlay auto-advance: certain screens (level intro, level complete)
  // tick a countdown and then fire an action, so the player isn't forced
  // to click. The button on those screens becomes a skip.
  const LEVEL_INTRO_SECONDS = 2.5;
  const LEVEL_COMPLETE_SECONDS = 2.0;
  // Per-level intro copy shown on the level-start overlay (level 2 onwards).
  const LEVEL_INTROS = {
    2: "Faster tempo, tighter jumps \u2014 <strong>spike rows</strong> and stacked block walls.<br>No enemies here: the level itself is the obstacle. Attempts carry over.",
    3: "The final gauntlet \u2014 <strong>spike rows</strong> and staircase block towers.<br>Memorize the rhythm. Beat it to win the game.",
  };
  let overlayTimer = 0; // 0 = no auto-advance active
  let overlayTimerText = ""; // base overlay text the countdown is appended to
  let overlayTimerVerb = "Starting"; // "Starting in…" / "Continuing in…"
  let overlayTimerAction = null; // fired when the timer runs out

  function startOverlayCountdown(seconds, text, verb, action) {
    overlayTimer = seconds;
    overlayTimerText = text;
    overlayTimerVerb = verb;
    overlayTimerAction = action;
  }

  // --- Flow control ---
  function showOverlay(title, text, btnLabel, action) {
    els.overlayTitle.textContent = title;
    els.overlayText.innerHTML = text;
    els.overlayBtn.textContent = btnLabel;
    gameState.overlayAction = action;
    els.overlay.classList.remove("hidden");
  }

  function hideOverlay() {
    els.overlay.classList.add("hidden");
  }

  // Start the BGM for the level we're about to play — track 1 for level 1,
  // a different track for level 2+. Called wherever the game enters play.
  function beginMusic() {
    playMusic(gameState.currentLevel);
  }

  function loadLevel(n) {
    gameState.currentLevel = n;
    const L = LEVELS[n];
    clearScene();
    particles.length = 0;
    gameState.coinCount = 0;
    gameState.keyCount = 0;
    gameState.time = 0;
    L.build();
    gameState.levelW = L.width;
    gameState.totalCoins = Levels.coins.length;
    gameState.CHECKPOINTS = []; // GD: no checkpoints — death restarts from x=0
    gameState.theme = THEMES[n];
  }

  function resetPlayerState() {
    resetPlayer();
    gameState.checkpoint.x = 80;
    gameState.checkpoint.y = GROUND_Y - 46;
    gameState.camera.x = 0;
  }

  function start() {
    ensureAudio();
    keys.jumpPressed = false;
    gameState.score = 0;
    gameState.attempts = 0;
    loadLevel(1);
    resetPlayer();
    gameState.state = "playing";
    hideOverlay();
    beginMusic();
  }

  function enterLevel() {
    overlayTimer = 0;
    overlayTimerAction = null;
    ensureAudio();
    keys.jumpPressed = false;
    gameState.state = "playing";
    hideOverlay();
    beginMusic();
  }

  function playLevel(n) {
    ensureAudio();
    loadLevel(n);
    resetPlayer();
    gameState.state = "playing";
    hideOverlay();
    beginMusic();
  }

  function nextLevel() {
    loadLevel(gameState.currentLevel + 1);
    resetPlayer();
    gameState.state = "menu";
    sfx.level();
    const introText = LEVEL_INTROS[gameState.currentLevel] ||
      "Level \u2014 hold to bounce, time your taps.";
    startOverlayCountdown(LEVEL_INTRO_SECONDS, introText, "Starting", enterLevel);
    showOverlay(
      `Level ${gameState.currentLevel} \u2014 ${LEVELS[gameState.currentLevel].name}`,
      introText + `<br>Starting in <strong>${Math.ceil(overlayTimer)}</strong>\u2026`,
      "Skip \u25B6",
      enterLevel
    );
  }

  function togglePause() {
    if (gameState.state === "playing") {
      gameState.state = "paused";
      sfx.pause();
      pauseMusic();
      showOverlay("Paused", "Hit <kbd>P</kbd> or press Resume to keep going.", "Resume", resume);
    } else if (gameState.state === "paused") {
      resume();
    }
  }

  function resume() {
    ensureAudio();
    keys.jumpPressed = false;
    gameState.state = "playing";
    hideOverlay();
    beginMusic();
  }

  function restartRun() {
    if (gameState.state === "playing" || gameState.state === "paused") start();
  }

  // --- Hurt / Win callbacks (set up via setCallbacks) ---
  // Hit detected: play the sound, pop a shatter burst, and start the death
  // beat. After the beat the level restarts from x=0 — no lives involved.
  function onHurt(fell = false) {
    if (!fell && gameState.dying > 0) return;
    sfx.hurt();
    burst(player.x + player.w / 2, player.y + player.h / 2, 18);
    player.vx = 0;
    player.vy = 0;
    gameState.dying = 0.5; // ~500ms shatter before restart
  }

  // Called once the dying timer reaches zero: restart the level, count the attempt.
  function resolveHurt() {
    gameState.dying = 0;
    gameState.attempts++;
    playLevel(gameState.currentLevel);
  }

  function onWin() {
    gameState.state = "win";
    stopMusic();
    sfx.win();
    confetti();
    const level = LEVELS[gameState.currentLevel];
    if (gameState.currentLevel < gameState.totalLevels) {
      const completeText =
        `Coins <strong>${gameState.coinCount}/${gameState.totalCoins}</strong> \u00B7 Attempts <strong>${gameState.attempts}</strong>`;
      startOverlayCountdown(LEVEL_COMPLETE_SECONDS, completeText, "Continuing", nextLevel);
      showOverlay(
        `Level ${gameState.currentLevel} complete! \uD83C\uDFC1`,
        completeText + `<br>Continuing in <strong>${Math.ceil(overlayTimer)}</strong>\u2026`,
        "Next level \u25B6",
        nextLevel
      );
    } else {
      showOverlay(
        "You beat the game! \uD83C\uDFC6",
        `All ${gameState.totalLevels} levels \u00B7 Coins ${gameState.coinCount} \u00B7 Best <strong>${best}%</strong>`,
        "Play again",
        start
      );
    }
  }

  // --- Game loop ---
  let last = 0;
  function loop(ts) {
    const dt = Math.min((ts - last) / 1000 || 0, 1 / 30);
    last = ts;
    gameState.animTime += dt;

    // Auto-advance overlay screens: tick the countdown and update the label;
    // when it runs out, fire the pending action. (The initial Start screen
    // has no timer, so it still waits for a click.)
    if (overlayTimer > 0) {
      overlayTimer -= dt;
      const secs = Math.max(1, Math.ceil(overlayTimer));
      els.overlayText.innerHTML =
        overlayTimerText + `<br>${overlayTimerVerb} in <strong>${secs}</strong>\u2026`;
      if (overlayTimer <= 0) {
        overlayTimer = 0;
        const action = overlayTimerAction;
        overlayTimerAction = null;
        if (action) action();
      }
    }

    if (gameState.state === "playing") {
      update(dt);
      updateCamera();
      const pct = Math.floor((player.x / gameState.levelW) * 100);
      if (pct > best) {
        best = pct;
        gameState.best = best;
        lsSet("opencode-best", String(best));
      }
    }
    updateParticles(dt);
    draw();
    updateHUD();
    requestAnimationFrame(loop);
  }

  // --- Wire up callbacks ---
  setCallbacks(onHurt, onWin, resolveHurt);

  // --- Wire up input ---
  bindInput(
    () => player,
    togglePause,
    restartRun
  );

  // --- Wire up UI buttons ---
  els.overlayBtn.addEventListener("click", () => {
    ensureAudio();
    els.overlayBtn.blur();
    if (gameState.overlayAction) gameState.overlayAction();
  });

  els.btnSound.addEventListener("click", () => {
    const on = toggleSound();
    els.btnSound.textContent = on ? "\uD83D\uDD0A" : "\uD83D\uDD07";
    if (on) { ensureAudio(); sfx.coin(); }
  });

  els.btnPause.addEventListener("click", () => {
    els.btnPause.blur();
    togglePause();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && gameState.state === "playing") togglePause();
  });

  canvas.addEventListener("pointerdown", (e) => e.preventDefault());

  // --- Dev hook ---
  window.__neon = { playLevel, loadLevel: loadLevel, start, player, coins: Levels.coins, spikes: Levels.spikes };

  // --- Initialize ---
  // best is now a percent (0-100); clamp legacy score values from old versions.
  best = Math.max(0, Math.min(100, parseInt(lsGet("opencode-best") || "0", 10) || 0));
  gameState.best = best;
  loadLevel(1);
  resetPlayer();
  showOverlay(
    "Neon Runner",
    "Auto-run neon runner: tap to jump, hold to keep bouncing.<br>Touch a spike or a block's side and you restart \u2014 how far can you get?<br>Three levels \u00B7 no enemies \u00B7 pure rhythm.",
    "Start",
    start
  );
  updateHUD();
  requestAnimationFrame(loop);
})();