import { MODES, LANGUAGES, getMode } from "./modes.js";

// Single source of truth for the current test config.
export const state = {
  mode: "time",
  option: 30,
  language: "en",
};

export function initToolbar(onChange) {
  const modeGroup = document.getElementById("group-mode");
  const optionGroup = document.getElementById("group-option");
  const langGroup = document.getElementById("group-language");

  // --- Mode buttons ---
  MODES.forEach((m) => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.dataset.mode = m.id;
    btn.textContent = m.label;
    btn.type = "button";
    btn.addEventListener("click", () => {
      state.mode = m.id;
      state.option = m.options[0] ?? null;
      renderOptions();
      highlight();
      onChange?.(state);
    });
    modeGroup.appendChild(btn);
  });

  // --- Language dropdown ---
  const select = document.createElement("select");
  select.className = "select";
  LANGUAGES.forEach((l) => {
    const opt = document.createElement("option");
    opt.value = l.id;
    opt.textContent = l.label;
    select.appendChild(opt);
  });
  select.value = state.language;
  select.addEventListener("change", () => {
    state.language = select.value;
    onChange?.(state);
  });
  langGroup.appendChild(select);

  // --- Option chips ---
  function renderOptions() {
    optionGroup.innerHTML = "";
    const mode = getMode(state.mode);
    mode.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "chip chip-sm";
      btn.dataset.option = String(opt);
      btn.textContent = String(opt) + mode.unit;
      btn.type = "button";
      btn.addEventListener("click", () => {
        state.option = opt;
        renderOptions();
        onChange?.(state);
      });
      optionGroup.appendChild(btn);
    });
    if (mode.options.length === 0) {
      const note = document.createElement("span");
      note.className = "chip-note";
      note.textContent = "custom text coming soon";
      optionGroup.appendChild(note);
    }
    highlight();
  }

  function highlight() {
    modeGroup.querySelectorAll(".chip").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === state.mode);
    });
    optionGroup.querySelectorAll(".chip").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.option === String(state.option));
    });
  }

  // Initial paint
  renderOptions();
  highlight();
}