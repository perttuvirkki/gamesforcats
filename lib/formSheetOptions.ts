import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Platform } from "react-native";

type AnyOptions = NativeStackNavigationOptions & Record<string, unknown>;

function stripIOSOnlySheetOptions(options: AnyOptions): AnyOptions {
  const {
    sheetAllowedDetents: _sheetAllowedDetents,
    sheetCornerRadius: _sheetCornerRadius,
    sheetGrabberVisible: _sheetGrabberVisible,
    onSheetDetentChanged: _onSheetDetentChanged,
    ...rest
  } = options as AnyOptions & Record<string, unknown>;

  return rest;
}

export function formSheetOptions(overrides: AnyOptions = {}): AnyOptions {
  if (Platform.OS === "ios") {
    return {
      ...overrides,
      presentation: "formSheet",
      sheetGrabberVisible: false,
    };
  }

  const safeOverrides = stripIOSOnlySheetOptions(overrides);
  return {
    ...safeOverrides,
    presentation: "modal",
  };
}

export function formSheetFitToContentsOptions(overrides: AnyOptions = {}): AnyOptions {
  if (Platform.OS === "ios") {
    return formSheetOptions({
      ...overrides,
      sheetAllowedDetents: "fitToContents",
    });
  }

  return formSheetOptions(overrides);
}

