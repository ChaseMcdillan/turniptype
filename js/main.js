import { initToolbar, state } from "./ui.js";

// For now: log state changes and show a placeholder sentence.
// Milestone 2 will replace this with the real typing engine.

const textEl = document.getElementById("text");
const inputEl = document.getElementById("input");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset");

function renderPlaceholder() {
  textEl.textContent =
    state.mode === "custom"
      ? "custom mode — paste your own text soon."
      : `placeholder — mode: ${state.mode}, option: ${state.option}, lang: ${state.language}`;
  inputEl.value = "";
}

function handleChange(next) {
  console.log("config changed:", next);
  renderPlaceholder();
}

// Start test (for now just focuses the input)
function startTest() {
  overlay.hidden = true;
  inputEl.disabled = false;
  inputEl.focus();
}

function resetTest() {
  overlay.hidden = false;
  inputEl.disabled = true;
  inputEl.value = "";
  renderPlaceholder();
}

startBtn.addEventListener("click", startTest);
resetBtn.addEventListener("click", resetTest);

// Keyboard shortcuts
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

// Boot
initToolbar(handleChange);
renderPlaceholder();
