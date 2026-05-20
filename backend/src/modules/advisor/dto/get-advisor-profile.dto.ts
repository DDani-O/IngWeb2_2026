/**
 * DTO de Respuesta: Perfil del Asesor
 * Incluye campo calculado: activeClientsCount (COUNT dinámico)
 */
export class GetAdvisorProfileDto {
  id!: string;
  userId!: string;
  email!: string;
  fullName!: string;
  licenseNumber!: string;
  specialty!: string;
  description!: string | null;
  maxCapacity!: number;
  activeClientsCount!: number; // ← CALCULADO con COUNT()
  phone!: string | null;
  country!: string | null;
  notifyEmail!: boolean;
  notifyPush!: boolean;
  photo!: string | null;
  createdAt!: string;
  updatedAt!: string;
}
