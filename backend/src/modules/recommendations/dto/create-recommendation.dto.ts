/** DTO de `POST /recommendations` y valores válidos de `tipo` y `prioridad`. */
import { Transform } from "class-transformer";
import { IsIn, IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";

export const RECOMMENDATION_TYPES = [
  "sugerencia",
  "alerta",
  "observacion",
] as const;
export const RECOMMENDATION_PRIORITIES = ["baja", "media", "alta"] as const;

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

/** POST /recommendations (spec §10.5). */
export class CreateRecommendationDto {
  @IsUUID(undefined, { message: "El cliente es obligatorio." })
  cliente_id!: string;

  @Transform(trim)
  @IsString({ message: "El titulo es obligatorio." })
  @IsNotEmpty({ message: "El titulo es obligatorio." })
  @MaxLength(120, { message: "El titulo no puede superar los 120 caracteres." })
  titulo!: string;

  @Transform(trim)
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
