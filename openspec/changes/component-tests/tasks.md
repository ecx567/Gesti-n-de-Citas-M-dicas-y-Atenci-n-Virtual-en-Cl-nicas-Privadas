# Tasks: Component Tests

## Review Workload Forecast

| Task | Est. Lines |
|------|-----------:|
| T1 - LoginScreen tests (7 scenarios) | ~120 |
| T2 - ForgotPasswordScreen tests (5 scenarios) | ~100 |
| T3 - ProfileScreen tests (4 scenarios) | ~120 |
| T4 - AppointmentDetailScreen tests (8 scenarios) | ~200 |
| **Total** | **~540** |

`400-line budget risk: Medium`
`Chained PRs recommended: Yes`
`Decision needed before apply: No`

## Chain Strategy

- Strategy: `stacked-to-main`
- PR 1 (main): Login + ForgotPassword tests — **completed**
- PR 2 (main): Profile + AppointmentDetail tests — **completed**

## Batch 1 — Login + ForgotPassword (PR 1 → main)

- [x] T1: Create `src/__tests__/login.test.tsx` — 7 scenarios
- [x] T2: Create `src/__tests__/forgot-password.test.tsx` — 5 scenarios
- [x] T3: Full verification — all 12 tests pass

## Batch 2 — Profile + AppointmentDetail (PR 2 → main)

- [x] T3: Create `src/__tests__/profile.test.tsx` — 4 scenarios
- [x] T4: Create `src/__tests__/appointment-detail.test.tsx` — 8 scenarios
- [x] T5: Full verification — all 64 tests pass
