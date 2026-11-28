import { PerfilDeGasto, PerfilVigente } from "../users/usuario.types";

/** Datos mínimos de un gasto para el análisis. */
export interface GastoAnalizable {
  id: string;
  categoria_id: string;
  comercio: string;
  fecha_gasto: string;
  monto: number;
}

export interface CategoriaAnalizable {
  id: string;
  nombre: string;
}

/** Perfil del catálogo con su regla (`criterio_regla.discrecional_max`). */
export interface PerfilConRegla extends PerfilDeGasto {
  discrecional_max: number;
}

export type NivelAlerta = "danger" | "warning" | "success" | "info";
export type NivelRiesgo = "bajo" | "medio" | "alto";

export interface Alerta {
  nivel: NivelAlerta;
  titulo: string;
  descripcion: string;
}

export interface GastoInusual {
  gasto_id: string;
  comercio: string;
  categoria: string;
  fecha_gasto: string;
  monto: number;
  promedio_categoria: number;
  desvio_porcentaje: number;
}

/** Objeto `analisis` del contrato (§3.6, backend/README.md). */
export interface Analisis {
  cliente_id: string;
  periodo: { desde: string; hasta: string };
  gasto_mes_actual: number;
  gasto_mes_anterior_a_la_fecha: number;
  variacion_mes_anterior: number | null;
  gasto_promedio_mensual: number;
  cantidad_gastos: number;
  categoria_dominante: {
    id: string;
    nombre: string;
    porcentaje: number;
  } | null;
  comercio_mas_frecuente: { comercio: string; cantidad: number } | null;
  dia_mayor_gasto: number | null;
  gastos_por_categoria: Array<{
    categoria_id: string;
    categoria: string;
    monto: number;
    porcentaje: number;
  }>;
  gastos_por_mes: Array<{ mes: string; monto: number }>;
  gastos_por_mes_y_categoria: Array<{
    mes: string;
    categoria: string;
    monto: number;
  }>;
  gastos_por_dia: Array<{ fecha: string; monto: number }>;
  ranking_comercios: Array<{
    comercio: string;
    monto: number;
    cantidad: number;
  }>;
  gastos_inusuales: GastoInusual[];
  alertas: Alerta[];
  /** Perfil vigente: el que eligió el asesor o, si no eligió ninguno, el sugerido. */
  perfil_de_gasto: PerfilVigente | null;
  /** Lo que calcula la regla automática, aunque el asesor haya elegido otro. */
  perfil_sugerido: PerfilDeGasto | null;
  nivel_riesgo: NivelRiesgo;
  ultimo_gasto_fecha: string | null;
}

/** Clasificación vigente que cargó un asesor (`clasificacion_de_perfil.asesor_id` no nulo). */
export interface ClasificacionManual {
  perfil_id: string;
  motivo: string | null;
}

/** Resultado de la regla de perfil, con la participación discrecional que la justifica. */
export interface AsignacionDePerfil {
  perfil: PerfilDeGasto;
  /** Participación del gasto discrecional (0 a 1). */
  participacion: number;
}

/** Objeto `resumen_asesor` del contrato (§3.6, backend/README.md). */
export interface ResumenAsesor {
  asesor_id: string;
  clientes_activos: number;
  clientes_con_alertas: number;
  recomendaciones_enviadas: number;
  recomendaciones_leidas: number;
  alertas: Alerta[];
  distribucion_por_perfil: Array<{ perfil: string; cantidad: number }>;
  gasto_por_perfil: Array<{ perfil: string; monto: number }>;
  actividad_mensual: Array<{ mes: string; clientes_activos: number }>;
}

/** Objeto `resumen_cliente` del contrato (§3.7, backend/README.md). */
export interface ResumenCliente {
  id: string;
  nombre_completo: string;
  email: string | null;
  estado: "activo" | "inactivo";
  perfil_de_gasto: PerfilVigente | null;
  gasto_promedio_mensual: number;
  gasto_mes_actual: number;
  variacion_mes_anterior: number | null;
  ultimo_gasto_fecha: string | null;
  gastos_inusuales: number;
  nivel_riesgo: NivelRiesgo;
}
