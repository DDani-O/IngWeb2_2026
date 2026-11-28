/** Controller de `/tickets/upload`. */
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

/** Carga de tickets con OCR/IA (contrato §3.4, backend/README.md). */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("cliente")
@Controller("tickets")
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  /**
   * POST /tickets/upload: multipart con el campo `archivo`. Multer corta en 5 MB y el
   * filtro lo responde como 422; el tipo lo valida el servicio.
   */
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
