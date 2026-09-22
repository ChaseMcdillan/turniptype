import { randomWords, randomQuote } from "./words.js";

// The typing engine. No DOM here — pure logic.
// main.js feeds it keystrokes; engine.js tells it what happened.

export function createEngine() {
  let state = null;
  let listeners = [];

  function emit() {
    listeners.forEach((fn) => fn(state));
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  // Build a fresh test based on the current config
  function load(config) {
    let text;
    let limit = null; // for time mode: stop when timer hits
    let wordLimit = null; // for word mode: stop when this many words typed

    if (config.mode === "time") {
      // generate a big pile of words; we'll cut off by timer
      text = randomWords(config.language, 200);
      limit = config.option; // seconds
    } else if (config.mode === "words") {
      wordLimit = config.option;
      text = randomWords(config.language, wordLimit);
    } else if (config.mode === "quote") {
      text = randomQuote(config.option);
    } else if (config.mode === "custom") {
      text = "custom text mode isn't wired up yet — coming soon.";
    }

    state = {
      config,
      text,
      typed: "",
      startedAt: null,
      endedAt: null,
      finished: false,
      timeLimit: limit,
      wordLimit,
      // per-second samples for the graph
      samples: [],
      lastSampleAt: null,
      lastSampleChars: 0,
    };
    emit();
    return state;
  }

  function start() {
    if (!state || state.startedAt) return;
    state.startedAt = Date.now();
    state.lastSampleAt = state.startedAt;
    state.lastSampleChars = 0;
    emit();
  }

  function tick() {
    if (!state || state.finished || !state.startedAt) return;

    // record a sample once per second for the graph
    const now = Date.now();
    if (now - state.lastSampleAt >= 1000) {
      state.samples.push(samplePoint(now));
      state.lastSampleAt = now;
      state.lastSampleChars = state.typed.length;
      emit();
    }

    // time mode: stop when we hit the limit
    if (state.timeLimit && (now - state.startedAt) / 1000 >= state.timeLimit) {
      finish();
    }
  }

  function samplePoint(now) {
    const minutes = (now - state.startedAt) / 60000;
    const chars = state.typed.length;
    const wpm = minutes > 0 ? Math.round(chars / 5 / minutes) : 0;
    return { t: Math.round((now - state.startedAt) / 1000), wpm };
  }

  function type(nextTyped) {
    if (!state || state.finished) return;
    if (!state.startedAt) start();

    state.typed = nextTyped;

    // word mode: finish when the right number of words are typed
    if (state.wordLimit) {
      const wordsTyped = nextTyped.trim().split(/\s+/).filter(Boolean).length;
      if (wordsTyped >= state.wordLimit && nextTyped.length >= state.text.length) {
        finish();
        return;
      }
    }

    // quote/word modes also finish on reaching the end
    if (!state.timeLimit && nextTyped.length >= state.text.length) {
      finish();
      return;
    }

    emit();
  }

  function finish() {
    if (!state || state.finished) return;
    state.finished = true;
    state.endedAt = Date.now();
    // final sample
    state.samples.push(samplePoint(state.endedAt));
    emit();
  }

  // ── Stats ──

  function stats() {
    if (!state || !state.startedAt) {
      return { wpm: 0, raw: 0, accuracy: 100, time: 0, correct: 0, errors: 0, consistency: 0, burst: 0 };
    }

    const end = state.endedAt ?? Date.now();
    const minutes = (end - state.startedAt) / 60000;
    const typed = state.typed;

    let correct = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === state.text[i]) correct++;
    }
    const errors = typed.length - correct;

    const wpm = minutes > 0 ? Math.round(correct / 5 / minutes) : 0;
    const raw = minutes > 0 ? Math.round(typed.length / 5 / minutes) : 0;
    const accuracy = typed.length === 0 ? 100 : Math.round((correct / typed.length) * 100);

    // burst = best 1-second window WPM from samples
    let burst = 0;
    for (let i = 1; i < state.samples.length; i++) {
      const dt = state.samples[i].t - state.samples[i - 1].t;
      const dw = state.samples[i].wpm - state.samples[i - 1].wpm;
      if (dt > 0) {
        // rough per-second instantaneous WPM
        const inst = Math.max(dw / dt + state.samples[i - 1].wpm, state.samples[i].wpm);
        burst = Math.max(burst, inst);
      }
    }
    burst = Math.round(burst);

    // consistency = 100 - coefficient of variation of samples
    const wpms = state.samples.map((s) => s.wpm).filter((n) => n > 0);
    let consistency = 0;
    if (wpms.length > 1) {
      const mean = wpms.reduce((a, b) => a + b, 0) / wpms.length;
      const variance = wpms.reduce((a, b) => a + (b - mean) ** 2, 0) / wpms.length;
      const std = Math.sqrt(variance);
      consistency = mean > 0 ? Math.max(0, Math.round(100 - (std / mean) * 100)) : 0;
    }

    return {
      wpm,
      raw,
      accuracy,
      time: Math.round((end - state.startedAt) / 1000),
      correct,
      errors,
      consistency,
      burst,
    };
  }

  function getState() { return state; }

  return { load, start, type, tick, finish, stats, getState, onChange };
}