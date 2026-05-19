import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class AssignClientProfileDto {
  @IsUUID()
  profileId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
