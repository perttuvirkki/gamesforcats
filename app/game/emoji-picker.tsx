import emojiSvgs from '@/assets/emojiSvgs';
import { FormSheetHeader } from '@/components/FormSheetHeader';
import { ThemedText } from '@/components/themed-text';
import { SELECTABLE_EMOJI_CODES } from '@/constants/emoji-codes';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { useGameSettings } from '../../components/GameContext';
import { useI18n } from '@/components/I18nContext';
import { lightHaptic } from '@/lib/haptics';
import { hasProAccess } from '@/lib/revenuecat';
import { useFocusEffect } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/use-color-scheme';

const FULL_EMOJI_LIST = SELECTABLE_EMOJI_CODES.map((code) => ({ code, name: '' }));

const getEmoji = (code: string): React.FC<SvgProps> | null => {
  const key = `${code}.svg` as keyof typeof emojiSvgs;
  return emojiSvgs[key] || null;
};

export default function EmojiPickerScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const [isPro, setIsPro] = React.useState(false);
  const locked = !isPro;
  const { customEmoji, setCustomEmoji } = useGameSettings();

  const handleSelect = (code: string) => {
    setCustomEmoji(code);
    router.back();
  };

  const handleReset = () => {
    setCustomEmoji(null);
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

  const renderEmoji = ({ item }: { item: typeof FULL_EMOJI_LIST[0] }) => {
    const EmojiComponent = getEmoji(item.code);
    if (!EmojiComponent) return null;
    
    const isSelected = customEmoji === item.code;
    
    return (
      <Pressable
        style={[styles.emojiButton, isSelected && styles.emojiButtonSelected]}
        onPress={
          locked
            ? openPaywall
            : () => {
                void lightHaptic();
                handleSelect(item.code);
              }
        }
      >
        <EmojiComponent width={44} height={44} />
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FormSheetHeader title={t('picker.emoji.title')} onClose={() => router.back()} />

      <FlatList
        data={FULL_EMOJI_LIST}
        renderItem={renderEmoji}
        keyExtractor={(item) => item.code}
        numColumns={5}
        ListHeaderComponent={
          <View>
            {locked ? (
              <View style={[styles.lockCard, isDark ? styles.lockCardDark : null]}>
                <ThemedText style={[styles.lockText, isDark ? styles.lockTextDark : null]}>{t('gameSettings.lockedHint')}</ThemedText>
                <Pressable style={({ pressed }) => [styles.lockButton, { opacity: pressed ? 0.85 : 1 }]} onPress={openPaywall}>
                  <Text style={styles.lockButtonText}>{t('settings.upgrade')}</Text>
                </Pressable>
              </View>
            ) : null}
            <Pressable
              style={styles.resetButton}
              onPress={
                locked
                  ? openPaywall
                  : () => {
                      void lightHaptic();
                      handleReset();
                    }
              }
            >
              <ThemedText style={styles.resetText}>{t('picker.emoji.useDefault')}</ThemedText>
            </Pressable>
          </View>
        }
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={5}
        removeClippedSubviews={true}
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
  lockCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  lockText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.8,
  },
  lockTextDark: {
    color: 'rgba(255,255,255,0.82)',
    opacity: 1,
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
  resetButton: {
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '500',
  },
  grid: {
    paddingBottom: 100,
  },
  emojiButton: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '20%',
  },
  emojiButtonSelected: {
    backgroundColor: '#FF8A00',
  },
});
