// src/modules/analytics/dto/consumption-highlights.dto.ts

import { Expose } from 'class-transformer';
import { IsNumber, IsString, IsOptional } from 'class-validator';

export class ConsumptionHighlightsDto {
  @Expose()
  @IsNumber()
  totalExpense: number;

  @Expose()
  @IsNumber()
  averageExpense: number;

  @Expose()
  @IsNumber()
  transactionCount: number;

  @Expose()
  @IsNumber()
  uniqueCategories: number;

  @Expose()
  @IsNumber()
  maxExpense: number;

  @Expose()
  @IsString()
  @IsOptional()
  mostFrequentMerchant: string | null;

  @Expose()
  @IsNumber()
  dayOfHighestExpense: number; // 1-7 (Monday-Sunday)

  @Expose()
  @IsNumber()
  minExpense?: number;

  @Expose()
  @IsNumber()
  uniqueMerchants?: number;
}
