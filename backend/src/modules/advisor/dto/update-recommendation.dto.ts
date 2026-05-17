import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import {
  AdvisorRecommendationPriority,
  AdvisorRecommendationStatus,
} from "./advisor-recommendation-types.enum";

export class UpdateRecommendationDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  content?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.toLowerCase() : value))
  @IsEnum(AdvisorRecommendationPriority)
  priority?: AdvisorRecommendationPriority;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.toLowerCase() : value))
  @IsEnum(AdvisorRecommendationStatus)
  status?: AdvisorRecommendationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  icon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  problem?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  solution?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  savingsPotential?: number;

  @IsOptional()
  @IsArray()
  @MaxLength(120, { each: true })
  @IsString({ each: true })
  implementationSteps?: string[];
}
