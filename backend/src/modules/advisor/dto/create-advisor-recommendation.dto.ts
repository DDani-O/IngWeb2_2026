import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import {
  AdvisorRecommendationPriority,
  AdvisorRecommendationType,
} from "./advisor-recommendation-types.enum";

export class CreateAdvisorRecommendationDto {
  @IsUUID("4")
  clientId!: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  content!: string;

  @IsIn(["sugerencia", "alerta", "observacion"])
  type!: AdvisorRecommendationType;

  @IsOptional()
  @IsIn(["alta", "media", "baja"])
  priority?: AdvisorRecommendationPriority;

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
