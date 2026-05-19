import { IsString, IsNumber, IsDateString, IsUUID, IsOptional, IsPositive, MinLength, MaxLength } from "class-validator";
import { Type } from "class-transformer";

export class ConfirmTicketDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  comercio: string;

  @IsDateString()
  fecha: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  monto: number;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;
}
