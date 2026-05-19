// src/modules/analytics/dto/consumption-analysis.dto.ts

import { Expose, Type } from 'class-transformer';
import { IsNumber, IsObject, IsArray, IsString } from 'class-validator';
import { ConsumptionHighlightsDto } from './consumption-highlights.dto';
import { CategoryDistributionDto } from './category-distribution.dto';
import { MonthlyEvolutionEntryDto } from './monthly-evolution.dto';
import { UnusualExpenseDto } from './unusual-expense.dto';

export class ConsumptionAnalysisDto {
  @Expose()
  @Type(() => ConsumptionHighlightsDto)
  @IsObject()
  highlights: ConsumptionHighlightsDto;

  @Expose()
  @Type(() => CategoryDistributionDto)
  @IsArray()
  categoryDistribution: CategoryDistributionDto[];

  @Expose()
  @Type(() => MonthlyEvolutionEntryDto)
  @IsArray()
  monthlyEvolution: MonthlyEvolutionEntryDto[];

  @Expose()
  @Type(() => UnusualExpenseDto)
  @IsArray()
  unusualExpenses: UnusualExpenseDto[];

  @Expose()
  @IsString()
  periodStart: string; // YYYY-MM-DD

  @Expose()
  @IsString()
  periodEnd: string; // YYYY-MM-DD

  @Expose()
  @IsNumber()
  generatedAt: number; // timestamp
}
