import { SharedValue } from 'react-native-reanimated';
import type { TranslationKey } from '@/lib/i18n';

export type MovementPattern =
  | 'random'
  | 'straight'
  | 'peek'
  | 'wander'
  | 'pounce'
  | 'leap'
  | 'circle'
  | 'edges'
  | 'billiards';

export interface PatternDefinition {
  id: MovementPattern;
  name: string;
  nameKey: TranslationKey;
  icon: string;
}

export interface MovementConfig {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scale?: SharedValue<number>;
  size: number;
  speed: number;
  screenWidth: number;
  screenHeight: number;
}

export type MovementFunction = (config: MovementConfig) => void;
