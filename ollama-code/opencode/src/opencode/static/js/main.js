// OpenCode — Neon Runner
// Bootstrap entry. The game is split into ES modules; importing game.js
// pulls in the whole graph (audio → input → levels → entities → renderer)
// and kicks off the game loop. No script-order bookkeeping needed anymore.
// Side-effect import: game.js self-initializes on module evaluation.
import "./game.js";
