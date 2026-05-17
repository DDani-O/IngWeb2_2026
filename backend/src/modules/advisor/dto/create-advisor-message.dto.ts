import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { AdvisorMessageType } from "./advisor-message-type.enum";

export class CreateAdvisorMessageDto {
  @IsUUID("4")
  clientId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsEnum(AdvisorMessageType)
  type?: AdvisorMessageType;
}
