// src/modules/analytics/dto/unusual-expense.dto.ts

import { Expose } from 'class-transformer';
import { IsNumber, IsString, IsUUID } from 'class-validator';

export class UnusualExpenseDto {
  @Expose()
  @IsUUID()
  expenseId: string;

  @Expose()
  @IsString()
  merchant: string;

  @Expose()
  @IsNumber()
  amount: number;

  @Expose()
  @IsString()
  category: string;

  @Expose()
  @IsString()
  date: string; // YYYY-MM-DD

  @Expose()
  @IsNumber()
  zScore: number;

  @Expose()
  @IsString()
  reason: string; // 'HIGH_ZSCORE' | 'ABOVE_95_PERCENTILE'

  @Expose()
  @IsNumber()
  anomalyScore: number; // 0-1 (confidence)

  @Expose()
  @IsNumber()
  categoryMean: number; // promedio histórico de la categoría
}
