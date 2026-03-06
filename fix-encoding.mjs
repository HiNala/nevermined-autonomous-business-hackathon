import { readFileSync, writeFileSync } from "fs";

const file = "src/components/pages/studio-page.tsx";

// Read as UTF-8 text — the mojibake appears as garbage unicode chars because
// the file was saved with double-encoded UTF-8 (UTF-8 bytes interpreted as Windows-1252 then re-saved as UTF-8).
// Each mojibake sequence maps to a single correct Unicode character.
let content = readFileSync(file, "utf8");

// Exact codepoint sequences confirmed via node inspection of the file.
// Format: [mojibake sequence, correct Unicode char]
const replacements = [
  // U+00e2 U+201d U+20ac -> ─ (box drawing light horizontal, used in comments)
  ["\u00e2\u201d\u20ac", "\u2500"],
  // U+00e2 U+20ac U+201d -> — em dash
  ["\u00e2\u20ac\u201d", "\u2014"],
  // U+00e2 U+20ac U+201c -> – en dash
  ["\u00e2\u20ac\u201c", "\u2013"],
  // U+00e2 U+0152 U+02dc -> ⌘ command key
  ["\u00e2\u0152\u02dc", "\u2318"],
  // U+00e2 U+2020 U+2019 -> → right arrow
  ["\u00e2\u2020\u2019", "\u2192"],
  // U+00e2 U+20ac U+00a6 -> … ellipsis
  ["\u00e2\u20ac\u00a6", "\u2026"],
];

let count = 0;
for (const [bad, good] of replacements) {
  const before = content;
  content = content.split(bad).join(good);
  if (content !== before) {
    count++;
    console.log(`Replaced: U+${bad.codePointAt(0).toString(16)} sequence -> ${good}`);
  }
}

writeFileSync(file, content, "utf8");
console.log(`Done. Fixed ${count} mojibake sequences in ${file}`);
