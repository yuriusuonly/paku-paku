# Design

This document is the source of truth for visual tokens and responsive behavior in Paku Paku. UI code must use the tokens exported from `constants/theme.js` instead of raw colors, hardcoded spacing patterns, or one-off typography.

## Principles

1. **Mobile-first:** base styles target wearable and small phone screens; `sm:` and `md:` progressively enhance the layout.
2. **Token-only:** colors, radii, typography, and common spacing come from `theme.js`.
3. **Readable before dense:** on small screens, prefer full-width cards and wrapping rows over compression.
4. **Touch-friendly:** interactive controls have at least a 44px hit area.
5. **Scroll tables, not squeeze tables:** wide data tables stay horizontally scrollable.

## Breakpoints and device tiers

| Tier | Width | Tailwind prefix | Layout expectations |
| --- | --- | --- | --- |
| Wearable / compact | `< 640px` | none (base) | Single column, full-width controls, no fixed min-widths that can overflow. |
| Phone | `>= 640px` | `sm:` | More horizontal space; cards may sit in two columns where safe. |
| Tablet | `>= 768px` | `md:` | Multi-column grids; wider content padding; larger headings. |
| Desktop | `>= 1024px` | `lg:` | Same as tablet with wider max content width. |

Breakpoint values are mirrored in `constants/layout.js`.

## Color tokens

Raw color values live only in `colors`/`alpha` in `theme.js`. Components use the `cx` class tokens below.

| Token | Class token | Usage |
| --- | --- | --- |
| Primary | `cx.bgPrimary`, `cx.textPrimary`, `cx.borderPrimary*` | Primary actions, links, active states. |
| Accent | `cx.dotInfo` | Informational indicators. |
| Ink | `cx.textInk`, `cx.bgInk`, `cx.bgSnackbar` | Headings, body text, dark surfaces. |
| Muted ink | `cx.textInk80/70/60/50` | Secondary text, labels, metadata. |
| Surface | `cx.bgSurface`, `cx.bgSurfaceSoft`, `cx.bgSurfaceMuted` | Cards, soft rows, disabled fills. |
| Border | `cx.borderSubtle`, `cx.borderSoft` | Dividers and card borders. |
| Success | `cx.dotSuccess`, `cx.borderSuccess30`, `cx.successAlert` | Success states. |
| Error | `cx.textError`, `cx.alert.error` | Validation and error states. |

Never inline hex values in screens or components. Add a token to `theme.js` if a new color is needed.

## Radius tokens

| Token | Classes | Usage |
| --- | --- | --- |
| `radius.sm` | `rounded-lg` | Inputs, inline cells, small controls. |
| `radius.md` | `rounded-2xl` | Cards, alerts, tables. |
| `radius.lg` | `rounded-3xl` | Accordion sections, large panels, modals. |
| `radius.pill` | `rounded-full` | Buttons, status pills. |

## Typography tokens

All text uses the Outfit font. Import the appropriate token instead of composing ad-hoc `text-*` classes.

| Token | Base (wearable) | Phone/tablet | Usage |
| --- | --- | --- | --- |
| `typography.display` | `text-3xl` | `sm:text-4xl md:text-5xl` | Home hero. |
| `typography.heading` | `text-2xl` | `sm:text-3xl md:text-4xl` | Page titles. |
| `typography.title` | `text-xl` | `sm:text-2xl md:text-3xl` | Section titles. |
| `typography.sectionTitle` | `text-lg` | `sm:text-xl` | Card/section headings. |
| `typography.body` | `text-sm` | `sm:text-base` | Body copy. |
| `typography.label` | `text-xs uppercase` | same | Field labels and metadata. |
| `typography.caption` | `text-xs` | same | Captions, helpers. |

## Spacing tokens

| Token | Classes | Usage |
| --- | --- | --- |
| `spacing.xs` | `gap-1` | Tight inline groups. |
| `spacing.sm` | `gap-2` | Small icon/text groups. |
| `spacing.md` | `gap-3` | Default form/action gaps. |
| `spacing.lg` | `gap-4` | Card content gaps. |
| `spacing.xl` | `gap-6` | Section gaps. |
| `spacing.xxl` | `gap-8` | Large layout gaps. |
| `spacing.padX` | `px-4 sm:px-5 md:px-8` | Screen horizontal padding. |
| `spacing.padY` | `py-6 sm:py-8 md:py-12` | Screen vertical padding. |
| `spacing.cardPad` | `p-4 sm:p-5 md:p-6` | Card padding. |

## Layout tokens

- `layout.content`: centered app content (`max-w-5xl`), used by `ScreenContainer`.
- `layout.form`: centered form column (`max-w-md`).
- `layout.card`: standard bordered surface card.

## Responsive rules

- Start with the wearable layout; add `sm:`/`md:` only when the layout benefits.
- Containers use `spacing.padX` and `spacing.padY`.
- Cards use `layout.card` plus `spacing.cardPad`.
- Forms are single column on wearable/phone; `max-w-md` keeps them readable on tablet.
- Grids use `flex-row flex-wrap` with full-width children by default (`w-full sm:w-1/2 md:w-1/3`).
- Tables use horizontal scrolling (`DataTable`) instead of shrinking columns.
- Headings use typography tokens so they scale across tiers.
- Buttons use `radius.pill`, `min-h-[44px]`, and wrap via `flex-wrap`.

## Component checklist

When adding or editing a component:

- Use `cx` color tokens, `radius`, `typography`, `spacing`, and `layout` from `theme.js`.
- Verify at 320px (wearable), 390px (phone), and 820px (tablet) widths.
- Ensure buttons/inputs are at least 44px tall and labels remain readable.
- Add `accessibilityRole`/`accessibilityLabel` to interactive elements.
- Keep tables scrollable; never hide columns on the basis of width alone.
- Update this document when adding a new token.

## Non-goals

- No dark theme tokens are defined yet; `darkMode: "class"` is configured for future use.
- No per-device native styling; the app is web-only.
- No raw hex or arbitrary color classes outside `theme.js`.
