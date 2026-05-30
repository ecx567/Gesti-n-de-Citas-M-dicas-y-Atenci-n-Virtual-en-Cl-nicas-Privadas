# Exploration: navegacion-y-pantallas-base

## Current State

The project is a **blank-typescript Expo SDK 56 project** (React Native 0.85.3, React 19.2.3, TypeScript 6.0.3). There is zero navigation infrastructure:

- **App.tsx**: Default template — renders `<Text>Open up App.tsx to start working on your app!</Text>` inside a centered `<View>` with `StyleSheet`. No navigation, no routing.
- **index.ts**: Standard Expo entrypoint — `registerRootComponent(App)`.
- **package.json**: Only `expo`, `expo-status-bar`, `react`, `react-native` as dependencies. No navigation packages installed.
- **app.json**: Has basic Expo config (name, slug, icons, orientation) but no `scheme`, no `plugins`, no `experiments.typedRoutes`.
- **openspec/config.yaml**: Fresh project, no test runner, no CI/CD, no linter. Git connected to `origin/main`.
- **No `src/` directory** yet — the project is single-root with `App.tsx` at root.

### Key Constraints from AGENTS.md

The project's `AGENTS.md` mandates: *"Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code."*

### Critical SDK 56 Change

In **SDK 56**, Expo Router no longer supports importing from external `@react-navigation/*` packages in application code. All React Navigation APIs are bundled and re-exported through `expo-router/*` entry points:

| Old import (SDK 55) | New import (SDK 56) |
|---|---|
| `@react-navigation/native` | `expo-router/react-navigation` |
| `@react-navigation/bottom-tabs` | `expo-router/js-tabs` |
| `@react-navigation/native-stack` | Expo Router built-in `<Stack>` |
| `@react-navigation/drawer` | Expo Router built-in `<Drawer>` |
| `@react-navigation/stack` | `expo-router/js-stack` |
| `@react-navigation/elements` | `expo-router/react-navigation` |
| `@react-navigation/material-top-tabs` | `expo-router/js-top-tabs` |

This means **we do NOT install `@react-navigation/*` packages at all** — they come bundled with `expo-router`.

---

## Affected Areas

- `App.tsx` — Must be replaced with Expo Router's entry point (`expo-router/entry` as `main`)
- `app.json` — Needs `"plugins": ["expo-router"]`, `"scheme": "vitacitas"`, `"experiments": { "typedRoutes": true }`
- `package.json` — Needs `"main": "expo-router/entry"` and new dependencies
- `tsconfig.json` — Needs path aliases (`@/*` → `./src/*`) for clean imports
- `src/app/` — New directory for file-based routes (to be created)
- `src/app/_layout.tsx` — Root layout with auth guard and navigation structure
- `src/app/(auth)/` — Auth flow screens (login, register)
- `src/app/(app)/` — Main app screens (tabs for patient/doctor)
- `src/ctx.tsx` — Auth context provider (from Expo Router auth pattern)

---

## Approaches

### 1. Expo Router (file-based routing) — **RECOMMENDED**

Expo's official recommendation. Routes are derived from the file system in `src/app/`. Built on React Navigation under the hood, but managed declaratively.

- **Pros**:
  - Official recommendation by Expo team for all new projects
  - SDK 56 bundles React Navigation internally — no separate `@react-navigation/*` installs needed
  - Automatic deep linking — every route is shareable by default
  - Typed routes — TypeScript validates all `router.push()` calls at compile time
  - Lazy bundling (async routes) in development — faster iteration
  - Built-in auth pattern with `<Stack.Protected>` (SDK 56+)
  - Native tabs (`<Tabs>`) and native stack (`<Stack>`) built in
  - Automatic sitemap generation for debugging
  - Static rendering support for web
  - File-based structure scales well as the app grows
  - Group notation `(auth)` and `(app)` to organize by auth state without affecting URLs

- **Cons**:
  - Locked into Expo Router's conventions — less flexibility for unusual navigation patterns
  - Requires migrating from the classic `App.tsx` entry point pattern
  - Need to adopt file-based mental model (less familiar for devs coming from React Navigation code-based approach)
  - Some custom navigator patterns require `withLayoutContext` wrapper

- **Effort**: Medium

### 2. React Navigation (standalone, code-based)

The traditional approach. Define navigators and screens in code. Would install `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs` separately.

- **Pros**:
  - Maximum flexibility — full control over navigation logic
  - Familiar pattern for developers with React Native experience
  - Well-documented with extensive community examples
  - Independent of Expo SDK version changes

- **Cons**:
  - **SDK 56 explicitly blocks** application code imports from `@react-navigation/*` (produces bundler errors). Requires `EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK=1` env var to bypass — a workaround, not a solution
  - No automatic deep linking — must configure manually
  - No typed routes — must maintain param types manually
  - No lazy bundling — larger initial bundle
  - Must manage splash screen, linking config, and navigation container manually
  - Extra packages to install and maintain versions for
  - No built-in auth guard pattern
  - Expo team may drop support for standalone React Navigation in future SDK versions

- **Effort**: Medium

### 3. Plain Stack Navigator (simpler, no tabs)

Use only `expo-router`'s `<Stack>` navigator. No tab navigator, no drawer. Screens are pushed/popped in a single flat stack.

- **Pros**:
  - Simplest possible setup — one layout, minimal boilerplate
  - Fast initial implementation
  - Good for a prototype or MVP that doesn't need tab-based navigation

- **Cons**:
  - No tab bar — users must navigate via buttons/links only, which is poor UX for a medical app
  - No persistent bottom navigation — common screens (home, appointments, profile) aren't quickly accessible
  - Doesn't scale to the full app needs (admin dashboard, doctor tabs, patient tabs)
  - Would require significant refactoring to add tabs later
  - Medical apps benefit from persistent navigation (quick access to appointments, emergency contacts)

- **Effort**: Low

---

## Recommendation

**Use Approach 1: Expo Router (file-based routing).**

Rationale:

1. **Expo's official recommendation** — The Expo docs explicitly say: *"If you are building a new app, we recommend using Expo Router for all the features described above."*

2. **SDK 56 is designed for it** — In SDK 56, Expo Router bundles React Navigation internally. Using standalone `@react-navigation/*` requires an opt-out env var and is explicitly unsupported for application code.

3. **Auth pattern is first-class** — Expo Router SDK 56 has a built-in `<Stack.Protected>` component for auth-guarding routes, which directly maps to our app's needs (patients, doctors, admin roles).

4. **File-based routing fits the domain** — A medical app with clear sections (auth, patient views, doctor views, admin) maps naturally to file groups:
   - `(auth)/` — login, register, forgot-password
   - `(patient)/` — home, appointments, doctors, profile
   - `(doctor)/` — dashboard, schedule, patients, profile
   - `(admin)/` — users, clinics, settings

5. **Deep linking is critical for healthcare** — Appointment links, notification deep links, and doctor profile shares work automatically.

6. **Structured from day one** — Starting with Expo Router establishes the file structure early, avoiding a painful migration later.

### Recommended Screen Hierarchy for Phase 1

```
src/app/
├── _layout.tsx                    # Root: SessionProvider + Stack with auth guards
├── index.tsx                      # Splash/loading state during auth check
│
├── (auth)/                        # Group: no auth required
│   ├── _layout.tsx                # Stack for auth screens
│   ├── login.tsx                  # Login screen
│   ├── register.tsx               # Patient registration
│   └── forgot-password.tsx        # Password recovery
│
└── (app)/                         # Group: requires authentication
    ├── _layout.tsx                # Tab navigator (Bottom Tabs)
    ├── index.tsx                  # Redirect to (patient) or (doctor) based on role
    │
    ├── (patient)/                 # Patient-specific screens
    │   ├── _layout.tsx            # Stack for patient screens
    │   ├── home.tsx               # Dashboard: upcoming appointments
    │   ├── appointments.tsx       # Appointment list + booking
    │   ├── appointment/[id].tsx   # Appointment detail (dynamic route)
    │   ├── doctors.tsx            # Browse doctors
    │   ├── doctor/[id].tsx        # Doctor profile (dynamic route)
    │   ├── profile.tsx            # Patient profile
    │   └── notifications.tsx      # Notifications list
    │
    └── (doctor)/                  # Doctor-specific screens
        ├── _layout.tsx            # Stack for doctor screens
        ├── dashboard.tsx          # Doctor dashboard
        ├── schedule.tsx           # Schedule management
        ├── patients.tsx           # Patient list
        ├── patient/[id].tsx       # Patient detail (dynamic route)
        └── profile.tsx            # Doctor profile
```

For Phase 1, I recommend implementing:
- **Auth flow**: `login.tsx`, `register.tsx`
- **Patient tab**: `home.tsx`, `appointments.tsx`, `appointment/[id].tsx`, `profile.tsx`
- **Notifications**: `notifications.tsx`
- **Root layout** with auth guard using `<Stack.Protected>`

Doctor-specific screens can be added in Phase 2 or as a separate change.

---

## Risks

- **SDK 56 stability**: SDK 56 was released ~May 2026. Some edge cases with the new `expo-router` import model may surface. Mitigation: pin exact versions in `package.json` and test on both iOS and Android before proceeding.
- **Learning curve**: The team may be unfamiliar with file-based routing. Mitigation: Expo Router's conventions are well-documented, and the file structure is intuitive once set up.
- **Third-party library compatibility**: Some libraries may still import from `@react-navigation/*` (Expo CLI auto-rewrites these from `node_modules` as a temporary shim, but this may not cover all cases). Mitigation: verify compatibility during implementation.
- **No `react-native-gesture-handler` by default**: Expo Router doesn't bundle it. If we need drawer navigation or gesture-based interactions, we must install it separately.

---

## Ready for Proposal

Yes

---

## Key Dependencies

All installed via `npx expo install` (automatically picks SDK 56 compatible versions):

| Package | Purpose | Required for |
|---|---|---|
| `expo-router` | File-based routing, Stack, Tabs, Drawer, auth guards | Core navigation |
| `react-native-screens` | Native screen containers (required by expo-router) | Navigation performance |
| `react-native-safe-area-context` | Safe area insets for notches, status bars | Layout safety |
| `expo-linking` | Deep linking support | Shareable routes |
| `expo-constants` | App configuration access | Expo Router setup |
| `react-native-gesture-handler` | Gesture support (optional, for Drawer/swipe) | Future drawer nav |
| `expo-secure-store` | Secure token storage | Auth session persistence |

**No `@react-navigation/*` packages are needed** — they are bundled inside `expo-router` in SDK 56.

### Versions

Since the project uses Expo SDK 56, the compatible versions will be resolved automatically by `npx expo install`. The `expo-router` version will be the one bundled with SDK 56 (likely `expo-router@5.x` based on the SDK 55→56 migration guide).
