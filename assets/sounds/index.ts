export type SoundItem = {
  id: string;
  name: string;
  emoji: string;
  source: number;
};

function titleCase(input: string) {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
    .join(" ");
}

function prettyNameFromFilename(filename: string) {
  return titleCase(
    filename
      .replace(/^mixkit-/, "")
      .replace(/\.wav$/i, "")
      .replace(/-\d+$/, "")
      .replace(/[-_]+/g, " "),
  );
}

function emojiFromId(id: string) {
  const s = id.toLowerCase();
  if (s.includes("purr")) return "😺";
  if (s.includes("hungry")) return "😿";
  if (s.includes("begging")) return "🥺";
  if (s.includes("pain")) return "🙀";
  if (s.includes("angry")) return "😾";
  if (s.includes("roar") || s.includes("lion") || s.includes("growl")) return "🦁";
  if (s.includes("bird")) return "🐦";
  return "🐾";
}

const SOURCES = [
  { filename: "mixkit-angry-cartoon-kitty-meow-94.wav", source: require("./mixkit-angry-cartoon-kitty-meow-94.wav") },
  { filename: "mixkit-angry-wild-cat-roar-89.wav", source: require("./mixkit-angry-wild-cat-roar-89.wav") },
  { filename: "mixkit-big-wild-cat-long-purr-96.wav", source: require("./mixkit-big-wild-cat-long-purr-96.wav") },
  { filename: "mixkit-big-wild-cat-scary-roar-88.wav", source: require("./mixkit-big-wild-cat-scary-roar-88.wav") },
  { filename: "mixkit-big-wild-cat-slow-moan-90.wav", source: require("./mixkit-big-wild-cat-slow-moan-90.wav") },
  { filename: "mixkit-big-wild-lion-growl-95.wav", source: require("./mixkit-big-wild-lion-growl-95.wav") },
  { filename: "mixkit-cartoon-kitty-begging-meow-92.wav", source: require("./mixkit-cartoon-kitty-begging-meow-92.wav") },
  { filename: "mixkit-cartoon-little-cat-meow-91.wav", source: require("./mixkit-cartoon-little-cat-meow-91.wav") },
  { filename: "mixkit-domestic-cat-hungry-meow-45.wav", source: require("./mixkit-domestic-cat-hungry-meow-45.wav") },
  { filename: "mixkit-little-cat-attention-meow-86.wav", source: require("./mixkit-little-cat-attention-meow-86.wav") },
  { filename: "mixkit-little-cat-pain-meow-87.wav", source: require("./mixkit-little-cat-pain-meow-87.wav") },
  { filename: "mixkit-sweet-kitty-meow-93.wav", source: require("./mixkit-sweet-kitty-meow-93.wav") },
  { filename: "mixkit-wild-lion-animal-roar-6.wav", source: require("./mixkit-wild-lion-animal-roar-6.wav") },
] as const;

export const SOUNDS: SoundItem[] = SOURCES.map(({ filename, source }) => {
  const id = filename.replace(/\.wav$/i, "");
  return {
    id,
    name: prettyNameFromFilename(filename),
    emoji: emojiFromId(id),
    source,
  };
});
