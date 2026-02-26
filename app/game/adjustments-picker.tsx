import { FormSheetHeader } from '@/components/FormSheetHeader';
import { useGameSettings } from '@/components/GameContext';
import { useI18n } from '@/components/I18nContext';
import { ThemedText } from '@/components/themed-text';
import { lightHaptic } from '@/lib/haptics';
import { hasProAccess } from '@/lib/revenuecat';
import Slider from '@react-native-community/slider';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AdjustmentsPickerScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [isPro, setIsPro] = React.useState(false);
  const locked = !isPro;
  const {
    speed,
    setSpeed,
    size,
    setSize,
    objectCount,
    setObjectCount,
  } = useGameSettings();

  const openPaywall = React.useCallback(() => {
    void lightHaptic();
    router.push('/paywall');
  }, [router]);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      hasProAccess()
        .then((val) => {
          if (cancelled) return;
          setIsPro(val);
        })
        .catch(() => {
          if (cancelled) return;
          setIsPro(false);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <View style={styles.container}>
      <FormSheetHeader title={t('picker.adjustments.title')} onClose={() => router.back()} />

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
        {locked ? (
          <View style={styles.lockCard}>
            <Text style={styles.lockText}>{t('gameSettings.lockedHint')}</Text>
            <Pressable style={({ pressed }) => [styles.lockButton, { opacity: pressed ? 0.85 : 1 }]} onPress={openPaywall}>
              <Text style={styles.lockButtonText}>{t('settings.upgrade')}</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Speed Slider */}
        <View style={styles.controlGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.sliderIcon}>⚡</Text>
            <ThemedText style={styles.label}>{t('gameSettings.speed', { ms: Math.round(speed) })}</ThemedText>
          </View>
          <Text style={styles.hint}>{t('gameSettings.speedHint')}</Text>
          <Slider
            style={styles.slider}
            minimumValue={200}
            maximumValue={3000}
            step={100}
            value={speed}
            onSlidingComplete={setSpeed}
            disabled={locked}
            minimumTrackTintColor="#FF8A00"
            maximumTrackTintColor="#000000"
          />
        </View>

        {/* Size Slider */}
        <View style={styles.controlGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.sliderIcon}>📐</Text>
            <ThemedText style={styles.label}>{t('gameSettings.size', { px: Math.round(size) })}</ThemedText>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={40}
            maximumValue={150}
            step={10}
            value={size}
            onSlidingComplete={setSize}
            disabled={locked}
            minimumTrackTintColor="#FF8A00"
            maximumTrackTintColor="#000000"
          />
        </View>

        {/* Count Slider */}
        <View style={styles.controlGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.sliderIcon}>🔢</Text>
            <ThemedText style={styles.label}>{t('gameSettings.count', { count: objectCount })}</ThemedText>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={objectCount}
            onSlidingComplete={setObjectCount}
            disabled={locked}
            minimumTrackTintColor="#FF8A00"
            maximumTrackTintColor="#000000"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 24,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 100,
  },
  lockCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.10)',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  lockText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.8,
    color: '#11181C',
  },
  lockButton: {
    backgroundColor: '#FF8A00',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  lockButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
  },
  controlGroup: {
    marginBottom: 24,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    borderRadius: 16,
    padding: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderIcon: {
    fontSize: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    marginLeft: 28,
  },
  slider: {
    width: '100%',
    height: 44,
    marginTop: 8,
  },
});
