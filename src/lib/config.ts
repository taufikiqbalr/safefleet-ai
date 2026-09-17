export function normalizeApiBaseUrl(value: string): string {
  const normalized = value.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(normalized)) {
    throw new Error('VITE_API_BASE_URL must use http:// or https://');
  }
  return normalized;
}

export const appConfig = Object.freeze({
  apiBaseUrl: normalizeApiBaseUrl(
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1',
  ),
  webVersion: '0.1.0',
});
