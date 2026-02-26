import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import React from 'react';
import { Platform, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { lightHaptic } from '@/lib/haptics';

interface GlassCloseButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

export function GlassCloseButton({ onPress, style }: GlassCloseButtonProps) {
  return (
    <Pressable 
      onPress={() => {
        void lightHaptic();
        onPress();
      }} 
      style={({ pressed }) => [
        styles.container, 
        style,
        { opacity: pressed ? 0.7 : 1 }
      ]}
    >
      {Platform.OS === 'ios' ? (
        <GlassView
          glassEffectStyle="regular"
          tintColor="rgba(255,255,255,0.35)"
          isInteractive={false}
          style={styles.glassContainer}
        >
          <Ionicons name="close" size={24} color="#000" style={styles.icon} />
        </GlassView>
      ) : (
        <View style={styles.androidFallbackContainer}>
          <View style={[StyleSheet.absoluteFill, styles.androidFallback]} />
          <Ionicons name="close" size={24} color="#000" style={styles.icon} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  glassContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  androidFallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  androidFallback: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  icon: {
    opacity: 0.6,
  },
});
