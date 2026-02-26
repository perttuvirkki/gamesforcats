import { Easing, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { MovementFunction } from './types';

export const PEEK_PATTERN = {
  id: 'peek' as const,
  name: 'Peek',
  nameKey: 'movement.peek',
  icon: '👀',
  cycleMultiplier: 1.0,
} as const;

export const peekMovement: MovementFunction = (config) => {
  const { translateX, translateY, size, speed, screenWidth, screenHeight } = config;
  
  const maxX = Math.max(0, screenWidth - size);
  const maxY = Math.max(0, screenHeight - size);
  const randomX = () => Math.random() * maxX;
  const randomY = () => Math.random() * maxY;

  const edge = Math.floor(Math.random() * 4); // 0=left,1=right,2=top,3=bottom
  const peekDistance = size * 2;
  const duration = speed;

  if (edge === 0) {
    translateY.value = randomY();
    translateX.value = withSequence(
      withTiming(-size, { duration: 0 }),
      withTiming(peekDistance, { duration: duration * 0.3, easing: Easing.out(Easing.quad) }),
      withDelay(duration * 0.5, withTiming(-size, { duration: duration * 0.2, easing: Easing.in(Easing.quad) }))
    );
    return;
  }

  if (edge === 1) {
    translateY.value = randomY();
    translateX.value = withSequence(
      withTiming(screenWidth + size, { duration: 0 }),
      withTiming(screenWidth - peekDistance, { duration: duration * 0.3, easing: Easing.out(Easing.quad) }),
      withDelay(duration * 0.5, withTiming(screenWidth + size, { duration: duration * 0.2, easing: Easing.in(Easing.quad) }))
    );
    return;
  }

  if (edge === 2) {
    translateX.value = randomX();
    translateY.value = withSequence(
      withTiming(-size, { duration: 0 }),
      withTiming(peekDistance, { duration: duration * 0.3, easing: Easing.out(Easing.quad) }),
      withDelay(duration * 0.5, withTiming(-size, { duration: duration * 0.2, easing: Easing.in(Easing.quad) }))
    );
    return;
  }

  translateX.value = randomX();
  translateY.value = withSequence(
    withTiming(screenHeight + size, { duration: 0 }),
    withTiming(screenHeight - peekDistance, { duration: duration * 0.3, easing: Easing.out(Easing.quad) }),
    withDelay(duration * 0.5, withTiming(screenHeight + size, { duration: duration * 0.2, easing: Easing.in(Easing.quad) }))
  );
};
