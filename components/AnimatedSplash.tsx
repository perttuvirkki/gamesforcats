import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

// Prevent the splash screen from auto-hiding
void SplashScreen.preventAutoHideAsync().catch(() => {
  // no-op
});

// Import splash images
const box1 = require('../assets/box1.png');
const box2 = require('../assets/box2.png');
const box3 = require('../assets/box3.png');
const SPLASH_BG_COLOR = '#FF8A00';

interface AnimatedSplashProps {
  children: React.ReactNode;
}

export default function AnimatedSplash({ children }: AnimatedSplashProps) {
  const [showSplash, setShowSplash] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false);
  
  const opacity = useSharedValue(1);
  const splashOpacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const images = [box1, box2, box3];
  const showShine = Platform.OS === 'ios';
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const onSplashLayout = useCallback(async () => {
    if (nativeSplashHidden) return;
    try {
      await SplashScreen.hideAsync();
    } catch {
      // no-op
    } finally {
      setNativeSplashHidden(true);
    }
  }, [nativeSplashHidden]);

  useEffect(() => {
    if (!nativeSplashHidden) return;

    let cancelled = false;
    const animateFrames = async () => {
      await delay(400);
      if (cancelled) return;
      setCurrentImage(1);

      await delay(400);
      if (cancelled) return;
      setCurrentImage(2);

      await delay(400);
      if (cancelled) return;
      opacity.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
      scale.value = withTiming(1.1, { duration: 300, easing: Easing.out(Easing.ease) });
      splashOpacity.value = withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) });

      await delay(440);
      if (cancelled) return;
      setShowSplash(false);
    };

    void animateFrames();
    return () => {
      cancelled = true;
    };
  }, [nativeSplashHidden, opacity, scale, splashOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const splashAnimatedStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
  }));

  return (
    <View style={styles.root}>
      {children}
      {showSplash ? (
        <Animated.View style={[styles.container, splashAnimatedStyle]} onLayout={onSplashLayout}>
          <Animated.View style={[styles.imageContainer, animatedStyle]}>
            {showShine ? <View style={styles.shineOuter} /> : null}
            {showShine ? <View style={styles.shineInner} /> : null}
            <View style={styles.imageStack}>
              {images.map((source, index) => (
                <Image
                  key={index}
                  source={source}
                  style={[styles.image, index === currentImage ? styles.imageVisible : styles.imageHidden]}
                  resizeMode="contain"
                  fadeDuration={0}
                />
              ))}
            </View>
          </Animated.View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SPLASH_BG_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  shineOuter: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(255,255,255,0.20)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.4,
    shadowRadius: 64,
    shadowOffset: { width: 0, height: 0 },
    elevation: 16,
  },
  shineInner: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(255,255,255,0.26)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.3,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  imageStack: {
    width: 300,
    height: 300,
    position: 'relative',
  },
  image: {
    width: 300,
    height: 300,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  imageVisible: {
    opacity: 1,
  },
  imageHidden: {
    opacity: 0,
  },
});
