import * as Application from "expo-application";
import * as StoreReview from "expo-store-review";
import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";

type ReviewPromptStateV1 = {
  firstSeenAtMs: number;
  gamesPlayed: number;
  lastReviewRequestAtMs: number | null;
  reviewRequestCount: number;
  lastPromptedVersion: string | null;
  gamesPlayedAtLastRequest: number;
};

const STORAGE_KEY = "gamesforcats.reviewPrompt.v1";
const DEFAULT_STATE: ReviewPromptStateV1 = {
  firstSeenAtMs: Date.now(),
  gamesPlayed: 0,
  lastReviewRequestAtMs: null,
  reviewRequestCount: 0,
  lastPromptedVersion: null,
  gamesPlayedAtLastRequest: 0,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MIN_GAMES_BEFORE_FIRST_PROMPT = 2;
const MIN_DAYS_BETWEEN_PROMPTS = 90;
const MIN_GAMES_BETWEEN_PROMPTS = 10;
const MAX_TOTAL_PROMPTS = 3;

function getVersionString(): string | null {
  const v = Application.nativeApplicationVersion ?? null;
  const build = Application.nativeBuildVersion ?? null;
  if (v && build) return `${v}(${build})`;
  if (v) return v;
  return null;
}

function isReviewPlatform() {
  return Platform.OS === "ios" || Platform.OS === "android";
}

function getStateFile(): File {
  return new File(Paths.document, "review-prompt.json");
}

function parseState(raw: unknown): ReviewPromptStateV1 {
  if (!raw || typeof raw !== "object") return DEFAULT_STATE;
  const obj = raw as any;

  const firstSeenAtMs = typeof obj.firstSeenAtMs === "number" ? obj.firstSeenAtMs : DEFAULT_STATE.firstSeenAtMs;
  const gamesPlayed = typeof obj.gamesPlayed === "number" ? obj.gamesPlayed : DEFAULT_STATE.gamesPlayed;
  const lastReviewRequestAtMs = typeof obj.lastReviewRequestAtMs === "number" ? obj.lastReviewRequestAtMs : null;
  const reviewRequestCount = typeof obj.reviewRequestCount === "number" ? obj.reviewRequestCount : DEFAULT_STATE.reviewRequestCount;
  const lastPromptedVersion = typeof obj.lastPromptedVersion === "string" ? obj.lastPromptedVersion : null;
  const gamesPlayedAtLastRequest =
    typeof obj.gamesPlayedAtLastRequest === "number" ? obj.gamesPlayedAtLastRequest : DEFAULT_STATE.gamesPlayedAtLastRequest;

  return { firstSeenAtMs, gamesPlayed, lastReviewRequestAtMs, reviewRequestCount, lastPromptedVersion, gamesPlayedAtLastRequest };
}

async function readState(): Promise<ReviewPromptStateV1> {
  try {
    if (Platform.OS === "web") {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (!raw) return DEFAULT_STATE;
      return parseState(JSON.parse(raw));
    }

    const file = getStateFile();
    if (!file.exists) return DEFAULT_STATE;
    const raw = await file.text();
    if (!raw) return DEFAULT_STATE;
    return parseState(JSON.parse(raw));
  } catch {
    return DEFAULT_STATE;
  }
}

async function writeState(next: ReviewPromptStateV1): Promise<void> {
  const payload = JSON.stringify(next);
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, payload);
      return;
    }
    const file = getStateFile();
    if (!file.exists) file.create({ intermediates: true });
    file.write(payload);
  } catch {
    // ignore
  }
}

export async function recordGamePlayed(): Promise<void> {
  const state = await readState();
  await writeState({ ...state, gamesPlayed: state.gamesPlayed + 1 });
}

export async function requestReviewIfEligibleFromHome(): Promise<boolean> {
  if (__DEV__) return false;
  if (!isReviewPlatform()) return false;

  const hasAction = await StoreReview.hasAction().catch(() => false);
  if (!hasAction) return false;

  const state = await readState();
  const now = Date.now();
  const daysSinceLastRequest = state.lastReviewRequestAtMs ? (now - state.lastReviewRequestAtMs) / MS_PER_DAY : Number.POSITIVE_INFINITY;
  const gamesSinceLastRequest = state.gamesPlayed - state.gamesPlayedAtLastRequest;

  const version = getVersionString();
  const alreadyPromptedThisVersion = Boolean(version && state.lastPromptedVersion === version);

  const eligible =
    state.gamesPlayed >= MIN_GAMES_BEFORE_FIRST_PROMPT &&
    state.reviewRequestCount < MAX_TOTAL_PROMPTS &&
    !alreadyPromptedThisVersion &&
    (state.lastReviewRequestAtMs === null ||
      (daysSinceLastRequest >= MIN_DAYS_BETWEEN_PROMPTS && gamesSinceLastRequest >= MIN_GAMES_BETWEEN_PROMPTS));

  if (!eligible) return false;

  try {
    await StoreReview.requestReview();
  } catch {
    return false;
  }

  await writeState({
    ...state,
    lastReviewRequestAtMs: now,
    reviewRequestCount: state.reviewRequestCount + 1,
    lastPromptedVersion: version,
    gamesPlayedAtLastRequest: state.gamesPlayed,
  });

  return true;
}
