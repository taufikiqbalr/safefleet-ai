import { describe, expect, it } from 'vitest';

import { buildAnalyticsQuery } from './api';

describe('W4 analytics query', () => {
  it('serializes range and trend bucket', () => {
    const query = new URLSearchParams(buildAnalyticsQuery({
      from: '2026-09-01',
      to: '2026-09-17',
      bucket: 'day',
    }, true));

    expect(Date.parse(query.get('from') ?? '')).not.toBeNaN();
    expect(Date.parse(query.get('to') ?? '')).not.toBeNaN();
    expect(query.get('bucket')).toBe('day');
  });

  it('does not send bucket to range-only endpoints', () => {
    const query = new URLSearchParams(buildAnalyticsQuery({
      from: '2026-09-01',
      to: '2026-09-17',
      bucket: 'hour',
    }));
    expect(query.has('bucket')).toBe(false);
  });
});
