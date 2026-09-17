import { requestJson } from '../lib/api';
import { normalizeDateFilter } from '../safety/api';
import type {
  AnalyticsBundle,
  AnalyticsFilters,
  AnalyticsLatency,
  AnalyticsModels,
  AnalyticsOverview,
  AnalyticsTrends,
} from './types';

export function buildAnalyticsQuery(filters: AnalyticsFilters, includeBucket = false): string {
  const query = new URLSearchParams();
  const from = normalizeDateFilter(filters.from, false);
  const to = normalizeDateFilter(filters.to, true);
  if (from) query.set('from', from);
  if (to) query.set('to', to);
  if (includeBucket) query.set('bucket', filters.bucket);
  return query.toString();
}

export async function getAnalyticsBundle(
  token: string,
  filters: AnalyticsFilters,
  signal?: AbortSignal,
): Promise<AnalyticsBundle> {
  const rangeQuery = buildAnalyticsQuery(filters, false);
  const trendQuery = buildAnalyticsQuery(filters, true);
  const [overview, trends, models, latency] = await Promise.all([
    requestJson<AnalyticsOverview>(`analytics/overview?${rangeQuery}`, { method: 'GET', signal }, token),
    requestJson<AnalyticsTrends>(`analytics/trends?${trendQuery}`, { method: 'GET', signal }, token),
    requestJson<AnalyticsModels>(`analytics/models?${rangeQuery}`, { method: 'GET', signal }, token),
    requestJson<AnalyticsLatency>(`analytics/latency?${rangeQuery}`, { method: 'GET', signal }, token),
  ]);
  return { overview, trends, models, latency };
}
