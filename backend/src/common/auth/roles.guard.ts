/** Guard de rol: compara el rol del JWT con el de `@Roles()` (403 si no coincide). */
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "./roles.decorator";
import { JwtPayload, UserRole } from "./auth.types";

/** Va después de `JwtAuthGuard`, que deja `request.user`. Sin `@Roles()`, deja pasar. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /** `false` se responde como 403 `PROHIBIDO` (ver `HttpExceptionFilter`). */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user?.role) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
