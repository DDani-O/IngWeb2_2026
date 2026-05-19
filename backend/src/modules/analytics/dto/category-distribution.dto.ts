// src/modules/analytics/dto/category-distribution.dto.ts

import { Expose } from 'class-transformer';
import { IsNumber, IsString, IsUUID } from 'class-validator';

export class CategoryDistributionDto {
  @Expose()
  @IsUUID()
  categoryId: string;

  @Expose()
  @IsString()
  categoryName: string;

  @Expose()
  @IsNumber()
  amount: number;

  @Expose()
  @IsNumber()
  percentage: number;

  @Expose()
  @IsNumber()
  transactionCount: number;

  @Expose()
  @IsNumber()
  averagePerTransaction: number;

  @Expose()
  @IsNumber()
  ranking: number; // 1 = highest spending
}
