import { withSequence, withTiming } from 'react-native-reanimated';
import { MovementFunction } from './types';
import { clamp, Point } from './utils';

export const CIRCLE_PATTERN = {
  id: 'circle' as const,
  name: 'Center Circle',
  nameKey: 'movement.circle',
  icon: '⭕️',
  cycleMultiplier: 3.6,
} as const;

export const circleMovement: MovementFunction = (config) => {
  const { translateX, translateY, size, speed, screenWidth, screenHeight } = config;

  const maxX = Math.max(0, screenWidth - size);
  const maxY = Math.max(0, screenHeight - size);
  const margin = Math.max(12, size * 0.8);

  const cx = clamp(maxX / 2, margin, maxX - margin);
  const cy = clamp(maxY / 2, margin, maxY - margin);

  // Use current radius so selecting the pattern doesn't "teleport".
  const dx = translateX.value - cx;
  const dy = translateY.value - cy;
  const rawRadius = Math.sqrt(dx * dx + dy * dy);

  const maxRadius = Math.max(20, Math.min(cx - margin, maxX - margin - cx, cy - margin, maxY - margin - cy));
  const radius = clamp(rawRadius, Math.min(40, maxRadius), maxRadius);
  const startAngle = Math.atan2(dy, dx);

  const steps = 40;
  const points: Point[] = [];
  for (let i = 1; i <= steps; i += 1) {
    const a = startAngle + (i / steps) * Math.PI * 2;
    points.push({
      x: clamp(cx + Math.cos(a) * radius, margin, maxX - margin),
      y: clamp(cy + Math.sin(a) * radius, margin, maxY - margin),
    });
  }

  const totalMs = speed * CIRCLE_PATTERN.cycleMultiplier;
  const per = Math.max(30, Math.round(totalMs / points.length));

  translateX.value = withSequence(...points.map((p) => withTiming(p.x, { duration: per })));
  translateY.value = withSequence(...points.map((p) => withTiming(p.y, { duration: per })));
};
