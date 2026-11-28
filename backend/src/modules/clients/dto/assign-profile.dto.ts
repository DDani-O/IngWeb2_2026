import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { TrimToNull } from "../../../common/validation/transforms";

/** PUT /clients/:id/spending-profile (spec §10.7): perfil elegido por el asesor. */
export class AssignProfileDto {
  @IsUUID(undefined, { message: "El perfil de gasto no existe." })
  perfil_id!: string;

  @IsOptional()
  @TrimToNull()
  @IsString({ message: "El motivo debe ser un texto." })
  @MaxLength(300, { message: "El motivo no puede superar los 300 caracteres." })
  motivo?: string | null;
}
