import { Easing, withSequence, withTiming } from 'react-native-reanimated';
import { MovementFunction } from './types';
import { clamp, makeLinearSegmentAnimations, Point } from './utils';

export const BILLIARDS_PATTERN = {
  id: 'billiards' as const,
  name: 'Billiards',
  nameKey: 'movement.billiards',
  icon: '🎱',
  cycleMultiplier: 5.0,
} as const;

function randomDirection(): { vx: number; vy: number } {
  for (let i = 0; i < 16; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const vx = Math.cos(angle);
    const vy = Math.sin(angle);
    // Avoid almost-axis-aligned movement so rebounds look dynamic.
    if (Math.abs(vx) >= 0.24 && Math.abs(vy) >= 0.24) return { vx, vy };
  }
  return { vx: 0.72, vy: 0.69 };
}

export const billiardsMovement: MovementFunction = (config) => {
  const { translateX, translateY, size, speed, screenWidth, screenHeight } = config;

  const maxX = Math.max(0, screenWidth - size);
  const maxY = Math.max(0, screenHeight - size);
  if (maxX <= 0 || maxY <= 0) return;

  const totalMs = speed * BILLIARDS_PATTERN.cycleMultiplier;
  const edgeEpsilon = Math.max(0.25, size * 0.02);

  let x = clamp(translateX.value, 0, maxX);
  let y = clamp(translateY.value, 0, maxY);

  const { vx: startVx, vy: startVy } = randomDirection();
  let vx = startVx;
  let vy = startVy;

  // Nudge slightly inward if currently on the border to avoid a zero-time first reflection.
  x = clamp(x + vx * edgeEpsilon, 0, maxX);
  y = clamp(y + vy * edgeEpsilon, 0, maxY);
  translateX.value = x;
  translateY.value = y;

  const start: Point = { x, y };
  const points: Point[] = [];
  const bounceCount = 8;

  for (let i = 0; i < bounceCount; i += 1) {
    const tx = vx > 0 ? (maxX - x) / vx : vx < 0 ? (0 - x) / vx : Number.POSITIVE_INFINITY;
    const ty = vy > 0 ? (maxY - y) / vy : vy < 0 ? (0 - y) / vy : Number.POSITIVE_INFINITY;
    const t = Math.min(tx, ty);
    if (!Number.isFinite(t) || t <= 0) break;

    x = clamp(x + vx * t, 0, maxX);
    y = clamp(y + vy * t, 0, maxY);
    points.push({ x, y });

    const hitVertical = Math.abs(x) <= edgeEpsilon || Math.abs(x - maxX) <= edgeEpsilon;
    const hitHorizontal = Math.abs(y) <= edgeEpsilon || Math.abs(y - maxY) <= edgeEpsilon;
    if (!hitVertical && !hitHorizontal) break;

    if (hitVertical) vx *= -1;
    if (hitHorizontal) vy *= -1;

    // Step a tiny amount inside after the bounce to prevent repeated same-wall collisions.
    x = clamp(x + vx * edgeEpsilon, 0, maxX);
    y = clamp(y + vy * edgeEpsilon, 0, maxY);
  }

  if (!points.length) {
    const fallbackX = Math.random() * maxX;
    const fallbackY = Math.random() * maxY;
    translateX.value = withTiming(fallbackX, { duration: totalMs, easing: Easing.linear });
    translateY.value = withTiming(fallbackY, { duration: totalMs, easing: Easing.linear });
    return;
  }

  const { animationsX, animationsY } = makeLinearSegmentAnimations({
    start,
    points,
    totalMs,
    minMs: 90,
    easing: Easing.linear,
  });

  translateX.value = withSequence(...animationsX);
  translateY.value = withSequence(...animationsY);
};
