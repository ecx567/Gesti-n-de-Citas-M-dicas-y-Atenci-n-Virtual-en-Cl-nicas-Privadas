# Proposal: Integración API Real y Auth

## Intent

Replace 100% mock data with real API calls for auth and appointments. The app currently hardcodes mock responses — this blocks MVP validation because the real backend is the source of truth for credentials, scheduling, and data integrity.

## Scope

### In Scope
- Thin fetch wrapper in `src/api/client.ts` with 401→refresh→retry logic
- Auth endpoints: login, register, refresh, logout, forgot-password
- Appointments endpoints: list, get-by-id, create, cancel
- `@tanstack/react-query` v5 with QueryClientProvider in root layout
- Update `src/ctx.tsx` to call real API for login/register/logout
- `.env` file with `EXPO_PUBLIC_API_URL`

### Out of Scope
- Doctor role-based screens and routing (next change)
- Admin screens (future)
- Real API backend implementation (contract defined as TS types only)

## Capabilities

### New Capabilities
- `api-client`: Fetch wrapper, `ApiError` envelope, 401 token refresh dedup, and `BASE_URL` config

### Modified Capabilities
- `auth-screens`: Login/register/logout/forgot-password now call real endpoints; refresh token replaces SecureStore re-read
- `appointment-management`: All CRUD operations call real API; React Query handles caching and refetch

## Approach

Three-tier architecture:

| Layer | Module | Responsibility |
|-------|--------|----------------|
| Client | `src/api/client.ts` | Fetch wrapper, 401 intercept, token refresh dedup (`let refreshPromise`) |
| Endpoints | `src/api/auth/`, `src/api/appointments/` | Pure request builders, typed request/response contracts |
| Hooks | `src/hooks/useAppointments.ts` | React Query useQuery + useMutation, cache invalidation |

Auth context (`src/ctx.tsx`) calls endpoint functions directly. Tokens persist in SecureStore with memory fallback on web.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/api/` (6 files) | New | client, config, auth types+endpoints, appointments types+endpoints |
| `src/hooks/useAppointments.ts` | New | React Query wrappers for appointment CRUD |
| `src/ctx.tsx` | Modified | login/register/logout call real API; manage access+refresh tokens |
| `app/_layout.tsx` | Modified | Wrap with QueryClientProvider |
| `.env` | New | `EXPO_PUBLIC_API_URL=http://localhost:3000` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| SecureStore race on concurrent 401s | Low | `let refreshPromise` dedup pattern |
| SecureStore throws on web | Medium | try/catch fallback to in-memory store |
| Backend contract drifts from frontend | Medium | TS interfaces as single source of truth |
| react-query breaking version change | Low | Pin `@tanstack/react-query@5` exact |

## Rollback Plan

Revert the single commit. Delete `.env`, `src/api/`, `src/hooks/`. Restore `src/ctx.tsx` and `app/_layout.tsx` to originals.

## Dependencies

- `pnpm add @tanstack/react-query` (v5)

## Success Criteria

- [ ] Login calls `POST /auth/login` and stores `accessToken` + `refreshToken`
- [ ] 401 on any request triggers refresh and retries original request transparently
- [ ] Appointment list fetches from `GET /appointments` with React Query caching and refetchOnFocus
- [ ] Create appointment calls `POST /appointments` and invalidates the list cache
- [ ] All existing screens render without regressions — no mock data leaks
