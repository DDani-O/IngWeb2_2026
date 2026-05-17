import { Transform, Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";
import {
  AdvisorRecommendationStatus,
  AdvisorRecommendationType,
} from "./advisor-recommendation-types.enum";

export class AdvisorRecommendationsQueryDto {
  @IsOptional()
  @IsUUID("4")
  clientId?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.toLowerCase() : value))
  @IsEnum(AdvisorRecommendationType)
  type?: AdvisorRecommendationType;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.toLowerCase() : value))
  @IsEnum(AdvisorRecommendationStatus)
  status?: AdvisorRecommendationStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
