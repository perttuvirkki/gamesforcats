import { FormSheetHeader } from '@/components/FormSheetHeader';
import { MOVEMENT_PATTERNS, MovementPattern } from '@/constants/movements';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useGameSettings } from '../../components/GameContext';
import { useI18n } from '@/components/I18nContext';
import { lightHaptic } from '@/lib/haptics';
import { hasProAccess } from '@/lib/revenuecat';
import { useFocusEffect } from '@react-navigation/native';

export default function MovementPickerScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [isPro, setIsPro] = React.useState(false);
  const locked = !isPro;
  const { movementPattern, setMovementPattern } = useGameSettings();

  const handleSelect = (id: string) => {
    setMovementPattern(id as MovementPattern);
    router.back();
  };

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

  const renderPattern = ({ item }: { item: typeof MOVEMENT_PATTERNS[0] }) => {
    const isSelected = movementPattern === item.id;

    return (
      <Pressable
        style={[styles.patternButton, isSelected && styles.patternButtonSelected]}
        onPress={
          locked
            ? openPaywall
            : () => {
                void lightHaptic();
                handleSelect(item.id);
              }
        }
      >
        <View style={styles.previewContainer}>
          <Text style={styles.patternIcon}>{item.icon}</Text>
        </View>
        <Text style={[styles.patternLabel, isSelected && styles.patternLabelSelected]}>
          {t(item.nameKey)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FormSheetHeader title={t('picker.movement.title')} onClose={() => router.back()} />

      <FlatList
        data={MOVEMENT_PATTERNS}
        renderItem={renderPattern}
        keyExtractor={(item) => item.id}
        numColumns={4}
        ListHeaderComponent={
          locked ? (
            <View style={styles.lockCard}>
              <Text style={styles.lockText}>{t('gameSettings.lockedHint')}</Text>
              <Pressable style={({ pressed }) => [styles.lockButton, { opacity: pressed ? 0.85 : 1 }]} onPress={openPaywall}>
                <Text style={styles.lockButtonText}>{t('settings.upgrade')}</Text>
              </Pressable>
            </View>
          ) : null
        }
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 24,
  },
  grid: {
    paddingBottom: 100,
  },
  lockCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.10)',
    marginBottom: 12,
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
  patternButton: {
    flex: 1,
    aspectRatio: 1,
    margin: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '25%',
    paddingVertical: 6,
  },
  patternButtonSelected: {
    backgroundColor: '#FF8A00',
  },
  previewContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  patternIcon: {
    fontSize: 24,
  },
  patternLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  patternLabelSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});
