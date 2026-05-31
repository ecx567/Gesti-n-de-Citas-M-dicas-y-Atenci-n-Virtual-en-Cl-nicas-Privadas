# Profile Screen Specification

## Purpose

Defines the patient profile screen displaying the authenticated user's personal information (name, email, role) from auth context, with navigation for settings, about, and logout.

## Requirements

### Requirement: Patient Info Display

The system MUST display `user.name`, `user.email`, and `user.role` badge from the auth context on the profile screen. Phone number is not displayed (not available in the current `AuthResponse.user` type).

#### Scenario: Profile info renders real user data

- GIVEN the user is authenticated and `user` is set in auth context
- WHEN the profile screen renders
- THEN the system MUST show the user's full name, email address, and role badge

#### Scenario: Missing optional fields render gracefully

- GIVEN the user object has some optional fields missing
- WHEN the profile screen renders
- THEN the system MUST display the available fields
- AND MUST NOT crash or display raw `null`/`undefined` values

#### Scenario: Null user is guarded by auth layout

- GIVEN the user context is null (unauthenticated)
- WHEN the profile screen attempts to render
- THEN the system MUST prevent access via the auth layout guard (redirect or block)

### Requirement: Navigation Placeholders

The system MUST display a list of menu items for Edit Profile, Settings, and About, each navigating to a placeholder screen.

#### Scenario: Edit Profile navigates to edit screen

- GIVEN the user is on the profile screen
- WHEN the user taps "Edit Profile"
- THEN the system MUST navigate to an edit profile screen
- AND that screen MUST display an "Under construction" message

#### Scenario: Settings navigates to settings screen

- GIVEN the user is on the profile screen
- WHEN the user taps "Settings"
- THEN the system MUST navigate to a settings screen
- AND that screen MUST display an "Under construction" message

#### Scenario: About navigates to about screen

- GIVEN the user is on the profile screen
- WHEN the user taps "About"
- THEN the system MUST navigate to an about screen
- AND that screen MUST display app version and an "Under construction" message

### Requirement: Logout Action

The system MUST provide a logout button on the profile screen that clears the session and navigates to the login screen.

#### Scenario: Logout clears session and redirects

- GIVEN the user is authenticated and on the profile screen
- WHEN the user taps "Logout"
- THEN the system MUST show a confirmation dialog
- AND on confirmation, MUST clear the SecureStore token
- AND navigate the user to the login screen

#### Scenario: Cancel logout keeps session

- GIVEN the user taps "Logout"
- WHEN the user dismisses or cancels the confirmation dialog
- THEN the system MUST NOT clear the session
- AND the user MUST remain on the profile screen
