/**
 * Global application theme constants (single source of truth).
 * @module shared/constants/theme
 */

export const colors = {
  primary: "#FE2C55",
  accent: "#25F4EE",
  ink: "#161823",
  white: "#FFFFFF",
  black: "#000000",
  success: "#34D399",
  errorText: "#9F1239",
  transparent: "transparent"
};

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

// Tailwind/NativeWind class tokens derived from theme colors.
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
  textError: "text-[#9f1239]",
  bgSnackbar: "bg-[#161823]",
  borderSuccess30: "border-emerald-400/30",
  dotSuccess: "bg-emerald-400",
  dotInfo: "bg-[#25F4EE]",
  successAlert: "border-emerald-200 bg-emerald-50 text-emerald-800"
};

// Build class maps that reference the constants above (no stray hex in consumers).
cx.alert = {
  error: `${cx.borderPrimary20} ${cx.bgPrimarySoft} ${cx.textError}`,
  success: cx.successAlert,
  info: `${cx.borderSubtle} ${cx.bgSurfaceSoft} ${cx.textInk80}`
};

export const theme = { colors, alpha, cx };

export default theme;
