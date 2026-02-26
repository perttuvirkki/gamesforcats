export { CIRCLE_PATTERN, circleMovement } from './circle';
export { BILLIARDS_PATTERN, billiardsMovement } from './billiards';
export { EDGES_PATTERN, edgesMovement } from './edges';
export { LEAP_PATTERN, leapMovement } from './leap';
export { PEEK_PATTERN, peekMovement } from './peek';
export { POUNCE_PATTERN, pounceMovement } from './pounce';
export { RANDOM_PATTERN, randomMovement } from './random';
export { STRAIGHT_PATTERN, straightMovement } from './straight';
export { WANDER_PATTERN, wanderMovement } from './wander';
export * from './types';

import { CIRCLE_PATTERN, circleMovement } from './circle';
import { BILLIARDS_PATTERN, billiardsMovement } from './billiards';
import { EDGES_PATTERN, edgesMovement } from './edges';
import { LEAP_PATTERN, leapMovement } from './leap';
import { PEEK_PATTERN, peekMovement } from './peek';
import { POUNCE_PATTERN, pounceMovement } from './pounce';
import { RANDOM_PATTERN, randomMovement } from './random';
import { STRAIGHT_PATTERN, straightMovement } from './straight';
import { WANDER_PATTERN, wanderMovement } from './wander';
import { MovementFunction, MovementPattern, PatternDefinition } from './types';

export const MOVEMENT_PATTERNS: PatternDefinition[] = [
  RANDOM_PATTERN,
  STRAIGHT_PATTERN,
  PEEK_PATTERN,
  WANDER_PATTERN,
  POUNCE_PATTERN,
  LEAP_PATTERN,
  CIRCLE_PATTERN,
  EDGES_PATTERN,
  BILLIARDS_PATTERN,
];

export const MOVEMENT_FUNCTIONS: Record<MovementPattern, MovementFunction> = {
  random: randomMovement,
  straight: straightMovement,
  peek: peekMovement,
  wander: wanderMovement,
  pounce: pounceMovement,
  leap: leapMovement,
  circle: circleMovement,
  edges: edgesMovement,
  billiards: billiardsMovement,
};

export const PATTERN_CYCLE_MULTIPLIERS: Record<MovementPattern, number> = {
  random: RANDOM_PATTERN.cycleMultiplier,
  straight: STRAIGHT_PATTERN.cycleMultiplier,
  peek: PEEK_PATTERN.cycleMultiplier,
  wander: WANDER_PATTERN.cycleMultiplier,
  pounce: POUNCE_PATTERN.cycleMultiplier,
  leap: LEAP_PATTERN.cycleMultiplier,
  circle: CIRCLE_PATTERN.cycleMultiplier,
  edges: EDGES_PATTERN.cycleMultiplier,
  billiards: BILLIARDS_PATTERN.cycleMultiplier,
};
