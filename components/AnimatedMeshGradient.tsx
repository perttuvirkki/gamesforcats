import { AnimatedMeshGradient as NativeMeshGradient } from "expo-ios-mesh-gradient";
import React from "react";
import { NativeEventEmitter, NativeModules, StyleSheet } from "react-native";

const PALETTE = [
  "rgba(255, 255, 255, 0.26)",
  "rgba(255, 255, 255, 0.10)",
  "rgba(255, 255, 255, 0.38)",
  "rgba(255, 255, 255, 0.05)",
  "rgba(255, 255, 255, 0.12)",
  "rgba(255, 255, 255, 0.07)",
  "rgba(255, 255, 255, 0.29)",
  "rgba(255, 255, 255, 0.26)",
  "rgba(255, 255, 255, 0.21)",
] as const;

export function AnimatedMeshGradient() {
  React.useEffect(() => {
    if (!__DEV__) return;
    const nativeAnimatedModule = NativeModules.NativeAnimatedModule ?? NativeModules.NativeAnimatedTurboModule;
    if (!nativeAnimatedModule) return;

    const emitter = new NativeEventEmitter(nativeAnimatedModule);
    const sub = emitter.addListener("onAnimatedValueUpdate", () => {});
    return () => sub.remove();
  }, []);

  return (
    <NativeMeshGradient
      colors={[...PALETTE]}
      columns={3}
      rows={3}
      animated={true}
      animationSpeed={0.005}
      smoothsColors={true}
      style={StyleSheet.absoluteFill}
    />
  );
}
