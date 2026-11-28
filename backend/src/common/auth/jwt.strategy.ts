/** Estrategia de Passport para el JWT propio (header `Authorization: Bearer`). */
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { JwtPayload } from "./auth.types";

/** Verifica la firma con `JWT_SECRET` y el vencimiento; rechaza tokens vencidos. */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_SECRET"),
    });
  }

  /**
   * El payload ya viene verificado: se usa tal cual como `request.user`. No se relee la
   * BD en cada pedido; un cambio de rol se ve en el próximo login.
   */
  validate(payload: JwtPayload) {
    return payload;
  }
}
