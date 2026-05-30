# Patient Home Specification

## Purpose

Defines the patient dashboard screen — the landing page after authentication. Shows a greeting, upcoming appointments summary, and quick action buttons. Designed as a static wireframe with mock data.

## Requirements

### Requirement: Greeting with Patient Name

The system MUST display a personalized greeting using the mock patient's first name at the top of the home screen.

#### Scenario: Greeting displays on load

- GIVEN the user is authenticated and on the home screen
- WHEN the screen renders
- THEN the system MUST show "Hello, {mock patient first name}" at the top

#### Scenario: Greeting handles missing name

- GIVEN mock patient data has no name
- WHEN the home screen renders
- THEN the system SHOULD display a generic greeting like "Hello" without error

### Requirement: Upcoming Appointments Summary

The system MUST display a summary card showing the next upcoming appointment with date, time, and doctor name.

#### Scenario: Upcoming appointment card displays

- GIVEN the mock data contains at least one future appointment
- WHEN the home screen renders
- THEN the system MUST show a card with the next appointment's time, date, and doctor name
- AND the card MUST be visually distinct from other content

#### Scenario: No upcoming appointments shows empty state

- GIVEN the mock data contains no future appointments
- WHEN the home screen renders
- THEN the system MUST display an empty state message
- AND MUST show a prompt to book a new appointment

### Requirement: Quick Action Buttons

The system MUST display two quick action buttons: "Book Appointment" and "View All Appointments".

#### Scenario: Quick actions are always visible

- GIVEN the user is on the home screen
- WHEN the screen renders
- THEN both quick action buttons MUST be displayed below the appointments summary

#### Scenario: Book Appointment navigates to booking

- GIVEN the user is on the home screen
- WHEN the user taps "Book Appointment"
- THEN the system MUST navigate to the appointment booking screen

#### Scenario: View All navigates to list

- GIVEN the user is on the home screen
- WHEN the user taps "View All Appointments"
- THEN the system MUST navigate to the appointments list
