# Delta Spec: Conexión Real al Backend

**Change**: conexion-real-al-backend  
**Mode**: hybrid  
**Type**: Delta spec — modifies 5 existing domain specs.

| Domain | Type | Requirements Changed |
|--------|------|---------------------|
| auth-screens | Modified | Login, Forgot-Password |
| auth-context | Modified | Auth Context (adds `user`) |
| patient-home | Modified | Greeting, Appointments Summary, Book Appointment nav |
| appointment-management | Added | Appointment Cancellation |
| profile-screen | Modified | Patient Info Display; removed phone display |

---

## auth-screens

### MODIFIED: Login Screen

The system MUST accept ALL credentials through the real login API, removing the hardcoded mock gate. Client-side validation (email format, required fields) MUST remain. API errors MUST surface as a general error. (Previously: only `mock@email.com`/`mock123` succeeded.)

#### Scenarios

| # | GIVEN | WHEN | THEN |
|---|-------|------|------|
| 1 | User on login with valid credentials | Submits | Calls real API → persists token + user to auth context → navigates to home |
| 2 | User on login screen | Submits empty email | Inline validation error; no API call; no navigation |
| 3 | User on login with any credentials | API returns error (network, 401, 500) | Shows "Ocurrió un error al iniciar sesión"; stays on login; no raw error text displayed |
| 4 | User on login with invalid format email | Submits | Inline email-format validation error before API call |

### MODIFIED: Register Screen

Register MUST store the returned `AuthResponse.user` in auth context after a successful API call. (Previously: created mock session token only.)

#### Scenarios

| # | GIVEN | WHEN | THEN |
|---|-------|------|------|
| 1 | User fills all fields with valid data | Submits | Calls real API → stores `user` in context → persists token → navigates to home |
| 2 | Password mismatch | Submits | Inline "passwords do not match" error; no API call |
| 3 | API error during registration | Server returns error | Shows error message; stays on register screen |

### MODIFIED: Forgot-Password Screen

The system MUST call the real `forgotPassword(email)` API instead of the mock `setTimeout`. (Previously: mock setTimeout with no network call.)

#### Scenarios

| # | GIVEN | WHEN | THEN |
|---|-------|------|------|
| 1 | User on forgot-password with valid email | Submits | Calls `forgotPassword(email)` → on success shows confirmation + link to login |
| 2 | User on forgot-password | API returns error | Shows descriptive error message; remains on screen |
| 3 | User on forgot-password | Submits empty email | Inline validation error; no API call |

---

## auth-context

### MODIFIED: Auth Context

The system MUST expose `user: User | null` (with `id`, `name`, `email`, `role`) after login/register and set it to `null` on logout. (Previously: only exposed session state and actions.)

#### Scenarios

| # | GIVEN | WHEN | THEN |
|---|-------|------|------|
| 1 | App authenticates via login or register | Auth context updates | `user` contains `AuthResponse.user` with id, name, email, role |
| 2 | App session is `unauthenticated` | Auth context renders | `user` is `null` |
| 3 | User logs out | Logout completes | Token cleared from SecureStore; `user` set to `null`; session → `unauthenticated` |

---

## patient-home

### MODIFIED: Greeting

The system MUST display a personalized greeting using `user.name` from auth context instead of a hardcoded mock name.

#### Scenarios

| # | GIVEN | WHEN | THEN |
|---|-------|------|------|
| 1 | User authenticated with name in context | Home renders | Shows "Hello, {user.name}" |
| 2 | User has no name set | Home renders | Shows generic "Hello" without error |

### MODIFIED: Upcoming Appointments Summary

The system MUST fetch appointments via `useAppointments` hook (real API) instead of mock data.

#### Scenarios

| # | GIVEN | WHEN | THEN |
|---|-------|------|------|
| 1 | API returns at least one future appointment | Home renders | Shows card with next appointment's date, time, doctor name; card navigates to `appointment/{id}` on tap |
| 2 | API returns no future appointments | Home renders | Shows empty state + "Reservar Cita" prompt |
| 3 | API call fails (network error) | Home renders | Shows fallback message; retry on manual refresh |

### MODIFIED: Quick Action — Book Appointment

The system MUST navigate to `/book-appointment` when the user taps "Reservar Cita". (Previously: `console.log` placeholder or no-op.)

#### Scenarios

| # | GIVEN | WHEN | THEN |
|---|-------|------|------|
| 1 | User on home screen | Taps "Reservar Cita" | Navigates to `/book-appointment` |
| 2 | User on home screen | Taps "Ver todas" | Navigates to appointments list (unchanged) |

---

## appointment-management

### ADDED: Appointment Cancellation

The system MUST allow the user to cancel an appointment from the detail screen with a confirmation dialog, wired to the real `cancelAppointment(id)` API.

#### Scenarios

| # | GIVEN | WHEN | THEN |
|---|-------|------|------|
| 1 | User on appointment detail | Taps cancel + confirms dialog | Shows loading spinner → calls `cancelAppointment(id)` → updates status to "cancelled" |
| 2 | User taps cancel | Dismisses confirmation dialog | No API call; detail screen unchanged |
| 3 | User confirms cancellation | API returns error (already cancelled, network failure) | Shows error message; detail screen unchanged |

### MODIFIED: Dynamic Appointment Detail

The detail screen MUST display a cancel button for appointments in "confirmed" status. (Previously: no cancel button.)

#### Scenarios

| # | GIVEN | WHEN | THEN |
|---|-------|------|------|
| 1 | Appointment status is "confirmed" | Detail renders | Cancel button visible |
| 2 | Appointment status is "cancelled" or "completed" | Detail renders | Cancel button hidden |

---

## profile-screen

### MODIFIED: Patient Info Display

The system MUST display `user.name` and `user.email` from auth context, and show `user.role` as a badge. (Previously: hardcoded mock data including phone number.)

#### Scenarios

| # | GIVEN | WHEN | THEN |
|---|-------|------|------|
| 1 | User authenticated with user context | Profile renders | Shows `user.name`, `user.email`, `user.role` badge |
| 2 | User object missing optional fields | Profile renders | Available fields display; no crash |
| 3 | User context is null (unauthenticated) | Profile renders | Redirect or prevent render (guarded by auth layout) |

### REMOVED: Phone Number Display

(Reason: Phone number is not in the current `AuthResponse.user` type. Removed until a profile-edit endpoint is added.)

---

## Implementation Notes

- All API calls already have corresponding endpoint functions (`login`, `register`, `forgotPassword`, `cancelAppointment`) and the `useAppointments` hook exists — no new API surface needed.
- Auth context (`ctx.tsx`) is the pivot point: store `user` from login/register responses, expose it, and set it to `null` on logout.
- No new screens or routes required — this is a wiring change only.
- "Reservar Cita" navigation fix: replace placeholder with `router.push('/book-appointment')`.
