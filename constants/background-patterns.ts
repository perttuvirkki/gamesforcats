import AnchorsAway from '@/assets/patterns/anchors-away.svg';
import BankNote from '@/assets/patterns/bank-note.svg';
import BrickWall from '@/assets/patterns/brick-wall.svg';
import Bubbles from '@/assets/patterns/bubbles.svg';
import Cage from '@/assets/patterns/cage.svg';
import Curtain from '@/assets/patterns/curtain.svg';
import DeathStar from '@/assets/patterns/death-star.svg';
import DiagonalStripes from '@/assets/patterns/diagonal-stripes.svg';
import EndlessClouds from '@/assets/patterns/endless-clouds.svg';
import FormalInvitation from '@/assets/patterns/formal-invitation.svg';
import Glamorous from '@/assets/patterns/glamorous.svg';
import Hexagons from '@/assets/patterns/hexagons.svg';
import ILikeFood from '@/assets/patterns/i-like-food.svg';
import Kiwi from '@/assets/patterns/kiwi.svg';
import LineInMotion from '@/assets/patterns/line-in-motion.svg';
import PolkaDots from '@/assets/patterns/polka-dots.svg';
import Rain from '@/assets/patterns/rain.svg';
import RandomShapes from '@/assets/patterns/random-shapes.svg';
import Topography from '@/assets/patterns/topography.svg';
import Wiggle from '@/assets/patterns/wiggle.svg';
import Yyy from '@/assets/patterns/yyy.svg';
import { ImageSourcePropType } from 'react-native';
import { SvgProps } from 'react-native-svg';
import type { TranslationKey } from '@/lib/i18n';

// Image-based pattern imports (Textures)
// Organized by Type
const BricksTexture = require('@/assets/backgrounds/Bricks059_1K-JPG_Color.jpg');
const MossTexture = require('@/assets/backgrounds/Moss002_1K-JPG_Color.jpg');
const TilesTexture = require('@/assets/backgrounds/Tiles132A_1K-JPG_Color.jpg');
const TactilePaving2 = require('@/assets/backgrounds/TactilePaving002_1K-JPG_Color.jpg');
const TactilePaving4 = require('@/assets/backgrounds/TactilePaving004_1K-JPG_Color.jpg');
const Tiles119 = require('@/assets/backgrounds/Tiles119_1K-JPG_Color.jpg');
const Tiles120 = require('@/assets/backgrounds/Tiles120_1K-JPG_Color.jpg');
const Tiles133 = require('@/assets/backgrounds/Tiles133A_1K-JPG_Color.jpg');
const Wood55 = require('@/assets/backgrounds/WoodFloor055_1K-JPG_Color.jpg');
const Wood57 = require('@/assets/backgrounds/WoodFloor057_1K-JPG_Color.jpg');

// Fabrics & Leathers
const Fabric06 = require('@/assets/backgrounds/Fabric006_1K-JPG_Color.jpg');
const Fabric09 = require('@/assets/backgrounds/Fabric009_1K-JPG_Color.jpg');
const Fabric24 = require('@/assets/backgrounds/Fabric024_1K-JPG_Color.jpg');
const Fabric26 = require('@/assets/backgrounds/Fabric026_1K-JPG_Color.jpg');
const Fabric40 = require('@/assets/backgrounds/Fabric040_1K-JPG_Color.jpg');
const Fabric55 = require('@/assets/backgrounds/Fabric055_1K-JPG_Color.jpg');
const Leather09 = require('@/assets/backgrounds/Leather009_1K-JPG_Color.jpg');
const Leather34 = require('@/assets/backgrounds/Leather034C_1K-JPG_Color.jpg');
const Leather36 = require('@/assets/backgrounds/Leather036B_1K-JPG_Color.jpg');

// Stones
const Marble16 = require('@/assets/backgrounds/Marble016_1K-JPG_Color.jpg');
const Marble20 = require('@/assets/backgrounds/Marble020_1K-JPG_Color.jpg');
const Marble21 = require('@/assets/backgrounds/Marble021_1K-JPG_Color.jpg');
const Onyx03 = require('@/assets/backgrounds/Onyx003_1K-JPG_Color.jpg');
const Onyx06 = require('@/assets/backgrounds/Onyx006_1K-JPG_Color.jpg');


export interface PatternDefinition {
  id: string;
  name: string;
  nameKey: TranslationKey;
  type: 'svg' | 'image';
  component?: React.FC<SvgProps>;
  imageSource?: ImageSourcePropType;
  width: number;
  height: number;
}

export const BACKGROUND_PATTERNS: PatternDefinition[] = [
  { id: 'none', name: 'None', nameKey: 'pattern.none', type: 'svg', component: () => null, width: 0, height: 0 },
  
  // Textures - Nature/Outdoor
  { id: 'moss', name: 'Moss', nameKey: 'pattern.moss', type: 'image', imageSource: MossTexture, width: 1024, height: 1024 },
  { id: 'bricks', name: 'Bricks', nameKey: 'pattern.bricks', type: 'image', imageSource: BricksTexture, width: 1024, height: 1024 },
  { id: 'paving2', name: 'Paving 1', nameKey: 'pattern.paving2', type: 'image', imageSource: TactilePaving2, width: 1024, height: 1024 },
  { id: 'paving4', name: 'Paving 2', nameKey: 'pattern.paving4', type: 'image', imageSource: TactilePaving4, width: 1024, height: 1024 },
  
  // Textures - Tiles & Wood
  { id: 'tiles', name: 'Tiles 1', nameKey: 'pattern.tiles', type: 'image', imageSource: TilesTexture, width: 1024, height: 1024 },
  { id: 'tiles119', name: 'Tiles 2', nameKey: 'pattern.tiles119', type: 'image', imageSource: Tiles119, width: 1024, height: 1024 },
  { id: 'tiles120', name: 'Tiles 3', nameKey: 'pattern.tiles120', type: 'image', imageSource: Tiles120, width: 1024, height: 1024 },
  { id: 'tiles133', name: 'Tiles 4', nameKey: 'pattern.tiles133', type: 'image', imageSource: Tiles133, width: 1024, height: 1024 },
  { id: 'wood55', name: 'Wood 1', nameKey: 'pattern.wood55', type: 'image', imageSource: Wood55, width: 1024, height: 1024 },
  { id: 'wood57', name: 'Wood 2', nameKey: 'pattern.wood57', type: 'image', imageSource: Wood57, width: 1024, height: 1024 },

  // Textures - Fabric & Leather
  { id: 'fabric06', name: 'Fabric 1', nameKey: 'pattern.fabric06', type: 'image', imageSource: Fabric06, width: 1024, height: 1024 },
  { id: 'fabric09', name: 'Fabric 2', nameKey: 'pattern.fabric09', type: 'image', imageSource: Fabric09, width: 1024, height: 1024 },
  { id: 'fabric24', name: 'Fabric 3', nameKey: 'pattern.fabric24', type: 'image', imageSource: Fabric24, width: 1024, height: 1024 },
  { id: 'fabric26', name: 'Fabric 4', nameKey: 'pattern.fabric26', type: 'image', imageSource: Fabric26, width: 1024, height: 1024 },
  { id: 'fabric40', name: 'Fabric 5', nameKey: 'pattern.fabric40', type: 'image', imageSource: Fabric40, width: 1024, height: 1024 },
  { id: 'fabric55', name: 'Fabric 6', nameKey: 'pattern.fabric55', type: 'image', imageSource: Fabric55, width: 1024, height: 1024 },
  { id: 'leather09', name: 'Leather 1', nameKey: 'pattern.leather09', type: 'image', imageSource: Leather09, width: 1024, height: 1024 },
  { id: 'leather34', name: 'Leather 2', nameKey: 'pattern.leather34', type: 'image', imageSource: Leather34, width: 1024, height: 1024 },
  { id: 'leather36', name: 'Leather 3', nameKey: 'pattern.leather36', type: 'image', imageSource: Leather36, width: 1024, height: 1024 },

  // Textures - Stone
  { id: 'marble16', name: 'Marble 1', nameKey: 'pattern.marble16', type: 'image', imageSource: Marble16, width: 1024, height: 1024 },
  { id: 'marble20', name: 'Marble 2', nameKey: 'pattern.marble20', type: 'image', imageSource: Marble20, width: 1024, height: 1024 },
  { id: 'marble21', name: 'Marble 3', nameKey: 'pattern.marble21', type: 'image', imageSource: Marble21, width: 1024, height: 1024 },
  { id: 'onyx03', name: 'Onyx 1', nameKey: 'pattern.onyx03', type: 'image', imageSource: Onyx03, width: 1024, height: 1024 },
  { id: 'onyx06', name: 'Onyx 2', nameKey: 'pattern.onyx06', type: 'image', imageSource: Onyx06, width: 1024, height: 1024 },
  
  // SVG patterns (tiled)
  { id: 'polka-dots', name: 'Dots', nameKey: 'pattern.polka-dots', type: 'svg', component: PolkaDots, width: 20, height: 20 },
  { id: 'diagonal-stripes', name: 'Stripes', nameKey: 'pattern.diagonal-stripes', type: 'svg', component: DiagonalStripes, width: 40, height: 40 },
  { id: 'hexagons', name: 'Hexagons', nameKey: 'pattern.hexagons', type: 'svg', component: Hexagons, width: 28, height: 49 },
  { id: 'bubbles', name: 'Bubbles', nameKey: 'pattern.bubbles', type: 'svg', component: Bubbles, width: 100, height: 100 },
  { id: 'brick-wall', name: 'Bricks (SVG)', nameKey: 'pattern.brick-wall', type: 'svg', component: BrickWall, width: 42, height: 44 },
  { id: 'wiggle', name: 'Wiggle', nameKey: 'pattern.wiggle', type: 'svg', component: Wiggle, width: 52, height: 26 },
  { id: 'rain', name: 'Rain', nameKey: 'pattern.rain', type: 'svg', component: Rain, width: 12, height: 16 },
  { id: 'endless-clouds', name: 'Clouds', nameKey: 'pattern.endless-clouds', type: 'svg', component: EndlessClouds, width: 56, height: 28 },
  { id: 'cage', name: 'Cage', nameKey: 'pattern.cage', type: 'svg', component: Cage, width: 32, height: 26 },
  { id: 'curtain', name: 'Curtain', nameKey: 'pattern.curtain', type: 'svg', component: Curtain, width: 44, height: 12 },
  { id: 'kiwi', name: 'Kiwi', nameKey: 'pattern.kiwi', type: 'svg', component: Kiwi, width: 34, height: 44 },
  { id: 'anchors-away', name: 'Anchors', nameKey: 'pattern.anchors-away', type: 'svg', component: AnchorsAway, width: 80, height: 80 },
  { id: 'death-star', name: 'Stars', nameKey: 'pattern.death-star', type: 'svg', component: DeathStar, width: 80, height: 105 },
  { id: 'formal-invitation', name: 'Formal', nameKey: 'pattern.formal-invitation', type: 'svg', component: FormalInvitation, width: 100, height: 18 },
  { id: 'glamorous', name: 'Glamour', nameKey: 'pattern.glamorous', type: 'svg', component: Glamorous, width: 180, height: 180 },
  { id: 'random-shapes', name: 'Shapes', nameKey: 'pattern.random-shapes', type: 'svg', component: RandomShapes, width: 80, height: 80 },
  { id: 'line-in-motion', name: 'Motion', nameKey: 'pattern.line-in-motion', type: 'svg', component: LineInMotion, width: 120, height: 120 },
  { id: 'i-like-food', name: 'Food', nameKey: 'pattern.i-like-food', type: 'svg', component: ILikeFood, width: 260, height: 260 },
  { id: 'bank-note', name: 'Fancy', nameKey: 'pattern.bank-note', type: 'svg', component: BankNote, width: 100, height: 20 },
  { id: 'topography', name: 'Topo', nameKey: 'pattern.topography', type: 'svg', component: Topography, width: 600, height: 600 },
  { id: 'yyy', name: 'YYY', nameKey: 'pattern.yyy', type: 'svg', component: Yyy, width: 60, height: 96 },
];

export function getPatternById(id: string): PatternDefinition | undefined {
  return BACKGROUND_PATTERNS.find(p => p.id === id);
}
