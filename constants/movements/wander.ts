import { Easing, withSequence, withTiming } from 'react-native-reanimated';
import { MovementFunction } from './types';

export const WANDER_PATTERN = {
  id: 'wander' as const,
  name: 'Wander',
  nameKey: 'movement.wander',
  icon: '🐾',
  cycleMultiplier: 4.0,
} as const;

type Point = { x: number; y: number };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const wanderMovement: MovementFunction = (config) => {
  const { translateX, translateY, size, speed, screenWidth, screenHeight } = config;

  const maxX = Math.max(0, screenWidth - size);
  const maxY = Math.max(0, screenHeight - size);

  const center: Point = { x: maxX / 2, y: maxY / 2 };
  const margin = Math.max(8, size * 0.4);

  const randomInside = (): Point => ({
    x: Math.random() * maxX,
    y: Math.random() * maxY,
  });

  const startSide = Math.floor(Math.random() * 4); // 0=left,1=right,2=top,3=bottom
  const startOutsideOffset = size * 2;

  let startOutside: Point = { x: -startOutsideOffset, y: Math.random() * maxY };
  let entryInside: Point = randomInside();

  if (startSide === 0) {
    startOutside = { x: -startOutsideOffset, y: Math.random() * maxY };
    entryInside = { x: Math.random() * (maxX * 0.2), y: clamp(startOutside.y, 0, maxY) };
  } else if (startSide === 1) {
    startOutside = { x: screenWidth + startOutsideOffset, y: Math.random() * maxY };
    entryInside = { x: maxX - Math.random() * (maxX * 0.2), y: clamp(startOutside.y, 0, maxY) };
  } else if (startSide === 2) {
    startOutside = { x: Math.random() * maxX, y: -startOutsideOffset };
    entryInside = { x: clamp(startOutside.x, 0, maxX), y: Math.random() * (maxY * 0.2) };
  } else {
    startOutside = { x: Math.random() * maxX, y: screenHeight + startOutsideOffset };
    entryInside = { x: clamp(startOutside.x, 0, maxX), y: maxY - Math.random() * (maxY * 0.2) };
  }

  const exitSide = Math.floor(Math.random() * 4);
  const exitOutsideOffset = size * 2;

  let exitOutside: Point = { x: -exitOutsideOffset, y: Math.random() * maxY };
  let approachExitInside: Point = randomInside();

  if (exitSide === 0) {
    exitOutside = { x: -exitOutsideOffset, y: Math.random() * maxY };
    approachExitInside = { x: Math.random() * (maxX * 0.2), y: clamp(exitOutside.y, 0, maxY) };
  } else if (exitSide === 1) {
    exitOutside = { x: screenWidth + exitOutsideOffset, y: Math.random() * maxY };
    approachExitInside = { x: maxX - Math.random() * (maxX * 0.2), y: clamp(exitOutside.y, 0, maxY) };
  } else if (exitSide === 2) {
    exitOutside = { x: Math.random() * maxX, y: -exitOutsideOffset };
    approachExitInside = { x: clamp(exitOutside.x, 0, maxX), y: Math.random() * (maxY * 0.2) };
  } else {
    exitOutside = { x: Math.random() * maxX, y: screenHeight + exitOutsideOffset };
    approachExitInside = { x: clamp(exitOutside.x, 0, maxX), y: maxY - Math.random() * (maxY * 0.2) };
  }

  const points: Point[] = [entryInside];
  const angleToCenter = Math.atan2(center.y - entryInside.y, center.x - entryInside.x);
  let heading = angleToCenter;
  let last = entryInside;

  const steps = 3;
  const minStep = Math.max(size * 1.5, 40);
  const maxStep = Math.max(size * 4, 120);

  for (let i = 0; i < steps; i++) {
    heading += (Math.random() - 0.5) * Math.PI * 0.9; // +/- ~81deg
    const dist = minStep + Math.random() * (maxStep - minStep);
    const next: Point = {
      x: clamp(last.x + Math.cos(heading) * dist, margin, maxX - margin),
      y: clamp(last.y + Math.sin(heading) * dist, margin, maxY - margin),
    };
    points.push(next);
    last = next;
  }

  points.push(approachExitInside);
  points.push(exitOutside);

  translateX.value = startOutside.x;
  translateY.value = startOutside.y;

  const totalMs = speed * WANDER_PATTERN.cycleMultiplier;
  const minMs = 80;
  const segmentCount = points.length;
  const minTotal = minMs * segmentCount;

  const dists: number[] = [];
  let sumDist = 0;
  let prev: Point = startOutside;
  for (const p of points) {
    const dx = p.x - prev.x;
    const dy = p.y - prev.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    dists.push(dist);
    sumDist += dist;
    prev = p;
  }

  const remainingMs = Math.max(0, totalMs - minTotal);
  const durations = dists.map((dist) => {
    if (sumDist <= 0) return minMs + remainingMs / segmentCount;
    return minMs + (remainingMs * dist) / sumDist;
  });

  const animationsX: any[] = [];
  const animationsY: any[] = [];

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const duration = durations[i];
    animationsX.push(withTiming(p.x, { duration, easing: Easing.linear }));
    animationsY.push(withTiming(p.y, { duration, easing: Easing.linear }));
  }

  translateX.value = withSequence(...animationsX);
  translateY.value = withSequence(...animationsY);
};
