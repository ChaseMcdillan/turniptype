// Word lists + quotes. Kept data-only so engine.js just pulls from here.

export const WORDS = {
  en: `the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us`.split(" "),

  es: `el la de que y a en un ser se no haber por con su para como estar tener le lo todo pero mas hacer o poder decir este ir otro ese si me ya ver porque dar cuando muy sin vez mucho saber que sobre mi alguno mismo yo tambien hasta ano dos querer entre asi primero desde grande eso ni nos lleg`.split(" "),

  fr: `le de un etre et a en avoir que pour dans ce il qui ne sur se pas plus pouvoir par je avec tout faire son mettre autre on mais nous comme ou si leur y dire elle devoir avant deux meme prendre aussi celui donner bien ou fois vous encore nouveau aller cela entre premier vouloir deja grand mon me moins`.split(" "),

  de: `der die und in den von zu das mit sich des auf fur ist im dem nicht ein eine als auch es an werden aus er hat dass sie nach wird bei einer um am sind noch wie einem uber einen so zum war haben nur oder aber vor zur bis mehr durch man sein wurde sei`.split(" "),
};

export const QUOTES = {
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
  all: [],
};

// flatten "all" to everything
QUOTES.all = [...QUOTES.short, ...QUOTES.medium, ...QUOTES.long];

// ── Generators ──

export function randomWords(lang, count) {
  const pool = WORDS[lang] ?? WORDS.en;
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return out.join(" ");
}

export function randomQuote(kind = "all") {
  const pool = QUOTES[kind] ?? QUOTES.all;
  return pool[Math.floor(Math.random() * pool.length)];
}