import { initToolbar, state as config } from "./ui.js";
import { createEngine } from "./engine.js";

const engine = createEngine();

const textEl = document.getElementById("text");
const inputEl = document.getElementById("input");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");
const timeEl = document.getElementById("time");
const timeLabelEl = document.getElementById("time-label");
const recordEl = document.getElementById("record");

let tickInterval = null;

// Line height of .text in pixels — must match CSS (2.4rem ≈ 38.4px)
const LINE_HEIGHT = 38;

// ── Rendering ──

function renderText() {
  const s = engine.getState();
  if (!s) return;
  const typed = s.typed;
  textEl.innerHTML = s.text
    .split("")
    .map((ch, i) => {
      const cls =
        i < typed.length
          ? typed[i] === ch
            ? "correct"
            : "wrong"
          : i === typed.length
          ? "current"
          : "";
      const display = ch === " " ? "&nbsp;" : ch;
      return `<span class="${cls}">${display}</span>`;
    })
    .join("");

  scrollCurrentIntoView();
}

function scrollCurrentIntoView() {
  const cur = textEl.querySelector(".current");
  if (!cur) return;
  const curTop = cur.offsetTop - textEl.offsetTop;
  const visibleLine = Math.floor(curTop / LINE_HEIGHT);
  const targetLine = Math.max(0, visibleLine - 1);
  textEl.style.transform = `translateY(-${targetLine * LINE_HEIGHT}px)`;
}

function renderStats() {
  const s = engine.stats();
  const state = engine.getState();

  wpmEl.textContent = s.wpm;
  accuracyEl.textContent = s.accuracy;

  // Time mode counts down; other modes count up
  if (state?.config?.mode === "time" && state.timeLimit) {
    const remaining = Math.max(0, state.timeLimit - s.time);
    timeEl.textContent = remaining;
    timeLabelEl.textContent = "remaining";
  } else {
    timeEl.textContent = s.time;
    timeLabelEl.textContent = "seconds";
  }
}

function renderAll() {
  renderText();
  renderStats();
}

// ── Flow ──

function loadNewTest() {
  clearInterval(tickInterval);
  engine.load({ ...config });
  inputEl.value = "";
  inputEl.disabled = true;
  overlay.hidden = false;
  textEl.style.transform = "translateY(0)";
  renderAll();
}

function startTest() {
  overlay.hidden = true;
  inputEl.disabled = false;
  inputEl.focus();
  engine.start();
  tickInterval = setInterval(() => {
    engine.tick();
    renderAll();
  }, 100);
}

function resetTest() {
  loadNewTest();
}

// ── Events ──

inputEl.addEventListener("input", () => {
  const s = engine.getState();
  if (!s) return;
  if (!s.startedAt) startTest();
  engine.type(inputEl.value);
});

startBtn.addEventListener("click", startTest);
resetBtn.addEventListener("click", resetTest);

document.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    inputEl.focus();
  }
  if (e.key === "Escape") {
    e.preventDefault();
    resetTest();
  }
});

// ── Boot ──

engine.onChange(() => {
  renderAll();
  const s = engine.getState();
  if (s?.finished) {
    clearInterval(tickInterval);
    inputEl.disabled = true;
    console.log("test finished:", engine.stats());
  }
});

initToolbar(loadNewTest);
loadNewTest();