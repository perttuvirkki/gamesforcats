import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import React from "react";
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { lightHaptic } from "@/lib/haptics";

export function GlassIconButton({
  name,
  onPress,
  style,
  size = 40,
  iconSize,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  size?: number;
  iconSize?: number;
  }) {
  const radius = size / 2;
  const resolvedIconSize = iconSize ?? Math.max(18, Math.round(size * 0.6));
  return (
    <Pressable
      onPress={() => {
        void lightHaptic();
        onPress();
      }}
      style={({ pressed }) => [
        styles.container,
        { width: size, height: size, borderRadius: radius },
        style,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {Platform.OS === "ios" ? (
        <GlassView
          glassEffectStyle="regular"
          tintColor="rgba(255,255,255,0.35)"
          isInteractive={false}
          style={[styles.glassContainer, { borderRadius: radius }]}
        >
          <Ionicons name={name} size={resolvedIconSize} color="#000" style={styles.icon} />
        </GlassView>
      ) : (
        <View style={[styles.androidFallbackContainer, { borderRadius: radius }]}>
          <View style={[StyleSheet.absoluteFill, styles.androidFallback]} />
          <Ionicons name={name} size={resolvedIconSize} color="#000" style={styles.icon} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    shadowColor: "#000",
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
  },
  androidFallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  androidFallback: {
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  icon: {
    opacity: 0.6,
  },
});
