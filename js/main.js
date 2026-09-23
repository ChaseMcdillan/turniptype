import { initToolbar, state as config } from "./ui.js";
import { createEngine } from "./engine.js";

const engine = createEngine();

const stageEl = document.getElementById("stage");
const stageInner = document.getElementById("stage-inner");
const textEl = document.getElementById("text");
const inputEl = document.getElementById("input");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");
const timeEl = document.getElementById("time");
const timeLabelEl = document.getElementById("time-label");

let tickInterval = null;

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

  if (config.layout === "scroll") {
    // native scroll — let the browser keep the current char visible
    cur.scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }

  // focus layout — translate the text block so the current line sits on line 2
  const stageRect = stageEl.getBoundingClientRect();
  const curRect = cur.getBoundingClientRect();
  const style = getComputedStyle(textEl);
  const lineHeight = parseFloat(style.lineHeight) || 38;

  // how far the current char is from the top of the visible stage
  const offsetInStage = curRect.top - stageRect.top;

  // keep it on the 2nd line of the window
  const keepOnLine = lineHeight; // 1 line down from top
  let shift = parseFloat(textEl.dataset.shift || "0");

  if (offsetInStage > keepOnLine) {
    shift += offsetInStage - keepOnLine;
  } else if (offsetInStage < 0) {
    shift = Math.max(0, shift + offsetInStage);
  }

  shift = Math.max(0, shift);
  textEl.dataset.shift = String(shift);
  textEl.style.transform = `translateY(-${shift}px)`;
}

function renderStats() {
  const s = engine.stats();
  const state = engine.getState();

  wpmEl.textContent = s.wpm;
  accuracyEl.textContent = s.accuracy;

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
  textEl.dataset.shift = "0";
  textEl.style.transform = "translateY(0)";
  if (stageEl.dataset.layout === "scroll") stageEl.scrollTop = 0;
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

// Re-render when layout changes (so scroll/focus behaves immediately)
window.addEventListener("tt:layout", () => {
  textEl.dataset.shift = "0";
  textEl.style.transform = "translateY(0)";
  if (stageEl.dataset.layout === "scroll") stageEl.scrollTop = 0;
  renderText();
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

initToolbar(() => {
  // fires on any toolbar change
  loadNewTest();
  window.dispatchEvent(new Event("tt:layout"));
});
loadNewTest();