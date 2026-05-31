# Apply Progress: Conexión Real al Backend

**Status**: All 9 tasks complete
**Mode**: Standard (strict_tdd: false)
**Date**: 2026-05-30

## Completed Tasks

### Phase 1: Auth Context — User Exposure
- [x] 1.1 `src/ctx.tsx` — Added `User` type import, `user` state, store from login/register, null on logout, exposed in `AuthContextValue`
- [x] 1.2 `src/__tests__/ctx.test.tsx` — Updated `TestConsumer` to expose `user`, added tests for user set/login and null/logout

### Phase 2: Auth Screen Wiring
- [x] 2.1 `src/app/(auth)/login.tsx` — Removed `MOCK_EMAIL`/`MOCK_PASSWORD` constants and mock credential check block
- [x] 2.2 `src/app/(auth)/forgot-password.tsx` — Imported `forgotPassword`, replaced setTimeout mock with try/catch, added `general` error to `FormErrors`, rendered error banner

### Phase 3: Patient Screen Wiring
- [x] 3.1 `src/app/(app)/(patient)/home.tsx` — Using `user?.name` from `useAuth()` for greeting, `useAppointments()` for data, fixed navigation to `/book-appointment`, added loading/error states
- [x] 3.2 `src/app/(app)/appointment/[id].tsx` — Added cancel button with `Alert.alert` confirmation, wired to `useCancelAppointment()`, loading spinner, error text, hidden for non-confirmed status
- [x] 3.3 `src/app/(app)/profile.tsx` — Replaced hardcoded data with `user` from `useAuth()`, added role badge, removed phone section

### Phase 4: Testing
- [x] 4.1 `src/hooks/__tests__/useAppointments.test.tsx` — Added `useCancelAppointment` tests: mutation success, error surface
- [x] 4.2 `src/__tests__/home.test.tsx` — Created with tests for loading, data display, empty state, error fallback, user greeting, null user

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `src/ctx.tsx` | Modified | Added `user` state, stored from login/register, nulled on logout, exposed in `AuthContextValue` |
| `src/__tests__/ctx.test.tsx` | Modified | Updated `TestConsumer` for user display, added 3 user state transition tests |
| `src/app/(auth)/login.tsx` | Modified | Removed `MOCK_EMAIL`/`MOCK_PASSWORD` constants and mock credential check block |
| `src/app/(auth)/forgot-password.tsx` | Modified | Wired to real `forgotPassword()` API, added `general` error state + error banner |
| `src/app/(app)/(patient)/home.tsx` | Modified | Replaced mock data with `useAuth()` + `useAppointments()`, fixed navigation, added loading/error/empty states |
| `src/app/(app)/appointment/[id].tsx` | Modified | Added cancel button with confirmation dialog, wired to `useCancelAppointment()`, loading/error states |
| `src/app/(app)/profile.tsx` | Modified | Replaced hardcoded mock data with real `user` from context, added role badge, removed phone |
| `src/hooks/__tests__/useAppointments.test.tsx` | Modified | Added `useCancelAppointment` test block with success and error cases |
| `src/__tests__/home.test.tsx` | Created | Basic render tests for home screen: loading, data, empty, error, user greeting, null user |
| `jest.config.js` | Modified | Added `@expo/vector-icons` → `__mocks__/@expo/vector-icons.js` `moduleNameMapper` entry |
| `__mocks__/@expo/vector-icons.js` | Created | Mock `Ionicons` component for tests (module not installed in dev) |

## Deviations from Design
- `jest.config.js` and `__mocks__/@expo/vector-icons.js` added as test support files (not in design)
- `ctx.test.tsx` uses `fireEvent.press()` instead of `btn.props.onPress()` — `Pressable` in RN doesn't expose `onPress` directly on host props
- `beforeEach` in `ctx.test.tsx` explicitly resets `SecureStore.getItemAsync` — `jest.clearAllMocks()` does not undo `mockResolvedValue()`

## Issues Found
None.

## Workload / PR Boundary
- Mode: single PR (ask-on-risk, under 400 lines)
- Current work unit: Full change — conexion-real-al-backend
- Estimated review budget impact: ~200 lines changed

## Status
9/9 tasks complete. Ready for verify.
