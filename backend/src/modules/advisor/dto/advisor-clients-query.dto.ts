import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class AdvisorClientsQueryDto {
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

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(["activo", "inactivo"])
  status?: string;

  @IsOptional()
  @IsIn(["low", "medium", "high"])
  risk?: string;

  @IsOptional()
  @IsString()
  profile?: string;

  @IsOptional()
  @IsIn(["gasto", "nombre", "actividad"])
  sortBy?: string;

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortDirection?: string;
}
