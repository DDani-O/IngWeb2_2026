import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  CurrentUser,
  JwtAuthGuard,
  JwtPayload,
  Roles,
  RolesGuard,
} from "../../common/auth";
import { TICKET_MAX_BYTES, TicketsService } from "./tickets.service";

/** Carga de tickets con OCR/IA (spec §10.4). */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("cliente")
@Controller("tickets")
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  /** Multipart con el campo `archivo`. Multer corta en 5 MB (el filtro lo responde como 422). */
  @Post("upload")
  @UseInterceptors(
    FileInterceptor("archivo", { limits: { fileSize: TICKET_MAX_BYTES } }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ticketsService.upload(file, user.sub);
  }
}
