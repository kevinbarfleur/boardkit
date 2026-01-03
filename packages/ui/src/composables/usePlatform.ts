/**
 * usePlatform
 *
 * Platform detection composable for multi-platform support.
 * Provides reactive information about the user's operating system.
 *
 * Uses navigator.userAgentData.platform (modern) with fallback to
 * navigator.platform (deprecated but widely supported).
 */
import { ref, computed, readonly } from "vue";

export type Platform = "mac" | "windows" | "linux" | "ios" | "android" | "unknown";

// Singleton state - detected once on module load
const platform = ref<Platform>("unknown");
const isInitialized = ref(false);

/**
 * Detect platform using modern APIs with legacy fallback
 */
function detectPlatform(): Platform {
  // SSR guard
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "unknown";
  }

  // Modern API: navigator.userAgentData (Chrome 90+, Edge 90+, Opera 76+)
  // Not deprecated and provides cleaner data
  const userAgentData = (navigator as NavigatorWithUserAgentData).userAgentData;
  if (userAgentData?.platform) {
    const p = userAgentData.platform.toLowerCase();
    if (p.includes("mac") || p === "macos") return "mac";
    if (p.includes("win")) return "windows";
    if (p.includes("linux")) return "linux";
    if (p.includes("android")) return "android";
    if (p === "ios" || p === "iphone" || p === "ipad") return "ios";
  }

  // Fallback: navigator.platform (deprecated but universal)
  // Using it inside a function to suppress the deprecation warning at call site
  const legacyPlatform = getLegacyPlatform();
  if (legacyPlatform) {
    const p = legacyPlatform.toLowerCase();
    if (p.includes("mac") || p === "iphone" || p === "ipad" || p === "ipod") {
      return p.includes("mac") ? "mac" : "ios";
    }
    if (p.includes("win")) return "windows";
    if (p.includes("linux")) return "linux";
    if (p.includes("android")) return "android";
  }

  // Last resort: userAgent string
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac os") || ua.includes("macintosh")) return "mac";
  if (ua.includes("iphone") || ua.includes("ipad")) return "ios";
  if (ua.includes("windows")) return "windows";
  if (ua.includes("android")) return "android";
  if (ua.includes("linux")) return "linux";

  return "unknown";
}

/**
 * Get legacy platform value (isolated to suppress deprecation warning)
 */
function getLegacyPlatform(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    return navigator.platform || "";
  } catch {
    return "";
  }
}

// Type for modern userAgentData API
interface NavigatorWithUserAgentData extends Navigator {
  userAgentData?: {
    platform?: string;
    mobile?: boolean;
    brands?: Array<{ brand: string; version: string }>;
  };
}

/**
 * Initialize platform detection (call once at app startup or lazily)
 */
export function initPlatform(): void {
  if (isInitialized.value) return;
  platform.value = detectPlatform();
  isInitialized.value = true;
}

/**
 * Platform detection composable
 *
 * @example
 * ```ts
 * const { isMac, modifierKey, modifierSymbol } = usePlatform()
 *
 * // In template
 * <kbd>{{ modifierSymbol }}</kbd> + <kbd>↵</kbd> to submit
 * ```
 */
export function usePlatform() {
  // Lazy initialization on first use
  if (!isInitialized.value) {
    initPlatform();
  }

  // Platform checks
  const isMac = computed(() => platform.value === "mac");
  const isWindows = computed(() => platform.value === "windows");
  const isLinux = computed(() => platform.value === "linux");
  const isIOS = computed(() => platform.value === "ios");
  const isAndroid = computed(() => platform.value === "android");
  const isMobile = computed(() => platform.value === "ios" || platform.value === "android");
  const isDesktop = computed(() => !isMobile.value && platform.value !== "unknown");
  const isApple = computed(() => platform.value === "mac" || platform.value === "ios");

  // Modifier key for keyboard shortcuts
  // Mac/iOS uses Command (⌘), others use Ctrl
  const modifierKey = computed(() => (isApple.value ? "meta" : "ctrl"));
  const modifierSymbol = computed(() => (isApple.value ? "⌘" : "Ctrl"));

  return {
    platform: readonly(platform),
    isMac,
    isWindows,
    isLinux,
    isIOS,
    isAndroid,
    isMobile,
    isDesktop,
    isApple,
    modifierKey,
    modifierSymbol,
  };
}
