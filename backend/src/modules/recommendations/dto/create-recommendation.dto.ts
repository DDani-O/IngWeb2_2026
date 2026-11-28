/** DTO de `POST /recommendations` y valores válidos de `tipo` y `prioridad`. */
import { IsIn, IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";
import { Trim } from "../../../common/validation/transforms";

export const RECOMMENDATION_TYPES = [
  "sugerencia",
  "alerta",
  "observacion",
] as const;
export const RECOMMENDATION_PRIORITIES = ["baja", "media", "alta"] as const;

/** POST /recommendations (contrato §3.5, backend/README.md). */
export class CreateRecommendationDto {
  @IsUUID(undefined, { message: "El cliente es obligatorio." })
  cliente_id!: string;

  @Trim()
  @IsString({ message: "El titulo es obligatorio." })
  @IsNotEmpty({ message: "El titulo es obligatorio." })
  @MaxLength(120, { message: "El titulo no puede superar los 120 caracteres." })
  titulo!: string;

  @Trim()
  @IsString({ message: "El mensaje es obligatorio." })
  @IsNotEmpty({ message: "El mensaje es obligatorio." })
  @MaxLength(2000, {
    message: "El mensaje no puede superar los 2000 caracteres.",
  })
  mensaje!: string;

  @IsIn([...RECOMMENDATION_TYPES], {
    message: "Tipo de recomendacion invalido.",
  })
  tipo!: (typeof RECOMMENDATION_TYPES)[number];

  @IsIn([...RECOMMENDATION_PRIORITIES], { message: "Prioridad invalida." })
  prioridad!: (typeof RECOMMENDATION_PRIORITIES)[number];
}
