import { describe, expect, it } from 'vitest';

import { normalizeApiBaseUrl } from './config';

describe('normalizeApiBaseUrl', () => {
  it('removes trailing slashes and whitespace', () => {
    expect(normalizeApiBaseUrl('  http://localhost:3000/api/v1/// ')).toBe(
      'http://localhost:3000/api/v1',
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
