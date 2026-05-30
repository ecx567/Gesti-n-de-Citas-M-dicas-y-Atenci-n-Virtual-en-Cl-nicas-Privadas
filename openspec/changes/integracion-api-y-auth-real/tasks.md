# Tasks: Integración API Real y Auth

**Cambio**: `integracion-api-y-auth-real`
**Estimación total**: ~780 líneas (520 implementación + 260 tests)

---

## Review Workload Forecast

| Métrica | Valor |
|---------|-------|
| Líneas estimadas cambiadas | ~780 |
| Budget de revisión | 400 líneas |
| Riesgo de budget | 🔴 Alto |
| PRs encadenados recomendados | Sí |
| Split sugerido | PR 1: Foundation (config, client, types, endpoints, hooks) |
| | PR 2: Integración (ctx, layout, screens, tests) |
| Estrategia de delivery | ask-on-risk |

---

## Fase 1 — Foundation (PR 1)

### T-1: Instalar dependencias
**Archivos**: `package.json`
**Qué**: `pnpm add @tanstack/react-query@5`
**Dependencias**: ninguna
**Aceptación**: `package.json` incluye `@tanstack/react-query` en dependencies
**Esfuerzo**: ~2 líneas

### T-2: Crear `.env`
**Archivos**: `.env`
**Qué**: `EXPO_PUBLIC_API_URL=http://localhost:3000`
**Dependencias**: ninguna
**Aceptación**: Archivo existe con la variable
**Esfuerzo**: ~1 línea

### T-3: Crear config.ts
**Archivos**: `src/api/config.ts`
**Qué**: Exportar `BASE_URL`, `TIMEOUT` (10s), `STALE_TIME` (30s), `RETRY_COUNT` (2)
**Dependencias**: ninguna
**Aceptación**: Módulo exporta las constantes con tipos
**Esfuerzo**: ~10 líneas

### T-4: Crear types de API
**Archivos**: `src/api/auth/types.ts`, `src/api/appointments/types.ts`
**Qué**:
- Auth: `LoginRequest`, `RegisterRequest`, `AuthResponse`, `User { id, name, email, role }`
- Appointments: `AppointmentApi`, `CreateAppointmentPayload`, `ApiResponse<T>`, `PaginatedResponse<T>`
**Dependencias**: ninguna
**Aceptación**: Tipos exportados, compilación `tsc --noEmit` pasa
**Esfuerzo**: ~40 líneas

### T-5: Crear ApiError class
**Archivos**: `src/api/client.ts` (parte 1)
**Qué**: Clase `ApiError extends Error` con `error`, `message`, `statusCode`, `validationErrors`
**Dependencias**: ninguna
**Aceptación**: `new ApiError(...)` captura correctamente los campos
**Esfuerzo**: ~15 líneas

---

## Fase 2 — API Client Core (PR 1)

### T-6: Fetch wrapper con auth y 401→refresh→retry
**Archivos**: `src/api/client.ts` (parte 2)
**Qué**:
- Función `apiClient<T>(config)` que:
  - Inyecta `Authorization: Bearer <token>` si `authenticated: true`
  - Parsea response JSON
  - Lanza `ApiError` en no-2xx
  - Timeout con AbortController
  - 401 → promise dedup (module-level `let refreshPromise`)
  - Retry original request con nuevo token
- `tokenStore` in-memory (`let accessToken`, `let refreshToken`, `setTokens()`, `clearTokens()`)
- `initializeTokens()` para leer desde SecureStore al arranque
**Dependencias**: T-5 (ApiError), T-3 (config)
**Aceptación**: Tests unitarios pasan: request exitoso, 401→refresh→retry, refresh falla→logout
**Esfuerzo**: ~80 líneas

---

## Fase 3 — API Endpoints (PR 1)

### T-7: Auth endpoints
**Archivos**: `src/api/auth/endpoints.ts`
**Qué**:
```typescript
login(data: LoginRequest) => Promise<AuthResponse>
register(data: RegisterRequest) => Promise<AuthResponse>
refreshToken(refreshToken: string) => Promise<{ accessToken, refreshToken, expiresIn }>
logout(refreshToken: string) => Promise<void>
forgotPassword(email: string) => Promise<{ message }>
```
**Dependencias**: T-4 (types), T-6 (client)
**Aceptación**: Cada función llama a `apiClient` con URL, método, y body correctos
**Esfuerzo**: ~40 líneas

### T-8: Appointments endpoints
**Archivos**: `src/api/appointments/endpoints.ts`
**Qué**:
```typescript
fetchAppointments(params?: { status?, page?, limit? }) => Promise<PaginatedResponse<AppointmentApi>>
fetchAppointment(id: string) => Promise<ApiResponse<AppointmentApi>>
createAppointment(payload: CreateAppointmentPayload) => Promise<ApiResponse<AppointmentApi>>
cancelAppointment(id: string) => Promise<void>
```
**Dependencias**: T-4 (types), T-6 (client)
**Aceptación**: Cada función llama a `apiClient` con URL y método correctos
**Esfuerzo**: ~40 líneas

---

## Fase 4 — React Query Hooks (PR 1)

### T-9: Crear hooks de appointments
**Archivos**: `src/hooks/useAppointments.ts`
**Qué**:
- `useAppointments(filters?)` — `useQuery` con key `['appointments', filters]`, staleTime 30s, refetchOnFocus
- `useAppointment(id)` — `useQuery` con key `['appointments', id]`
- `useCreateAppointment()` — `useMutation` que invalida `['appointments']` en success
- `useCancelAppointment()` — `useMutation` que invalida `['appointments']` en success
- Mapeo API→Domain: `AppointmentApi` → `Appointment` (applanar doctor.name, doctor.specialty, derivar date/time de dateTime)
**Dependencias**: T-8 (appointments endpoints)
**Aceptación**: Hook devuelve `{ data, isLoading, error }`; mutation invalida cache
**Esfuerzo**: ~70 líneas

---

## Fase 5 — Integración (PR 2)

### T-10: QueryClientProvider en root layout `[x]`
**Archivos**: `src/app/_layout.tsx`
**Qué**: Envolver children con `<QueryClientProvider>`; crear `QueryClient` con defaultOptions (staleTime, retry)
**Dependencias**: T-1 (deps instaladas)
**Aceptación**: App renderiza sin errores, React Query disponible en toda la app
**Esfuerzo**: ~10 líneas

### T-11: Actualizar AuthContext (ctx.tsx) `[x]`
**Archivos**: `src/ctx.tsx`
**Qué**:
- En `init`: leer accessToken + refreshToken de SecureStore → `initializeTokens()`
- `login()`: llama `POST /auth/login`, store tokens en SecureStore + tokenStore, set session
- `register()`: llama `POST /auth/register`, store tokens, set session
- `logout()`: llama `POST /auth/logout`, limpia SecureStore + tokenStore, set unauthenticated
- Eliminar mock token logic (`MOCK_TOKEN`, `mock-token-vitacitas`)
- Actualizar `SessionState` a `'loading' | 'authenticated' | 'unauthenticated'` (se mantiene igual)
- Mantener interfaz `AuthContextValue` igual para no romper screens
**Dependencias**: T-7 (auth endpoints), T-6 (client tokenStore)
**Aceptación**: Login llama endpoint real, logout llama endpoint real, init lee tokens reales
**Esfuerzo**: ~60 líneas

### T-12: Limpiar tipos mock `[x]`
**Archivos**: `src/types/appointment.ts`
**Qué**: Eliminar funciones `getAppointments`, `getAppointmentById`, `addAppointment`; conservar solo tipos de dominio `Appointment`, `AppointmentStatus`, `MockAppointment`
**Dependencias**: T-9 (hooks reemplazan funciones mock)
**Aceptación**: No hay más referencias a funciones mock desde screens
**Esfuerzo**: ~10 líneas

### T-13: Actualizar AppointmentsScreen `[x]`
**Archivos**: `src/app/(app)/appointments.tsx`
**Qué**: Reemplazar `useMemo(() => filterAppointments(activeFilter), ...)` por `useAppointments(activeFilter)`; agregar loading state con ActivityIndicator; eliminar import de `getAppointments`
**Dependencias**: T-9 (hooks)
**Aceptación**: Lista de citas carga desde API con React Query, filtros funcionan, loading state visible
**Esfuerzo**: ~30 líneas

### T-14: Actualizar BookAppointmentScreen `[x]`
**Archivos**: `src/app/(app)/book-appointment.tsx`
**Qué**: Reemplazar `addAppointment({...})` síncrono por `useCreateAppointment()` + await; mostrar error de API inline; navegar a detalle después de crear
**Dependencias**: T-9 (hooks)
**Aceptación**: Booking crea cita via API, cache se invalida, error se muestra inline
**Esfuerzo**: ~30 líneas

---

## Fase 6 — Testing (PR 2)

### T-15: Test client.ts `[x]`
**Archivos**: `src/api/__tests__/client.test.ts`
**Qué**:
- Mockear `global.fetch`
- Test: request exitoso retorna data
- Test: 4xx lanza ApiError con campos correctos
- Test: 401→refresh exitoso retry original request
- Test: 401→refresh fallido limpia tokens y lanza error
- Test: request sin auth no incluye Authorization header
**Dependencias**: T-6 (client implementado)
**Aceptación**: Todos los tests pasan
**Esfuerzo**: ~80 líneas

### T-16: Test endpoints `[x]`
**Archivos**: `src/api/__tests__/endpoints.test.ts`
**Qué**: Testear que cada endpoint construye la URL, método y body correctos
**Dependencias**: T-7, T-8 (endpoints implementados)
**Aceptación**: Tests pasan
**Esfuerzo**: ~80 líneas

### T-17: Test hooks `[x]`
**Archivos**: `src/hooks/__tests__/useAppointments.test.ts`
**Qué**: Usar `renderHook` con QueryClientProvider wrapper; testear query key, loading state, error state
**Dependencias**: T-9 (hooks implementados)
**Aceptación**: Tests pasan
**Esfuerzo**: ~60 líneas

### T-18: Test AuthContext `[x]`
**Archivos**: `src/__tests__/ctx.test.tsx`
**Qué**: Mockear SecureStore y endpoints; testear init, login, logout flow
**Dependencias**: T-11 (ctx implementado)
**Aceptación**: Tests pasan
**Esfuerzo**: ~40 líneas

---

## Resumen de implementación

| PR | Fases | Archivos | Líneas est. |
|----|-------|----------|-------------|
| PR 1 | Fase 1-4 (Foundation → Hooks) | 9 nuevos + package.json | ~300 |
| PR 2 | Fase 5-6 (Integración → Tests) | 6 modificados + 4 tests | ~480 |

## Rollback Plan

1. Revertir `package.json` (remover `@tanstack/react-query`)
2. Eliminar archivos nuevos: `src/api/*`, `src/hooks/useAppointments.ts`, `.env`
3. Revertir cambios en `src/ctx.tsx`, `src/app/_layout.tsx`, `src/types/appointment.ts`, screens
4. `pnpm install` para restaurar estado de dependencias

## Notas

- Las open questions se resolvieron: timeout 10s, staleTime 30s, retry 2, logout con auth header + body, refresh con body
- Sin feature flag — reemplazo atómico
- `role` definido como `'patient' | 'doctor' | 'admin'` para expansión futura
