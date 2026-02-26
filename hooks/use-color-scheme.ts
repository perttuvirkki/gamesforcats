import { useAppSettings } from "@/components/AppSettingsContext";
import { useColorScheme as useNativeColorScheme, type ColorSchemeName } from "react-native";

export function useColorScheme(): NonNullable<ColorSchemeName> {
  const system = useNativeColorScheme();
  const { themeMode } = useAppSettings();

  if (themeMode === "dark") return "dark";
  if (themeMode === "light") return "light";
  return (system ?? "light") as NonNullable<ColorSchemeName>;
}
