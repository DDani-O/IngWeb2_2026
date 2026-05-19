import {
  BadRequestException,
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
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
import { ConfirmTicketDto } from "./dto/confirm-ticket.dto";
import { TicketsService } from "./tickets.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("cliente")
@Controller("tickets")
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 8 * 1024 * 1024 },
      storage: undefined,
    }),
  )
  async uploadTicket(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) {
      throw new BadRequestException(
        "No se recibió ningún archivo. Enviá el campo 'file' como multipart/form-data.",
      );
    }
    return this.ticketsService.uploadAndProcess(file, user.sub);
  }

  @Post(":id/confirm")
  async confirmTicket(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ConfirmTicketDto,
  ) {
    return this.ticketsService.confirmTicket(id, user.sub, dto);
  }
}
