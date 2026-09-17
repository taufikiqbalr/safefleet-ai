import { describe, expect, it } from 'vitest';

import { deriveRealtimeBaseUrl, normalizeApiBaseUrl } from './config';

describe('normalizeApiBaseUrl', () => {
  it('removes trailing slashes and whitespace', () => {
    expect(normalizeApiBaseUrl('  http://localhost:6100/api/v1/// ')).toBe(
      'http://localhost:6100/api/v1',
    );
  });

  it('accepts https URLs', () => {
    expect(normalizeApiBaseUrl('https://api.example.com/api/v1')).toBe(
      'https://api.example.com/api/v1',
    );
  });

  it('rejects non-http protocols', () => {
    expect(() => normalizeApiBaseUrl('file:///tmp/backend')).toThrow(
      'VITE_API_BASE_URL must use http:// or https://',
    );
  });
});

describe('deriveRealtimeBaseUrl', () => {
  it('removes the versioned API suffix for Socket.IO', () => {
    expect(deriveRealtimeBaseUrl('http://localhost:6100/api/v1')).toBe('http://localhost:6100');
    expect(deriveRealtimeBaseUrl('https://example.com/safefleet/api/v2')).toBe('https://example.com/safefleet');
  });
});
