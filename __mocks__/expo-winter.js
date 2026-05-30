/**
 * Mock for expo/src/winter.
 *
 * expo/src/winter installs WinterCG globals (TextDecoder, URL, fetch, etc.)
 * on globalThis via lazy getters that call require() when accessed.
 *
 * Jest 30's throwIfBetweenTests guard blocks require() calls during
 * module setup (between tests), so these lazy getters fail.
 *
 * Since Node.js 25 already has all WinterCG globals (TextDecoder, URL,
 * URLSearchParams, DOMException, structuredClone, fetch, FormData), we
 * skip the expo winter polyfill entirely. The globals are already there.
 */
// No-op — globalThis already has everything Node.js provides natively.
