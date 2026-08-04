// OpenCode — Neon Runner
// This file is now a module loader. The game logic has been split into:
//   audio.js, input.js, levels.js, entities.js, renderer.js, game.js
// Each module is a self-contained IIFE exposing a single global (e.g. Audio, Input, etc.)

(() => {
  "use strict";

  const canvas = document.getElementById("game-canvas");
  if (!canvas) {
    console.log("OpenCode frontend loaded");
    return;
  }

  // All modules are loaded via <script> tags in order:
  //   1. audio.js     — WebAudio sound synthesis
  //   2. input.js     — keyboard + touch input
  //   3. levels.js    — level data, themes, constants
  //   4. entities.js  — physics, player, particles, collisions, update logic
  //   5. renderer.js  — all draw functions, canvas setup, HUD
  //   6. game.js      — orchestrator: state machine, game loop, wiring, init
  //
  // Each module exposes a global (Audio, Input, Levels, Entities, Renderer, Game).
  // game.js is the main entry point — it wires everything together and starts the loop.

  console.log("OpenCode modules loaded: Audio, Input, Levels, Entities, Renderer, Game");
})();