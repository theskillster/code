// OpenCode — Audio (tiny WebAudio synth, no assets)
// Exposes: ensureAudio, tone, sfx, playMusic, pauseMusic, stopMusic,
//          musicActive, isSoundOn, toggleSound

const Audio = (() => {
  "use strict";

  let audioCtx = null;
  let soundOn = true;

  // Try to read saved preference on load.
  try {
    soundOn = localStorage.getItem("opencode-sound") !== "off";
  } catch { /* storage unavailable */ }

  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  }

  function tone(freq, dur, type = "square", vol = 0.14, slide = 0, delay = 0) {
    if (!soundOn || !audioCtx) return;
    const t = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  const sfx = {
    jump: () => tone(330, 0.16, "square", 0.1, 240),
    coin: () => {
      tone(880, 0.08, "sine", 0.12);
      tone(1318, 0.12, "sine", 0.12, 0, 0.07);
    },
    key: () => {
      tone(660, 0.1, "sine", 0.13);
      tone(990, 0.16, "sine", 0.13, 0, 0.09);
    },
    gate: () => tone(200, 0.5, "sawtooth", 0.1, 360),
    shoot: () => {
      tone(150, 0.1, "sawtooth", 0.09, -70);
      tone(760, 0.07, "square", 0.07, 0, 0.02);
    },
    stomp: () => tone(220, 0.12, "square", 0.13, -90),
    hurt: () => tone(340, 0.3, "sawtooth", 0.14, -200),
    pause: () => tone(520, 0.08, "sine", 0.09),
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, "triangle", 0.15, 0, i * 0.11)),
    level: () => [392, 523, 659, 784].forEach((f, i) => tone(f, 0.14, "triangle", 0.14, 0, i * 0.1)),
    over: () => [392, 311, 233, 155].forEach((f, i) => tone(f, 0.28, "sawtooth", 0.12, 0, i * 0.16)),
    life: () => {
      tone(523, 0.1, "triangle", 0.14);
      tone(784, 0.16, "triangle", 0.14, 0, 0.08);
    },
  };

  // --- Music (procedural chiptune BGM, no assets) ---
  // A lookahead scheduler walks a per-level pattern, scheduling notes a
  // fraction of a second ahead so the loop stays tight regardless of
  // frame rate. Each level gets its own track (different key + tempo).
  const MUSIC_LOOKAHEAD = 0.12; // seconds of music scheduled ahead
  const MUSIC_TICK = 0.03;      // scheduler wake-up interval
  const MUSIC_VOL = 0.55;       // master music gain (0 = muted)

  let musicGain = null;
  let musicTimer = null;
  let musicTrack = null; // active track object
  let musicStep = 0;     // current step index within the pattern
  let musicNextTime = 0; // audioCtx time the next step should play at

  const midiFreq = (m) => (m === null ? null : 440 * Math.pow(2, (m - 69) / 12));

  // One bar of eighth notes: bass root on every step + a lead arpeggio.
  const bar8 = (bassRoot, lead) => lead.map((l) => [bassRoot, l]);
  // One bar of sixteenth notes: bass alternates root/octave, lead holds each note 2 steps.
  const bar16 = (bassRoot, lead) =>
    lead.map((l, i) => [i % 2 === 0 ? bassRoot : bassRoot + 12, l]);

  // Each track is a looping [bass, lead] step pattern. Steps are [midi, midi]
  // pairs (midi numbers; null would be a rest, kept for future tracks).
  const TRACKS = {
    1: {
      name: "Neon Meadows",
      bpm: 124,
      sub: 2, // eighth-note steps
      bassType: "triangle",
      leadType: "square",
      bassVol: 0.10,
      leadVol: 0.055,
      steps: [
        ...bar8(48, [60, 64, 67, 72, 76, 72, 67, 64]), // C
        ...bar8(45, [57, 60, 64, 69, 72, 69, 64, 60]), // Am
        ...bar8(41, [53, 57, 60, 65, 69, 65, 60, 57]), // F
        ...bar8(43, [55, 59, 62, 67, 71, 67, 62, 59]), // G
      ],
    },
    2: {
      name: "The Voltage Vault",
      bpm: 156,
      sub: 4, // sixteenth-note steps
      bassType: "square",
      leadType: "sawtooth",
      bassVol: 0.07,
      leadVol: 0.04,
      steps: [
        ...bar16(40, [64, 64, 67, 67, 71, 71, 76, 76, 74, 74, 71, 71, 67, 67, 64, 64]), // Em
        ...bar16(36, [60, 60, 64, 64, 67, 67, 72, 72, 71, 71, 67, 67, 64, 64, 60, 60]), // C
        ...bar16(38, [62, 62, 66, 66, 69, 69, 74, 74, 72, 72, 69, 69, 66, 66, 62, 62]), // D
        ...bar16(40, [64, 64, 67, 67, 71, 71, 76, 76, 75, 75, 71, 71, 67, 67, 64, 64]), // Em (D# lead-in)
      ],
    },
    3: {
      name: "Solar Sprint",
      bpm: 140,
      sub: 2,
      bassType: "sine",
      leadType: "triangle",
      bassVol: 0.11,
      leadVol: 0.065,
      steps: [
        ...bar8(45, [69, 73, 76, 81, 85, 81, 76, 73]), // A
        ...bar8(38, [62, 66, 69, 74, 78, 74, 69, 66]), // D
        ...bar8(42, [66, 69, 73, 78, 81, 78, 73, 69]), // F#m
        ...bar8(40, [64, 68, 71, 76, 80, 76, 71, 68]), // E
      ],
    },
  };

  function musicNote(freq, dur, type, vol, at) {
    if (!audioCtx || !musicGain) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(vol, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(gain).connect(musicGain);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }

  // Wake up, schedule any notes whose time has come, then go back to sleep.
  function schedulerTick() {
    if (!musicTrack || !audioCtx) return;
    // If the scheduler was throttled (background tab, suspended context),
    // don't dump the whole backlog at once — jump back to the present.
    if (musicNextTime < audioCtx.currentTime - 0.2) {
      musicNextTime = audioCtx.currentTime + 0.08;
    }
    const stepDur = 60 / musicTrack.bpm / musicTrack.sub;
    const horizon = audioCtx.currentTime + MUSIC_LOOKAHEAD;
    while (musicNextTime < horizon) {
      const [bass, lead] = musicTrack.steps[musicStep % musicTrack.steps.length];
      const bf = midiFreq(bass);
      const lf = midiFreq(lead);
      if (bf !== null) musicNote(bf, stepDur * 0.95, musicTrack.bassType, musicTrack.bassVol, musicNextTime);
      if (lf !== null) musicNote(lf, stepDur * 0.95, musicTrack.leadType, musicTrack.leadVol, musicNextTime);
      musicNextTime += stepDur;
      musicStep++;
    }
  }

  // Start (or restart) the BGM for a level — track 1 for level 1, track 2
  // for level 2, falling back to track 1 for any unknown level.
  function playMusic(trackNum) {
    stopMusic();
    ensureAudio();
    if (!audioCtx) return;
    if (!musicGain) {
      musicGain = audioCtx.createGain();
      musicGain.gain.value = soundOn ? MUSIC_VOL : 0;
      musicGain.connect(audioCtx.destination);
    }
    musicTrack = TRACKS[trackNum] || TRACKS[1];
    musicStep = 0;
    musicNextTime = audioCtx.currentTime + 0.08;
    musicTimer = setInterval(schedulerTick, MUSIC_TICK * 1000);
  }

  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    musicTrack = null;
  }

  // Pausing the game stops the scheduler; resuming restarts the track.
  const pauseMusic = stopMusic;

  function musicActive() {
    return !!(musicTrack && musicTimer);
  }

  function isSoundOn() { return soundOn; }

  function toggleSound() {
    soundOn = !soundOn;
    try {
      localStorage.setItem("opencode-sound", soundOn ? "on" : "off");
    } catch { /* ignore */ }
    if (musicGain && audioCtx) {
      musicGain.gain.setTargetAtTime(soundOn ? MUSIC_VOL : 0, audioCtx.currentTime, 0.05);
    }
    return soundOn;
  }

  return {
    ensureAudio, tone, sfx,
    playMusic, pauseMusic, stopMusic, musicActive,
    isSoundOn, toggleSound,
  };
})();
