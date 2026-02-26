import { Easing, withTiming } from 'react-native-reanimated';

export type Point = { x: number; y: number };

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function makeLinearSegmentAnimations({
  start,
  points,
  totalMs,
  minMs = 60,
  easing = Easing.linear,
}: {
  start: Point;
  points: Point[];
  totalMs: number;
  minMs?: number;
  easing?: (value: number) => number;
}) {
  const distances: number[] = [];
  let sum = 0;
  let prev = start;

  for (const p of points) {
    const dx = p.x - prev.x;
    const dy = p.y - prev.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    distances.push(dist);
    sum += dist;
    prev = p;
  }

  const minTotal = minMs * points.length;
  const remaining = Math.max(0, totalMs - minTotal);

  const durations = distances.map((d) => {
    if (sum <= 0) return minMs + remaining / Math.max(1, points.length);
    return minMs + (remaining * d) / sum;
  });

  const animationsX: any[] = [];
  const animationsY: any[] = [];

  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    const duration = durations[i];
    animationsX.push(withTiming(p.x, { duration, easing }));
    animationsY.push(withTiming(p.y, { duration, easing }));
  }

  return { animationsX, animationsY, durations };
}
