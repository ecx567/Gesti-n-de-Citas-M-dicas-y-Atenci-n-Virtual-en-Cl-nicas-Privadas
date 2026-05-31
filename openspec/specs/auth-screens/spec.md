# Auth Screens Specification

## Purpose

Defines the authentication flow: login, register, and forgot-password screens. Manages session state through an auth context provider backed by SecureStore for token persistence.

## Requirements

### Requirement: Login Screen

The system MUST provide a login screen with email and password fields that calls the real login API — no hardcoded mock credentials. Client-side validation (email format, required fields) MUST remain in place. API errors MUST surface as a general error banner.

#### Scenario: Successful login via real API

- GIVEN the user is on the login screen with valid credentials entered
- WHEN the user taps the submit button
- THEN the system MUST call the real login API
- AND persist the token to SecureStore
- AND store the `AuthResponse.user` in auth context
- AND navigate the user to the home screen

#### Scenario: Empty fields show validation errors

- GIVEN the user is on the login screen
- WHEN the user taps submit with an empty email field
- THEN the system MUST display an inline validation error
- AND MUST NOT call the API
- AND MUST NOT attempt any session transition

#### Scenario: Invalid email format shows validation error

- GIVEN the user is on the login screen
- WHEN the user enters an email that does not match the required format
- THEN the system MUST display an inline email-format validation error
- AND MUST NOT call the API

#### Scenario: API error shows general error message

- GIVEN the user is on the login screen with any credentials
- WHEN the API returns an error (network failure, 401, 500)
- THEN the system MUST display "Ocurrió un error al iniciar sesión"
- AND the user MUST remain on the login screen
- AND no raw error text MUST be displayed

### Requirement: Register Screen

The system MUST provide a registration screen with name, email, password, and confirm-password fields that calls the real register API.

#### Scenario: Successful registration via real API

- GIVEN the user fills all required fields with valid data
- WHEN the user taps submit
- THEN the system MUST call the real register API
- AND persist the token to SecureStore
- AND store the `AuthResponse.user` in auth context
- AND navigate the user to the home screen

#### Scenario: Password mismatch shows validation error

- GIVEN the user enters different values in password and confirm-password
- WHEN the user taps submit
- THEN the system MUST display a "passwords do not match" error
- AND MUST NOT call the API

#### Scenario: API error during registration

- GIVEN the user fills all required fields with valid data
- WHEN the register API returns an error
- THEN the system MUST display a descriptive error message
- AND the user MUST remain on the register screen

### Requirement: Forgot-Password Screen

The system MUST provide a forgot-password screen where the user can enter their email to receive a password reset via the real `forgotPassword()` API.

#### Scenario: Email submitted calls real API and shows confirmation

- GIVEN the user is on the forgot-password screen with a valid email
- WHEN the user taps submit
- THEN the system MUST call `forgotPassword(email)`
- AND on success display a confirmation message with a link to return to the login screen

#### Scenario: API error shows error banner

- GIVEN the user is on the forgot-password screen with a valid email
- WHEN the forgotPassword API returns an error
- THEN the system MUST display a descriptive error banner
- AND the user MUST remain on the forgot-password screen

#### Scenario: Empty email shows validation

- GIVEN the user is on the forgot-password screen
- WHEN the user taps submit with an empty email field
- THEN the system MUST display an inline validation error
- AND MUST NOT call the API

### Requirement: Auth Context and Session State

The system MUST provide an auth context that wraps the application, exposing session state (`loading`, `authenticated`, `unauthenticated`), user object (`User | null`), and actions (login, register, logout).

#### Scenario: Context initializes from SecureStore

- GIVEN the app launches and a token exists in SecureStore
- WHEN the auth context initializes
- THEN the session state MUST transition from `loading` to `authenticated`
- AND `user` MAY be `null` until a subsequent login/register call

#### Scenario: Login sets user in context

- GIVEN the login API returns successfully
- WHEN `ctx.login()` completes
- THEN the context MUST store the `AuthResponse.user` object
- AND `user` MUST contain `id`, `name`, `email`, and `role`

#### Scenario: Unauthenticated session has null user

- GIVEN the session state is `unauthenticated`
- WHEN the auth context renders
- THEN `user` MUST be `null`

#### Scenario: Logout clears user and persisted token

- GIVEN the user is authenticated
- WHEN the user triggers logout
- THEN the system MUST delete the token from SecureStore
- AND set `user` to `null`
- AND the session state MUST transition to `unauthenticated`
