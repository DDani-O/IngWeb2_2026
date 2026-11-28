/** Decorador `@Roles()`: roles que pueden usar un handler o un controller. */
import { SetMetadata } from "@nestjs/common";
import { UserRole } from "./auth.types";

export const ROLES_KEY = "roles";

/** Lo lee `RolesGuard`; en el handler pisa al del controller. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
