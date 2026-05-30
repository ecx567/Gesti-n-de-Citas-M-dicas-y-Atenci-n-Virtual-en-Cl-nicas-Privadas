# Auth Screens Specification

## Purpose

Defines the authentication flow: login, register, and forgot-password screens. Manages session state through an auth context provider backed by SecureStore for token persistence.

## Requirements

### Requirement: Login Screen

The system MUST provide a login screen with email and password fields and a submit action that transitions the user to the authenticated app area on success.

#### Scenario: Successful login navigates to home

- GIVEN the user is on the login screen with valid credentials entered
- WHEN the user taps the submit button
- THEN the system MUST persist the token to SecureStore
- AND navigate the user to the home screen

#### Scenario: Empty fields show validation errors

- GIVEN the user is on the login screen
- WHEN the user taps submit with an empty email field
- THEN the system MUST display an inline validation error
- AND MUST NOT attempt any session transition

#### Scenario: Invalid credentials show error message

- GIVEN the user is on the login screen with incorrect credentials
- WHEN the mock validation rejects the credentials
- THEN the system MUST display a descriptive error message
- AND the user MUST remain on the login screen

### Requirement: Register Screen

The system MUST provide a registration screen with name, email, password, and confirm-password fields.

#### Scenario: Successful registration creates session

- GIVEN the user fills all required fields with valid data
- WHEN the user taps submit
- THEN the system MUST create a mock session token
- AND navigate the user to the home screen

#### Scenario: Password mismatch shows validation error

- GIVEN the user enters different values in password and confirm-password
- WHEN the user taps submit
- THEN the system MUST display a "passwords do not match" error
- AND MUST NOT create a session

### Requirement: Forgot-Password Screen

The system MUST provide a forgot-password screen where the user can enter their email to receive a mock password reset confirmation.

#### Scenario: Email submitted shows confirmation

- GIVEN the user is on the forgot-password screen with a valid email
- WHEN the user taps submit
- THEN the system MUST display a confirmation message
- AND provide a link to return to the login screen

#### Scenario: Empty email shows validation

- GIVEN the user is on the forgot-password screen
- WHEN the user taps submit with an empty email field
- THEN the system MUST display an inline validation error

### Requirement: Auth Context and Session State

The system MUST provide an auth context that wraps the application, exposing session state (`loading`, `authenticated`, `unauthenticated`) and actions (login, register, logout).

#### Scenario: Context initializes from SecureStore

- GIVEN the app launches and a token exists in SecureStore
- WHEN the auth context initializes
- THEN the session state MUST transition from `loading` to `authenticated`

#### Scenario: Logout clears persisted token

- GIVEN the user is authenticated
- WHEN the user triggers logout
- THEN the system MUST delete the token from SecureStore
- AND the session state MUST transition to `unauthenticated`
