// OpenCode — Input (keyboard + touch controls)
// Depends on: nothing directly — game.js injects callbacks via bindInput().
// Exposes: keys, setKey, bindInput, unbindInput

const Input = (() => {
  "use strict";

  const keys = { left: false, right: false, jump: false, jumpPressed: false };

  const KEYMAP = {
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
    Space: "jump",
    ArrowUp: "jump",
    KeyW: "jump",
  };

  // References to game functions (set by bindInput).
  let _togglePause = null;
  let _restartRun = null;
  let _getPlayer = null;

  function setKey(code, down) {
    const k = KEYMAP[code];
    if (!k) return;
    if (down && !keys[k] && k === "jump") keys.jumpPressed = true;
    keys[k] = down;
  }

  function onKeyDown(e) {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    setKey(e.code, true);
    if ((e.code === "KeyP" || e.code === "Escape") && _togglePause) _togglePause();
    if (e.code === "KeyR" && _restartRun) _restartRun();
  }

  function onKeyUp(e) {
    setKey(e.code, false);
    // Variable jump height: releasing the jump key cuts upward velocity.
    if ((e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") && _getPlayer) {
      const player = _getPlayer();
      if (player.vy < -260) player.vy = -260;
    }
  }

  function bindInput(getPlayer, togglePause, restartRun) {
    _getPlayer = getPlayer;
    _togglePause = togglePause;
    _restartRun = restartRun;

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // Touch / pointer controls.
    document.querySelectorAll(".touch-controls button").forEach((btn) => {
      const k = btn.dataset.key;
      const down = (e) => {
        e.preventDefault();
        if (k === "jump" && !keys.jump) keys.jumpPressed = true;
        keys[k] = true;
      };
      const up = (e) => {
        e.preventDefault();
        if (k === "jump" && keys.jump && _getPlayer) {
          const player = _getPlayer();
          if (player.vy < -260) player.vy = -260;
        }
        keys[k] = false;
      };
      btn.addEventListener("pointerdown", down);
      btn.addEventListener("pointerup", up);
      btn.addEventListener("pointerleave", up);
      btn.addEventListener("pointercancel", up);
    });
  }

  function unbindInput() {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  }

  return { keys, setKey, bindInput, unbindInput };
})();