import { Stack } from "expo-router";
import { formSheetFitToContentsOptions, formSheetOptions } from "@/lib/formSheetOptions";

export default function GameLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" options={{ gestureEnabled: false }} />
      <Stack.Screen name="settings" options={formSheetFitToContentsOptions()} />
      <Stack.Screen name="emoji-picker" options={formSheetOptions()} />
      <Stack.Screen name="pattern-picker" options={formSheetOptions()} />
      <Stack.Screen name="background-picker" options={formSheetOptions()} />
      <Stack.Screen name="movement-picker" options={formSheetOptions()} />
    </Stack>
  );
}
