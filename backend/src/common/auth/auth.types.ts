export type UserRole = 'cliente' | 'asesor';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
