// ─────────────────────────────────────────────────────────────
// TurnipType — single-file app
// ─────────────────────────────────────────────────────────────

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

const config = { mode: "time", option: 30, language: "en" };
const test = {
  text: "", typed: "", startedAt: null, endedAt: null, finished: false,
  timeLimit: null, samples: [], lastSampleAt: null,
};

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
const recordEl = $("record");
const resultsEl = $("results");
const graphSvg = $("graph");
const badgeEl = $("r-badge");
const againBtn = $("r-again");
const changeBtn = $("r-change");

const liveUI = [
  document.querySelector(".toolbar"),
  document.querySelector(".stats"),
  document.querySelector(".stage"),
  document.querySelector(".input"),
  document.querySelector(".footer"),
];

let tickInterval = null;

function recordKey() {
  return `tt.best.${config.mode}.${config.option}.${config.language}`;
}
function getRecord() {
  const v = localStorage.getItem(recordKey());
  return v ? Number(v) : null;
}
function setRecord(wpm) {
  localStorage.setItem(recordKey(), String(wpm));
}
function refreshRecordDisplay() {
  const r = getRecord();
  recordEl.textContent = r ?? "—";
}

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

function loadNewTest() {
  clearInterval(tickInterval);
  resultsEl.hidden = true;
  liveUI.forEach((el) => el && (el.hidden = false));

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
  textEl.style.transform = "translateY(0)";
  textEl.dataset.shift = "0";

  refreshRecordDisplay();
  renderAll();
}

// ── Rendering ──
// Simple per-character rendering. No word spans. Normal prose wrapping.
function buildTextHTML(text, typed) {
  let html = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    let cls = "";
    if (i < typed.length) cls = typed[i] === ch ? "correct" : "wrong";
    else if (i === typed.length) cls = "current";

    if (ch === " ") {
      // real non-breaking space so it renders and doesn't collapse
      html += `<span class="char space ${cls}">&nbsp;</span>`;
    } else {
      html += `<span class="char ${cls}">${ch}</span>`;
    }
  }
  return html;
}

function renderText() {
  textEl.innerHTML = buildTextHTML(test.text, test.typed);
  scrollCurrentIntoView();
}

function scrollCurrentIntoView() {
  const cur = textEl.querySelector(".current");
  if (!cur) return;

  const stageEl = document.querySelector(".stage");
  const lineHeight = parseFloat(getComputedStyle(textEl).lineHeight) || 38;
  const stageRect = stageEl.getBoundingClientRect();
  const curRect = cur.getBoundingClientRect();

  const offset = curRect.top - stageRect.top;
  const targetY = lineHeight;
  let shift = parseFloat(textEl.dataset.shift || "0");

  if (offset > targetY) shift += offset - targetY;
  else if (offset < 0) shift = Math.max(0, shift + offset);

  shift = Math.max(0, shift);
  textEl.dataset.shift = String(shift);
  textEl.style.transform = `translateY(-${shift}px)`;
}

function computeStats() {
  if (!test.startedAt) return { wpm: 0, raw: 0, accuracy: 100, time: 0, correct: 0, wrong: 0, consistency: 0, burst: 0 };
  const end = test.endedAt ?? Date.now();
  const minutes = (end - test.startedAt) / 60000;
  let correct = 0;
  for (let i = 0; i < test.typed.length; i++) if (test.typed[i] === test.text[i]) correct++;
  const wrong = test.typed.length - correct;
  const wpm = minutes > 0 ? Math.round(correct / 5 / minutes) : 0;
  const raw = minutes > 0 ? Math.round(test.typed.length / 5 / minutes) : 0;
  const accuracy = test.typed.length === 0 ? 100 : Math.round((correct / test.typed.length) * 100);

  const wpms = test.samples.map((s) => s.wpm).filter((n) => n > 0);
  let consistency = 0;
  if (wpms.length > 1) {
    const mean = wpms.reduce((a, b) => a + b, 0) / wpms.length;
    const variance = wpms.reduce((a, b) => a + (b - mean) ** 2, 0) / wpms.length;
    const std = Math.sqrt(variance);
    consistency = mean > 0 ? Math.max(0, Math.round(100 - (std / mean) * 100)) : 0;
  }

  const burst = wpms.length ? Math.max(...wpms) : 0;

  return {
    wpm, raw, accuracy,
    time: Math.round((end - test.startedAt) / 1000),
    correct, wrong, consistency, burst,
  };
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

function drawGraph(samples) {
  const W = 600, H = 160, pad = 12;
  graphSvg.innerHTML = "";

  if (!samples || samples.length < 2) {
    graphSvg.innerHTML = `<text x="300" y="85" text-anchor="middle" fill="#6b6b78" font-family="Inter" font-size="12">not enough data</text>`;
    return;
  }

  const values = samples.map((s) => s.wpm);
  const maxV = Math.max(...values, 1);
  const minV = 0;
  const range = maxV - minV || 1;

  const xs = samples.map((_, i) => pad + (i / (samples.length - 1)) * (W - pad * 2));
  const ys = samples.map((s) => H - pad - ((s.wpm - minV) / range) * (H - pad * 2));

  let grid = "";
  for (let i = 0; i <= 3; i++) {
    const y = pad + (i / 3) * (H - pad * 2);
    grid += `<line x1="${pad}" y1="${y}" x2="${W - pad}" y2="${y}" stroke="#26262e" stroke-width="1" />`;
  }

  const linePath = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`).join(" ");

  const fillPath =
    `M ${xs[0]} ${H - pad} ` +
    xs.map((x, i) => `L ${x} ${ys[i]}`).join(" ") +
    ` L ${xs[xs.length - 1]} ${H - pad} Z`;

  const dots = xs.map((x, i) => `<circle cx="${x}" cy="${ys[i]}" r="2.5" fill="#818cf8" />`).join("");

  const maxLabel = `<text x="${pad}" y="${pad + 10}" fill="#6b6b78" font-family="JetBrains Mono" font-size="10">${maxV}</text>`;
  const endLabel = `<text x="${W - pad}" y="${H - pad - 4}" fill="#6b6b78" font-family="JetBrains Mono" font-size="10" text-anchor="end">${samples.length}s</text>`;

  graphSvg.innerHTML = `
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#6366f1" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
      </linearGradient>
    </defs>
    ${grid}
    <path d="${fillPath}" fill="url(#grad)" />
    <path d="${linePath}" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    ${dots}
    ${maxLabel}
    ${endLabel}
  `;
}

function showResults() {
  const s = computeStats();

  liveUI.forEach((el) => el && (el.hidden = true));
  resultsEl.hidden = false;

  $("r-wpm").textContent = s.wpm;
  $("r-acc").textContent = s.accuracy + "%";
  $("r-raw").textContent = s.raw;
  $("r-burst").textContent = s.burst;
  $("r-consistency").textContent = s.consistency + "%";
  $("r-correct").textContent = s.correct;
  $("r-wrong").textContent = s.wrong;
  $("r-time").textContent = s.time;

  const prev = getRecord();
  const isBest = s.wpm > 0 && (prev === null || s.wpm > prev);
  if (isBest) {
    setRecord(s.wpm);
    badgeEl.hidden = false;
  } else {
    badgeEl.hidden = true;
  }
  refreshRecordDisplay();

  drawGraph(test.samples);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

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
  showResults();
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
againBtn.addEventListener("click", loadNewTest);
changeBtn.addEventListener("click", () => {
  loadNewTest();
  document.querySelector(".toolbar").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Tab") { e.preventDefault(); inputEl.focus(); }
  if (e.key === "Escape") { e.preventDefault(); loadNewTest(); }
});

buildToolbar();
renderOptions();
loadNewTest();