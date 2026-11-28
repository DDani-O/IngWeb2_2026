/** Tipos del objeto `usuario` del contrato y de sus partes (perfil de gasto, referencias a otros usuarios). */
import { UserRole } from "../../common/auth";

/** Referencia corta a otro usuario (asesor o cliente) dentro de una respuesta. */
export interface UsuarioRef {
  id: string;
  nombre_completo: string;
}

/** Perfil del catálogo `perfiles_de_gasto`. */
export interface PerfilDeGasto {
  id: string;
  nombre: string;
  descripcion: string;
}

/** Quién asignó el perfil vigente: la regla automática o el asesor del cliente. */
export type OrigenPerfil = "sistema" | "asesor";

/**
 * Perfil vigente del cliente (`clasificacion_de_perfil` sin `vigente_hasta`). Con
 * `origen = "asesor"`, `motivo` es el que escribió el asesor (puede ser `null`); con
 * `"sistema"`, explica el porcentaje discrecional que lo justifica.
 */
export interface PerfilVigente extends PerfilDeGasto {
  origen: OrigenPerfil;
  motivo: string | null;
}

/** Objeto `usuario` del contrato (§3.0, backend/README.md). */
export interface Usuario {
  id: string;
  email: string | null;
  rol: UserRole;
  nombre_completo: string;
  biografia: string;
  foto_perfil_url: string | null;
  estado: "activo" | "inactivo";
  creado_en: string;
  perfil_cliente?: {
    ocupacion: string;
    ingreso_estimado: number | null;
    objetivo_financiero: string;
    perfil_de_gasto: PerfilVigente | null;
    asesor: UsuarioRef | null;
  };
  perfil_asesor?: {
    matricula: string;
    especialidad: string;
    descripcion: string;
    clientes_asignados: number;
  };
}
