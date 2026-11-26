import { Transform } from "class-transformer";
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

/**
 * PUT /auth/profile (spec §10.1). Los campos de cada rol se controlan en UsersService:
 * cliente → ocupacion, ingreso_estimado, objetivo_financiero; asesor → matricula, especialidad, descripcion.
 */
export class UpdateProfileDto {
  @Transform(trim)
  @IsString({ message: "El nombre es obligatorio." })
  @MinLength(2, { message: "El nombre debe tener al menos 2 caracteres." })
  @MaxLength(120, { message: "El nombre no puede superar los 120 caracteres." })
  nombre_completo!: string;

  @IsOptional()
  @Transform(trim)
  @IsString({ message: "La biografia debe ser texto." })
  @MaxLength(500, {
    message: "La biografia no puede superar los 500 caracteres.",
  })
  biografia?: string;

  @IsOptional()
  @Transform(trim)
  @IsString({ message: "La ocupacion debe ser texto." })
  @MaxLength(120, {
    message: "La ocupacion no puede superar los 120 caracteres.",
  })
  ocupacion?: string;

  @IsOptional() // null limpia el valor
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: "El ingreso estimado debe ser un numero." },
  )
  @Min(0, { message: "El ingreso estimado no puede ser negativo." })
  ingreso_estimado?: number | null;

  @IsOptional()
  @Transform(trim)
  @IsString({ message: "El objetivo financiero debe ser texto." })
  @MaxLength(300, {
    message: "El objetivo financiero no puede superar los 300 caracteres.",
  })
  objetivo_financiero?: string;

  @IsOptional()
  @Transform(trim)
  @IsString({ message: "La matricula debe ser texto." })
  @MaxLength(60, {
    message: "La matricula no puede superar los 60 caracteres.",
  })
  matricula?: string;

  @IsOptional()
  @Transform(trim)
  @IsString({ message: "La especialidad debe ser texto." })
  @MaxLength(120, {
    message: "La especialidad no puede superar los 120 caracteres.",
  })
  especialidad?: string;

  @IsOptional()
  @Transform(trim)
  @IsString({ message: "La descripcion debe ser texto." })
  @MaxLength(500, {
    message: "La descripcion no puede superar los 500 caracteres.",
  })
  descripcion?: string;
}
