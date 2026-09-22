
// Mode definitions + language list.
// Keeping this data-only means the rest of the app just reads from it.

export const MODES = [
  { id: "time",   label: "time",   options: [5, 10, 15, 30, 60], unit: "s" },
  { id: "words",  label: "words",  options: [5, 10, 15, 25, 50, 100], unit: "" },
  { id: "quote",  label: "quote",  options: ["short", "medium", "long", "all"], unit: "" },
  { id: "custom", label: "custom", options: [], unit: "" },
];

export const LANGUAGES = [
  { id: "en", label: "english" },
  { id: "es", label: "spanish" },
  { id: "fr", label: "french" },
  { id: "de", label: "german" },
];

// Default selection on load
export const DEFAULTS = {
  mode: "time",
  option: 30,
  language: "en",
};

// Get the mode object by id
export function getMode(id) {
  return MODES.find((m) => m.id === id) ?? MODES[0];
}
