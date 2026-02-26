import emojiSvgs from "@/assets/emojiSvgs";
import { useI18n } from "@/components/I18nContext";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { env } from "@/lib/env";
import { lightHaptic } from "@/lib/haptics";
import { configureRevenueCat } from "@/lib/revenuecat";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Alert, Image, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import type { PurchasesOffering, PurchasesOfferings, PurchasesPackage } from "react-native-purchases";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CatPlayingImage = require("@/assets/catplaying.jpg");
const ACCENT = Colors.light.tint;
const ACCENT_UNDERLINE = "rgba(255,138,0,0.55)";
const TwemojiAllGames = emojiSvgs["1f3ae.svg"];
const TwemojiCustomize = emojiSvgs["1f3a8.svg"];
const TwemojiFamilySharing = emojiSvgs["1f46a.svg"];
const TwemojiFutureProof = emojiSvgs["1f6e1.svg"];

const PLANS = {
  // Play Console does not allow underscores in product IDs, so Android may use `lifetime-pro` while iOS uses `lifetime_pro`.
  lifetime: { productIds: ["lifetime_pro", "lifetime-pro"] as const, packageIds: ["lifetime_pro", "$rc_lifetime"] as const },
} as const;

const PRIVACY_URL = "https://www.supersmart.fi/privacy";
const TERMS_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

function findPackage(packages: PurchasesPackage[], productIds: readonly string[], packageIds: readonly string[]): PurchasesPackage | null {
  return packages.find((p) => productIds.includes(p.product.identifier)) ?? packages.find((p) => packageIds.includes(p.identifier)) ?? null;
}

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { width, height } = useWindowDimensions();
  const topImageMaxHeight = height * 0.4;
  const isTablet = Math.min(width, height) >= 768;

  const [loading, setLoading] = React.useState(true);
  const [purchasing, setPurchasing] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);
  const [lifetimePackage, setLifetimePackage] = React.useState<PurchasesPackage | null>(null);
  const [debugInfo, setDebugInfo] = React.useState<{
    offeringId: string | null;
    availablePackageIds: string[];
    availableProductIds: string[];
    error: string | null;
  }>({ offeringId: null, availablePackageIds: [], availableProductIds: [], error: null });

  const isSupportedPlatform = Platform.OS === "ios" || Platform.OS === "android";

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!isSupportedPlatform) return;
        configureRevenueCat();

        const apiKey = Platform.OS === "ios" ? env.revenueCat.iosApiKey : env.revenueCat.androidApiKey;
        if (!apiKey) {
          if (cancelled) return;
          setLifetimePackage(null);
          setDebugInfo({
            offeringId: null,
            availablePackageIds: [],
            availableProductIds: [],
            error: "RevenueCat API key is missing (check your EXPO_PUBLIC_REVENUECAT_* env vars and restart Expo).",
          });
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Purchases = require("react-native-purchases").default as typeof import("react-native-purchases").default;
        const offerings = (await Purchases.getOfferings()) as PurchasesOfferings;
        const all = offerings.all ?? {};
        const current: PurchasesOffering | null = offerings.current ?? all["default"] ?? Object.values(all)[0] ?? null;
        const packages = current?.availablePackages ?? [];
        const lifetime = findPackage(packages, PLANS.lifetime.productIds, PLANS.lifetime.packageIds) ?? null;
        const availablePackageIds = packages.map((p) => p.identifier);
        const availableProductIds = packages.map((p) => p.product.identifier);

        if (cancelled) return;
        setLifetimePackage(lifetime);
        setDebugInfo({
          offeringId: current?.identifier ?? null,
          availablePackageIds,
          availableProductIds,
          error: null,
        });
      } catch (e: any) {
        if (cancelled) return;
        setLifetimePackage(null);
        setDebugInfo({
          offeringId: null,
          availablePackageIds: [],
          availableProductIds: [],
          error: e?.message ? String(e.message) : "Failed to load RevenueCat offerings.",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isSupportedPlatform]);

  const selectedPackage = lifetimePackage;
  const canPurchase = isSupportedPlatform && !loading && !purchasing && !restoring && Boolean(selectedPackage);

  const closePaywall = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }, [router]);

  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      // ignore
    }
  };

  const purchase = async () => {
    if (!isSupportedPlatform) return;
    if (!selectedPackage) {
      Alert.alert(t("paywall.offerNotAvailable.title"), t("paywall.offerNotAvailable.body"));
      return;
    }
    if (!env.revenueCat.iosApiKey && !env.revenueCat.androidApiKey) {
      Alert.alert(t("paywall.notConfigured.title"), t("paywall.notConfigured.body"));
      return;
    }

    setPurchasing(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Purchases = require("react-native-purchases").default as typeof import("react-native-purchases").default;
      await Purchases.purchasePackage(selectedPackage);
      Alert.alert(t("paywall.purchaseSuccess.title"), t("paywall.purchaseSuccess.body"));
      closePaywall();
    } catch (e: any) {
      const userCancelled =
        typeof e?.userCancelled === "boolean" ? e.userCancelled : typeof e?.code === "string" ? e.code.toLowerCase().includes("cancel") : false;
      if (!userCancelled) {
        Alert.alert(t("paywall.purchaseFailed.title"), t("paywall.purchaseFailed.body"));
      }
    } finally {
      setPurchasing(false);
    }
  };

  const restore = async () => {
    if (!isSupportedPlatform) return;
    setRestoring(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Purchases = require("react-native-purchases").default as typeof import("react-native-purchases").default;
      await Purchases.restorePurchases();
      Alert.alert(t("paywall.restoreSuccess.title"), t("paywall.restoreSuccess.body"));
    } catch {
      Alert.alert(t("paywall.restoreFailed.title"), t("paywall.restoreFailed.body"));
    } finally {
      setRestoring(false);
    }
  };

  if (!isSupportedPlatform) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View pointerEvents="box-none" style={styles.topBar}>
          <Pressable
            hitSlop={12}
            onPress={() => {
              void lightHaptic();
              closePaywall();
            }}
            style={styles.closeBtn}
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>
        <View style={styles.center}>
          <ThemedText type="title" style={styles.title}>
            {t("common.notAvailable")}
          </ThemedText>
          <ThemedText style={styles.subtitle}>{t("paywall.platformOnly")}</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, isDark ? styles.screenDark : null]}>
      <View style={[styles.topRegion, isTablet ? styles.topRegionTablet : { maxHeight: topImageMaxHeight }]}>
        <Image source={CatPlayingImage} style={[styles.panoramaImage, isDark ? styles.panoramaImageDark : null]} resizeMode="cover" />
        {isTablet ? <View pointerEvents="none" style={styles.tabletMediaOverlay} /> : null}
      </View>

      <View pointerEvents="box-none" style={styles.topBarOverlay}>
        <Pressable
          hitSlop={12}
          onPress={() => {
            void lightHaptic();
            closePaywall();
          }}
          style={[styles.closeBtn, isDark ? styles.closeBtnDark : null, { top: insets.top + 8 }]}
        >
          <Text style={[styles.closeText, isDark ? styles.closeTextDark : null]}>✕</Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.content,
          isTablet ? styles.contentTablet : null,
          isTablet && isDark ? styles.contentTabletDark : null,
          {
            paddingTop: isTablet ? Math.max(16, insets.top + 8) : 10,
            paddingBottom: isTablet ? Math.max(28, insets.bottom + 18) : Math.max(18, insets.bottom + 10),
            justifyContent: isTablet ? "flex-end" : "flex-start",
          },
        ]}
      >
        <View
          style={[
            styles.paywallCard,
            isTablet ? styles.paywallCardTablet : null,
            isDark ? styles.paywallCardDark : null,
            isTablet && isDark ? styles.paywallCardTabletDark : null,
          ]}
        >
          <View style={[styles.hero, isTablet ? styles.heroTablet : null]}>
            <Text style={[styles.heroTitle, isDark ? styles.heroTitleDark : null, isTablet ? styles.heroTitleTablet : null]}>
              {t("paywall.heroTitle")}
            </Text>
            <Text style={[styles.heroSubtitle, isDark ? styles.heroSubtitleDark : null, isTablet ? styles.heroSubtitleTablet : null]}>
              {t("paywall.heroSubtitle")}
            </Text>
            <View style={[styles.valueList, isTablet ? styles.valueListTablet : null]}>
              <View style={[styles.valueRow, isTablet ? styles.valueRowTablet : null]}>
                <View style={[styles.valueEmojiWrap, isTablet ? styles.valueEmojiWrapTablet : null]}>
                  {TwemojiAllGames ? <TwemojiAllGames width={18} height={18} /> : <Text style={styles.valueBulletFallback}>•</Text>}
                </View>
                <Text style={[styles.valueItem, isDark ? styles.valueItemDark : null, isTablet ? styles.valueItemTablet : null]}>
                  {t("paywall.value.allGames")}
                </Text>
              </View>
              <View style={[styles.valueRow, isTablet ? styles.valueRowTablet : null]}>
                <View style={[styles.valueEmojiWrap, isTablet ? styles.valueEmojiWrapTablet : null]}>
                  {TwemojiCustomize ? <TwemojiCustomize width={18} height={18} /> : <Text style={styles.valueBulletFallback}>•</Text>}
                </View>
                <Text style={[styles.valueItem, isDark ? styles.valueItemDark : null, isTablet ? styles.valueItemTablet : null]}>
                  {t("paywall.value.customizeEverything")}
                </Text>
              </View>
              {Platform.OS === "ios" ? (
                <View style={[styles.valueRow, isTablet ? styles.valueRowTablet : null]}>
                  <View style={[styles.valueEmojiWrap, isTablet ? styles.valueEmojiWrapTablet : null]}>
                    {TwemojiFamilySharing ? <TwemojiFamilySharing width={18} height={18} /> : <Text style={styles.valueBulletFallback}>•</Text>}
                  </View>
                  <Text style={[styles.valueItem, isDark ? styles.valueItemDark : null, isTablet ? styles.valueItemTablet : null]}>
                    {t("paywall.value.familySharing")}
                  </Text>
                </View>
              ) : null}
              <View style={[styles.valueRow, isTablet ? styles.valueRowTablet : null]}>
                <View style={[styles.valueEmojiWrap, isTablet ? styles.valueEmojiWrapTablet : null]}>
                  {TwemojiFutureProof ? <TwemojiFutureProof width={18} height={18} /> : <Text style={styles.valueBulletFallback}>•</Text>}
                </View>
                <Text style={[styles.valueItem, isDark ? styles.valueItemDark : null, isTablet ? styles.valueItemTablet : null]}>
                  {t("paywall.value.futureProof")}
                </Text>
              </View>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator />
              <Text style={[styles.loadingText, isDark ? styles.loadingTextDark : null]}>{t("paywall.loadingOffers")}</Text>
            </View>
          ) : (
            <>
              <View style={[styles.priceBlock, isTablet ? styles.priceBlockTablet : null]}>
                <Text style={[styles.pricePlanLabel, isDark ? styles.optionTitleDark : null, isTablet ? styles.pricePlanLabelTablet : null]}>
                  {t("paywall.plan.lifetime")}
                </Text>
                {lifetimePackage?.product.priceString ? (
                  <Text style={[styles.priceOnly, isDark ? styles.priceOnlyDark : null, isTablet ? styles.priceOnlyTablet : null]}>
                    {lifetimePackage.product.priceString}
                  </Text>
                ) : null}
              </View>

              <Pressable
                onPress={() => {
                  void lightHaptic();
                  void purchase();
                }}
                disabled={!canPurchase}
                style={[styles.cta, isTablet ? styles.ctaTablet : null, !canPurchase ? styles.ctaDisabled : null]}
              >
                <Text style={[styles.ctaText, isTablet ? styles.ctaTextTablet : null]}>{purchasing ? t("common.processing") : t("common.continue")}</Text>
              </Pressable>

              <Text style={[styles.note, isDark ? styles.noteDark : null, isTablet ? styles.noteTablet : null]}>
                {t("paywall.lifetimeDisclaimer")}
              </Text>

              <View style={[styles.footerLinks, isTablet ? styles.footerLinksTablet : null]}>
                <Pressable
                  onPress={() => {
                    void lightHaptic();
                    void openUrl(TERMS_URL);
                  }}
                  style={styles.footerLink}
                >
                  <Text style={[styles.footerLinkText, isDark ? styles.footerLinkTextDark : null, isTablet ? styles.footerLinkTextTablet : null]}>
                    {t("paywall.terms")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    void lightHaptic();
                    void openUrl(PRIVACY_URL);
                  }}
                  style={styles.footerLink}
                >
                  <Text style={[styles.footerLinkText, isDark ? styles.footerLinkTextDark : null, isTablet ? styles.footerLinkTextTablet : null]}>
                    {t("paywall.privacy")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    void lightHaptic();
                    void restore();
                  }}
                  disabled={loading || purchasing || restoring}
                  style={styles.footerLink}
                >
                  <Text style={[styles.footerLinkText, isDark ? styles.footerLinkTextDark : null, isTablet ? styles.footerLinkTextTablet : null]}>
                    {restoring ? t("common.processing") : t("common.restorePurchases")}
                  </Text>
                </Pressable>
              </View>

              {!lifetimePackage ? (
                <Text style={[styles.note, isDark ? styles.noteDark : null]}>
                  {debugInfo.error
                    ? debugInfo.error
                    : `${t("paywall.offersNotFound")} ${debugInfo.offeringId ?? "none"} • ${
                        debugInfo.availableProductIds.length ? debugInfo.availableProductIds.join(", ") : "none"
                      }`}
                </Text>
              ) : null}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  screenDark: {
    backgroundColor: "#0B0F1A",
  },
  topBar: {
    paddingHorizontal: 16,
    justifyContent: "center",
    height: 44,
    zIndex: 10,
    elevation: 10,
  },
  topBarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 20,
    elevation: 20,
  },
  dots: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  dotActive: {
    width: 28,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  closeBtn: {
    position: "absolute",
    right: 14,
    top: 8,
    width: 42,
    height: 42,
    borderRadius: 99,
    backgroundColor: "rgba(0,0,0,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    zIndex: 20,
    elevation: 24,
  },
  closeBtnDark: {
    backgroundColor: "rgba(0,0,0,0.62)",
    borderColor: "rgba(255,255,255,0.45)",
  },
  closeText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    opacity: 1,
  },
  closeTextDark: {
    color: "#fff",
    opacity: 1,
  },
  content: {
    flexGrow: 0,
    flexShrink: 0,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  contentTablet: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "transparent",
    zIndex: 5,
  },
  contentTabletDark: {
    backgroundColor: "transparent",
  },
  topRegion: {
    width: "100%",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minHeight: 0,
    overflow: "hidden",
  },
  topRegionTablet: {
    ...StyleSheet.absoluteFillObject,
  },
  paywallCard: {
    width: "100%",
    maxWidth: 560,
    borderRadius: 26,
    paddingHorizontal: 2,
  },
  paywallCardDark: {
    backgroundColor: "rgba(10,14,24,0.82)",
    borderColor: "rgba(255,255,255,0.14)",
  },
  paywallCardTablet: {
    width: "100%",
    maxWidth: 760,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.10)",
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 16,
    shadowColor: "#111827",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 26,
  },
  paywallCardTabletDark: {
    backgroundColor: "rgba(10,14,24,0.92)",
    borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#000",
    shadowOpacity: 0.36,
  },
  panoramaImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  tabletMediaOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(12,16,28,0.26)",
  },
  panoramaImageDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  hero: {
    paddingTop: 12,
    paddingBottom: 14,
    alignItems: "center",
  },
  heroTablet: {
    paddingTop: 14,
    paddingBottom: 16,
  },
  heroTitle: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 38,
    lineHeight: 46,
    fontWeight: "900",
    textAlign: "center",
  },
  heroTitleTablet: {
    fontSize: 46,
    lineHeight: 50,
  },
  heroTitleDark: {
    color: "#fff",
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 18,
    lineHeight: 26,
    opacity: 0.54,
    textAlign: "center",
    maxWidth: 520,
  },
  heroSubtitleTablet: {
    fontSize: 22,
    lineHeight: 30,
    maxWidth: 460,
  },
  heroSubtitleDark: {
    color: "rgba(255,255,255,0.78)",
    opacity: 1,
  },
  valueList: {
    marginTop: 14,
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    columnGap: 14,
    rowGap: 8,
    alignSelf: "stretch",
  },
  valueListTablet: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    columnGap: 14,
    rowGap: 10,
    alignSelf: "stretch",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  valueRowTablet: {},
  valueEmojiWrap: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  valueEmojiWrapTablet: {
    width: 22,
    height: 22,
  },
  valueBulletFallback: {
    fontSize: 18,
    lineHeight: 18,
    color: "#111827",
  },
  valueItem: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "700",
    textAlign: "left",
    color: "#111827",
  },
  valueItemTablet: {
    fontSize: 18,
    lineHeight: 26,
  },
  valueItemDark: {
    color: "rgba(255,255,255,0.92)",
  },
  trialRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.10)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },
  trialRowDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.14)",
  },
  trialLabel: {
    fontSize: 16,
    fontWeight: "800",
  },
  trialLabelDark: {
    color: "#fff",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.65,
    fontWeight: "700",
  },
  loadingTextDark: {
    color: "rgba(255,255,255,0.75)",
    opacity: 1,
  },
  optionCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.10)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    overflow: "visible",
  },
  optionCardTablet: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 22,
    marginBottom: 14,
  },
  priceBlock: {
    marginTop: 4,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  priceBlockTablet: {
    marginTop: 8,
    marginBottom: 12,
  },
  pricePlanLabel: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
    opacity: 0.8,
    includeFontPadding: false,
  },
  pricePlanLabelTablet: {
    fontSize: 22,
    lineHeight: 26,
  },
  priceOnly: {
    fontSize: 52,
    lineHeight: 56,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
    includeFontPadding: false,
  },
  priceOnlyTablet: {
    fontSize: 74,
    lineHeight: 78,
  },
  priceOnlyDark: {
    color: "#fff",
  },
  optionCardDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  optionCardDisabled: {
    opacity: 0.55,
  },
  optionCardPromo: {
    paddingVertical: 16,
  },
  optionCardSelected: {
    borderColor: ACCENT,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 12,
    backgroundColor: ACCENT,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    transform: [{ translateY: -12 }],
    zIndex: 10,
    elevation: 10,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.2,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.18)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  radioDark: {
    borderColor: "rgba(255,255,255,0.22)",
  },
  radioSelected: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  radioCheck: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    color: "#111827",
  },
  optionTitleDark: {
    color: "#fff",
  },
  optionTitlePromo: {
    fontSize: 22,
    lineHeight: 28,
  },
  optionTitleLifetime: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
  },
  priceRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    flexWrap: "wrap",
  },
  optionPrice: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    color: "#111827",
  },
  optionPriceDark: {
    color: "#fff",
  },
  priceUnit: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
    opacity: 0.72,
  },
  priceUnitDark: {
    color: "rgba(255,255,255,0.84)",
    opacity: 1,
  },
  priceOld: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    textDecorationLine: "line-through",
    opacity: 0.48,
  },
  priceOldDark: {
    color: "rgba(255,255,255,0.68)",
    opacity: 1,
  },
  optionSubtitle: {
    marginTop: 2,
    fontSize: 16,
    lineHeight: 22,
    opacity: 0.82,
    fontWeight: "700",
    color: "#111827",
  },
  optionSubtitleDark: {
    color: "rgba(255,255,255,0.9)",
    opacity: 1,
  },
  optionSubtitlePromo: {
    marginTop: 4,
    lineHeight: 36,
  },
  subtitlePriceStrong: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    color: "#111827",
  },
  subtitlePriceStrongDark: {
    color: "#fff",
  },
  optionRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  optionRightRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
  },
  selectCircle: {
    width: 28,
    height: 28,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.20)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  selectCircleDark: {
    borderColor: "rgba(255,255,255,0.22)",
  },
  selectCircleSelected: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  selectIconWrap: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  selectFallbackCheck: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 14,
    fontWeight: "900",
    textAlign: "center",
    includeFontPadding: false,
  },
  cta: {
    marginTop: 8,
    height: 50,
    borderRadius: 50,
    backgroundColor: ACCENT,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaTablet: {
    marginTop: 12,
    height: 62,
    borderRadius: 62,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 20,
  },
  ctaTextTablet: {
    fontSize: 30,
  },
  footerLinks: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  footerLinksTablet: {
    marginTop: 16,
  },
  footerLink: {
    flex: 1,
    alignItems: "center",
  },
  footerLinkText: {
    color: ACCENT,
    fontWeight: "800",
    fontSize: 10,
    textDecorationLine: "underline",
    textDecorationColor: ACCENT_UNDERLINE,
  },
  footerLinkTextTablet: {
    fontSize: 14,
  },
  footerLinkTextDark: {
    color: "rgba(255,255,255,0.82)",
    textDecorationColor: "rgba(255,255,255,0.40)",
  },
  note: {
    marginTop: 8,
    marginHorizontal: 14,
    textAlign: "center",
    fontSize: 13,
    opacity: 0.55,
    paddingBottom: 6,
  },
  noteTablet: {
    marginTop: 12,
    fontSize: 16,
  },
  noteDark: {
    color: "rgba(255,255,255,0.65)",
    opacity: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.7,
    textAlign: "center",
  },
});
