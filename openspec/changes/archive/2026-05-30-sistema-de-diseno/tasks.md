# Tasks: Sistema de Diseño

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~300 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Theme foundation + 5 screen migrations + verify | PR 1 | Single PR under 400 lines |

## Phase 1: Foundation

- [x] **T1** — Create `src/theme/index.ts` exporting `colors`, `spacing`, `fontSize`, `fontWeight`, `borderRadius`, `shadows` as `as const` named exports

## Phase 2: Screen Migrations

- [x] **T2** — Migrate `src/app/(auth)/login.tsx` to use theme tokens
- [x] **T3** — Migrate `src/app/(auth)/forgot-password.tsx` to use theme tokens
- [x] **T4** — Migrate `src/app/(app)/appointment/[id].tsx` to use theme tokens
- [x] **T5** — Migrate `src/app/(app)/profile.tsx` to use theme tokens
- [x] **T6** — Migrate `src/app/(app)/(patient)/home.tsx` to use theme tokens

## Phase 3: Verification

- [x] **T7** — Run `tsc --noEmit`, `npx jest`, and verify zero residual hex colors
