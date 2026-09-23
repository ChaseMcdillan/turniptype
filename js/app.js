// ─────────────────────────────────────────────────────────────
// TurnipType — single-file app
// ─────────────────────────────────────────────────────────────

// ── Word + quote data ──
const WORDS = {
  en: "the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us".split(" "),
  es: "el la de que y a en un ser se no haber por con su para como estar tener le lo todo pero mas hacer o poder decir este ir otro ese si me ya ver porque dar cuando muy sin vez mucho saber que sobre mi alguno mismo yo tambien hasta ano dos querer entre asi primero desde grande eso ni nos lleg".split(" "),
  fr: "le de un etre et a en avoir que pour dans ce il qui ne sur se pas plus pouvoir par je avec tout faire son mettre autre on mais nous comme ou si leur y dire elle devoir avant deux meme prendre aussi celui donner bien ou fois vous encore nouveau aller cela entre premier vouloir deja grand mon me moins".split(" "),
  de: "der die und in den von zu das mit sich des auf fur ist im dem nicht ein eine als auch es an werden aus er hat dass sie nach wird bei einer um am sind noch wie einem uber einen so zum war haben nur oder aber vor zur bis mehr durch man sein wurde sei".split(" "),
};

const QUOTES = {
  short: [
    "Simplicity is the soul of efficiency.",
    "Talk is cheap. Show me the code.",
    "Done is better than perfect.",
    "Make it work, make it right, make it fast.",
    "The best error message is the one that never shows up.",
  ],
  medium: [
    "Programs must be written for people to read, and only incidentally for machines to execute.",
    "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
    "The most damaging phrase in the language is: we've always done it this way.",
    "Premature optimization is the root of all evil in programming.",
    "There are only two hard things in computer science: cache invalidation and naming things.",
  ],
  long: [
    "The pragmatist knows that the best architecture is the one that survives contact with real users, real deadlines, and real bugs. Theory is cheap. Shipping is expensive. And the code you don't write is the code you don't have to maintain, debug, or explain to the person who inherits it six months from now.",
    "When you find yourself reaching for a framework to solve a problem you have not yet had, stop. Write the smallest thing that could possibly work, ship it, and let reality tell you what to build next. The best engineers are not the ones who know the most tools, but the ones who know when not to use them.",
  ],
};
QUOTES.all = [...QUOTES.short, ...QUOTES.medium, ...QUOTES.long];

const MODES = [
  { id: "time",   label: "time",   options: [5, 10, 15, 30, 60], unit: "s" },
  { id: "words",  label: "words",  options: [5, 10, 15, 25, 50, 100], unit: "" },
  { id: "quote",  label: "quote",  options: ["short", "medium", "long", "all"], unit: "" },
  { id: "custom", label: "custom", options: [], unit: "" },
];

const LANGUAGES = [
  { id: "en", label: "english" },
  { id: "es", label: "spanish" },
  { id: "fr", label: "french" },
  { id: "de", label: "german" },
];

function randomWords(lang, count) {
  const pool = WORDS[lang] ?? WORDS.en;
  const out = [];
  for (let i = 0; i < count; i++) out.push(pool[Math.floor(Math.random() * pool.length)]);
  return out.join(" ");
}

function randomQuote(kind) {
  const pool = QUOTES[kind] ?? QUOTES.all;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── App state ──
const config = { mode: "time", option: 30, language: "en" };
const test = {
  text: "", typed: "", startedAt: null, endedAt: null, finished: false,
  timeLimit: null, samples: [], lastSampleAt: null,
};

// ── DOM ──
const $ = (id) => document.getElementById(id);
const modeGroup = $("group-mode");
const optionGroup = $("group-option");
const langGroup = $("group-language");
const textEl = $("text");
const inputEl = $("input");
const overlay = $("overlay");
const startBtn = $("start-btn");
const resetBtn = $("reset");
const wpmEl = $("wpm");
const accuracyEl = $("accuracy");
const timeEl = $("time");
const timeLabelEl = $("time-label");

let tickInterval = null;

// ── Toolbar ──
function buildToolbar() {
  MODES.forEach((m) => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.dataset.mode = m.id;
    btn.textContent = m.label;
    btn.type = "button";
    btn.addEventListener("click", () => {
      config.mode = m.id;
      config.option = m.options[0] ?? null;
      renderOptions();
      highlight();
      loadNewTest();
    });
    modeGroup.appendChild(btn);
  });

  const select = document.createElement("select");
  select.className = "select";
  LANGUAGES.forEach((l) => {
    const opt = document.createElement("option");
    opt.value = l.id;
    opt.textContent = l.label;
    select.appendChild(opt);
  });
  select.value = config.language;
  select.addEventListener("change", () => {
    config.language = select.value;
    loadNewTest();
  });
  langGroup.appendChild(select);
}

function renderOptions() {
  optionGroup.innerHTML = "";
  const mode = MODES.find((m) => m.id === config.mode);
  mode.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "chip chip-sm";
    btn.dataset.option = String(opt);
    btn.textContent = String(opt) + mode.unit;
    btn.type = "button";
    btn.addEventListener("click", () => {
      config.option = opt;
      renderOptions();
      loadNewTest();
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
    btn.classList.toggle("active", btn.dataset.mode === config.mode);
  });
  optionGroup.querySelectorAll(".chip").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.option === String(config.option));
  });
}

// ── Test loading ──
function loadNewTest() {
  clearInterval(tickInterval);
  let text = "";
  let timeLimit = null;

  if (config.mode === "time") {
    text = randomWords(config.language, 200);
    timeLimit = config.option;
  } else if (config.mode === "words") {
    text = randomWords(config.language, config.option);
  } else if (config.mode === "quote") {
    text = randomQuote(config.option);
  } else {
    text = "custom text mode isn't wired up yet — coming soon.";
  }

  test.text = text;
  test.typed = "";
  test.startedAt = null;
  test.endedAt = null;
  test.finished = false;
  test.timeLimit = timeLimit;
  test.samples = [];
  test.lastSampleAt = null;

  inputEl.value = "";
  inputEl.disabled = true;
  overlay.hidden = false;
  window.scrollTo({ top: 0 });
  renderAll();
}

// ── Rendering ──
function renderText() {
  const typed = test.typed;
  textEl.innerHTML = test.text
    .split("")
    .map((ch, i) => {
      const cls =
        i < typed.length
          ? typed[i] === ch ? "correct" : "wrong"
          : i === typed.length ? "current" : "";
      const display = ch === " " ? "&nbsp;" : ch;
      return `<span class="${cls}">${display}</span>`;
    })
    .join("");
}

function computeStats() {
  if (!test.startedAt) return { wpm: 0, accuracy: 100, time: 0 };
  const end = test.endedAt ?? Date.now();
  const minutes = (end - test.startedAt) / 60000;
  let correct = 0;
  for (let i = 0; i < test.typed.length; i++) if (test.typed[i] === test.text[i]) correct++;
  const wpm = minutes > 0 ? Math.round(correct / 5 / minutes) : 0;
  const accuracy = test.typed.length === 0 ? 100 : Math.round((correct / test.typed.length) * 100);
  const time = Math.round((end - test.startedAt) / 1000);
  return { wpm, accuracy, time };
}

function renderStats() {
  const s = computeStats();
  wpmEl.textContent = s.wpm;
  accuracyEl.textContent = s.accuracy;
  if (config.mode === "time" && test.timeLimit) {
    timeEl.textContent = Math.max(0, test.timeLimit - s.time);
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

// ── Test flow ──
function startTest() {
  if (test.startedAt) return;
  overlay.hidden = true;
  inputEl.disabled = false;
  inputEl.focus();
  test.startedAt = Date.now();
  test.lastSampleAt = test.startedAt;
  tickInterval = setInterval(tick, 100);
}

function tick() {
  if (test.finished || !test.startedAt) return;
  const now = Date.now();
  if (now - test.lastSampleAt >= 1000) {
    const minutes = (now - test.startedAt) / 60000;
    const wpm = minutes > 0 ? Math.round(test.typed.length / 5 / minutes) : 0;
    test.samples.push({ t: Math.round((now - test.startedAt) / 1000), wpm });
    test.lastSampleAt = now;
  }
  if (test.timeLimit && (now - test.startedAt) / 1000 >= test.timeLimit) finishTest();
  renderAll();
}

function finishTest() {
  if (test.finished) return;
  test.finished = true;
  test.endedAt = Date.now();
  clearInterval(tickInterval);
  inputEl.disabled = true;
  console.log("test finished:", computeStats(), "samples:", test.samples);
}

inputEl.addEventListener("input", () => {
  if (test.finished) return;
  if (!test.startedAt) startTest();
  test.typed = inputEl.value;
  renderText();
  renderStats();
  if (!test.timeLimit && test.typed.length >= test.text.length) finishTest();
});

startBtn.addEventListener("click", startTest);
resetBtn.addEventListener("click", loadNewTest);

document.addEventListener("keydown", (e) => {
  if (e.key === "Tab") { e.preventDefault(); inputEl.focus(); }
  if (e.key === "Escape") { e.preventDefault(); loadNewTest(); }
});

// ── Boot ──
buildToolbar();
renderOptions();
loadNewTest();