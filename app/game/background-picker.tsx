import { FormSheetHeader } from '@/components/FormSheetHeader';
import { BACKGROUND_PATTERNS } from '@/constants/background-patterns';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useGameSettings } from '../../components/GameContext';
import { useI18n } from '@/components/I18nContext';
import { lightHaptic } from '@/lib/haptics';
import { hasProAccess } from '@/lib/revenuecat';
import { useFocusEffect } from '@react-navigation/native';

const TEXTURE_OPTIONS = [
  { id: 'none', nameKey: 'pattern.none' as const },
  ...BACKGROUND_PATTERNS.filter((p) => p.type === 'image').map((p) => ({ id: p.id, nameKey: p.nameKey })),
];

export default function BackgroundPickerScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [isPro, setIsPro] = React.useState(false);
  const locked = !isPro;
  const { backgroundTexture, setBackgroundTexture, setBackgroundMode } = useGameSettings();

  const handleSelect = (id: string) => {
    setBackgroundTexture(id);
    if (id === 'none') {
      setBackgroundMode('pattern');
    } else {
      setBackgroundMode('texture');
    }
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

  const renderTexture = ({ item }: { item: (typeof TEXTURE_OPTIONS)[0] }) => {
    const isSelected = backgroundTexture === item.id;
    const pattern = BACKGROUND_PATTERNS.find((p) => p.id === item.id);

    return (
      <Pressable
        style={[styles.tileButton, isSelected && styles.tileButtonSelected]}
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
          {item.id === 'none' ? (
            <Text style={styles.icon}>✕</Text>
          ) : pattern?.type === 'image' && pattern.imageSource ? (
            <Image source={pattern.imageSource} style={styles.imagePreview} resizeMode="cover" />
          ) : (
            <Text style={styles.icon}>✕</Text>
          )}
        </View>
        <Text style={[styles.label, isSelected && styles.labelSelected]}>{t(item.nameKey)}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FormSheetHeader title={t('picker.background.title')} onClose={() => router.back()} />

      <FlatList
        data={TEXTURE_OPTIONS}
        renderItem={renderTexture}
        keyExtractor={(item) => item.id}
        numColumns={3}
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
  tileButton: {
    flex: 1,
    margin: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '33.33%',
    paddingVertical: 10,
  },
  tileButtonSelected: {
    backgroundColor: '#FF8A00',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  previewContainer: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  icon: {
    fontSize: 28,
    color: '#666',
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  labelSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});
