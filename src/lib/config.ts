export function normalizeApiBaseUrl(value: string): string {
  const normalized = value.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(normalized)) {
    throw new Error('VITE_API_BASE_URL must use http:// or https://');
  }
  return normalized;
}

export function deriveRealtimeBaseUrl(apiBaseUrl: string): string {
  const url = new URL(normalizeApiBaseUrl(apiBaseUrl));
  url.search = '';
  url.hash = '';
  url.pathname = url.pathname.replace(/\/api\/v\d+$/i, '').replace(/\/+$/, '');
  return `${url.origin}${url.pathname}`;
}

const apiBaseUrl = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1',
);

export const appConfig = Object.freeze({
  apiBaseUrl,
  realtimeBaseUrl: deriveRealtimeBaseUrl(apiBaseUrl),
  webVersion: '0.3.0',
});
