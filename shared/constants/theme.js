/**
 * Global application theme constants (single source of truth).
 * @module shared/constants/theme
 */

/**
 * Base color values. Use `cx`/token class maps in UI instead of raw values.
 * @type {Record<string, string>}
 */
export const colors = {
  primary: "#FE2C55",
  accent: "#25F4EE",
  ink: "#161823",
  white: "#FFFFFF",
  black: "#000000",
  success: "#34D399",
  errorText: "#FE2C55",
  transparent: "transparent"
};

/**
 * Alpha values used to build surfaces, borders, and muted text.
 * @type {Record<string, string>}
 */
export const alpha = {
  ink02: "rgba(22,24,35,0.02)",
  ink03: "rgba(22,24,35,0.03)",
  ink05: "rgba(22,24,35,0.05)",
  ink10: "rgba(22,24,35,0.10)",
  ink20: "rgba(22,24,35,0.20)",
  ink35: "rgba(22,24,35,0.35)",
  ink50: "rgba(22,24,35,0.50)",
  ink60: "rgba(22,24,35,0.60)",
  ink70: "rgba(22,24,35,0.70)",
  ink80: "rgba(22,24,35,0.80)",
  white60: "rgba(255,255,255,0.60)",
  primary10: "rgba(254,44,85,0.10)",
  primary20: "rgba(254,44,85,0.20)",
  primary30: "rgba(254,44,85,0.30)",
  success30: "rgba(52,211,153,0.30)"
};

/**
 * Border radius tokens.
 * @type {Record<string, string>}
 */
export const radius = Object.freeze({
  sm: "rounded-lg",
  md: "rounded-2xl",
  lg: "rounded-3xl",
  pill: "rounded-full"
});

/**
 * Typography tokens. Base styles target wearable/small screens.
 * @type {Record<string, string>}
 */
export const typography = Object.freeze({
  display: "font-outfit text-3xl sm:text-4xl md:text-5xl font-black tracking-tight",
  heading: "font-outfit text-2xl sm:text-3xl md:text-4xl font-black tracking-tight",
  title: "font-outfit text-xl sm:text-2xl md:text-3xl font-bold tracking-tight",
  sectionTitle: "font-outfit text-lg sm:text-xl font-bold",
  body: "font-outfit text-sm sm:text-base leading-relaxed",
  label: "font-outfit text-xs font-semibold uppercase tracking-wide",
  caption: "font-outfit text-xs"
});

/**
 * Spacing and gap tokens. Base styles target wearable/small screens.
 * @type {Record<string, string>}
 */
export const spacing = Object.freeze({
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
  xl: "gap-6",
  xxl: "gap-8",
  padX: "px-4 sm:px-5 md:px-8",
  padY: "py-6 sm:py-8 md:py-12",
  cardPad: "p-4 sm:p-5 md:p-6"
});

/**
 * Layout tokens for content width and common composition.
 * @type {Record<string, string>}
 */
export const layout = Object.freeze({
  content: "mx-auto w-full max-w-5xl flex-1",
  form: "mx-auto w-full max-w-md",
  card: "border border-[#161823]/10 bg-[#161823]/[0.02] rounded-2xl"
});

/**
 * NativeWind/Tailwind class tokens derived from theme colors.
 * Prefer these over raw hex or alpha values in components.
 * @type {Record<string, any>}
 */
export const cx = {
  bgApp: "bg-white",
  bgSurface: "bg-[#161823]/[0.02]",
  bgSurfaceSoft: "bg-[#161823]/[0.03]",
  bgSurfaceMuted: "bg-[#161823]/5",
  borderSubtle: "border-[#161823]/10",
  borderSoft: "border-[#161823]/20",
  textInk: "text-[#161823]",
  textInk80: "text-[#161823]/80",
  textInk70: "text-[#161823]/70",
  textInk60: "text-[#161823]/60",
  textInk50: "text-[#161823]/50",
  textPrimary: "text-[#FE2C55]",
  textWhite: "text-white",
  textWhite60: "text-white/60",
  bgWhite: "bg-white",
  bgPrimary: "bg-[#FE2C55]",
  bgInk: "bg-[#161823]",
  bgPrimarySoft: "bg-[#FE2C55]/10",
  borderPrimary: "border-[#FE2C55]",
  borderPrimary20: "border-[#FE2C55]/20",
  borderPrimary30: "border-[#FE2C55]/30",
  textError: "text-[#FE2C55]",
  bgSnackbar: "bg-[#161823]",
  borderSuccess30: "border-emerald-400/30",
  dotSuccess: "bg-emerald-400",
  dotInfo: "bg-[#25F4EE]",
  successAlert: "border-emerald-200 bg-emerald-50 text-emerald-800",
  radius,
  typography,
  spacing,
  layout
};

cx.alert = {
  error: `${cx.borderPrimary20} ${cx.bgPrimarySoft} ${cx.textError}`,
  success: cx.successAlert,
  info: `${cx.borderSubtle} ${cx.bgSurfaceSoft} ${cx.textInk80}`
};

export const theme = { colors, alpha, cx, radius, typography, spacing, layout };

export default theme;
