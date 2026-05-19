// src/modules/analytics/dto/monthly-evolution.dto.ts

import { Expose } from 'class-transformer';
import { IsNumber, IsString, IsOptional } from 'class-validator';

export class MonthlyEvolutionEntryDto {
  @Expose()
  @IsString()
  month: string; // YYYY-MM

  @Expose()
  @IsNumber()
  totalExpense: number;

  @Expose()
  @IsNumber()
  transactionCount: number;

  @Expose()
  @IsNumber()
  averagePerTransaction: number;

  @Expose()
  @IsNumber()
  @IsOptional()
  variationPercentage?: number | null; // null para primer mes

  @Expose()
  @IsNumber()
  trend: number; // 1 = up, -1 = down, 0 = stable
}
