import emojiSvgs from "@/assets/emojiSvgs";

const COLORED_CIRCLE_CODES = new Set([
  "26aa", // White circle
  "26ab", // Black circle
  "1f534", // Red circle
  "1f535", // Blue circle
  "1f7e0", // Orange circle
  "1f7e1", // Yellow circle
  "1f7e2", // Green circle
  "1f7e3", // Purple circle
  "1f7e4", // Brown circle
]);

function isSelectableEmojiCode(code: string): boolean {
  // Filter out variants/sequences
  if (code.includes("-")) return false;

  // Colored circles (game objects)
  if (COLORED_CIRCLE_CODES.has(code)) return true;

  // WHITELIST: Keep ONLY Animals

  // 1. Main Animal Block (1f400-1f43f)
  if (code.match(/^1f4[0-3][0-9a-f]$/)) return true;

  // 2. Supplemental Animals (1f980-1f9ae)
  if (code.match(/^1f9[89][0-9a-f]$/)) return true; // 1f98x, 1f99x
  if (code.match(/^1f9a[0-9a-e]$/)) return true; // 1f9ax (exclude f=probing cane)

  // 3. Bugs (1fab0-1fab3) - Fly, Worm, Beetle, Cockroach
  if (code.match(/^1fab[0-3]$/)) return true;

  // 4. Specific standalone animals
  if (code === "1f577") return true; // Spider
  if (code === "1f578") return true; // Spider Web
  if (code === "1f54a") return true; // Dove

  return false;
}

export const SELECTABLE_EMOJI_CODES: string[] = Object.keys(emojiSvgs)
  .map((key) => key.replace(".svg", ""))
  .filter(isSelectableEmojiCode)
  .sort();

