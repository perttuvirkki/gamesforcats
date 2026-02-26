import { Easing, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { MovementFunction } from './types';

export const RANDOM_PATTERN = {
  id: 'random' as const,
  name: 'Random',
  nameKey: 'movement.random',
  icon: '🎲',
  cycleMultiplier: 8.0,
} as const;

export const randomMovement: MovementFunction = (config) => {
  const { translateX, translateY, size, speed, screenWidth, screenHeight } = config;
  
  const randomX = () => Math.random() * Math.max(0, screenWidth - size);
  const randomY = () => Math.random() * Math.max(0, screenHeight - size);

  const start = { x: translateX.value, y: translateY.value };
  const pointCount = 6 + Math.floor(Math.random() * 9); // 6–14 segments (varied loop length)
  const points = [start, ...Array.from({ length: pointCount }, () => ({ x: randomX(), y: randomY() })), start];

  const baseDist = Math.sqrt(screenWidth ** 2 + screenHeight ** 2) / 2;
  const getDuration = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const scaled = baseDist > 0 ? (dist / baseDist) * speed : speed;
    return Math.max(120, scaled);
  };

  const animationsX: any[] = [];
  const animationsY: any[] = [];

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const next = points[i];
    const duration = getDuration(prev, next);
    animationsX.push(withTiming(next.x, { duration, easing: Easing.linear }));
    animationsY.push(withTiming(next.y, { duration, easing: Easing.linear }));
  }

  translateX.value = withRepeat(withSequence(...animationsX), -1, false);
  translateY.value = withRepeat(withSequence(...animationsY), -1, false);
};
