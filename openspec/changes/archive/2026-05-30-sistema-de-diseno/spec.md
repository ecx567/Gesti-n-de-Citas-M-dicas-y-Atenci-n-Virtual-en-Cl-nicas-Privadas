# Design System — Specification

## Purpose

Define the contract for a centralized design token module (`src/theme/index.ts`) that eliminates hardcoded style values across the app. The module exposes flat, type-safe constants that 5 proof-of-concept screens MUST consume, replacing all inline hex colors, spacing literals, font sizes, radii, and shadow objects.

## Requirements

### R1: Token Module Contract

The system MUST provide a module at `src/theme/index.ts` exporting all design tokens as `as const` objects for type safety.

#### Scenario: R1a — All token categories exported

- GIVEN a fresh import of `@/theme`
- WHEN destructuring the exports
- THEN `colors`, `spacing`, `fontSize`, `fontWeight`, `borderRadius`, and `shadows` are all available
- AND each export is typed with `as const` (literal types, not widened)

#### Scenario: R1b — Color values match spec

- GIVEN the `colors` export
- WHEN checking each key
- THEN `primary` is `#0891B2`, `primaryLight` is `#ECFEFF`, `text` is `#0F172A`, `textSecondary` is `#64748B`, `textMuted` is `#94A3B8`, `background` is `#F8FAFC`, `surface` is `#FFFFFF`, `border` is `#E2E8F0`, `error` is `#DC2626`, `errorBg` is `#FEF2F2`, `errorBorder` is `#FECACA`, `success` is `#16A34A`, `successBg` is `#F0FDF4`, `warning` is `#D97706`, `warningBg` is `#FFFBEB`, `disabled` is `#CBD5E1`, `white` is `#FFFFFF`

#### Scenario: R1c — Spacing values match spec

- GIVEN the `spacing` export
- WHEN checking each key
- THEN `xs` is 4, `sm` is 8, `md` is 12, `lg` is 16, `xl` is 20, `xxl` is 24, `xxxl` is 32

#### Scenario: R1d — Typography values match spec

- GIVEN the `fontSize` and `fontWeight` exports
- WHEN checking each key
- THEN `fontSize` has keys `xs`(12), `sm`(13), `md`(14), `lg`(15), `xl`(16), `xxl`(18), `xxxl`(20), `title`(22), `hero`(28)
- AND `fontWeight` has keys `regular`(400), `medium`(500), `semibold`(600), `bold`(700)

#### Scenario: R1e — Border radius and shadow values match spec

- GIVEN the `borderRadius` and `shadows` exports
- WHEN checking each key
- THEN `borderRadius` has `sm`(8), `md`(10), `lg`(12), `xl`(14), `xxl`(16), `full`(9999)
- AND `shadows.card` has `shadowColor: '#000'`, `shadowOffset: {width:0, height:2}`, `shadowOpacity: 0.06`, `shadowRadius: 8`, `elevation: 3`

### R2: Screen Migration

The system MUST migrate 5 specified screens to import tokens from `@/theme` and replace all hardcoded style values.

#### Scenario: R2a — login.tsx uses theme

- GIVEN `src/app/(auth)/login.tsx`
- WHEN scanning for hardcoded hex colors (`#XXXXXX`)
- THEN zero instances remain
- AND all style values reference `colors`, `spacing`, `fontSize`, `borderRadius` from `@/theme`

#### Scenario: R2b — forgot-password.tsx uses theme

- GIVEN `src/app/(auth)/forgot-password.tsx`
- WHEN scanning for hardcoded hex colors
- THEN zero instances remain
- AND all style values reference theme tokens

#### Scenario: R2c — appointment/[id].tsx uses theme

- GIVEN `src/app/(app)/appointment/[id].tsx`
- WHEN scanning for hardcoded hex colors, shadow objects, and border radius literals
- THEN zero instances remain
- AND shadows use `shadows.card` and radii use `borderRadius.*`

#### Scenario: R2d — profile.tsx uses theme

- GIVEN `src/app/(app)/profile.tsx`
- WHEN scanning for hardcoded hex colors
- THEN zero instances remain

#### Scenario: R2e — home.tsx uses theme

- GIVEN `src/app/(app)/(patient)/home.tsx`
- WHEN scanning for hardcoded hex colors and spacing literals
- THEN zero instances remain

### R3: No Visual Regression

The system MUST preserve identical visual appearance after migration on all 5 screens.

#### Scenario: R3a — TypeScript compilation passes

- GIVEN the project with the new `src/theme/index.ts` and all 5 migrated screens
- WHEN running `tsc --noEmit`
- THEN exit code is 0
- AND no type errors are reported

#### Scenario: R3b — Visual snapshot matches

- GIVEN a rendered migrated screen
- WHEN comparing its layout, colors, spacing, and typography to the pre-migration version
- THEN every visual property is identical
- AND no regressions are introduced
