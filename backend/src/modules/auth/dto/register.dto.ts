import { IsEmail, IsEnum, IsString, MinLength } from "class-validator";

export enum UserRoleEnum {
  Cliente = "cliente",
  Asesor = "asesor",
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  fullName: string;

  @IsEnum(UserRoleEnum)
  role: UserRoleEnum;
}
