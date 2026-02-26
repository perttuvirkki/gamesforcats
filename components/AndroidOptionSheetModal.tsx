import { ThemedText } from "@/components/themed-text";
import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

export function AndroidOptionSheetModal({
  visible,
  title,
  options,
  selectedIndex,
  isDark,
  onSelect,
  onCancel,
  cancelLabel = "Cancel",
}: {
  visible: boolean;
  title: string;
  options: string[];
  selectedIndex?: number;
  isDark: boolean;
  onSelect: (index: number) => void;
  onCancel: () => void;
  cancelLabel?: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.sheetBackdrop} onPress={onCancel}>
        <Pressable style={[styles.sheetCard, isDark ? styles.sheetCardDark : null]} onPress={() => {}}>
          <ThemedText style={[styles.sheetTitle, isDark ? styles.sheetTitleDark : null]} numberOfLines={2}>
            {title}
          </ThemedText>

          <View style={[styles.sheetOptionsCard, isDark ? styles.sheetOptionsCardDark : null]}>
            <ScrollView style={styles.sheetOptionsScroll} contentContainerStyle={styles.sheetOptionsContent} showsVerticalScrollIndicator={false}>
              {options.map((label, index) => (
                <Pressable
                  key={`${index}-${label}`}
                  onPress={() => onSelect(index)}
                  style={({ pressed }) => [
                    styles.sheetOption,
                    isDark ? styles.sheetOptionDark : null,
                    pressed ? styles.sheetOptionPressed : null,
                  ]}
                >
                  <ThemedText style={styles.sheetOptionText} numberOfLines={1}>
                    {label}
                  </ThemedText>
                  {selectedIndex === index ? (
                    <ThemedText lightColor="rgba(0,0,0,0.55)" darkColor="rgba(255,255,255,0.70)" style={styles.sheetCheck}>
                      ✓
                    </ThemedText>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <Pressable onPress={onCancel} style={({ pressed }) => [styles.sheetCancel, pressed ? styles.sheetOptionPressed : null]}>
            <ThemedText style={styles.sheetCancelText}>{cancelLabel}</ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheetCard: {
    padding: 12,
    paddingBottom: 10,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.12)",
  },
  sheetCardDark: {
    backgroundColor: "rgba(20,20,20,0.98)",
    borderColor: "rgba(255,255,255,0.14)",
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sheetTitleDark: {
    color: "rgba(255,255,255,0.92)",
  },
  sheetOptionsCard: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.10)",
  },
  sheetOptionsCardDark: {
    borderColor: "rgba(255,255,255,0.14)",
  },
  sheetOptionsScroll: {
    maxHeight: 420,
  },
  sheetOptionsContent: {},
  sheetOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.75)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.10)",
  },
  sheetOptionDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  sheetOptionPressed: {
    opacity: 0.85,
  },
  sheetOptionText: {
    flex: 1,
    paddingRight: 10,
  },
  sheetCheck: {
    fontWeight: "900",
  },
  sheetCancel: {
    marginTop: 10,
    alignSelf: "stretch",
    borderRadius: 14,
    backgroundColor: "rgba(150, 150, 150, 0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.10)",
    paddingVertical: 12,
    alignItems: "center",
  },
  sheetCancelText: {
    fontWeight: "800",
  },
});

