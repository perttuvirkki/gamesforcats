import { withSequence, withTiming } from 'react-native-reanimated';
import { MovementFunction } from './types';
import { clamp, makeLinearSegmentAnimations, Point } from './utils';

export const POUNCE_PATTERN = {
  id: 'pounce' as const,
  name: 'Pounce',
  nameKey: 'movement.pounce',
  icon: '⚡️',
  cycleMultiplier: 9.0,
} as const;

export const pounceMovement: MovementFunction = (config) => {
  const { translateX, translateY, size, speed, screenWidth, screenHeight } = config;

  const maxX = Math.max(0, screenWidth - size);
  const maxY = Math.max(0, screenHeight - size);
  const margin = Math.max(8, size * 0.4);

  const randomInside = (): Point => ({
    x: clamp(Math.random() * maxX, margin, maxX - margin),
    y: clamp(Math.random() * maxY, margin, maxY - margin),
  });

  const pounceCount = 2 + Math.floor(Math.random() * 2); // 2–3 pounces per cycle
  const targets = Array.from({ length: pounceCount }, () => randomInside());

  // Build a sequence: pause, then quick pounce, repeat.
  const totalMs = speed * POUNCE_PATTERN.cycleMultiplier;
  // Keep the actual pounces quick, and spend most of the time "waiting" in place.
  const minMoveMsPerPounce = 50;
  const minMoveTotalMs = minMoveMsPerPounce * pounceCount;
  const moveTotalMs = clamp(Math.round(speed * 0.35), minMoveTotalMs, 800);
  const pauseMs = Math.max(0, Math.floor((totalMs - moveTotalMs) / pounceCount));

  const start = { x: translateX.value, y: translateY.value };
  const { animationsX, animationsY } = makeLinearSegmentAnimations({
    start,
    points: targets,
    totalMs: moveTotalMs,
    minMs: minMoveMsPerPounce,
  });

  const fullX: any[] = [];
  const fullY: any[] = [];

  // Pause at current (no movement), then move to next target.
  let last = start;
  for (let i = 0; i < targets.length; i += 1) {
    fullX.push(withTiming(last.x, { duration: pauseMs }));
    fullY.push(withTiming(last.y, { duration: pauseMs }));
    fullX.push(animationsX[i]);
    fullY.push(animationsY[i]);
    last = targets[i];
  }

  translateX.value = withSequence(...fullX);
  translateY.value = withSequence(...fullY);
};
