import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";
import { AdvisorMessageType } from "./advisor-message-type.enum";

export class AdvisorMessagesQueryDto {
  @IsOptional()
  @IsUUID("4")
  clientId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  onlyUnread?: boolean;

  @IsOptional()
  @IsEnum(AdvisorMessageType)
  type?: AdvisorMessageType;
}
