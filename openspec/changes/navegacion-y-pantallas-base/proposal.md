# Proposal: Navegación y Pantallas Base

## Intent

Set up Expo Router file-based navigation and build core screens for auth, patient home, appointments, and profile. Establishes the app's navigation skeleton — future features plug into this structure.

## Scope

### In Scope
- Expo Router migration: replace `App.tsx` entry point with file-based routing
- Auth screens: login, register, forgot-password
- Patient screens: home dashboard, appointment list, appointment detail (dynamic `[id]`), profile
- Auth context provider for session management (Expo SecureStore)
- Bottom tab navigator for main app sections
- Typed routes with TypeScript `experiments.typedRoutes`

### Out of Scope
- Doctor/admin screens — deferred to later change
- API integration — screens are wireframes with mock data
- NativeWind/styling system — only navigation structure in this change
- Push notifications infrastructure

## Capabilities

### New Capabilities
- `navigation-routing`: Expo Router file-based routing, root/auth/app layouts, typed routes, bottom tabs
- `auth-screens`: Login, register, forgot-password forms with session token persistence via SecureStore
- `patient-home`: Patient dashboard showing upcoming appointments summary card
- `appointment-management`: Appointment list view, booking flow, dynamic detail screen by ID
- `profile-screen`: Patient profile display with navigation placeholders for settings

### Modified Capabilities
None — fresh project with no existing specs.

## Approach

Replace `App.tsx` with `expo-router/entry` as entry point. Configure `app.json`: scheme, `expo-router` plugin, `typedRoutes`. Install `expo-router` + peer deps via `npx expo install`. Create `src/app/` with root `_layout.tsx` (`<Stack>`, `<Stack.Protected>` auth guard), `(auth)/` group (login, register, forgot-password), and `(app)/` group (bottom tabs: home, appointments, profile). Build each screen as typed placeholder with navigation hooks. Auth context via React context wrapping SecureStore token read.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `App.tsx` | Removed | Replaced by `expo-router/entry` |
| `app.json` | Modified | Add `scheme`, `plugins`, `experiments.typedRoutes` |
| `package.json` | Modified | Add `"main": "expo-router/entry"`, new deps |
| `tsconfig.json` | Modified | Add `@/*` path alias → `./src/*` |
| `src/app/` | New | File-based route directory tree |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| SDK 56 expo-router regressions | Low | Pin exact versions, test iOS + Android |
| Auth guard race conditions | Low | Show splash/index until session resolves |

## Rollback Plan

Revert `package.json` deps, `app.json` config, and restore `App.tsx` from git. Delete `src/app/` directory. The app returns to blank-template state.

## Dependencies

- `expo-router`, `react-native-screens`, `react-native-safe-area-context`, `expo-constants`, `expo-linking`, `expo-secure-store`

## Success Criteria

- [ ] App boots via `expo-router/entry` with zero bundler errors
- [ ] Unauthenticated users are redirected to `(auth)/login`
- [ ] Login navigates to `(app)/(patient)/home` on success
- [ ] Bottom tabs (Home, Appointments, Profile) each render their screen
- [ ] Dynamic route `appointment/[id].tsx` resolves correctly
- [ ] TypeScript compilation passes (`tsc --noEmit`)
