import { lightHaptic } from '@/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useI18n } from './I18nContext';

export default function LoadingScreenRunner() {
  const router = useRouter();
  const { t } = useI18n();
  const hintOpacity = useSharedValue(0);
  const hintTranslateX = useSharedValue(50);

  const exitToMenu = React.useCallback(() => {
    router.dismissAll();
    setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    }, 100);
  }, [router]);

  const showTapHint = React.useCallback(() => {
    void lightHaptic();
    hintOpacity.value = withSequence(withTiming(1, { duration: 200 }), withTiming(1, { duration: 1500 }), withTiming(0, { duration: 300 }));
    hintTranslateX.value = withSequence(withTiming(0, { duration: 200 }), withTiming(0, { duration: 1500 }), withTiming(-50, { duration: 300 }));
  }, [hintOpacity, hintTranslateX]);

  const hintStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
    transform: [{ translateX: hintTranslateX.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <View style={styles.spinnerWrap}>
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.spinner} />
      </View>

      <Animated.View style={[styles.hintContainer, hintStyle]} pointerEvents="none">
        <Text style={styles.hintText}>{t('hint.holdToExit')}</Text>
      </Animated.View>

      <Pressable
        style={({ pressed }) => [styles.menuButton, { opacity: pressed ? 0.7 : 1 }]}
        onPress={showTapHint}
        onLongPress={() => {
          void lightHaptic();
          exitToMenu();
        }}
        delayLongPress={300}
      >
        {Platform.OS === 'ios' ? (
          <GlassView glassEffectStyle="regular" tintColor="rgba(255,255,255,0.28)" isInteractive={false} style={styles.menuGlass}>
            <Ionicons name="home-outline" size={26} color="#000" style={styles.menuIcon} />
          </GlassView>
        ) : (
          <View style={styles.menuAndroidFallback}>
            <Ionicons name="home-outline" size={26} color="#000" style={styles.menuIcon} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  spinnerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    transform: [{ scale: 2.1 }],
  },
  menuButton: {
    position: 'absolute',
    right: 30,
    bottom: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  menuGlass: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.10)',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  menuAndroidFallback: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.10)',
  },
  menuIcon: {
    opacity: 0.65,
  },
  hintContainer: {
    position: 'absolute',
    bottom: 52,
    right: 100,
    zIndex: 9999,
    elevation: 9999,
  },
  hintText: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});
