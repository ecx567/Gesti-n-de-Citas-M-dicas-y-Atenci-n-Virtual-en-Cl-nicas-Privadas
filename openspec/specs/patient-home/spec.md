# Patient Home Specification

## Purpose

Defines the patient dashboard screen — the landing page after authentication. Shows a personalized greeting using the authenticated user's name, an upcoming appointments summary driven by the `useAppointments` hook, and quick action buttons linked to real navigation routes.

## Requirements

### Requirement: Greeting with Patient Name

The system MUST display a personalized greeting using `user.name` from the auth context at the top of the home screen.

#### Scenario: Greeting displays user name

- GIVEN the user is authenticated and has a name in auth context
- WHEN the home screen renders
- THEN the system MUST show "¡Hola, {user.name}!" at the top

#### Scenario: Greeting handles missing name

- GIVEN the user has no name set in auth context
- WHEN the home screen renders
- THEN the system SHOULD display a generic greeting like "¡Hola!" without error

### Requirement: Upcoming Appointments Summary

The system MUST fetch appointments via the `useAppointments` hook (real API) and display a summary card showing the next upcoming appointment with date, time, and doctor name.

#### Scenario: Upcoming appointment card displays from API

- GIVEN the API returns at least one future appointment
- WHEN the home screen renders
- THEN the system MUST show a card with the next appointment's time, date, and doctor name
- AND tapping the card navigates to `appointment/{id}`

#### Scenario: No upcoming appointments shows empty state

- GIVEN the API returns no future appointments
- WHEN the home screen renders
- THEN the system MUST display an empty state message
- AND MUST show a prompt to book a new appointment

#### Scenario: API fetch failure shows fallback

- GIVEN the API call fails (network error)
- WHEN the home screen renders
- THEN the system MUST show a fallback message
- AND allow retry on manual refresh

### Requirement: Quick Action Buttons

The system MUST display two quick action buttons: "Reservar Cita" and "Ver todas".

#### Scenario: Quick actions are always visible

- GIVEN the user is on the home screen
- WHEN the screen renders
- THEN both quick action buttons MUST be displayed below the appointments summary

#### Scenario: "Reservar Cita" navigates to booking

- GIVEN the user is on the home screen
- WHEN the user taps "Reservar Cita"
- THEN the system MUST navigate to `/book-appointment`

#### Scenario: "Ver todas" navigates to appointments list

- GIVEN the user is on the home screen
- WHEN the user taps "Ver todas"
- THEN the system MUST navigate to the appointments list
