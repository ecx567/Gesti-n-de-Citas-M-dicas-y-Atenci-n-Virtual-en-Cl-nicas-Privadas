# Archive Report: Conexión Real al Backend

**Change**: conexion-real-al-backend
**Date archived**: 2026-05-30
**Persistence mode**: hybrid

---

## Executive Summary

Change 3 "conexion-real-al-backend" removed all mock data gates and wired the remaining 6 screens to real API calls. Auth context now exposes `user` from `AuthResponse`, login/forgot-password call real endpoints, home screen uses `useAppointments` hook, appointment detail supports cancellation, and profile shows real user data. All 9 tasks completed, 40/40 tests pass.

## What Was Done

| Task | File | Description |
|------|------|-------------|
| 1.1 | `src/ctx.tsx` | Added `user` state, stored from login/register, nulled on logout, exposed in `AuthContextValue` |
| 1.2 | `src/__tests__/ctx.test.tsx` | Updated `TestConsumer`, added 3 user state transition tests |
| 2.1 | `src/app/(auth)/login.tsx` | Removed `MOCK_EMAIL`/`MOCK_PASSWORD` constants and mock credential check block |
| 2.2 | `src/app/(auth)/forgot-password.tsx` | Wired to real `forgotPassword()` API, added error state + banner |
| 3.1 | `src/app/(app)/(patient)/home.tsx` | Replaced mock data with `useAuth()` + `useAppointments()`, fixed navigation, added loading/error/empty states |
| 3.2 | `src/app/(app)/appointment/[id].tsx` | Added cancel button with confirmation dialog, wired to `useCancelAppointment()`, loading/error states |
| 3.3 | `src/app/(app)/profile.tsx` | Replaced hardcoded mock data with user from context, added role badge, removed phone |
| 4.1 | `src/hooks/__tests__/useAppointments.test.tsx` | Added `useCancelAppointment` tests: mutation success and error |
| 4.2 | `src/__tests__/home.test.tsx` | Tests for loading, data display, empty, error, user greeting, null user |

## Files Changed (Total: 11)

| File | Action |
|------|--------|
| `src/ctx.tsx` | Modified — Auth context user exposure |
| `src/__tests__/ctx.test.tsx` | Modified — User state transition tests |
| `src/app/(auth)/login.tsx` | Modified — Mock gate removal |
| `src/app/(auth)/forgot-password.tsx` | Modified — Real API wiring |
| `src/app/(app)/(patient)/home.tsx` | Modified — Real data + navigation fix |
| `src/app/(app)/appointment/[id].tsx` | Modified — Cancel button + confirmation |
| `src/app/(app)/profile.tsx` | Modified — Real user data display |
| `src/hooks/__tests__/useAppointments.test.tsx` | Modified — Cancel mutation tests |
| `src/__tests__/home.test.tsx` | Created — Home screen render tests |
| `jest.config.js` | Modified — Vector icons moduleNameMapper |
| `__mocks__/@expo/vector-icons.js` | Created — Ionicons mock for tests |

## Test Results

**40 passed / 0 failed / 0 skipped** across 5 test suites.

| Suite | Tests | Coverage |
|-------|-------|----------|
| `src/__tests__/ctx.test.tsx` | 7 | ctx.tsx: 82.75% stmts |
| `src/__tests__/home.test.tsx` | 6 | home.tsx: 88% stmts |
| `src/hooks/__tests__/useAppointments.test.tsx` | 7 | useAppointments.ts: 95.83% stmts |
| `src/api/__tests__/endpoints.test.ts` | pre-existing | — |
| `src/api/__tests__/client.test.ts` | pre-existing | — |

## Verdict

**PASS WITH WARNINGS** — All core behavioral changes verified via tests or source inspection. Auth context, home screen, and hooks have full coverage. Login, forgot-password, appointment detail cancel UI, and profile screens lack component-level tests (verified by source only).

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| `auth-screens` | Updated | Login: mock gate removed, API error added; Register: real API, user in context; Forgot-Password: real API call, error banner; Auth Context: user field added to context value |
| `auth-context` | Created | New domain spec — `user: User | null` exposure, lifecycle scenarios (login, register, logout, cold start) |
| `patient-home` | Updated | Greeting from user context; appointments via `useAppointments()` hook; navigation fixed; loading/error states |
| `appointment-management` | Updated | Added Appointment Cancellation requirement (confirmation dialog, API call, loading/error states); cancel button visibility rules on detail screen |
| `profile-screen` | Updated | Patient info from auth context (user.name, user.email, user.role); phone number removed; null user guard |

## Archive Contents

- proposal.md ✅
- spec.md ✅
- design.md ✅
- tasks.md ✅ (9/9 tasks complete)
- apply-progress.md ✅
- verify-report.md ✅
- archive-report.md ✅ (this file)

## Open Items

- ⚠️ No component tests for 4 of 6 changed screens (login, forgot-password, appointment detail, profile) — verified by source only
- ⚠️ Cancel button UI state machine (spinner, error text) not tested at component level
- ⚠️ Forgot-password success/error branches not tested at component level
- 💡 Suggestion: add `[id].tsx` cancel flow component tests, `profile.tsx` render test, and navigation assertions in `home.test.tsx`

## SDD Cycle Complete

The change has been fully planned, implemented, verified, and archived.
