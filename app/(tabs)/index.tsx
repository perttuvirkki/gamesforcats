import { useAppSettings } from "@/components/AppSettingsContext";
import { useI18n } from "@/components/I18nContext";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getPatternById } from "@/constants/background-patterns";
import { GameDefinition, getBackgroundColor, getGameById, getGamesByCategory } from "@/constants/games";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { lightHaptic } from "@/lib/haptics";
import { configureRevenueCat, hasProAccess } from "@/lib/revenuecat";
import { requestReviewIfEligibleFromHome } from "@/lib/reviewPrompt";
import { getWeeklyFreeGames } from "@/lib/weeklyFreeGames";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Image, Platform, Pressable, SectionList, StyleSheet, Text, useWindowDimensions, View } from "react-native";

const MenuBackgroundBox = require("@/assets/backgrounds/background_box.jpg");
const BigTape = require("@/assets/bigtape.png");
const FreeThisWeekSticker = require("@/assets/freethisweek.png");
const WelcomeImage = require("@/assets/welcome.png");
const SmallTapes = [require("@/assets/smalltape1.png"), require("@/assets/smalltape2.png"), require("@/assets/smalltape3.png")] as const;
const LIFETIME_PRODUCT_IDS = ["lifetime_pro", "lifetime-pro"] as const;
const LIFETIME_PACKAGE_IDS = ["lifetime_pro", "$rc_lifetime"] as const;

const MENU_BG_ASPECT_RATIO = (() => {
  const resolved = Image.resolveAssetSource(MenuBackgroundBox as number);
  const width = resolved?.width ?? 0;
  const height = resolved?.height ?? 0;
  return width > 0 && height > 0 ? width / height : 0.75;
})();

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function hashString(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const FEATURED_IDS = new Set(["box-escape", "box-dash", "inverted-box-dash", "top-jump", "piano"]);

function isLightTextColor(color: string) {
  const c = color.trim().toLowerCase();
  if (c === "white" || c === "#fff" || c === "#ffffff") return true;
  if (c === "black" || c === "#000" || c === "#000000") return false;
  if (c.startsWith("#") && (c.length === 4 || c.length === 7)) {
    const hex = c.length === 4 ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}` : c;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance > 0.6;
  }
  return true;
}

function pickSmallTape(id: string) {
  return SmallTapes[hashString(id) % SmallTapes.length];
}

function findLifetimePackage(packages: any[]): any | null {
  return (
    packages.find((p) => LIFETIME_PRODUCT_IDS.includes(p?.product?.identifier)) ??
    packages.find((p) => LIFETIME_PACKAGE_IDS.includes(p?.identifier)) ??
    null
  );
}

function formatDoublePrice(price: number, currencyCode?: string): string | null {
  if (!Number.isFinite(price) || price <= 0) return null;
  const doubled = price * 2;
  if (currencyCode) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currencyCode,
        currencyDisplay: "narrowSymbol",
      }).format(doubled);
    } catch {
      // fallback below
    }
  }
  return doubled.toFixed(2);
}

function doublePriceStringLike(priceString?: string | null): string | null {
  if (!priceString) return null;
  const firstDigit = priceString.search(/\d/);
  if (firstDigit < 0) return null;

  let lastDigit = -1;
  for (let i = priceString.length - 1; i >= 0; i -= 1) {
    if (/\d/.test(priceString[i] ?? "")) {
      lastDigit = i;
      break;
    }
  }
  if (lastDigit < firstDigit) return null;

  const prefix = priceString.slice(0, firstDigit);
  const suffix = priceString.slice(lastDigit + 1);
  const numericRaw = priceString.slice(firstDigit, lastDigit + 1);

  const dotIdx = numericRaw.lastIndexOf(".");
  const commaIdx = numericRaw.lastIndexOf(",");
  const decSep = dotIdx > commaIdx ? "." : commaIdx > -1 ? "," : "";
  const decIdx = decSep ? numericRaw.lastIndexOf(decSep) : -1;

  const intRawPart = decIdx >= 0 ? numericRaw.slice(0, decIdx) : numericRaw;
  const fracRawPart = decIdx >= 0 ? numericRaw.slice(decIdx + 1) : "";
  const intDigits = intRawPart.replace(/[^\d]/g, "");
  const fracDigits = fracRawPart.replace(/[^\d]/g, "");
  if (!intDigits) return null;

  const groupSep = (intRawPart.match(/[^\d]/g) ?? []).slice(-1)[0] ?? "";
  const parsed = Number(`${intDigits}${fracDigits ? `.${fracDigits}` : ""}`);
  if (!Number.isFinite(parsed)) return null;

  const doubled = parsed * 2;
  const fractionCount = fracDigits.length;
  const fixed = fractionCount > 0 ? doubled.toFixed(fractionCount) : Math.round(doubled).toString();
  const [fixedInt, fixedFrac = ""] = fixed.split(".");

  const groupedInt =
    groupSep && fixedInt.length > 3 ? fixedInt.replace(/\B(?=(\d{3})+(?!\d))/g, groupSep) : fixedInt;
  const formatted = fractionCount > 0 ? `${groupedInt}${decSep || "."}${fixedFrac}` : groupedInt;

  return `${prefix}${formatted}${suffix}`;
}

function CardPatternOverlay({ patternId }: { patternId: string }) {
  const pattern = getPatternById(patternId);
  const [layout, setLayout] = React.useState({ width: 0, height: 0 });

  if (!pattern || patternId === "none" || pattern.type !== "svg" || !pattern.component) return null;

  const PatternComponent = pattern.component;
  const maxSide = Math.max(1, Math.max(pattern.width, pattern.height));
  const targetSide = 54;
  const scale = Math.min(2, Math.max(0.25, targetSide / maxSide));
  const tileWidth = Math.max(10, pattern.width * scale);
  const tileHeight = Math.max(10, pattern.height * scale);
  const cols = Math.ceil((layout.width || 1) / tileWidth) + 1;
  const rows = Math.ceil((layout.height || 1) / tileHeight) + 1;

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={({ nativeEvent: { layout: next } }) => {
        if (next.width !== layout.width || next.height !== layout.height) {
          setLayout({ width: next.width, height: next.height });
        }
      }}
    >
      <View style={[StyleSheet.absoluteFill, styles.cardPatternOverlay]}>
        {Array.from({ length: rows }, (_, row) => (
          <View key={row} style={styles.cardPatternRow}>
            {Array.from({ length: cols }, (_, col) => (
              <View key={col} style={{ width: tileWidth, height: tileHeight }}>
                <PatternComponent width={tileWidth} height={tileHeight} />
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function CardTextureOverlay({ textureId }: { textureId: string }) {
  const texture = getPatternById(textureId);
  if (!texture || textureId === "none" || texture.type !== "image" || !texture.imageSource) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image source={texture.imageSource} style={[StyleSheet.absoluteFill, styles.cardTextureOverlay]} resizeMode="cover" />
    </View>
  );
}

function GameCard({
  game,
  isTablet,
  isWeeklyFree,
  isLocked,
  onPress,
}: {
  game: GameDefinition;
  isTablet: boolean;
  isWeeklyFree?: boolean;
  isLocked?: boolean;
  onPress: () => void;
}) {
  const { t } = useI18n();
  const tape = pickSmallTape(game.id);
  const tape2 = pickSmallTape(`${game.id}-free`);
  const iconSize = isTablet ? 102 : 84;
  const tiltDegRaw = ((hashString(game.id) % 7) - 3) * (isTablet ? 0.22 : 0.32);
  const tiltDeg = Math.max(-1.2, Math.min(1.2, tiltDegRaw));

  return (
    <Pressable
      key={game.id}
      style={({ pressed }) => [
        styles.cardOuter,
        {
          opacity: pressed ? 0.85 : 1,
          transform: [{ rotate: `${tiltDeg}deg` }, { scale: pressed ? 0.985 : 1 }],
        },
      ]}
      onPress={onPress}
    >
      {isWeeklyFree ? (
        <View pointerEvents="none" style={[styles.freeTapePairWrap, isTablet ? styles.freeTapePairWrapTablet : null]}>
          <View style={[styles.freeTapeItem, styles.freeTapeLeft, isTablet ? styles.freeTapeItemTablet : null]}>
            <Image source={tape} style={styles.tapeSmallImage} resizeMode="contain" />
            <View style={styles.freeTapeTextWrap}>
              <Text style={styles.freeTapeText}>{t("home.freeSticker.left")}</Text>
            </View>
          </View>
          <View
            style={[
              styles.freeTapeItem,
              styles.freeTapeRight,
              isTablet ? styles.freeTapeItemTablet : null,
              isTablet ? styles.freeTapeRightTablet : null,
            ]}
          >
            <Image source={tape2} style={styles.tapeSmallImage} resizeMode="contain" />
            <View style={styles.freeTapeTextWrap}>
              <Text style={styles.freeTapeText}>{t("home.freeSticker.right")}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View pointerEvents="none" style={[styles.tapeSmallWrap, isTablet ? styles.tapeSmallWrapTablet : null]}>
          <Image source={tape} style={styles.tapeSmallImage} resizeMode="contain" />
        </View>
      )}
      <View style={[styles.cardInner, isTablet ? styles.cardInnerTablet : null, { backgroundColor: getBackgroundColor(game.background) }]}>
        {game.defaultBackgroundPattern ? (
          <>
            <CardTextureOverlay textureId={game.defaultBackgroundPattern} />
            <CardPatternOverlay patternId={game.defaultBackgroundPattern} />
          </>
        ) : null}
        {isLocked ? (
          <View pointerEvents="none" style={[styles.lockSticker, isTablet ? styles.lockStickerTablet : null]}>
            <Text style={styles.lockStickerEmoji}>🐾</Text>
          </View>
        ) : null}
        <View style={[styles.cardIconWrap, isTablet ? styles.cardIconWrapTablet : null]} pointerEvents="none">
          <game.asset width={iconSize} height={iconSize} />
        </View>
        <View style={styles.cardBottomRow}>
          <View
            style={[
              styles.cardNamePill,
              isLightTextColor(game.textColor) ? styles.cardNamePillDark : styles.cardNamePillLight,
              isTablet ? styles.cardNamePillTablet : null,
            ]}
          >
            <Text style={[styles.featuredName, isTablet ? styles.featuredNameTablet : null, { color: game.textColor }]} numberOfLines={2}>
              {t(game.nameKey)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function MenuBackground({ width, height, variant }: { width: number; height: number; variant: "light" | "dark" }) {
  const backdropColor = variant === "dark" ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.menuBackgroundImageWrap}>
        <Image source={MenuBackgroundBox} style={[styles.menuBackgroundImage, { aspectRatio: MENU_BG_ASPECT_RATIO }]} resizeMode="cover" />
      </View>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: backdropColor }]} />
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 768;
  const theme = useColorScheme() ?? "light";
  const isDark = theme === "dark";
  const { t } = useI18n();
  const { installId, hydrated, hasSeenWelcome, hasSeenMenuIntro, setHasSeenMenuIntro } = useAppSettings();
  const [isPro, setIsPro] = React.useState<boolean>(false);
  const [proHydrated, setProHydrated] = React.useState<boolean>(false);
  const [showMenuIntro, setShowMenuIntro] = React.useState(false);
  const [welcomeOfferPrice, setWelcomeOfferPrice] = React.useState<string | null>(null);
  const [welcomeOfferOriginalPrice, setWelcomeOfferOriginalPrice] = React.useState<string | null>(null);
  const [welcomeOfferLoaded, setWelcomeOfferLoaded] = React.useState(false);
  const promoShownRef = React.useRef(false);
  const skipAutoPaywallThisSessionRef = React.useRef(false);
  const weeklyFree = React.useMemo(() => getWeeklyFreeGames(installId), [installId]);
  const freeGameIds = React.useMemo(() => {
    const ids = [weeklyFree.freeInteractiveGameId, ...weeklyFree.freeRegularGameIds].filter(Boolean) as string[];
    return new Set(ids);
  }, [weeklyFree.freeInteractiveGameId, weeklyFree.freeRegularGameIds]);

  React.useEffect(() => {
    if (!hydrated) return;
    if (!hasSeenWelcome) return;
    if (hasSeenMenuIntro) return;
    skipAutoPaywallThisSessionRef.current = true;
    setShowMenuIntro(true);
  }, [hydrated, hasSeenWelcome, hasSeenMenuIntro]);

  React.useEffect(() => {
    if (!showMenuIntro) return;
    if (Platform.OS !== "ios" && Platform.OS !== "android") {
      setWelcomeOfferLoaded(true);
      return;
    }
    let cancelled = false;
    async function loadOfferPrice() {
      try {
        configureRevenueCat();
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Purchases = require("react-native-purchases").default as typeof import("react-native-purchases").default;
        const offerings = await Purchases.getOfferings();
        const all = offerings.all ?? {};
        const current = offerings.current ?? all["default"] ?? Object.values(all)[0] ?? null;
        const pkg = findLifetimePackage(current?.availablePackages ?? []);
        const currentPrice = pkg?.product?.priceString ?? null;
        const originalPrice = doublePriceStringLike(currentPrice) ?? formatDoublePrice(pkg?.product?.price ?? NaN, pkg?.product?.currencyCode);
        if (cancelled) return;
        setWelcomeOfferPrice(currentPrice);
        setWelcomeOfferOriginalPrice(originalPrice);
      } catch {
        if (cancelled) return;
        setWelcomeOfferPrice(null);
        setWelcomeOfferOriginalPrice(null);
      } finally {
        if (!cancelled) setWelcomeOfferLoaded(true);
      }
    }
    void loadOfferPrice();
    return () => {
      cancelled = true;
    };
  }, [showMenuIntro]);

  const closeMenuIntro = React.useCallback(() => {
    setShowMenuIntro(false);
    setHasSeenMenuIntro(true);
  }, [setHasSeenMenuIntro]);

  const claimWelcomeOffer = React.useCallback(() => {
    skipAutoPaywallThisSessionRef.current = true;
    closeMenuIntro();
    router.push("/paywall");
  }, [closeMenuIntro, router]);

  const letMeTry = React.useCallback(() => {
    skipAutoPaywallThisSessionRef.current = true;
    closeMenuIntro();
  }, [closeMenuIntro]);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      let paywallHandle: ReturnType<typeof setTimeout> | null = null;
      hasProAccess()
        .then((val) => {
          if (cancelled) return;
          setIsPro(val);
          setProHydrated(true);
          if (val || promoShownRef.current || !hasSeenMenuIntro || showMenuIntro || skipAutoPaywallThisSessionRef.current) return;
          paywallHandle = setTimeout(() => {
            if (cancelled || promoShownRef.current) return;
            promoShownRef.current = true;
            router.push("/paywall");
          }, 2000);
        })
        .catch(() => {
          if (cancelled) return;
          setIsPro(false);
          setProHydrated(true);
          if (promoShownRef.current || !hasSeenMenuIntro || showMenuIntro || skipAutoPaywallThisSessionRef.current) return;
          paywallHandle = setTimeout(() => {
            if (cancelled || promoShownRef.current) return;
            promoShownRef.current = true;
            router.push("/paywall");
          }, 2000);
        });
      return () => {
        cancelled = true;
        if (paywallHandle) clearTimeout(paywallHandle);
      };
    }, [router, hasSeenMenuIntro, showMenuIntro]),
  );

  const openGame = React.useCallback(
    async (gameId: string) => {
      void lightHaptic();
      if (freeGameIds.has(gameId)) {
        router.push(`/game/${gameId}`);
        return;
      }

      const isPro = await hasProAccess().catch(() => false);
      if (isPro) {
        router.push(`/game/${gameId}`);
        return;
      }

      router.push("/paywall");
    },
    [freeGameIds, router],
  );

  useFocusEffect(
    React.useCallback(() => {
      const handle = setTimeout(() => {
        requestReviewIfEligibleFromHome().catch(() => {});
      }, 1200);
      return () => clearTimeout(handle);
    }, []),
  );

  const SECTIONS = React.useMemo(
    () => [
      {
        title: t("home.section.critters"),
        data: chunk(
          getGamesByCategory("critters").filter((g) => !FEATURED_IDS.has(g.id)),
          2,
        ),
      },
      {
        title: t("home.section.objects"),
        data: chunk(
          getGamesByCategory("objects").filter((g) => !FEATURED_IDS.has(g.id)),
          2,
        ),
      },
    ],
    [t],
  );

  const renderItem = ({ item }: { item: GameDefinition[] }) => (
    <View style={styles.gridRow}>
      {item.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          isTablet={isTablet}
          isWeeklyFree={proHydrated && !isPro && freeGameIds.has(game.id)}
          isLocked={proHydrated ? !isPro && !freeGameIds.has(game.id) : false}
          onPress={() => openGame(game.id)}
        />
      ))}
      {item.length === 1 ? <View style={styles.gridSpacer} /> : null}
    </View>
  );

  const renderSectionHeader = ({ section }: { section: any }) => (
    <View style={styles.sectionHeader}>
      <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, isTablet ? styles.sectionTitleTablet : null]}>
        {section.title}
      </ThemedText>
    </View>
  );

  const featuredGames = (["box-escape", "box-dash", "inverted-box-dash", "top-jump", "piano"] as const)
    .map((id) => getGameById(id))
    .filter(Boolean) as GameDefinition[];
  const featuredRows = chunk(featuredGames, 2);

  const ListHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleWrap}>
        <View pointerEvents="none" style={[styles.tapeBigWrap, isTablet ? styles.tapeBigWrapTablet : null]}>
          <Image source={BigTape} style={styles.tapeBigImage} resizeMode="contain" />
        </View>
        <View style={styles.titleBox}>
          <ThemedText
            type="title"
            lightColor="#1F1A12"
            darkColor="#1F1A12"
            style={[styles.titleText, isTablet ? styles.titleTablet : styles.titlePhone]}
            adjustsFontSizeToFit
          >
            {t("home.titleLine1")}
          </ThemedText>
          <ThemedText
            type="title"
            lightColor={Colors.light.tint}
            darkColor={Colors.dark.tint}
            style={[styles.titleText, styles.titleAccent, isTablet ? styles.titleTablet : styles.titlePhone]}
            adjustsFontSizeToFit
          >
            {t("home.titleLine2")}
          </ThemedText>
          <ThemedText
            lightColor="rgba(31,26,18,0.72)"
            darkColor="rgba(31,26,18,0.72)"
            style={[styles.titleSubtitle, isTablet ? styles.titleSubtitleTablet : null]}
          >
            {t("home.subtitle")}
          </ThemedText>
        </View>
      </View>

      {proHydrated && !isPro ? (
        <Pressable
          style={({ pressed }) => [styles.getAllGamesButton, isTablet ? styles.getAllGamesButtonTablet : null, { opacity: pressed ? 0.92 : 1 }]}
          onPress={() => {
            void lightHaptic();
            router.push("/paywall");
          }}
        >
          <Image source={FreeThisWeekSticker} style={styles.getAllGamesButtonImage} resizeMode="contain" />
          <View pointerEvents="none" style={styles.getAllGamesButtonTextWrap}>
            <Text style={styles.getAllGamesButtonText}>{t("settings.upgrade")}</Text>
          </View>
        </Pressable>
      ) : null}

      <View style={styles.featuredSection}>
        <ThemedText type="defaultSemiBold" style={[styles.featuredTitle, isTablet ? styles.featuredTitleTablet : null]}>
          {t("home.section.interactive")}
        </ThemedText>
        {featuredRows.map((row, idx) => (
          <View key={idx} style={styles.gridRow}>
            {row.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isTablet={isTablet}
                isWeeklyFree={proHydrated && !isPro && freeGameIds.has(game.id)}
                isLocked={proHydrated ? !isPro && !freeGameIds.has(game.id) : false}
                onPress={() => openGame(game.id)}
              />
            ))}
            {row.length === 1 ? <View style={styles.gridSpacer} /> : null}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <MenuBackground width={width} height={height} variant={theme === "dark" ? "dark" : "light"} />
      <StatusBar style="auto" />
      <SectionList
        sections={SECTIONS}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={ListHeader}
        keyExtractor={(row) => row.map((g) => g.id).join("-")}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
      />
      {showMenuIntro ? (
        <View style={styles.menuIntroOverlay}>
          <Image source={WelcomeImage} resizeMode="contain" style={[styles.menuIntroTopCat, isTablet ? styles.menuIntroTopCatTablet : null]} />
          <View style={[styles.menuIntroCard, isDark ? styles.menuIntroCardDark : null, isTablet ? styles.menuIntroCardTablet : null]}>
            <View style={[styles.menuIntroTextContent, isTablet ? styles.menuIntroTextContentTablet : null]}>
              <Text style={[styles.menuIntroTitle, isDark ? styles.menuIntroTitleDark : null]}>{t("home.welcomeOffer.title")}</Text>
              <Text style={[styles.menuIntroBody, isDark ? styles.menuIntroBodyDark : null]}>{t("home.welcomeOffer.body")}</Text>
              <Text style={[styles.menuIntroInfo, isDark ? styles.menuIntroInfoDark : null]}>{t("home.welcomeOffer.freeGamesInfo")}</Text>
              {welcomeOfferOriginalPrice || welcomeOfferPrice || !welcomeOfferLoaded ? (
                <View style={styles.menuIntroPriceWrap}>
                  {welcomeOfferOriginalPrice ? (
                    <Text style={[styles.menuIntroOldPrice, isDark ? styles.menuIntroOldPriceDark : null]}>{welcomeOfferOriginalPrice}</Text>
                  ) : null}
                  {welcomeOfferPrice ? (
                    <Text style={[styles.menuIntroNewPrice, isDark ? styles.menuIntroNewPriceDark : null]}>{welcomeOfferPrice}</Text>
                  ) : !welcomeOfferLoaded ? (
                    <Text style={[styles.menuIntroNewPrice, isDark ? styles.menuIntroNewPriceDark : null]}>{t("common.loading")}</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
            <Pressable
              onPress={() => {
                void lightHaptic();
                claimWelcomeOffer();
              }}
              style={({ pressed }) => [styles.menuIntroButton, styles.menuIntroButtonPrimary, { opacity: pressed ? 0.86 : 1 }]}
            >
              <Text style={styles.menuIntroButtonText}>{t("home.welcomeOffer.claimButton")}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                void lightHaptic();
                letMeTry();
              }}
              style={({ pressed }) => [styles.menuIntroButton, styles.menuIntroButtonGhost, isDark ? styles.menuIntroButtonGhostDark : null, { opacity: pressed ? 0.86 : 1 }]}
            >
              <Text style={[styles.menuIntroButtonText, styles.menuIntroButtonTextGhost, isDark ? styles.menuIntroButtonTextGhostDark : null]}>
                {t("home.welcomeOffer.tryButton")}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    alignItems: "center",
  },
  titleWrap: {
    position: "relative",
    alignSelf: "center",
    maxWidth: "100%",
    paddingTop: 24,
    marginBottom: 18,
    alignItems: "center",
  },
  getAllGamesButton: {
    marginTop: 10,
    width: 250,
    height: 66,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-1.2deg" }],
  },
  getAllGamesButtonTablet: {
    width: 290,
    height: 76,
  },
  getAllGamesButtonImage: {
    width: "100%",
    height: "100%",
  },
  getAllGamesButtonTextWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  getAllGamesButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  titleBox: {
    minWidth: "75%",
    borderRadius: 14,
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 10,
    backgroundColor: "#FFF8E8",
    borderWidth: 1,
    borderColor: "rgba(31,26,18,0.16)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
    alignItems: "center",
    transform: [{ rotate: "-1.2deg" }],
  },
  titleText: {
    textAlign: "center",
  },
  titleAccent: {
    fontWeight: "900",
  },
  titlePhone: {
    fontSize: 40,
    lineHeight: 40,
  },
  titleSubtitle: {
    opacity: 0.7,
    textAlign: "center",
  },
  titleTablet: {
    fontSize: 44,
    lineHeight: 44,
  },
  titleSubtitleTablet: {
    fontSize: 18,
    lineHeight: 26,
  },
  featuredSection: {
    marginTop: 18,
    marginBottom: 12,
    alignSelf: "stretch",
  },
  featuredTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.5,
    marginBottom: 26,
    textAlign: "center",
  },
  featuredTitleTablet: {
    fontSize: 14,
    letterSpacing: 1.2,
    marginBottom: 30,
  },
  featuredRow: {
    flexDirection: "row",
    gap: 18,
  },
  cardOuter: {
    position: "relative",
    flex: 1,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tapeSmallWrap: {
    position: "absolute",
    top: -18,
    alignSelf: "center",
    width: 112,
    height: 36,
    zIndex: 10,
  },
  tapeSmallWrapTablet: {
    top: -20,
    width: 130,
    height: 42,
  },
  tapeSmallImage: {
    width: "100%",
    height: "100%",
  },
  freeTapePairWrap: {
    position: "absolute",
    top: -20,
    alignSelf: "center",
    flexDirection: "row",
    gap: 0,
    zIndex: 10,
  },
  freeTapePairWrapTablet: {
    top: -24,
    gap: 0,
  },
  freeTapeItem: {
    width: 112,
    height: 36,
  },
  freeTapeItemTablet: {
    width: 130,
    height: 42,
  },
  freeTapeLeft: {
    transform: [{ rotate: "-1.8deg" }],
  },
  freeTapeRight: {
    marginLeft: -18,
    transform: [{ rotate: "1.8deg" }],
  },
  freeTapeRightTablet: {
    marginLeft: -22,
  },
  freeTapeTextWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  freeTapeText: {
    color: "rgba(31,26,18,0.92)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    textAlign: "center",
  },
  cardInner: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    padding: 12,
    justifyContent: "flex-end",
    minHeight: 120,
  },
  cardInnerTablet: {
    minHeight: 160,
    padding: 16,
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  cardIconWrap: {
    position: "absolute",
    top: 12,
    right: 10,
    width: 88,
    height: 88,
    justifyContent: "center",
    alignItems: "center",
  },
  cardIconWrapTablet: {
    top: 14,
    right: 12,
    width: 124,
    height: 124,
  },
  lockSticker: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.light.tint,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
    transform: [{ rotate: "-10deg" }],
  },
  lockStickerTablet: {
    width: 54,
    height: 54,
    borderRadius: 16,
  },
  lockStickerEmoji: {
    fontSize: 22,
  },
  featuredName: {
    fontSize: 14,
    fontWeight: "700",
  },
  featuredNameTablet: {
    fontSize: 18,
  },
  cardNamePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: "100%",
  },
  cardNamePillTablet: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cardNamePillDark: {
    backgroundColor: "rgba(0,0,0,0.28)",
    borderColor: "rgba(255,255,255,0.22)",
  },
  cardNamePillLight: {
    backgroundColor: "rgba(255,255,255,0.55)",
    borderColor: "rgba(0,0,0,0.08)",
  },
  cardPatternOverlay: {
    opacity: 0.26,
  },
  cardPatternRow: {
    flexDirection: "row",
  },
  cardTextureOverlay: {
    opacity: 0.35,
  },
  list: {
    paddingHorizontal: 32,
    paddingTop: 18,
    paddingBottom: 120,
  },
  menuBackgroundImageWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  menuBackgroundImage: {
    height: "100%",
  },
  tapeBigWrap: {
    position: "absolute",
    top: -8,
    alignSelf: "center",
    width: 210,
    height: 48,
    zIndex: 10,
    transform: [{ rotate: "0.8deg" }],
  },
  tapeBigWrapTablet: {
    top: -10,
    width: 260,
    height: 58,
    transform: [{ rotate: "0.8deg" }],
  },
  tapeBigImage: {
    width: "100%",
    height: "100%",
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.5,
    textAlign: "center",
  },
  sectionTitleTablet: {
    fontSize: 16,
    letterSpacing: 1.2,
  },
  gridRow: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 26,
  },
  gridSpacer: {
    flex: 1,
  },
  menuIntroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    zIndex: 50,
  },
  menuIntroTopCat: {
    position: "absolute",
    top: 22,
    width: 210,
    height: 110,
    transform: [{ rotate: "180deg" }],
    opacity: 0.98,
  },
  menuIntroTopCatTablet: {
    top: 28,
    width: 290,
    height: 150,
  },
  menuIntroCard: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 20,
    backgroundColor: "#FFF8E8",
    borderWidth: 1,
    borderColor: "rgba(31,26,18,0.15)",
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  menuIntroCardTablet: {
    maxWidth: 560,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  menuIntroCardDark: {
    backgroundColor: "rgba(16,22,34,0.96)",
    borderColor: "rgba(255,255,255,0.14)",
  },
  menuIntroTextContent: {
    width: "100%",
    minHeight: 170,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIntroTextContentTablet: {
    minHeight: 0,
  },
  menuIntroTitle: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "900",
    textAlign: "center",
    color: "#1F1A12",
  },
  menuIntroTitleDark: {
    color: "#fff",
  },
  menuIntroBody: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
    textAlign: "center",
    color: "rgba(31,26,18,0.8)",
  },
  menuIntroBodyDark: {
    color: "rgba(255,255,255,0.84)",
  },
  menuIntroInfo: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    textAlign: "center",
    color: "rgba(31,26,18,0.78)",
  },
  menuIntroInfoDark: {
    color: "rgba(255,255,255,0.75)",
  },
  menuIntroPriceWrap: {
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  menuIntroOldPrice: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    color: "rgba(31,26,18,0.46)",
    textDecorationLine: "line-through",
  },
  menuIntroOldPriceDark: {
    color: "rgba(255,255,255,0.46)",
  },
  menuIntroNewPrice: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "900",
    color: "#1F1A12",
  },
  menuIntroNewPriceDark: {
    color: "#fff",
  },
  menuIntroButton: {
    marginTop: 10,
    width: "100%",
    minWidth: 180,
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  menuIntroButtonPrimary: {
    marginTop: 18,
    backgroundColor: Colors.light.tint,
  },
  menuIntroButtonGhost: {
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor: "rgba(31,26,18,0.15)",
  },
  menuIntroButtonGhostDark: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderColor: "rgba(255,255,255,0.24)",
  },
  menuIntroButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  menuIntroButtonTextGhost: {
    color: "rgba(31,26,18,0.88)",
  },
  menuIntroButtonTextGhostDark: {
    color: "rgba(255,255,255,0.9)",
  },
});
