import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { ClientMessageType } from "./client-message-type.enum";

export class CreateClientMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsEnum(ClientMessageType)
  type?: ClientMessageType;
}
