/**
 * Responsive layout breakpoints (CSS pixels).
 * @module constants/layout
 */

/**
 * Breakpoint aliases used by DESIGN.md and Tailwind's default screen prefixes.
 *
 * - wearable: base styles, no prefix (up to 639px)
 * - phone: `sm:` prefix (640px+)
 * - tablet: `md:` prefix (768px+)
 * - desktop: `lg:` prefix (1024px+)
 *
 * @type {Readonly<{wearable: number, phone: number, tablet: number, desktop: number, sm: number, md: number, lg: number, xl: number, xxl: number}>}
 */
export const breakpoints = Object.freeze({
  wearable: 0,
  phone: 640,
  tablet: 768,
  desktop: 1024,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536
});

export default breakpoints;
