/** Decorador `@CurrentUser()`: el usuario del JWT ya validado por `JwtStrategy`. */
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JwtPayload } from "./auth.types";

/** Inyecta el `JwtPayload` en el handler; es la única fuente del id del usuario. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as JwtPayload | undefined;
  },
);
