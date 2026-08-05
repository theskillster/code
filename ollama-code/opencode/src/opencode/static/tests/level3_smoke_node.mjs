// OpenCode — headless smoke-harness driver (Node).
//
// Runs the SAME level3_smoke_runner.js the browser harness uses, but in Node
// with a minimal stub DOM/canvas/localStorage, so the 34 checks can be run
// from the CLI on any machine with Node — no browser needed. The runner
// drives Entities.update() directly, so the requestAnimationFrame game loop
// is stubbed to no-op and the WebAudio API is absent (sfx/music no-op).
//
// Usage:  node src/opencode/static/tests/level3_smoke_node.mjs
// Exit:   0 if every check passed, 1 otherwise.

// --- Minimal canvas 2D context stub (draw() never runs in the harness) ---
const ctxHandler = {
  get(target, prop) {
    if (prop === "measureText") return () => ({ width: 0 });
    if (prop === "createLinearGradient" || prop === "createRadialGradient") {
      return () => ({ addColorStop: () => {} });
    }
    // Any other property (fillStyle, scale, fillRect, ...) is either a
    // no-op callable or a read we don't care about.
    if (typeof prop === "string") return () => ctxProxy;
    return undefined;
  },
  set() { return true; }, // swallow all property writes
};
const ctxProxy = new Proxy({}, ctxHandler);

// --- Element stub: everything game.js/renderer.js touch at module init ---
function makeEl(id) {
  return {
    id,
    textContent: "",
    innerHTML: "",
    style: {},
    dataset: {},
    classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
    addEventListener() {},
    removeEventListener() {},
    blur() {},
    focus() {},
    getContext: () => ctxProxy,
    width: 0,
    height: 0,
    appendChild() {},
    setAttribute() {},
  };
}

// --- document stub ---
const els = new Map();
globalThis.document = {
  getElementById: (id) => {
    if (!els.has(id)) els.set(id, makeEl(id));
    return els.get(id);
  },
  querySelectorAll: () => [],
  addEventListener() {},
  removeEventListener() {},
  createElement: () => makeEl(""),
  body: makeEl("body"),
  hidden: false,
};

// --- window stub (game.js sets window.__neon; renderer reads devicePixelRatio) ---
const windowStub = {
  devicePixelRatio: 1,
  addEventListener() {},
  removeEventListener() {},
  // No AudioContext: audio.js then no-ops every sfx/music call.
  AudioContext: undefined,
  webkitAudioContext: undefined,
};
globalThis.window = windowStub;
globalThis.requestAnimationFrame = () => {}; // keep the game loop off
globalThis.cancelAnimationFrame = () => {};

// --- localStorage stub (audio.js reads a pref at import; game.js wraps in try/catch) ---
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => void store.set(k, String(v)),
  removeItem: (k) => void store.delete(k),
};

// --- Run the real harness (and through it, the six game modules) ---
const runnerUrl = new URL("./level3_smoke_runner.js", import.meta.url).href;
await import(runnerUrl);

const results = els.get("results");
const text = results ? results.textContent : "";
const lines = text.split("\n").filter((l) => l.trim().length > 0);
const pass = lines.filter((l) => l.startsWith("PASS")).length;
const fail = lines.filter((l) => l.startsWith("FAIL")).length;

console.log(text || "(harness produced no output)");
console.log(`\n${pass} PASS, ${fail} FAIL`);
process.exit(fail === 0 && pass > 0 ? 0 : 1);
