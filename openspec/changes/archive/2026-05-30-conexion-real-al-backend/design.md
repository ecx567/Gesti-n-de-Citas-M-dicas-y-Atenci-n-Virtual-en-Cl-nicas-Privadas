# Design: Conexión Real al Backend

## Technical Approach

Remove all mock data gates and wire 6 screens to real API calls. The auth context (`ctx.tsx`) is the pivot: store `AuthResponse.user` after login/register so downstream screens can consume real user data. Existing hooks (`useAppointments`, `useCancelAppointment`) and endpoint functions are already in place — this is pure wiring with no new API surface.

## Architecture Decisions

### Decision: User state in auth context

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Store `user` in React state, null on restart | No `/me` endpoint; screens degrade gracefully when user is null | ✅ Adopt — simplest path, matches risk mitigation in proposal |
| Persist user to SecureStore | Over-engineered; user might become stale; no PUT endpoint to sync | ❌ Reject |
| Add `/me` endpoint + query | Out of scope — would require backend + React Query hook | ❌ Reject |

**Rationale**: On cold start with a stored token, `session` is `authenticated` but `user` is `null`. Screens already handle this by the spec's fallback rules. A `/me` endpoint can be added later without breaking changes.

### Decision: Cancel button state machine

**Choice**: Local `useState` with three states (`idle → cancelling → error`) + `Alert.alert` confirmation. No Redux/context — this is local UI state.
**Alternatives**: React Query mutation state (`isPending`, `isError`) — considered but local state gives explicit control over the button UI (disable + spinner + revert on error).
**Rationale**: The cancel flow is self-contained on one screen. Using `mutateAsync` with local state gives precise UX control without coupling to query state.

### Decision: Register already wired — no change needed

`register.tsx` already calls `ctx.register()` which invokes `apiRegister`. The only missing piece is storing `user` in context, which the ctx.tsx change covers. No register.tsx code changes needed.

## Data Flow

```
Login/Register ──→ ctx.tsx ──→ files AuthResponse.user
                     │                in user state
                     ├──→ login.tsx     (consumes auth actions only)
                     ├──→ home.tsx      (user.name for greeting, useAppointments for list)
                     ├──→ profile.tsx   (user.name, user.email, user.role)
                     └──→ appointment/[id].tsx (useAppointment + useCancelAppointment)

forgot-password ──→ imports forgotPassword() directly — no context dependency
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/ctx.tsx` | Modify | Add `user: User \| null` to context value; store from login/register responses; null on logout |
| `src/app/(auth)/login.tsx` | Modify | Remove `MOCK_EMAIL`, `MOCK_PASSWORD` constants + mock gate block (lines 21-22, 80-85) |
| `src/app/(auth)/forgot-password.tsx` | Modify | Import `forgotPassword`, replace `setTimeout` mock, add error state |
| `src/app/(app)/(patient)/home.tsx` | Modify | Import `useAuth().user` for greeting, `useAppointments()` for list, fix navigation; remove all mock data |
| `src/app/(app)/appointment/[id].tsx` | Modify | Add cancel button + confirmation + `useCancelAppointment` mutation |
| `src/app/(app)/profile.tsx` | Modify | Replace hardcoded values with `user` from context; remove phone; add role badge |

## Component Designs

### ctx.tsx — User exposure

- Add `import type { User } from '@/api/auth/types'`
- Add `user` state: `const [user, setUser] = useState<User | null>(null)`
- In `login()`: `const response = await apiLogin(...)` → `setUser(response.user)`
- In `register()`: `const response = await apiRegister(...)` → `setUser(response.user)`
- In `logout()`: `setUser(null)` before `setSession('unauthenticated')`
- Extend `AuthContextValue`: add `user: User | null`
- No changes to `useAuth()` hook — destructuring handles the new field

### login.tsx — Mock gate removal

- **Remove**: `MOCK_EMAIL` constant (line 21), `MOCK_PASSWORD` constant (line 22)
- **Remove**: Mock credential check block (lines 80-85 inclusive)
- **Keep**: Client-side validation (email format, required fields) — untouched
- **Keep**: `try { await login(...) } catch { general error }` — already correct
- **State changes**: No new state; `isSubmitting` and `errors` remain as-is

### forgot-password.tsx — API wiring

- **Add import**: `import { forgotPassword } from '@/api/auth/endpoints'`
- **Add state**: `generalError: string | undefined` to `FormErrors` interface and `errors` state
- **Replace** lines 66-72: remove `setTimeout` mock, add:
  ```ts
  try {
    await forgotPassword(email.trim());
    setIsSubmitted(true);
  } catch {
    setErrors({ general: 'Ocurrió un error al enviar el correo. Intenta de nuevo.' });
  } finally {
    setIsSubmitting(false);
  }
  ```
- **Add** general error banner to render (below header, same pattern as login)
- **State changes**: Added `errors.general`; no new state variables

### home.tsx — Real data

- **Add imports**: `useAuth` from `@/ctx`, `useAppointments` from `@/hooks/useAppointments`, `Appointment` from `@/types/appointment`, `ActivityIndicator` from react-native
- **Remove**: `MOCK_PATIENT_NAME`, `MockAppointment` interface, `MOCK_APPOINTMENTS` array
- **Change greeting**: `user?.name ?? ` ` instead of `MOCK_PATIENT_NAME`
- **Change data source**: `const { data: appointments, isLoading } = useAppointments()` instead of `useState(MOCK_APPOINTMENTS)`
- **Change card type**: `AppointmentCard` accepts `Appointment` from domain types instead of `MockAppointment`
- **Fix navigation**: `router.push('/book-appointment')` in `handleBookAppointment`
- **Add loading state**: Show `ActivityIndicator` while `isLoading`
- **Add error state**: Show fallback message if `error` from hook is truthy
- **State changes**: Removed local `appointments` state; now driven by React Query

### appointment/[id].tsx — Cancel button

- **Add import**: `useCancelAppointment` from `@/hooks/useAppointments`
- **Add state**: `const [cancelState, setCancelState] = useState<'idle' | 'cancelling' | 'error'>('idle')`
- **Add hook**: `const cancelMutation = useCancelAppointment()`
- **Add handler**:
  ```ts
  function handleCancel() {
    Alert.alert('Cancelar Cita', '¿Estás seguro de que querés cancelar esta cita?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, Cancelar',
        style: 'destructive',
        onPress: async () => {
          setCancelState('cancelling');
          try {
            await cancelMutation.mutateAsync(id!);
            setCancelState('idle');
          } catch {
            setCancelState('error');
          }
        },
      },
    ]);
  }
  ```
- **Add cancel button** after the details card, only when `appointment.status === 'confirmed'`:
  - Show button with red/destructive style
  - Disable and show spinner when `cancelState === 'cancelling'`
  - Show error message when `cancelState === 'error'`
- **Add styles**: Red cancel button, error toast style

### profile.tsx — Real user data

- **Add import**: `type User` from `@/api/auth/types`
- **Change**: `const { session, logout } = useAuth()` → `const { user, logout } = useAuth()`
- **Replace**: Remove `patientName`, `patientEmail`, `patientPhone` hardcoded vars
- **Replace** display: `user?.name ?? ''` → name, `user?.email ?? ''` → email
- **Remove**: Phone number display line + style
- **Add**: Role badge — `user?.role && <Text style={...}>{user.role}</Text>`
- **State changes**: Removed `patientPhone` display; removed unused `session` destructure

## Error Handling

| Screen | Error | UX |
|--------|-------|-----|
| login | API failure (network, 401, 500) | General error banner: "Ocurrió un error al iniciar sesión" — existing, unchanged |
| forgot-password | API failure | General error banner (new) |
| home | API fetch error | Fallback message shown; retry on manual refresh |
| appointment detail | Cancel API failure | Error text below cancel button; button re-enabled |
| appointment detail | Appointment not found (404) | Existing not-found screen — unchanged |
| profile | No error paths | Read-only display; may show empty fields if user is null |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | ctx.tsx user state transitions | Mock apiLogin/apiRegister; verify user set after success, null after logout |
| Unit | Cancel button state machine | Unit test handleCancel → idle → cancelling → idle/error |
| Integration | Login flow E2E | Submit valid creds → verify token stored + user in context + navigation to home |
| Integration | Forgot-password success | Submit email → verify API called → confirmation screen shown |
| Integration | Appointment cancel | Tap cancel → confirm → verify API called → status updates |
| Manual | App restart with stored token | Verify screens render without crash when user is null |

## Migration / Rollout

No migration required. All changes are runtime wiring — no data transformation, no feature flags, no backend changes. Deploy as a single PR.

## Open Questions

None.
