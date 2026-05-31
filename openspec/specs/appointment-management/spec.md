# Appointment Management Specification

## Purpose

Defines appointment CRUD screens: a filterable list view, a booking flow, and a dynamic detail screen by appointment ID. Uses mock data rendered via appointment cards with status badges.

## Requirements

### Requirement: Appointment List View

The system MUST display a list of appointments filterable by status: upcoming, past, and cancelled.

#### Scenario: Upcoming filter shows future appointments

- GIVEN the user is on the appointments list screen
- WHEN the user selects the "Upcoming" filter
- THEN the system MUST display only appointments with a future date
- AND each item MUST show doctor name, date, time, and status badge

#### Scenario: No appointments in filter shows empty state

- GIVEN the user selects a filter with no matching appointments
- WHEN the list renders
- THEN the system MUST display an empty state message
- AND provide a button to switch to a different filter

#### Scenario: Past filter shows only completed appointments

- GIVEN the user is on the appointments list screen
- WHEN the user selects the "Past" filter
- THEN the system MUST display only appointments with a past date

### Requirement: Appointment Booking Flow

The system MUST provide a multi-step booking flow that collects specialty, doctor, date, and time to create a mock appointment.

#### Scenario: Booking flow completes successfully

- GIVEN the user starts the booking flow
- WHEN the user completes all required steps
- THEN the system MUST create a mock appointment
- AND navigate to the appointment detail screen for the new appointment

#### Scenario: Booking flow can be cancelled

- GIVEN the user started the booking flow
- WHEN the user taps the back button on any step
- THEN the system MUST return to the previous screen
- AND MUST NOT create a mock appointment

### Requirement: Appointment Cancellation

The system MUST allow the user to cancel an appointment from the detail screen with a confirmation dialog, wired to the real `cancelAppointment(id)` API.

#### Scenario: Cancel with confirmation calls API and updates status

- GIVEN the user is on the appointment detail screen for a confirmed appointment
- WHEN the user taps the cancel button and confirms the dialog
- THEN the system MUST show a loading spinner
- AND call `cancelAppointment(id)`
- AND on success update the appointment status to "cancelled"

#### Scenario: Dismiss confirmation cancels no-op

- GIVEN the user taps the cancel button
- WHEN the user dismisses or cancels the confirmation dialog
- THEN the system MUST NOT call the API
- AND the detail screen MUST remain unchanged

#### Scenario: Cancel API error shows message

- GIVEN the user confirms cancellation
- WHEN the `cancelAppointment` API returns an error (already cancelled, network failure)
- THEN the system MUST display an error message
- AND the detail screen MUST remain unchanged

### Requirement: Dynamic Appointment Detail

The system MUST render a detail screen at `appointment/[id].tsx` that displays full appointment information based on the route parameter.

#### Scenario: Valid ID renders appointment details

- GIVEN the user navigates to `appointment/123`
- WHEN the screen renders
- THEN the system MUST display the appointment with ID 123
- AND show doctor name, date, time, location, and status

#### Scenario: Unknown ID shows not-found state

- GIVEN the user navigates to an appointment ID that does not exist
- WHEN the screen renders
- THEN the system MUST display a "Appointment not found" message
- AND provide a button to return to the appointments list

#### Scenario: Cancel button visible for confirmed appointments

- GIVEN the appointment status is "confirmed"
- WHEN the detail screen renders
- THEN a cancel button MUST be visible

#### Scenario: Cancel button hidden for cancelled or completed

- GIVEN the appointment status is "cancelled" or "completed"
- WHEN the detail screen renders
- THEN the cancel button MUST NOT be visible

### Requirement: Appointment Card Component

The system MUST provide a reusable appointment card component displaying doctor name, date, time, and a color-coded status badge.

#### Scenario: Status badge colors reflect status

- GIVEN an appointment card renders
- WHEN the status is "confirmed"
- THEN the badge MUST display a green indicator

#### Scenario: Card is pressable

- GIVEN an appointment card is rendered
- WHEN the user taps the card
- THEN the system MUST navigate to `appointment/{id}`
