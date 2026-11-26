import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

/** POST /auth/login (spec §10.1). */
export class LoginDto {
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: "El email no es valido." })
  email!: string;

  @IsString({ message: "La contrasena es obligatoria." })
  @IsNotEmpty({ message: "La contrasena es obligatoria." })
  password!: string;
}
