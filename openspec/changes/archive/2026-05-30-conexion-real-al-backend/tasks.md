# Tasks: Conexión Real al Backend

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~200 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Auth Context — User Exposure

- [x] 1.1 `src/ctx.tsx` — Add `User` type import, `user` state (`useState<User | null>`), store from login/register response, null on logout, expose in `AuthContextValue`
- [x] 1.2 `src/__tests__/ctx.test.tsx` — Update `TestConsumer` to expose `user`, add test for user set after login and null after logout

## Phase 2: Auth Screen Wiring

- [x] 2.1 `src/app/(auth)/login.tsx` — Remove `MOCK_EMAIL`/`MOCK_PASSWORD` constants and lines 80-85 mock credential check block
- [x] 2.2 `src/app/(auth)/forgot-password.tsx` — Import `forgotPassword`, replace lines 68-72 `setTimeout` mock with try/catch calling real API, add `general` error to `FormErrors`, render error banner

## Phase 3: Patient Screen Wiring

- [x] 3.1 `src/app/(app)/(patient)/home.tsx` — Use `user?.name` from `useAuth()` for greeting, `useAppointments()` for data, fix `handleBookAppointment` to `router.push('/book-appointment')`, add loading/error states
- [x] 3.2 `src/app/(app)/appointment/[id].tsx` — Add cancel button with `Alert.alert` confirmation, wire to `useCancelAppointment()`, show loading spinner during cancellation, error text on failure, hide button when status is not `confirmed`
- [x] 3.3 `src/app/(app)/profile.tsx` — Replace hardcoded `patientName`/`patientEmail`/`patientPhone` with `user` from `useAuth()`, add role badge, remove phone section

## Phase 4: Testing

- [x] 4.1 `src/hooks/__tests__/useAppointments.test.tsx` — Add test for `useCancelAppointment`: calls mutation, invalidates cache on success, surfaces error on failure
- [x] 4.2 `src/__tests__/home.test.tsx` — Add basic render test: loading state, appointment data display, empty state, error fallback
