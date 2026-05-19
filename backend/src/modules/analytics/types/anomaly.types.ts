// src/modules/analytics/types/anomaly.types.ts

export interface AnomalyResult {
  id: string;
  amount: number;
  merchant: string;
  date: string;
  categoryId: string;
  categoryName: string;
  zScore: number;
  reason: 'HIGH_ZSCORE' | 'ABOVE_95_PERCENTILE';
  anomalyScore: number;
}

export interface ZScoreResult {
  zScore: number;
  mean: number;
  stdev: number;
}

export interface PercentileResult {
  percentile: number;
  value: number;
}
