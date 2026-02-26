import { GAMES } from "@/constants/games";

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

// Keep in sync with the "Interactive" section in `app/(tabs)/index.tsx`.
const INTERACTIVE_GAME_IDS = ["box-escape", "box-dash", "inverted-box-dash", "top-jump", "piano"] as const;

const REGULAR_GAME_IDS = GAMES.map((g) => g.id).filter((id) => !(INTERACTIVE_GAME_IDS as readonly string[]).includes(id));
const FREE_REGULAR_GAMES_PER_WEEK = 2;

function weekKeyUtc(nowMs: number): number {
  return Math.floor(nowMs / MS_PER_WEEK);
}

// xmur3 + mulberry32: tiny deterministic PRNG from string seed
function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: readonly T[], seedStr: string): T[] {
  const seed = xmur3(seedStr)();
  const rand = mulberry32(seed);
  const out = items.slice() as T[];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

function pickWeeklyId(ids: readonly string[], userSeed: string, wk: number): string | null {
  if (!ids.length) return null;

  const cycle = Math.floor(wk / ids.length);
  const index = wk % ids.length;
  const shuffled = seededShuffle(ids, `${userSeed}:${cycle}`);
  let picked = shuffled[index] ?? null;

  if (picked && wk > 0) {
    const prevWk = wk - 1;
    const prevCycle = Math.floor(prevWk / ids.length);
    const prevIndex = prevWk % ids.length;
    const prevShuffled = seededShuffle(ids, `${userSeed}:${prevCycle}`);
    const prevPicked = prevShuffled[prevIndex] ?? null;
    if (prevPicked && prevPicked === picked) {
      picked = shuffled[(index + 1) % ids.length] ?? picked;
    }
  }

  return picked;
}

function pickWeeklyIds(ids: readonly string[], count: number, userSeed: string, wk: number): string[] {
  if (!ids.length || count <= 0) return [];
  const shuffled = seededShuffle(ids, `${userSeed}:${wk}`);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export type WeeklyFreeGames = {
  weekKey: number;
  freeInteractiveGameId: string | null;
  freeRegularGameIds: string[];
  freeRegularGameId: string | null;
};

export function getWeeklyFreeGames(userSeed: string, nowMs?: number): WeeklyFreeGames {
  const effectiveNowMs = nowMs ?? Date.now();
  const wk = weekKeyUtc(effectiveNowMs);
  const freeInteractiveGameId = pickWeeklyId(INTERACTIVE_GAME_IDS, `${userSeed}:interactive`, wk);
  const freeRegularGameIds = pickWeeklyIds(REGULAR_GAME_IDS, FREE_REGULAR_GAMES_PER_WEEK, `${userSeed}:regular`, wk);
  const freeRegularGameId = freeRegularGameIds[0] ?? null;
  return { weekKey: wk, freeInteractiveGameId, freeRegularGameIds, freeRegularGameId };
}
