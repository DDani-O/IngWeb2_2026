import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional } from "class-validator";

export enum ClientRecommendationStatus {
  Completada = "completada",
  Descartada = "descartada",
  Pendiente = "pendiente",
}

export class UpdateClientRecommendationDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.toLowerCase() : value))
  @IsEnum(ClientRecommendationStatus)
  status?: ClientRecommendationStatus;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
