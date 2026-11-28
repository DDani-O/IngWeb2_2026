import { Transform } from "class-transformer";
import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

/** Texto recortado; un motivo vacío se guarda como `null`. */
const trimToNull = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() || null : value;

/** PUT /clients/:id/spending-profile (spec §10.7): perfil elegido por el asesor. */
export class AssignProfileDto {
  @IsUUID(undefined, { message: "El perfil de gasto no existe." })
  perfil_id!: string;

  @IsOptional()
  @Transform(trimToNull)
  @IsString({ message: "El motivo debe ser un texto." })
  @MaxLength(300, { message: "El motivo no puede superar los 300 caracteres." })
  motivo?: string | null;
}
