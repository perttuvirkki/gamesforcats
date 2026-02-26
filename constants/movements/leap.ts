import { Easing, withSequence, withTiming } from 'react-native-reanimated';
import { MovementFunction } from './types';
import { clamp, makeLinearSegmentAnimations, Point } from './utils';

export const LEAP_PATTERN = {
  id: 'leap' as const,
  name: 'Leap',
  nameKey: 'movement.leap',
  icon: '🐸',
  cycleMultiplier: 2.8,
} as const;

export const leapMovement: MovementFunction = (config) => {
  const { translateX, translateY, scale, size, speed, screenWidth, screenHeight } = config;

  const maxX = Math.max(0, screenWidth - size);
  const maxY = Math.max(0, screenHeight - size);
  const margin = Math.max(8, size * 0.4);

  const randomInside = (): Point => ({
    x: clamp(Math.random() * maxX, margin, maxX - margin),
    y: clamp(Math.random() * maxY, margin, maxY - margin),
  });

  const leapCount = 3 + Math.floor(Math.random() * 3); // 3–5 leaps per cycle
  const targets = Array.from({ length: leapCount }, () => randomInside());

  const totalMs = speed * LEAP_PATTERN.cycleMultiplier;
  const pauseMs = Math.max(160, Math.round(speed * 0.35));
  const moveTotalMs = Math.max(240, totalMs - pauseMs * leapCount);

  const start = { x: translateX.value, y: translateY.value };
  const { durations } = makeLinearSegmentAnimations({
    start,
    points: targets,
    totalMs: moveTotalMs,
    minMs: 110,
    easing: Easing.out(Easing.cubic),
  });

  const fullX: any[] = [];
  const fullY: any[] = [];
  const fullScale: any[] = [];

  let last = start;
  for (let i = 0; i < targets.length; i += 1) {
    const target = targets[i];
    const duration = durations[i] ?? 0;
    const upDuration = Math.max(1, Math.round(duration * 0.45));
    const downDuration = Math.max(1, duration - upDuration);

    const dx = target.x - last.x;
    const dy = target.y - last.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const arcHeight = clamp(dist * 0.25, size * 0.55, size * 1.8);
    const peakY = clamp(Math.min(last.y, target.y) - arcHeight, margin, maxY - margin);
    const peakScale = clamp(1.18 + Math.min(0.4, dist / Math.max(1, Math.min(screenWidth, screenHeight))) * 0.6, 1.18, 1.55);

    fullX.push(withTiming(last.x, { duration: pauseMs }));
    fullY.push(withTiming(last.y, { duration: pauseMs }));

    // Leap forward quickly...
    fullX.push(withTiming(target.x, { duration, easing: Easing.out(Easing.cubic) }));
    // ...with a small arc.
    fullY.push(
      withSequence(
        withTiming(peakY, { duration: upDuration, easing: Easing.out(Easing.quad) }),
        withTiming(target.y, { duration: downDuration, easing: Easing.in(Easing.quad) })
      )
    );

    // Scale up mid-leap to feel like the emoji is "coming closer".
    if (scale) {
      fullScale.push(withTiming(1, { duration: pauseMs }));
      fullScale.push(
        withSequence(
          withTiming(peakScale, { duration: upDuration, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: downDuration, easing: Easing.in(Easing.quad) })
        )
      );
    }

    last = target;
  }

  translateX.value = withSequence(...fullX);
  translateY.value = withSequence(...fullY);
  if (scale && fullScale.length) {
    scale.value = withSequence(...fullScale);
  }
};
