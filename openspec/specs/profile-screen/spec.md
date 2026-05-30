# Profile Screen Specification

## Purpose

Defines the patient profile screen displaying personal information with navigation placeholders for edit profile, settings, about, and logout actions. Wireframe with mock data, no API integration.

## Requirements

### Requirement: Patient Info Display

The system MUST display the patient's name, email, and phone number from mock data on the profile screen.

#### Scenario: Profile info renders on load

- GIVEN the user is authenticated and on the profile screen
- WHEN the screen renders
- THEN the system MUST show the patient's full name, email address, and phone number

#### Scenario: Partial mock data renders gracefully

- GIVEN the mock patient data is missing a phone number
- WHEN the profile screen renders
- THEN the system MUST display the available fields
- AND MUST show a placeholder or omit the missing field without crashing

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
