export type AnalyticsWindow = {
  from: string;
  to: string;
};

export type AnalyticsOverview = {
  window: AnalyticsWindow;
  trips: {
    totalTrips: number;
    drivingHours: number;
  };
  events: {
    totalEvents: number;
    drowsinessEvents: number;
  };
  alerts: {
    totalAlerts: number;
    criticalAlerts: number;
    activeAlerts: number;
    avgAcknowledgeSeconds: number | null;
    avgResolutionSeconds: number | null;
  };
  feedback: {
    reviewedEvents: number;
    confirmed: number;
    falseAlarm: number;
    uncertain: number;
    falseAlarmRate: number | null;
  };
  riskDistribution: Array<{
    riskLevel: string;
    count: number;
  }>;
};

export type AnalyticsTrends = {
  window: AnalyticsWindow;
  bucket: 'day' | 'hour';
  items: Array<{
    bucket: string;
    safetyEvents: number;
    alerts: number;
  }>;
};

export type AnalyticsModelRow = {
  modelVersion: string | null;
  thresholdProfile: string | null;
  totalEvents: number;
  confirmed: number;
  falseAlarm: number;
  uncertain: number;
  avgInferenceLatencyMs: number | null;
  avgIngestionDelayMs: number | null;
};

export type AnalyticsModels = {
  window: AnalyticsWindow;
  items: AnalyticsModelRow[];
};

export type LatencyMetric = {
  samples: number;
  avgMs: number | null;
  p95Ms: number | null;
  note?: string;
};

export type AnalyticsLatency = {
  window: AnalyticsWindow;
  ingestion: LatencyMetric;
  eventToRisk: LatencyMetric;
  eventToInitialAlert: LatencyMetric;
  dashboardDelivery: LatencyMetric;
};

export type AnalyticsBundle = {
  overview: AnalyticsOverview;
  trends: AnalyticsTrends;
  models: AnalyticsModels;
  latency: AnalyticsLatency;
};

export type AnalyticsFilters = {
  from: string;
  to: string;
  bucket: 'day' | 'hour';
};
