import { Transform } from "class-transformer";
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";
import { UserRole } from "../../../common/auth";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

/** Misma regla que `isStrongPassword` del front: mayúscula y número (ASCII). */
const PASSWORD_RULE_MESSAGE =
  "La contrasena debe tener al menos 8 caracteres, una mayuscula y un numero.";

/** POST /auth/register (spec §10.1). `matricula` y `especialidad` son obligatorios para asesores. */
export class RegisterDto {
  @Transform(trim)
  @IsString({ message: "El nombre es obligatorio." })
  @MinLength(2, { message: "El nombre debe tener al menos 2 caracteres." })
  @MaxLength(120, { message: "El nombre no puede superar los 120 caracteres." })
  nombre_completo!: string;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: "El email no es valido." })
  email!: string;

  @IsString({ message: "La contrasena es obligatoria." })
  @MinLength(8, { message: PASSWORD_RULE_MESSAGE })
  @Matches(/[A-Z]/, { message: PASSWORD_RULE_MESSAGE })
  @Matches(/\d/, { message: PASSWORD_RULE_MESSAGE })
  @MaxLength(72, {
    message: "La contrasena no puede superar los 72 caracteres.",
  })
  password!: string;

  @IsIn(["cliente", "asesor"], { message: "El rol debe ser cliente o asesor." })
  rol!: UserRole;

  @ValidateIf(
    (dto: RegisterDto) => dto.rol === "asesor" || dto.matricula !== undefined,
  )
  @Transform(trim)
  @IsString({ message: "La matricula es obligatoria para asesores." })
  @IsNotEmpty({ message: "La matricula es obligatoria para asesores." })
  @MaxLength(60, {
    message: "La matricula no puede superar los 60 caracteres.",
  })
  matricula?: string;

  @ValidateIf(
    (dto: RegisterDto) =>
      dto.rol === "asesor" || dto.especialidad !== undefined,
  )
  @Transform(trim)
  @IsString({ message: "La especialidad es obligatoria para asesores." })
  @IsNotEmpty({ message: "La especialidad es obligatoria para asesores." })
  @MaxLength(120, {
    message: "La especialidad no puede superar los 120 caracteres.",
  })
  especialidad?: string;
}
