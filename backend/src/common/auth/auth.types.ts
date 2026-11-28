/** Tipos de la sesión: roles de la cuenta y contenido del JWT propio de la API. */
export type UserRole = "cliente" | "asesor";

/** Lo que firma `AuthService` en el token: `sub` es el id de `usuarios` (nunca viene del body). */
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
