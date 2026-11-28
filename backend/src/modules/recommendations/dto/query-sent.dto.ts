/** DTO de la query de recomendaciones enviadas. */
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";

/** Query de GET /recommendations/sent (contrato §3.5, backend/README.md). */
export class QuerySentRecommendationsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "El limite debe ser un numero entero." })
  @Min(1, { message: "El limite debe ser al menos 1." })
  @Max(100, { message: "El limite no puede superar 100." })
  limite?: number;

  @IsOptional()
  @IsUUID(undefined, { message: "El cliente no existe." })
  cliente_id?: string;
}
