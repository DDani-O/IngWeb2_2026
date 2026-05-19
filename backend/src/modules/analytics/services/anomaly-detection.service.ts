// src/modules/analytics/services/anomaly-detection.service.ts

import { Injectable } from '@nestjs/common';
import { AnomalyResult, ZScoreResult } from '../types/anomaly.types';
import { ExpenseRecord } from '../types/consumption.types';
import { ANALYTICS_CONSTANTS } from '../constants/analytics.constants';

@Injectable()
export class AnomalyDetectionService {
  /**
   * Detectar gastos inusuales usando Z-score + Percentile
   */
  async detectAnomalies(expenses: ExpenseRecord[]): Promise<AnomalyResult[]> {
    if (expenses.length < ANALYTICS_CONSTANTS.MIN_RECORDS_FOR_ANOMALY) {
      return[];
    }

    const anomalies: AnomalyResult[] = [];
    const byCategory = this._groupByCategory(expenses);

    expenses.forEach((expense) => {
      const categoryExpenses = byCategory.get(expense.categoryId) || [];
      const amounts = categoryExpenses.map((e) => e.amount);

      // 1. Calcular Z-score
      const { zScore, mean, stdev } = this._calculateZScore(
        expense.amount,
        amounts,
      );

      // 2. Calcular percentil
      const percentile = this._calculatePercentile(
        expense.amount,
        amounts,
      );

      // 3. Detectar anomalía
      const isHighZScore = Math.abs(zScore) > ANALYTICS_CONSTANTS.ZSCORE_THRESHOLD;
      const isAbove95Percentile =
        percentile > ANALYTICS_CONSTANTS.PERCENTILE_THRESHOLD;

      if (isHighZScore || isAbove95Percentile) {
        const reason = isHighZScore
          ? 'HIGH_ZSCORE'
          : 'ABOVE_95_PERCENTILE';

        // Calcular anomaly score (0-1)
        const zsScoreContribution = Math.min(
          1,
          Math.abs(zScore) / ANALYTICS_CONSTANTS.ZSCORE_THRESHOLD,
        );
        const percentileContribution = percentile / 100;
        const anomalyScore = (zsScoreContribution + percentileContribution) / 2;

        anomalies.push({
          id: expense.id,
          amount: expense.amount,
          merchant: expense.merchant,
          date: expense.date,
          categoryId: expense.categoryId,
          categoryName: expense.categoryName,
          zScore,
          reason,
          anomalyScore: Math.min(1, anomalyScore),
        });
      }
    });

    // Retornar top anomalías
    return anomalies
      .sort((a, b) => b.anomalyScore - a.anomalyScore)
      .slice(0, ANALYTICS_CONSTANTS.MAX_UNUSUAL_EXPENSES_RETURNED);
  }

  /**
   * Agrupar gastos por categoría
   */
  private _groupByCategory(
    expenses: ExpenseRecord[],
  ): Map<string, ExpenseRecord[]> {
    const grouped = new Map<string, ExpenseRecord[]>();

    expenses.forEach((expense) => {
      if (!grouped.has(expense.categoryId)) {
        grouped.set(expense.categoryId, []);
      }
      grouped.get(expense.categoryId)!.push(expense);
    });

    return grouped;
  }

  /**
   * Calcular Z-score
   */
  private _calculateZScore(
    value: number,
    population: number[],
  ): ZScoreResult {
    if (population.length < 2) {
      return { zScore: 0, mean: value, stdev: 0 };
    }

    const mean = population.reduce((a, b) => a + b, 0) / population.length;
    const variance =
      population.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) /
      population.length;
    const stdev = Math.sqrt(variance);

    const zScore = stdev === 0 ? 0 : (value - mean) / stdev;

    return { zScore, mean, stdev };
  }

  /**
   * Calcular percentil (0-100)
   */
  private _calculatePercentile(value: number, population: number[]): number {
    if (population.length === 0) return 0;

    const sorted = [...population].sort((a, b) => a - b);
    const count = sorted.filter((x) => x <= value).length;

    return (count / sorted.length) * 100;
  }
}
