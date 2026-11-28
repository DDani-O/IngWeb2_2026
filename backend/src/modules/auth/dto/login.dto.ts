import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { TrimLowercase } from "../../../common/validation/transforms";

/** POST /auth/login (contrato §3.1, backend/README.md). */
export class LoginDto {
  @TrimLowercase()
  @IsEmail({}, { message: "El email no es valido." })
  email!: string;

  @IsString({ message: "La contrasena es obligatoria." })
  @IsNotEmpty({ message: "La contrasena es obligatoria." })
  password!: string;
}
