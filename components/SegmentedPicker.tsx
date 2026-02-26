import React from "react";
import { Host, Picker as SwiftUIPicker } from "@expo/ui/swift-ui";
import { Picker as ComposePicker } from "@expo/ui/jetpack-compose";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { lightHaptic } from "@/lib/haptics";

const ACCENT = Colors.light.tint;

export function SegmentedPicker({
  options,
  selectedIndex,
  onOptionSelected,
}: {
  options: string[];
  selectedIndex: number;
  onOptionSelected: (index: number) => void;
}) {
  const colorScheme = useColorScheme();

  if (Platform.OS === "web") {
    return (
      <View style={styles.fallback}>
        {options.map((label, index) => {
          const selected = index === selectedIndex;
          return (
            <Pressable
              key={label}
              style={({ pressed }) => [
                styles.fallbackItem,
                selected && styles.fallbackItemSelected,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => {
                void lightHaptic();
                onOptionSelected(index);
              }}
            >
              <Text style={[styles.fallbackText, selected && styles.fallbackTextSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (Platform.OS === "ios") {
    return (
      <Host style={styles.host} matchContents={{ vertical: true }} colorScheme={colorScheme}>
        <SwiftUIPicker
          options={options}
          selectedIndex={selectedIndex}
          variant="segmented"
          onOptionSelected={({ nativeEvent: { index } }: { nativeEvent: { index: number } }) => onOptionSelected(index)}
        />
      </Host>
    );
  }

  return (
    <ComposePicker
      options={options}
      selectedIndex={selectedIndex}
      variant="segmented"
      style={styles.host}
      onOptionSelected={({ nativeEvent: { index } }: { nativeEvent: { index: number } }) => onOptionSelected(index)}
    />
  );
}

const styles = StyleSheet.create({
  host: {
    width: "100%",
    height: 44,
    alignSelf: "stretch",
  },
  fallback: {
    flexDirection: "row",
    borderRadius: 12,
    backgroundColor: "rgba(150, 150, 150, 0.15)",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
    height: 44,
  },
  fallbackItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackItemSelected: {
    backgroundColor: ACCENT,
  },
  fallbackText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
  },
  fallbackTextSelected: {
    color: "#fff",
  },
});
