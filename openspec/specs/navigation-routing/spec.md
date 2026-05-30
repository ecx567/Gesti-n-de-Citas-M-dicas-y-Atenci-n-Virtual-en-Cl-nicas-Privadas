# Navigation Routing Specification

## Purpose

Defines the file-based routing skeleton for the mobile app using Expo Router. Establishes root layout, auth guard, authenticated bottom tabs, typed routes, and deep linking support.

## Requirements

### Requirement: Root Layout with Auth Guard

The system MUST render a root `<Stack>` layout that conditionally shows the auth group or the app group based on session state.

#### Scenario: Unauthenticated user sees auth screens

- GIVEN the user has no stored session token
- WHEN the app initializes
- THEN the root layout MUST render the `(auth)/` route group
- AND the user MUST see the login screen as the first screen

#### Scenario: Authenticated user sees app screens

- GIVEN the user has a valid stored session token
- WHEN the app initializes
- THEN the root layout MUST render the `(app)/` route group
- AND the user MUST see the home screen as the first screen

#### Scenario: Session loading state prevents flash

- GIVEN the app is checking SecureStore for a token
- WHEN the session state is `loading`
- THEN the system MUST show a loading indicator
- AND MUST NOT render either route group until resolution

### Requirement: Bottom Tab Navigator

The `(app)/` route group MUST contain a bottom tab navigator with three tabs: Home, Appointments, and Profile.

#### Scenario: Tab navigation switches screens

- GIVEN the user is authenticated and on the Home tab
- WHEN the user taps the Appointments tab
- THEN the system MUST navigate to the appointments list screen
- AND the active tab MUST visually indicate selection

#### Scenario: Tab preserves navigation state

- GIVEN the user navigated to `appointment/123` from Appointments tab
- WHEN the user taps Home tab and then taps Appointments tab again
- THEN the system SHOULD restore the previous appointment detail view

### Requirement: Typed Routes

The system MUST enable `experiments.typedRoutes` in `app.json` to provide TypeScript type checking for all route paths and parameters.

#### Scenario: Type-safe navigation to dynamic route

- GIVEN a developer calls `router.push`
- WHEN passing a dynamic route like `appointment/[id]`
- THEN TypeScript MUST enforce that `id` is provided as a string parameter

#### Scenario: TypeScript compilation catches invalid routes

- GIVEN a developer references a non-existent route path
- WHEN running `tsc --noEmit`
- THEN the compiler MUST produce a type error for the invalid route

### Requirement: Deep Linking

The system MUST support deep linking via `expo-linking` with a registered URL scheme, enabling navigation from external sources like notifications or email links.

#### Scenario: Deep link opens correct screen

- GIVEN the app is not running
- WHEN the user taps a deep link with the registered scheme
- THEN the system MUST open the app and navigate to the screen specified in the link

#### Scenario: Unrecognized deep link shows default screen

- GIVEN the app receives a deep link with an unknown path
- WHEN the system attempts to resolve the link
- THEN the system MUST navigate to the home screen as fallback
