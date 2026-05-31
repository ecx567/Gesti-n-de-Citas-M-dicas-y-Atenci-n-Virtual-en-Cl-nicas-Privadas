# Proposal: Conexión Real al Backend

## Intent

Remove all mock data gates and wire remaining screens to the real API. After this change, every screen in the patient flow will call real endpoints — no hardcoded credentials, no mock data, no fake delays.

## Scope

### In Scope

- **Login**: Remove the hardcoded `MOCK_EMAIL`/`MOCK_PASSWORD` gate so the real API validates credentials
- **Forgot-password**: Replace `setTimeout` mock with real `forgotPassword()` API call
- **Auth context**: Expose authenticated `user` object (name, email, role) so screens can display real user data
- **Home screen**: Replace mock patient name with real user name, replace mock appointments with `useAppointments` hook, fix "Reservar Cita" navigation (currently `console.log`)
- **Appointment detail**: Add cancel button with confirmation dialog wired to `cancelAppointment()` endpoint
- **Profile screen**: Show real user name and email from auth context instead of hardcoded values

### Out of Scope

- Doctor/specialty catalog API — no backend endpoint exists yet
- Design system / theming — structural refactor for a later change
- Screen test coverage — deferred to a dedicated testing change
- Push notifications
- Doctor/admin role screens
- Edit profile (requires PUT endpoint)
- Appointment update (requires PATCH endpoint)

## Capabilities

### Modified Capabilities

- `auth-screens` — Login and forgot-password now call real API
- `auth-context` — Exposes `user` object from authenticated session
- `patient-home` — Shows real data from API hooks
- `appointment-management` — Detail screen supports cancellation
- `profile-screen` — Displays real user info

## Approach

1. **ctx.tsx**: Store `AuthResponse.user` after login/register, expose it as `user` in the context value. Keep `session` state as-is.
2. **login.tsx**: Remove the ~MOCK_EMAIL~/~MOCK_PASSWORD~ check. Validation stays (email format, required fields). API errors surface via `catch`.
3. **forgot-password.tsx**: Import `forgotPassword` from auth endpoints. Replace `setTimeout` with API call. Show success/error states.
4. **home.tsx**: Import `useAuth` for user name. Import `useAppointments` for real data. Wire "Reservar Cita" to `router.push('/book-appointment')`.
5. **appointment/[id].tsx**: Add cancel button with `Alert.alert` confirmation. Call `cancelAppointment` from endpoints. Show loading state during cancellation.
6. **profile.tsx**: Replace hardcoded name/email with `user.name` and `user.email` from auth context.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/ctx.tsx` | Modified | Add `user` to context, store from login/register response |
| `src/app/(auth)/login.tsx` | Modified | Remove mock gate |
| `src/app/(auth)/forgot-password.tsx` | Modified | Wire to real API |
| `src/app/(app)/(patient)/home.tsx` | Modified | Real data, fix navigation |
| `src/app/(app)/appointment/[id].tsx` | Modified | Add cancel button |
| `src/app/(app)/profile.tsx` | Modified | Real user data |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| API not running on login attempt | Medium | Error surfaces via existing catch blocks; user sees "Ocurrió un error" |
| Cancel after appointment already cancelled | Low | API returns error; display friendly message |
| User object missing from login response | Low | Keep email fallback on profile screen |

## Rollback Plan

Revert changes to each file individually. No structural changes to routing or layouts.

## Dependencies

- `src/api/auth/endpoints.ts` — `forgotPassword` already exists
- `src/api/appointments/endpoints.ts` — `cancelAppointment` already exists
- `src/api/auth/types.ts` — `AuthResponse.user` already defined
- `src/hooks/useAppointments.ts` — already exported

## Success Criteria

- [ ] Login accepts real API credentials (no mock gate)
- [ ] Forgot-password shows success/error from real API
- [ ] Home screen shows real user name and real appointments
- [ ] "Reservar Cita" in home navigates to booking flow
- [ ] Appointment detail has cancel button that calls API
- [ ] Profile screen shows real user name and email
- [ ] All existing tests still pass (28/31)
