import { FormSheetHeader } from '@/components/FormSheetHeader';
import { ThemedText } from '@/components/themed-text';
import { BACKGROUND_PATTERNS } from '@/constants/background-patterns';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import ColorPicker, { HueSlider, Panel1, Swatches } from 'reanimated-color-picker';
import { useGameSettings } from '../../components/GameContext';
import { useI18n } from '@/components/I18nContext';
import { lightHaptic } from '@/lib/haptics';
import { hasProAccess } from '@/lib/revenuecat';
import { useFocusEffect } from '@react-navigation/native';

const SVG_PATTERN_OPTIONS = BACKGROUND_PATTERNS.filter((p) => p.id === 'none' || p.type === 'svg');
const COMMON_COLOR_SWATCHES = [
  '#FFFFFF',
  '#000000',
  '#FF3B30',
  '#FF9500',
  '#FFCC00',
  '#34C759',
  '#00C7BE',
  '#007AFF',
  '#5856D6',
  '#AF52DE',
];

export default function PatternPickerScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [isPro, setIsPro] = React.useState(false);
  const locked = !isPro;
  const {
    backgroundPattern,
    setBackgroundPattern,
    backgroundColor,
    setBackgroundColor,
    setBackgroundMode,
  } = useGameSettings();

  const handleSelect = (id: string) => {
    setBackgroundPattern(id);
    setBackgroundMode('pattern');
    router.back();
  };

  const handleColorSelect = (hexColor: string) => {
    setBackgroundColor(hexColor);
    setBackgroundMode('pattern');
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

  const renderPattern = ({ item }: { item: typeof SVG_PATTERN_OPTIONS[0] }) => {
    const isSelected = backgroundPattern === item.id;
    const PatternComponent = item.component;

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
          {item.id === 'none' ? (
             <Text style={styles.patternIcon}>✕</Text>
          ) : PatternComponent && item.type === 'svg' ? (
            <View style={styles.svgPreview}>
              <PatternComponent width={40} height={40} />
            </View>
          ) : null}
        </View>
        <Text style={[styles.patternLabel, isSelected && styles.patternLabelSelected]}>
          {t(item.nameKey)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FormSheetHeader title={t('picker.pattern.title')} onClose={() => router.back()} />

      <FlatList
        data={SVG_PATTERN_OPTIONS}
        renderItem={renderPattern}
        keyExtractor={(item) => item.id}
        numColumns={5}
	        ListHeaderComponent={
	          <View>
              {locked ? (
                <View style={styles.lockCard}>
                  <Text style={styles.lockText}>{t('gameSettings.lockedHint')}</Text>
                  <Pressable style={({ pressed }) => [styles.lockButton, { opacity: pressed ? 0.85 : 1 }]} onPress={openPaywall}>
                    <Text style={styles.lockButtonText}>{t('settings.upgrade')}</Text>
                  </Pressable>
                </View>
              ) : null}
              <View pointerEvents={locked ? 'none' : 'auto'} style={locked ? styles.lockedControl : null}>
	            <ColorPicker value={backgroundColor} onChangeJS={({ hex }) => handleColorSelect(hex)}>
	              <Panel1 style={styles.colorPanel} />
	              <HueSlider style={styles.hueSlider} />
	              <Swatches colors={COMMON_COLOR_SWATCHES} style={styles.swatches} />
	            </ColorPicker>
              </View>

            <View style={styles.sectionHeader}>
              <ThemedText>{t('picker.pattern.section')}</ThemedText>
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
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
  lockedControl: {
    opacity: 0.6,
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 100,
  },
  colorPanel: {
    height: 190,
    borderRadius: 14,
    overflow: 'hidden',
  },
  hueSlider: {
    marginTop: 12,
    height: 18,
    borderRadius: 999,
  },
  swatches: {
    marginTop: 12,
  },
  patternButton: {
    flex: 1,
    margin: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '20%',
    paddingVertical: 6,
  },
  patternButtonSelected: {
    backgroundColor: '#FF8A00',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  previewContainer: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  svgPreview: {
    opacity: 0.6,
  },
  patternIcon: {
    fontSize: 20,
    color: '#666',
  },
  patternLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#333',
  },
  patternLabelSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});
