# Tasks: Navegación y Pantallas Base

## Phase 0 — Project Configuration
_No dependencies_

- [x] Update `app.json`: add `scheme`, `expo-router` plugin, `experiments.typedRoutes`
- [x] Update `package.json`: `"main": "expo-router/entry"`, add deps
- [x] Create `tsconfig.json` with `@/*` path alias → `./src/*`
- [x] Remove `App.tsx`, update `index.ts` entry point
- [x] Run `npx expo install expo-router expo-secure-store expo-linking`
- [x] Verify: `npx expo start` boots without errors

## Phase 1 — Auth Infrastructure
_Depends on: Phase 0_

- [x] Create `src/ctx.tsx`: AuthContext with SecureStore persistence, `login`/`register`/`logout`, session state `loading` | `authenticated` | `unauthenticated`
- [x] Create `src/app/_layout.tsx`: Root `<Stack>` wrapping children in `<AuthProvider>`, loading splash while session resolves
- [x] Create `src/app/index.tsx`: Loading/splash screen during session check
- [ ] Verify: unauthenticated → loading → splash; authenticated → renders children (pending auth screens from PR 2)

## Phase 2 — Auth Screens (Wireframes)
_Depends on: Phase 1_

- [ ] Create `src/app/(auth)/_layout.tsx`: Stack layout for auth group
- [ ] Create `src/app/(auth)/login.tsx`: Email/password form, inline validation, mock submit → token in SecureStore
- [ ] Create `src/app/(auth)/register.tsx`: Name/email/password/confirm form, validation, mock registration
- [ ] Create `src/app/(auth)/forgot-password.tsx`: Email field, validation, confirmation message + back link
- [ ] Verify: login navigates to `(app)`, register creates session, forgot-pwd shows confirmation

## Phase 3 — App Layout & Bottom Tabs
_Depends on: Phase 1_

- [ ] Create `src/app/(app)/_layout.tsx`: Bottom `<Tabs>` with Home, Appointments, Profile tabs + icons
- [ ] Create `src/app/(app)/index.tsx`: Redirect to patient home
- [ ] Enable `experiments.typedRoutes` in `app.json`
- [ ] Verify: 3 tabs render, tapping switches screens, TypeScript validates routes

## Phase 4 — Patient Home
_Depends on: Phase 3_

- [ ] Create `src/app/(patient)/home.tsx`: Greeting w/ mock name, upcoming appointment card, "Book Appointment" + "View All" quick actions, empty state fallback
- [ ] Verify: greeting renders, card displays mock data, quick actions navigate

## Phase 5 — Appointment Screens
_Depends on: Phase 3_

- [ ] Create reusable `AppointmentCard` component: doctor name, date, time, badge (confirmed=green, cancelled=red, pending=yellow), pressable → detail
- [ ] Create `src/app/appointments.tsx`: List filterable by upcoming/past/cancelled with mock data, empty states per filter
- [ ] Create `src/app/appointment/[id].tsx`: Dynamic route rendering full detail from mock data, "not found" state for invalid IDs
- [ ] Create booking flow: specialty → doctor → date → time → confirmation → navigate to detail screen
- [ ] Verify: filters work, `[id]` resolves correctly, booking creates mock appointment

## Phase 6 — Profile Screen & Placeholders
_Depends on: Phase 3_

- [ ] Create `src/app/(patient)/profile.tsx`: Patient name/email/phone, menu items (Edit Profile, Settings, About), logout with confirmation dialog
- [ ] Create placeholder screens: `edit-profile.tsx`, `settings.tsx`, `about.tsx` — each shows "Under construction"
- [ ] Verify: info renders, menus navigate to placeholders, logout clears SecureStore → redirects to login

## Review Workload Forecast

| Phase | Est. Lines |
|-------|-----------:|
| 0 — Project Config | ~30 |
| 1 — Auth Infrastructure | ~120 |
| 2 — Auth Screens | ~200 |
| 3 — App Layout & Tabs | ~60 |
| 4 — Patient Home | ~90 |
| 5 — Appointment Screens | ~250 |
| 6 — Profile & Placeholders | ~180 |
| **Total** | **~930** |

⚠️ **Total exceeds review budget of 400 lines.** Delivery strategy `ask-always`: recommend splitting into stacked PRs to main.

### Suggested PR Split

| PR | Phases | Est. Lines |
|----|--------|-----------:|
| 1 | 0 + 1 (deps, config, auth infra) | ~150 |
| 2 | 2 (auth screens) | ~200 |
| 3 | 3 + 4 (tabs + home) | ~150 |
| 4 | 5 (appointment screens) | ~250 |
| 5 | 6 (profile + placeholders) | ~180 |
