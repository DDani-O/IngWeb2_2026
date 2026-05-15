import { Transform, Type } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  MinLength,
  ValidateIf,
} from "class-validator";

export enum UserRoleEnum {
  Cliente = "cliente",
  Asesor = "asesor",
}

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @Transform(({ value }) => (value === "usuario" ? "cliente" : value))
  @IsEnum(UserRoleEnum)
  role!: UserRoleEnum;

  @ValidateIf((dto) => dto.role === UserRoleEnum.Asesor)
  @IsString()
  @IsNotEmpty()
  licenseNumber!: string;

  @ValidateIf((dto) => dto.role === UserRoleEnum.Asesor)
  @IsString()
  @IsNotEmpty()
  specialty!: string;

  @ValidateIf((dto) => dto.role === UserRoleEnum.Asesor)
  @IsOptional()
  @IsString()
  description?: string;

  @ValidateIf((dto) => dto.role === UserRoleEnum.Cliente)
  @IsOptional()
  @IsString()
  occupation?: string;

  @ValidateIf((dto) => dto.role === UserRoleEnum.Cliente)
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedIncome?: number;

  @ValidateIf((dto) => dto.role === UserRoleEnum.Cliente)
  @IsOptional()
  @IsString()
  financialGoal?: string;

  @ValidateIf((dto) => dto.role === UserRoleEnum.Cliente)
  @IsOptional()
  @IsString()
  @Length(3, 3)
  preferredCurrency?: string;
}
