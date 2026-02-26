import { Easing, withSequence, withTiming } from 'react-native-reanimated';
import { MovementFunction } from './types';
import { clamp, Point } from './utils';

export const EDGES_PATTERN = {
  id: 'edges' as const,
  name: 'Rounded Edges',
  nameKey: 'movement.edges',
  icon: '⬛️',
  cycleMultiplier: 5.2,
} as const;

function roundedRectPointAt({
  t,
  left,
  top,
  right,
  bottom,
  r,
}: {
  t: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
  r: number;
}): Point {
  const w = Math.max(1, right - left);
  const h = Math.max(1, bottom - top);
  const rr = clamp(r, 0, Math.min(w, h) / 2);

  const topLen = Math.max(0, w - rr * 2);
  const rightLen = Math.max(0, h - rr * 2);
  const arc = (Math.PI / 2) * rr;
  const total = 2 * (topLen + rightLen) + 4 * arc;

  let d = ((t % 1) + 1) % 1;
  d *= total;

  const go = (len: number) => {
    const used = Math.min(len, d);
    d -= used;
    return used;
  };

  // Start at top edge, after top-left corner arc, moving right.
  // Top edge
  const uTop = go(topLen);
  if (uTop < topLen) return { x: left + rr + uTop, y: top };

  // Top-right arc: angles -90 -> 0
  const uArc1 = go(arc);
  if (uArc1 < arc) {
    const a = -Math.PI / 2 + (uArc1 / arc) * (Math.PI / 2);
    return { x: right - rr + Math.cos(a) * rr, y: top + rr + Math.sin(a) * rr };
  }

  // Right edge
  const uRight = go(rightLen);
  if (uRight < rightLen) return { x: right, y: top + rr + uRight };

  // Bottom-right arc: angles 0 -> 90
  const uArc2 = go(arc);
  if (uArc2 < arc) {
    const a = 0 + (uArc2 / arc) * (Math.PI / 2);
    return { x: right - rr + Math.cos(a) * rr, y: bottom - rr + Math.sin(a) * rr };
  }

  // Bottom edge (right -> left)
  const uBottom = go(topLen);
  if (uBottom < topLen) return { x: right - rr - uBottom, y: bottom };

  // Bottom-left arc: angles 90 -> 180
  const uArc3 = go(arc);
  if (uArc3 < arc) {
    const a = Math.PI / 2 + (uArc3 / arc) * (Math.PI / 2);
    return { x: left + rr + Math.cos(a) * rr, y: bottom - rr + Math.sin(a) * rr };
  }

  // Left edge (bottom -> top)
  const uLeft = go(rightLen);
  if (uLeft < rightLen) return { x: left, y: bottom - rr - uLeft };

  // Top-left arc: angles 180 -> 270
  const uArc4 = go(arc);
  const a = Math.PI + (uArc4 / arc) * (Math.PI / 2);
  return { x: left + rr + Math.cos(a) * rr, y: top + rr + Math.sin(a) * rr };
}

function findNearestT({
  samples,
  current,
  rect,
}: {
  samples: number;
  current: Point;
  rect: { left: number; top: number; right: number; bottom: number; r: number };
}) {
  let bestT = 0;
  let bestD = Infinity;
  for (let i = 0; i < samples; i += 1) {
    const t = i / samples;
    const p = roundedRectPointAt({ t, ...rect });
    const dx = p.x - current.x;
    const dy = p.y - current.y;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      bestT = t;
    }
  }
  return bestT;
}

export const edgesMovement: MovementFunction = (config) => {
  const { translateX, translateY, size, speed, screenWidth, screenHeight } = config;

  const maxX = Math.max(0, screenWidth - size);
  const maxY = Math.max(0, screenHeight - size);
  const inset = Math.max(10, size * 0.45);

  const left = inset;
  const top = inset;
  const right = maxX - inset;
  const bottom = maxY - inset;
  const r = clamp(size * 0.9, 18, Math.min((right - left) / 2, (bottom - top) / 2));

  const rect = { left, top, right, bottom, r };
  const current = { x: translateX.value, y: translateY.value };
  const t0 = findNearestT({ samples: 80, current, rect });

  const steps = 70;
  const points: Point[] = [];
  for (let i = 1; i <= steps; i += 1) {
    const t = t0 + i / steps;
    points.push(roundedRectPointAt({ t, ...rect }));
  }

  const nearest = roundedRectPointAt({ t: t0, ...rect });
  const totalMs = speed * EDGES_PATTERN.cycleMultiplier;
  const approachMs = Math.min(320, Math.max(90, Math.round(totalMs * 0.18)));
  const loopMs = Math.max(200, totalMs - approachMs);
  const per = Math.max(20, Math.round(loopMs / points.length));

  translateX.value = withSequence(
    withTiming(nearest.x, { duration: approachMs, easing: Easing.out(Easing.quad) }),
    ...points.map((p) => withTiming(p.x, { duration: per, easing: Easing.linear }))
  );
  translateY.value = withSequence(
    withTiming(nearest.y, { duration: approachMs, easing: Easing.out(Easing.quad) }),
    ...points.map((p) => withTiming(p.y, { duration: per, easing: Easing.linear }))
  );
};
