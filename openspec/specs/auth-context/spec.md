# Auth Context Specification

## Purpose

Defines the auth context provider that wraps the application, exposing the authenticated user object (`User | null`) alongside session state and actions. The user object is sourced from the `AuthResponse.user` returned by login/register API calls and is not persisted across restarts (no `/me` endpoint exists yet).

## Requirements

### Requirement: User Exposure

The system MUST expose `user: User | null` (with `id`, `name`, `email`, `role`) from the auth context after a successful login or register, and set it to `null` on logout.

#### Scenario: Login sets user with full profile

- GIVEN the user calls the login API with valid credentials
- WHEN the API returns `AuthResponse` with a `user` object
- THEN the auth context MUST store `user`
- AND `user` MUST contain `id`, `name`, `email`, and `role`

#### Scenario: Register sets user with full profile

- GIVEN the user calls the register API with valid data
- WHEN the API returns `AuthResponse` with a `user` object
- THEN the auth context MUST store `user`
- AND `user` MUST contain `id`, `name`, `email`, and `role`

#### Scenario: Unauthenticated session has null user

- GIVEN the session state is `unauthenticated`
- WHEN the auth context renders
- THEN `user` MUST be `null`

#### Scenario: Logout clears user

- GIVEN the user is authenticated with a stored `user` object
- WHEN the user triggers logout
- THEN the context MUST set `user` to `null`
- AND the session state MUST transition to `unauthenticated`
- AND the token MUST be deleted from SecureStore

#### Scenario: User is null on cold start with stored token

- GIVEN the app restarts with a stored token but no `/me` endpoint
- WHEN the auth context initializes from SecureStore
- THEN `session` transitions to `authenticated`
- BUT `user` remains `null` until the next login/register call
- AND downstream screens MUST handle `user` being `null` gracefully
