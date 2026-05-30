// src/api/config.ts

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
export const TIMEOUT = 10_000; // 10s
export const STALE_TIME = 30_000; // 30s
export const RETRY_COUNT = 2;
