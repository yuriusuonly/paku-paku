import nativewindPreset from "nativewind/preset";

/**
 * Tailwind CSS configuration with NativeWind preset support.
 * @module tailwind.config
 */

/**
 * Default Tailwind config: scans app sources, uses class-based dark mode,
 * and exposes the Outfit font family via the `font-outfit` utility.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  darkMode: "class",
  content: [
    "{app,cipher,components,constants,database,domain,endpoints,errors,format,helpers,interceptors,network,repositories,screens,services,stores,validation}/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [
    nativewindPreset
  ],
  plugins: [],
  theme: {
    extend: {
      fontFamily: {
        outfit: [
          "Outfit",
          "sans-serif"
        ],
      },
    },
  }
};
