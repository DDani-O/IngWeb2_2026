import { Module } from "@nestjs/common";
import { SupabaseModule } from "../../common/supabase/supabase.module";
import { TicketsController } from "./tickets.controller";
import { TicketsService } from "./tickets.service";
import { OcrService } from "./ocr.service";

@Module({
  imports: [SupabaseModule],
  controllers: [TicketsController],
  providers: [TicketsService, OcrService],
})
export class TicketsModule {}
