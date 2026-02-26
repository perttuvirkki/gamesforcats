import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { GlassIconButton } from './GlassIconButton';
import { GlassCloseButton } from './GlassCloseButton';
import { ThemedText } from './themed-text';

export function FormSheetHeader({
  title,
  onClose,
  leftAction,
  style,
}: {
  title: string;
  onClose: () => void;
  leftAction?: { icon: React.ComponentProps<typeof GlassIconButton>['name']; onPress: () => void };
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.header, style]} collapsable={false}>
      {leftAction ? (
        <GlassIconButton name={leftAction.icon} onPress={leftAction.onPress} />
      ) : (
        <View style={styles.side} />
      )}
      <ThemedText type="title" style={styles.title} numberOfLines={1}>
        {title}
      </ThemedText>
      <GlassCloseButton onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    marginTop: 8,
    marginBottom: 12,
    zIndex: 10,
  },
  side: {
    width: 40,
    height: 40,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
});
