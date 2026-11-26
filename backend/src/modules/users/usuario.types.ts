import { UserRole } from "../../common/auth";

/** Referencia corta a otro usuario (asesor o cliente) dentro de una respuesta. */
export interface UsuarioRef {
  id: string;
  nombre_completo: string;
}

/** Perfil de gasto vigente (clasificacion_de_perfil + perfiles_de_gasto). */
export interface PerfilDeGasto {
  id: string;
  nombre: string;
  descripcion: string;
}

/** Objeto `usuario` del contrato (spec §10, "Objetos comunes"). */
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
    perfil_de_gasto: PerfilDeGasto | null;
    asesor: UsuarioRef | null;
  };
  perfil_asesor?: {
    matricula: string;
    especialidad: string;
    descripcion: string;
    clientes_asignados: number;
  };
}
