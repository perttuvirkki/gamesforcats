import emojiSvgs from '@/assets/emojiSvgs';
import { GameSoundId } from '@/assets/sounds/gameSounds';
import { SELECTABLE_EMOJI_CODES } from '@/constants/emoji-codes';
import type { MovementPattern } from '@/constants/movements';
import type { TranslationKey } from '@/lib/i18n';
import { SvgProps } from 'react-native-svg';

// Helper to get emoji by code (e.g., '1f41f' for fish)
const getEmoji = (code: string): React.FC<SvgProps> => 
  emojiSvgs[`${code}.svg` as keyof typeof emojiSvgs];

const getEmojiMaybe = (code: string): React.FC<SvgProps> | null => {
  const key = `${code}.svg` as keyof typeof emojiSvgs;
  return emojiSvgs[key] ?? null;
};

const DEFAULT_CRITTER_ASSETS = SELECTABLE_EMOJI_CODES.map(getEmojiMaybe).filter(Boolean) as React.FC<SvgProps>[];

// Animal SVGs
const MouseSvg = getEmoji('1f400');
const SnailSvg = getEmoji('1f40c');
const OctopusSvg = getEmoji('1f419');
const BugSvg = getEmoji('1f41b');
const AntSvg = getEmoji('1f41c');
const BeeSvg = getEmoji('1f41d');
const LadybugSvg = getEmoji('1f41e');
const FishSvg = getEmoji('1f41f');
const TropicalFishSvg = getEmoji('1f420');
const BlowfishSvg = getEmoji('1f421');
const BirdSvg = getEmoji('1f426');
const EagleSvg = getEmoji('1f985');
const DuckSvg = getEmoji('1f986');
const OwlSvg = getEmoji('1f989');
const ParrotSvg = getEmoji('1f99c');
const FrogSvg = getEmoji('1f438');
const RabbitSvg = getEmoji('1f407');
const SpiderSvg = getEmoji('1f577');
const ButterflySvg = getEmoji('1f98b');
const SquidSvg = getEmoji('1f991');
	const CricketSvg = getEmoji('1f997');
	const CockroachSvg = getEmoji('1fab3');
	const OtterSvg = getEmoji('1f9a6');
	const CrabSvg = getEmoji('1f980');
	const LobsterSvg = getEmoji('1f99e');

// Object SVGs
const BallSvg = getEmoji('1f3be');
const LaserSvg = getEmoji('1f534');
const YarnSvg = getEmoji('1f9f6');
const LoadingSvg = getEmojiMaybe('23f3') ?? YarnSvg;
const BoxSvg = getEmoji('1f4e6');
const InboxTraySvg = getEmoji('1f4e4');
const OutboxTraySvg = getEmoji('1f4e5');
const CheeseburgerSvg = getEmoji('1f354');
const PianoSvg = getEmoji('1f3b9');

// Background colors - thematic habitats and fun colors for each animal
export const BACKGROUNDS = {
  // Light backgrounds
  white: '#FFFFFF',
  cream: '#FFF8DC',
  lightGray: '#F5F5F5',
  lightBlue: '#E3F2FD',
  lightGreen: '#E8F5E9',
  lightPink: '#FCE4EC',
  
  // Dark backgrounds
  darkBlue: '#1A237E',
  darkGreen: '#1B5E20',
  charcoal: '#212121',
  navy: '#0D1B2A',
  
  // Thematic habitat colors
  cheese: '#FFD54F',       // Yellow cheese for mouse
  pond: '#4FC3F7',         // Light pond blue for frog
  grass: '#8BC34A',        // Fresh grass green for cricket
  honey: '#FFA000',        // Golden honey for bee
  ocean: '#0288D1',        // Ocean blue for fish
  sky: '#81D4FA',          // Sky blue for bird
  garden: '#AED581',       // Garden green for bugs
  soil: '#8D6E63',         // Brown soil for ants
  web: '#ECEFF1',          // Light gray web for spider
  flower: '#F8BBD9',       // Pink flower for butterfly
  leaf: '#66BB6A',         // Leaf green for ladybug
  rain: '#90CAF9',         // Rainy blue for snail
} as const;

export type BackgroundVariant = keyof typeof BACKGROUNDS;

export interface GameDefinition {
  id: string;
  name: string;
  nameKey: TranslationKey;
  cardColor: string;      // Color for menu card
  textColor: string;      // Text color for menu
  asset: React.FC<SvgProps>;  // Primary asset (for menu display)
  assets?: React.FC<SvgProps>[]; // Optional array of assets (for game variation)
  category: 'critters' | 'objects';
  background: BackgroundVariant;
  assetRotationOffsetRad?: number; // Optional extra in-game rotation (radians)
  defaultBackgroundPattern?: string; // Optional default pattern
  defaultObjectCount?: number; // Optional default object count
  defaultSpeed?: number; // Optional default speed (ms)
  defaultMovementPattern?: MovementPattern; // Optional default movement pattern
  backgroundSound?: GameSoundId; // Optional looping background sound
  spawnSound?: GameSoundId; // Optional sound played on spawn
  deathSound?: GameSoundId; // Optional sound played when the critter/object is caught
}

export const GAMES: GameDefinition[] = [
  // Critters with thematic habitat backgrounds
  // Mouse -> cheese yellow background
  { id: 'mouse', name: 'Mouse Hunt', nameKey: 'game.mouse', cardColor: '#9E9E9E', textColor: '#FFF', asset: MouseSvg, category: 'critters', background: 'cheese', defaultBackgroundPattern: 'bubbles', backgroundSound: 'mouse', deathSound: 'splat1' },
  
  // Bird -> sky blue background (with bird variety!)
  { id: 'bird', name: 'Bird Watch', nameKey: 'game.bird', cardColor: '#42A5F5', textColor: '#FFF', asset: BirdSvg, assets: [BirdSvg, EagleSvg, DuckSvg, OwlSvg, ParrotSvg], category: 'critters', background: 'sky', defaultBackgroundPattern: 'endless-clouds', defaultObjectCount: 5, backgroundSound: 'bird', deathSound: 'splat1' },
  
  // Fish -> ocean blue background (with sea creature variety!)
  { id: 'fish', name: 'Fish Splash', nameKey: 'game.fish', cardColor: '#00BCD4', textColor: '#FFF', asset: FishSvg, assets: [FishSvg, TropicalFishSvg, BlowfishSvg, OctopusSvg, SquidSvg, OtterSvg, CrabSvg, LobsterSvg], category: 'critters', background: 'ocean', defaultBackgroundPattern: 'wiggle', defaultObjectCount: 5, backgroundSound: 'fish', deathSound: 'splat1' },
  
  // Spider -> web gray background
  { id: 'spider', name: 'Bug Hunt', nameKey: 'game.spider', cardColor: '#424242', textColor: '#FFF', asset: SpiderSvg, assets: [SpiderSvg, BugSvg, AntSvg, BeeSvg, LadybugSvg, ButterflySvg, SnailSvg, CricketSvg, CockroachSvg], category: 'critters', background: 'web', defaultBackgroundPattern: 'tiles133', defaultMovementPattern: 'wander', backgroundSound: 'bugs', deathSound: 'splat1' },

  // Box -> cream background
  { id: 'box-escape', name: 'Box Escape', nameKey: 'game.box-escape', cardColor: '#A1887F', textColor: '#000', asset: BoxSvg, assets: DEFAULT_CRITTER_ASSETS, category: 'critters', background: 'cream', defaultBackgroundPattern: 'none' },
  { id: 'box-dash', name: 'Box Dash', nameKey: 'game.box-dash', cardColor: '#D7CCC8', textColor: '#000', asset: InboxTraySvg, assets: DEFAULT_CRITTER_ASSETS, category: 'critters', background: 'lightGray', defaultBackgroundPattern: 'none' },
  { id: 'inverted-box-dash', name: 'Inverted Box Dash', nameKey: 'game.inverted-box-dash', cardColor: '#F8BBD0', textColor: '#000', asset: OutboxTraySvg, assets: DEFAULT_CRITTER_ASSETS, category: 'critters', background: 'lightPink', defaultBackgroundPattern: 'none' },
  { id: 'top-jump', name: 'Top Jump', nameKey: 'game.top-jump', cardColor: '#64B5F6', textColor: '#000', asset: RabbitSvg, assets: DEFAULT_CRITTER_ASSETS, category: 'critters', background: 'lightBlue', defaultBackgroundPattern: 'topography' },
  
  // Bee -> honey gold background
  { id: 'bee', name: 'Bee Buzz', nameKey: 'game.bee', cardColor: '#FFC107', textColor: '#000', asset: BeeSvg, category: 'critters', background: 'honey', defaultBackgroundPattern: 'hexagons', backgroundSound: 'bee', deathSound: 'splat1' },
  // Ladybug -> leaf green background
  { id: 'ladybug', name: 'Ladybug Dash', nameKey: 'game.ladybug', cardColor: '#E53935', textColor: '#FFF', asset: LadybugSvg, category: 'critters', background: 'leaf', defaultBackgroundPattern: 'moss', backgroundSound: 'bugs', deathSound: 'splat1' },
  // Frog -> pond blue background
  { id: 'frog', name: 'Frog Leap', nameKey: 'game.frog', cardColor: '#7CB342', textColor: '#FFF', asset: FrogSvg, category: 'critters', background: 'pond', assetRotationOffsetRad: Math.PI / 2, defaultBackgroundPattern: 'random-shapes', defaultMovementPattern: 'leap', defaultSpeed: 2700, backgroundSound: 'frog', deathSound: 'splat1' },
  
  // Objects
  // Laser -> charcoal background
  { id: 'laser', name: 'Laser Chase', nameKey: 'game.laser', cardColor: '#F44336', textColor: '#FFF', asset: LaserSvg, category: 'objects', background: 'charcoal', defaultBackgroundPattern: 'brick-wall', deathSound: 'splat1' },
  
  // Yarn -> light gray background
  { id: 'yarn', name: 'Yarn Ball', nameKey: 'game.yarn', cardColor: '#9C27B0', textColor: '#FFF', asset: YarnSvg, category: 'objects', background: 'lightGray', defaultBackgroundPattern: 'wiggle', defaultMovementPattern: 'straight', spawnSound: 'bell', deathSound: 'splat1' },
  
  // Tennis ball -> dark green background
  { id: 'ball', name: 'Tennis Ball', nameKey: 'game.ball', cardColor: '#C0CA33', textColor: '#000', asset: BallSvg, category: 'objects', background: 'darkGreen', defaultBackgroundPattern: 'polka-dots', defaultMovementPattern: 'billiards', deathSound: 'splat1' },

  // Cheeseburger -> cheese background
  { id: 'cheeseburger', name: 'Cheeseburger', nameKey: 'game.cheeseburger', cardColor: '#FFB74D', textColor: '#000', asset: CheeseburgerSvg, category: 'objects', background: 'cheese', defaultBackgroundPattern: 'i-like-food', deathSound: 'splat1' },

  // Piano -> light background
  { id: 'piano', name: 'Piano', nameKey: 'game.piano', cardColor: '#111827', textColor: '#FFF', asset: PianoSvg, assets: DEFAULT_CRITTER_ASSETS, category: 'objects', background: 'lightGray', defaultBackgroundPattern: 'none' },

  // Loading screen -> black background with centered spinner
  { id: 'loading-screen', name: 'Loading screen', nameKey: 'game.loading-screen', cardColor: '#000000', textColor: '#FFF', asset: LoadingSvg, category: 'objects', background: 'charcoal', defaultBackgroundPattern: 'none' },
];

export const getGameById = (id: string): GameDefinition | undefined => 
  GAMES.find(game => game.id === id);

export const getGamesByCategory = (category: GameDefinition['category']): GameDefinition[] =>
  GAMES.filter(game => game.category === category);

export const getBackgroundColor = (variant: BackgroundVariant): string =>
  BACKGROUNDS[variant];
