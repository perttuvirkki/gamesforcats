import { Easing, withTiming } from 'react-native-reanimated';
import { MovementFunction } from './types';

export const STRAIGHT_PATTERN = {
  id: 'straight' as const,
  name: 'Straight',
  nameKey: 'movement.straight',
  icon: '➡️',
  cycleMultiplier: 3.0,
} as const;

export const straightMovement: MovementFunction = (config) => {
  const { translateX, translateY, size, speed, screenWidth, screenHeight } = config;
  
  const maxX = Math.max(0, screenWidth - size);
  const maxY = Math.max(0, screenHeight - size);
  const randomX = () => Math.random() * maxX;
  const randomY = () => Math.random() * maxY;

  const duration = speed * 3;
  const edge = Math.floor(Math.random() * 4); // 0=left,1=right,2=top,3=bottom

  if (edge < 2) {
    const startX = edge === 0 ? -size : screenWidth + size;
    const endX = edge === 0 ? screenWidth + size : -size;
    translateY.value = randomY();
    translateX.value = startX;
    translateX.value = withTiming(endX, { duration, easing: Easing.linear });
    return;
  }

  const startY = edge === 2 ? -size : screenHeight + size;
  const endY = edge === 2 ? screenHeight + size : -size;
  translateX.value = randomX();
  translateY.value = startY;
  translateY.value = withTiming(endY, { duration, easing: Easing.linear });
};
