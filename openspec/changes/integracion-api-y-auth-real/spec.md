# Delta Spec: Integración API Real y Auth

| Domain | Type | Existing Spec |
|--------|------|---------------|
| api-client | New | — |
| auth-integration | Delta | `openspec/specs/auth-screens/spec.md` |
| appointments-api | Delta | `openspec/specs/appointment-management/spec.md` |

Replaces all mock data with real API calls. Three-tier: client → endpoints → hooks.

---

## 1. api-client (New)

### Requirement: Fetch Wrapper

The system MUST provide a thin `fetch` wrapper in `src/api/client.ts` that injects auth headers and parses the API envelope.

#### Scenario: Successful request returns parsed data

- GIVEN the wrapper receives a config with `{ method, url, body, authenticated: true }`
- WHEN the request succeeds with 2xx
- THEN MUST return `{ data, response }` with the parsed JSON body

#### Scenario: Non-2xx raises ApiError

- GIVEN the server responds with a 4xx or 5xx
- WHEN the wrapper parses the error body
- THEN MUST throw `ApiError` with `{ error, message, statusCode, validationErrors? }`

#### Scenario: Unauthenticated request omits Authorization header

- GIVEN the config has `authenticated: false`
- WHEN the request is sent
- THEN MUST NOT include an `Authorization` header

### Requirement: Token Refresh with Dedup

The system MUST intercept 401 responses, attempt a transparent refresh, and retry the original request exactly once. Concurrent 401s MUST share a single refresh via `let refreshPromise`.

#### Scenario: Single 401 triggers refresh and retry

- GIVEN a valid access token expires mid-session
- WHEN the wrapper receives a 401
- THEN MUST call `POST /auth/refresh` with the stored refresh token
- AND retry the original request with the new access token

#### Scenario: Concurrent 401s share one refresh call

- GIVEN multiple requests fail with 401 simultaneously
- WHEN the wrapper dedup logic fires
- THEN `POST /auth/refresh` MUST be called exactly once
- AND all original requests MUST be retried with the new token

#### Scenario: Refresh failure logs out user

- GIVEN the refresh endpoint returns a 401
- WHEN the wrapper catches the refresh error
- THEN MUST clear both tokens
- AND transition the session to `unauthenticated`

### Requirement: Configuration

The system MUST load `BASE_URL` from `EXPO_PUBLIC_API_URL` env var. Default: `http://localhost:3000`.

---

## 2. auth-integration (Delta over auth-screens)

### MODIFIED Requirements

#### Login Screen

Login MUST call `POST /auth/login` and persist `accessToken` + `refreshToken` to SecureStore. Mock token creation is REMOVED.
(Previously: mock validation with hardcoded credentials)

**Scenario: Successful login stores tokens**

- GIVEN the user enters valid email/password
- WHEN the user taps submit
- THEN the system MUST call `POST /auth/login`
- AND store `accessToken` + `refreshToken` in SecureStore
- AND set session to `authenticated`

**Scenario: API error shows server message**

- GIVEN `POST /auth/login` returns 401 with `{ message: "Invalid credentials" }`
- WHEN the response is parsed
- THEN the system MUST display that error message inline
- AND the user MUST remain on the login screen

#### Register Screen

Register MUST call `POST /auth/register`. Mock session creation is REMOVED.
(Previously: mock session token creation)

**Scenario: Successful register creates session**

- GIVEN the user fills all fields with valid data
- WHEN the user taps submit
- THEN the system MUST call `POST /auth/register`
- AND store the returned tokens
- AND navigate to the home screen

#### Auth Context

The context MUST manage two tokens (`accessToken`, `refreshToken`), call `POST /auth/refresh` when expired, and call `POST /auth/logout` on sign-out.
(Previously: single mock token with SecureStore re-read)

**Scenario: Context initializes from stored tokens**

- GIVEN the app launches and both tokens exist in SecureStore
- WHEN the auth context initializes
- THEN session MUST transition to `authenticated`
- AND the access token MUST be available for API requests

**Scenario: Logout calls API and clears tokens**

- GIVEN the user is authenticated
- WHEN the user triggers logout
- THEN the system MUST call `POST /auth/logout`
- AND delete both tokens from SecureStore
- AND transition session to `unauthenticated`

### ADDED Requirements

#### Forgot-Password Calls API

The system MUST call `POST /auth/forgot-password` when the user submits their email.

**Scenario: Email sent shows confirmation**

- GIVEN the user enters a registered email
- WHEN the user taps submit
- THEN the system MUST call `POST /auth/forgot-password`
- AND display a confirmation message with a "Return to login" link

---

## 3. appointments-api (Delta over appointment-management)

### MODIFIED Requirements

#### Appointment List View

The list MUST fetch from `GET /appointments?status=&page=&limit=` via React Query with caching and `refetchOnFocus`. Mock data is REMOVED.
(Previously: client-side filter on mock array)

**Scenario: List fetches and caches appointments**

- GIVEN the user opens the appointments screen
- WHEN the screen renders
- THEN `useQuery` MUST call `GET /appointments`
- AND cache the result under key `['appointments', filters]`

**Scenario: Filter change triggers refetch**

- GIVEN the user switches from "Upcoming" to "Past"
- WHEN the filter changes
- THEN `useQuery` MUST refetch with the new `status` param
- AND the list MUST update

**Scenario: Empty API response shows empty state**

- GIVEN `GET /appointments` returns `{ data: [], meta: { total: 0 } }`
- WHEN the list renders
- THEN the system MUST display an empty state message
- AND provide a button to switch filters

#### Appointment Booking

Create MUST call `POST /appointments` and invalidate the list cache on success. Mock creation is REMOVED.
(Previously: mock appointment pushed to local array)

**Scenario: Booking calls API and invalidates cache**

- GIVEN the user completes all booking steps
- WHEN the user confirms
- THEN the system MUST call `POST /appointments`
- AND invalidate `['appointments']` query cache
- AND navigate to the detail screen of the created appointment

**Scenario: API error on create shows message**

- GIVEN `POST /appointments` returns a validation error
- WHEN the mutation fails
- THEN the system MUST display the server error message
- AND the user MUST remain on the booking flow

#### Appointment Detail

Detail MUST fetch from `GET /appointments/:id` via React Query. Mock lookup is REMOVED.
(Previously: mock data lookup by ID)

**Scenario: Valid ID fetches appointment detail**

- GIVEN the user navigates to `appointment/123`
- WHEN the screen renders
- THEN `useQuery` MUST call `GET /appointments/123`
- AND display doctor name, date, time, location, and status

**Scenario: 404 shows not-found state**

- GIVEN `GET /appointments/:id` returns 404
- WHEN the query errors
- THEN the system MUST display "Appointment not found"
- AND provide a button to return to the appointments list

### ADDED Requirements

#### React Query Provider

The root layout (`app/_layout.tsx`) MUST wrap children in `<QueryClientProvider>`. The `QueryClient` MUST configure `staleTime: 30_000` and `retry: 1`.

#### Cancel Appointment

The system MUST call `DELETE /appointments/:id` for cancellation and invalidate the list cache.

**Scenario: Cancel removes appointment from list**

- GIVEN the user views an upcoming appointment detail
- WHEN the user taps "Cancel"
- THEN the system MUST call `DELETE /appointments/:id`
- AND invalidate `['appointments']` cache
- AND the appointment MUST no longer appear in the upcoming list

---

## Data Contracts

```typescript
// API envelope
interface ApiResponse<T> { data: T }
interface ApiError {
  error: string; message: string; statusCode: number;
  validationErrors?: Record<string, string[]>;
}
interface PaginatedResponse<T> {
  data: T[]; meta: { total: number; page: number; limit: number; totalPages: number };
}

// Auth
interface LoginRequest { email: string; password: string }
interface RegisterRequest { name: string; email: string; password: string }
interface AuthResponse { accessToken: string; refreshToken: string; expiresIn: number; user: User }
interface User { id: string; name: string; email: string; role: 'patient' | 'doctor' | 'admin' }

// Appointments
interface AppointmentApi {
  id: string; doctor: { id: string; name: string; specialty: string };
  patientId: string; dateTime: string; status: string;
  location: string; notes?: string; createdAt: string; updatedAt: string;
}
```
