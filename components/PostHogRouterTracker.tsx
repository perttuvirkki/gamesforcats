import { usePathname } from "expo-router";
import React from "react";
import { usePostHog } from "posthog-react-native";

export function PostHogRouterTracker() {
  const posthog = usePostHog();
  const pathname = usePathname();
  const lastPathRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!posthog || !pathname) return;
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    posthog.screen(pathname, { pathname });
  }, [pathname, posthog]);

  return null;
}

