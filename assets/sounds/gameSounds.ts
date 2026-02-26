import type { TranslationKey } from '@/lib/i18n';

// Game background sound files
export const GAME_SOUNDS = {
  frog: require('./games/frog-croaking.mp3'),
  bee: require('./games/wasp-bee-buzzing.mp3'),
  fish: require('./games/swiming.mp3'),
  mouse: require('./games/rat-squeaks-1.mp3'),
  squeak2: require('./games/rat-squeaks-2.mp3'),
  bird: require('./games/birds-chirping.mp3'),
  bugs: require('./games/bug-scuttling.mp3'),
  bell: require('./games/bell-ring.mp3'),
  squeak3: require('./games/rat-squeaks-3.mp3'),
  squeak4: require('./games/rat-squeaks-4.mp3'),
  bug_crawl: require('./games/small-bug-crawl.mp3'),
  summer_insect: require('./games/summer-insect.mp3'),
  // Kill / tap effects
  splat1: require('./kill_effects/splat1.mp3'),
  splat2: require('./kill_effects/splat2.mp3'),
  splat3: require('./kill_effects/splat3.mp3'),
  splat4: require('./kill_effects/splat4.mp3'),
} as const;

export type GameSoundId = keyof typeof GAME_SOUNDS;

export type SoundOption = {
  id: GameSoundId | 'none';
  nameKey: TranslationKey;
  emoji: string;
  source: number | null;
};

export const SOUND_OPTIONS: SoundOption[] = [
  { id: 'none', nameKey: 'gameSettings.sound.none', emoji: '🔇', source: null },
  { id: 'frog', nameKey: 'gameSettings.sound.frog', emoji: '🐸', source: GAME_SOUNDS.frog },
  { id: 'bee', nameKey: 'gameSettings.sound.bee', emoji: '🐝', source: GAME_SOUNDS.bee },
  { id: 'fish', nameKey: 'gameSettings.sound.fish', emoji: '🐟', source: GAME_SOUNDS.fish },
  { id: 'mouse', nameKey: 'gameSettings.sound.mouse', emoji: '🐭', source: GAME_SOUNDS.mouse },
  { id: 'bird', nameKey: 'gameSettings.sound.bird', emoji: '🐦', source: GAME_SOUNDS.bird },
  { id: 'bugs', nameKey: 'gameSettings.sound.bugs', emoji: '🐛', source: GAME_SOUNDS.bugs },
];

export function getGameSound(id: GameSoundId): number {
  return GAME_SOUNDS[id];
}
