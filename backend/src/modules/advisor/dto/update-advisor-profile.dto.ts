import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  MaxLength,
  IsInt,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para actualizar el perfil del asesor.
 * Solo el asesor puede actualizar su propio perfil.
 * Campos editables: specialty, description, maxCapacity, phone, country
 */
export class UpdateAdvisorProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  specialty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  maxCapacity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  notifyEmail?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  notifyPush?: boolean;
}
