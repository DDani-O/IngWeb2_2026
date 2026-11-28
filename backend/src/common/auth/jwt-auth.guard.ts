/** Guard de sesión: exige un JWT válido y vigente (401 si falta o venció). */
import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/** Delegado en `JwtStrategy`; el control de rol lo hace `RolesGuard`. */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
