// src/modules/analytics/dto/consumption-highlights.dto.ts

import { Expose, Type } from 'class-transformer';
import { IsNumber, IsString, IsArray, ValidateNested } from 'class-validator';

export class MerchantFrequencyDto {
  @Expose()
  @IsString()
  merchant: string;

  @Expose()
  @IsNumber()
  count: number;
}

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
  @IsNumber()
  minExpense: number;

  @Expose()
  @IsNumber()
  uniqueMerchants: number;

  @Expose()
  @IsNumber()
  dayOfHighestExpense: number; // 1-7 (Monday-Sunday)

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MerchantFrequencyDto)
  topMerchants: MerchantFrequencyDto[];
}
