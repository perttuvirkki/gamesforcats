import { AndroidOptionSheetModal } from "@/components/AndroidOptionSheetModal";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { lightHaptic } from "@/lib/haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text } from "react-native";

type LanguageContextMenuProps = {
  options: string[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  title?: string;
};

export function LanguageContextMenu({ options, selectedIndex, onSelectIndex, title = "Language" }: LanguageContextMenuProps) {
  const colorScheme = useColorScheme();
  const [open, setOpen] = React.useState(false);
  if (Platform.OS === "web") return null;
  const selectedLabel = options[selectedIndex] ?? "";
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;

  if (Platform.OS === "ios") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ContextMenu, Host, Button } = require("@expo/ui/swift-ui") as any;

    return (
      <Host style={{ width: "100%", height: 44 }} matchContents={{ vertical: true }} colorScheme={colorScheme}>
        <ContextMenu activationMethod="singlePress">
          <ContextMenu.Items>
            {options.map((label, index) => (
              <Button
                key={label}
                onPress={() => {
                  lightHaptic();
                  onSelectIndex(index);
                }}
              >
                {index === selectedIndex ? `✓ ${label}` : label}
              </Button>
            ))}
          </ContextMenu.Items>
          <ContextMenu.Trigger>
            <Button variant="bordered">{selectedLabel}</Button>
          </ContextMenu.Trigger>
        </ContextMenu>
      </Host>
    );
  }

  return (
    <>
      <Pressable
        onPress={() => {
          void lightHaptic();
          setOpen(true);
        }}
        style={({ pressed }) => [
          styles.androidTrigger,
          { borderColor: isDark ? "rgba(255,255,255,0.28)" : "rgba(17,24,28,0.28)", opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={[styles.androidTriggerText, { color: theme.text }]} numberOfLines={1}>
          {selectedLabel}
        </Text>
      </Pressable>

      <AndroidOptionSheetModal
        visible={open}
        title={title}
        options={options}
        selectedIndex={selectedIndex}
        isDark={isDark}
        onSelect={(index) => {
          void lightHaptic();
          setOpen(false);
          onSelectIndex(index);
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  androidTrigger: {
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  androidTriggerText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
