// Shared design tokens: colour maths, semantics and bullet parsing.
// Browser safe on purpose — the in-app preview and the PowerPoint renderer read the same values.
export const hex = (v) =>
  String(v || "")
    .replace("#", "")
    .toUpperCase()
    .padStart(6, "0")
    .slice(0, 6);
const channels = (v) => [0, 2, 4].map((i) => parseInt(hex(v).slice(i, i + 2), 16) || 0);
const compose = (list) =>
  list
    .map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

/** Blend two colours. ratio=0 keeps a, ratio=1 returns b. */
export function mix(a, b, ratio = 0.5) {
  const from = channels(a),
    to = channels(b);
  return compose(from.map((v, i) => v + (to[i] - v) * ratio));
}

export function luminance(v) {
  const [r, g, b] = channels(v).map((n) => {
    const s = n / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Pick the candidate with the highest contrast against background. */
export const readable = (background, ...candidates) =>
  candidates
    .map(hex)
    .reduce((best, c) => (contrast(background, c) > contrast(background, best) ? c : best));

/**
 * Derive a full working palette from a style definition.
 * Every token is theme aware so the same layout code works on Midnight and Bold Ideas.
 */
export function palette(style) {
  const bg = hex(style.bg),
    fg = hex(style.fg),
    accent = hex(style.accent),
    panel = hex(style.panel),
    dark = luminance(bg) < 0.45;
  return {
    id: style.id,
    dark,
    bg,
    fg,
    accent,
    panel,
    // Alternating card surface: a touch lighter on dark themes, a touch brighter on light ones.
    panelAlt: dark ? mix(panel, fg, 0.09) : mix(panel, "FFFFFF", 0.6),
    // Hairline separators and card borders that never shout.
    line: mix(bg, fg, dark ? 0.22 : 0.15),
    muted: mix(fg, bg, 0.32),
    // Accent used as a fill needs a legible foreground.
    onAccent: readable(accent, bg, fg, "FFFFFF", "121212"),
    softAccent: mix(bg, accent, dark ? 0.24 : 0.13),
    accentLine: mix(bg, accent, 0.55),
    font: style.font,
    // Body copy keeps one neutral sans so long text stays readable in display fonts.
    bodyFont: ["Georgia", "Consolas"].includes(style.font) ? style.font : "Aptos",
  };
}

const SEMANTICS = [
  [/ryzyk|bezpiecz|dane osob|rodo|poufn|granic|\bpraw|zgodn|polityk|audyt/i, "shield"],
  [/\bczas|minut|termin|tydzie|tygod|miesi|harmonogram|deadline|tempo|godzin/i, "clock"],
  [/model|\bai\b|\bgpt|copilot|gemini|\bllm|prompt|asystent|czatbot|chatbot/i, "ai"],
  [/źród|zrod|szukaj|research|wyszuk|weryfik|\bfakt|sprawdzen/i, "search"],
  [/wynik|mierz|\bmiar|\bkpi|analit|analiz|koszt|procent|liczb|wskaźnik|dane\b|raport/i, "chart"],
  [/człow|osob|zesp|persona|klient|uczestnik|grupa|\brola|role\b|partner|menedż|dział|trener|prowadząc/i, "group"],
  [/\bcel|zadani|\bplan|priorytet|\bkrok|\befekt|rezultat|wdroż/i, "target"],
  [/pomysł|warto|kreac|inspirac|\bidea|burza|szansa|potencjał/i, "lamp"],
  [/integrac|\bapi\b|system|narzędzi|automatyz|workflow|proces/i, "apis"],
  [/notat|dokument|szablon|brief|instrukc|opis|tekst|wersj/i, "document"],
  [/prezent|rozmow|narrac|pytani|feedback|omów|dyskus|komunik/i, "microphone"],
  [/gotow\b|sprawdzon|zaliczon|checklist|kryteri|standard|jako/i, "check-circle"],
];

/** Choose an icon that matches the meaning of a piece of slide text. */
export function semanticIcon(value) {
  const text = String(value || "");
  for (const [pattern, name] of SEMANTICS) if (pattern.test(text)) return name;
  return "lamp";
}

/**
 * Split a bullet into a headline and a supporting sentence.
 * "Lead:: detail" is explicit; a short "Lead: detail" prefix is recognised too,
 * so decks written before the layout upgrade still gain a two-level hierarchy.
 */
export function splitPoint(value) {
  const raw = String(value ?? "").trim();
  if (raw.includes("::")) {
    const [lead, ...rest] = raw.split("::");
    return [lead.trim(), rest.join("::").trim()];
  }
  const match = raw.match(/^([^:.!?\n]{2,32}):\s+(\S[\s\S]*)$/);
  return match ? [match[1].trim(), match[2].trim()] : [raw, ""];
}
