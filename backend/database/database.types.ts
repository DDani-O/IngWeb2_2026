export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analisis_de_consumo: {
        Row: {
          cantidad_gastos: number
          categoria_dominante_id: string | null
          cliente_id: string
          comercio_mas_frecuente: string | null
          creado_en: string
          dia_mayor_gasto: number | null
          gasto_promedio: number | null
          gasto_total: number
          gastos_inusuales_detectados: number
          id: string
          periodo_fin: string
          periodo_inicio: string
        }
        Insert: {
          cantidad_gastos: number
          categoria_dominante_id?: string | null
          cliente_id: string
          comercio_mas_frecuente?: string | null
          creado_en?: string
          dia_mayor_gasto?: number | null
          gasto_promedio?: number | null
          gasto_total: number
          gastos_inusuales_detectados?: number
          id?: string
          periodo_fin: string
          periodo_inicio: string
        }
        Update: {
          cantidad_gastos?: number
          categoria_dominante_id?: string | null
          cliente_id?: string
          comercio_mas_frecuente?: string | null
          creado_en?: string
          dia_mayor_gasto?: number | null
          gasto_promedio?: number | null
          gasto_total?: number
          gastos_inusuales_detectados?: number
          id?: string
          periodo_fin?: string
          periodo_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "analisis_de_consumo_categoria_dominante_id_fkey"
            columns: ["categoria_dominante_id"]
            isOneToOne: false
            referencedRelation: "categorias_de_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_de_consumo_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      analisis_ocr: {
        Row: {
          categoria_sugerida_id: string | null
          comercio_detectado: string | null
          confianza_general: number | null
          creado_en: string
          fecha_detectada: string | null
          gasto_id: string | null
          id: string
          monto_detectado: number | null
          respuesta_modelo: Json | null
          texto_extraido: string | null
          ticket_id: string
        }
        Insert: {
          categoria_sugerida_id?: string | null
          comercio_detectado?: string | null
          confianza_general?: number | null
          creado_en?: string
          fecha_detectada?: string | null
          gasto_id?: string | null
          id?: string
          monto_detectado?: number | null
          respuesta_modelo?: Json | null
          texto_extraido?: string | null
          ticket_id: string
        }
        Update: {
          categoria_sugerida_id?: string | null
          comercio_detectado?: string | null
          confianza_general?: number | null
          creado_en?: string
          fecha_detectada?: string | null
          gasto_id?: string | null
          id?: string
          monto_detectado?: number | null
          respuesta_modelo?: Json | null
          texto_extraido?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analisis_ocr_categoria_sugerida_id_fkey"
            columns: ["categoria_sugerida_id"]
            isOneToOne: false
            referencedRelation: "categorias_de_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_ocr_gasto_id_fkey"
            columns: ["gasto_id"]
            isOneToOne: false
            referencedRelation: "client_anomaly_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_ocr_gasto_id_fkey"
            columns: ["gasto_id"]
            isOneToOne: false
            referencedRelation: "gastos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_ocr_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      asignaciones_de_clientes: {
        Row: {
          activo: boolean
          actualizado_en: string
          asesor_id: string
          asignado_en: string
          cliente_id: string
          id: string
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          asesor_id: string
          asignado_en?: string
          cliente_id: string
          id?: string
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          asesor_id?: string
          asignado_en?: string
          cliente_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_de_clientes_asesor_id_fkey"
            columns: ["asesor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_de_clientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_de_gasto: {
        Row: {
          actualizado_en: string
          creado_en: string
          descripcion: string | null
          icono: string
          id: string
          nombre: string
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          descripcion?: string | null
          icono: string
          id?: string
          nombre: string
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          descripcion?: string | null
          icono?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      clasificacion_de_perfil: {
        Row: {
          asesor_id: string | null
          cliente_id: string
          creado_en: string
          id: string
          motivo: string | null
          perfil_id: string
          puntaje: number | null
          vigente_desde: string
          vigente_hasta: string | null
        }
        Insert: {
          asesor_id?: string | null
          cliente_id: string
          creado_en?: string
          id?: string
          motivo?: string | null
          perfil_id: string
          puntaje?: number | null
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Update: {
          asesor_id?: string | null
          cliente_id?: string
          creado_en?: string
          id?: string
          motivo?: string | null
          perfil_id?: string
          puntaje?: number | null
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clasificacion_de_perfil_asesor_id_fkey"
            columns: ["asesor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clasificacion_de_perfil_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clasificacion_de_perfil_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles_de_gasto"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos: {
        Row: {
          actualizado_en: string
          categoria_id: string
          cliente_id: string
          comercio: string
          creado_en: string
          descripcion: string | null
          fecha_gasto: string
          id: string
          moneda: string
          monto: number
          ocr_confianza: number | null
          ocr_estado: Database["public"]["Enums"]["estado_ocr"]
          origen: Database["public"]["Enums"]["origen_gasto"]
          ticket_principal_id: string | null
        }
        Insert: {
          actualizado_en?: string
          categoria_id: string
          cliente_id: string
          comercio: string
          creado_en?: string
          descripcion?: string | null
          fecha_gasto: string
          id?: string
          moneda?: string
          monto: number
          ocr_confianza?: number | null
          ocr_estado?: Database["public"]["Enums"]["estado_ocr"]
          origen: Database["public"]["Enums"]["origen_gasto"]
          ticket_principal_id?: string | null
        }
        Update: {
          actualizado_en?: string
          categoria_id?: string
          cliente_id?: string
          comercio?: string
          creado_en?: string
          descripcion?: string | null
          fecha_gasto?: string
          id?: string
          moneda?: string
          monto?: number
          ocr_confianza?: number | null
          ocr_estado?: Database["public"]["Enums"]["estado_ocr"]
          origen?: Database["public"]["Enums"]["origen_gasto"]
          ticket_principal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gastos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_de_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_ticket_principal_id_fkey"
            columns: ["ticket_principal_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      mensajes_asesor: {
        Row: {
          asesor_id: string
          asunto: string | null
          cliente_id: string
          contenido: string
          creado_en: string
          destinatario_id: string
          id: string
          leido: boolean
          leido_en: string | null
          remitente_id: string
          tipo: Database["public"]["Enums"]["tipo_mensaje_asesor"]
        }
        Insert: {
          asesor_id: string
          asunto?: string | null
          cliente_id: string
          contenido: string
          creado_en?: string
          destinatario_id: string
          id?: string
          leido?: boolean
          leido_en?: string | null
          remitente_id: string
          tipo?: Database["public"]["Enums"]["tipo_mensaje_asesor"]
        }
        Update: {
          asesor_id?: string
          asunto?: string | null
          cliente_id?: string
          contenido?: string
          creado_en?: string
          destinatario_id?: string
          id?: string
          leido?: boolean
          leido_en?: string | null
          remitente_id?: string
          tipo?: Database["public"]["Enums"]["tipo_mensaje_asesor"]
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_asesor_asesor_id_fkey"
            columns: ["asesor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_asesor_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_asesor_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_asesor_remitente_id_fkey"
            columns: ["remitente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles_asesores: {
        Row: {
          actualizado_en: string
          capacidad_maxima: number
          creado_en: string
          descripcion: string | null
          especialidad: string | null
          id: string
          matricula: string | null
          pais: string | null
          telefono: string | null
          usuario_id: string
        }
        Insert: {
          actualizado_en?: string
          capacidad_maxima?: number
          creado_en?: string
          descripcion?: string | null
          especialidad?: string | null
          id?: string
          matricula?: string | null
          pais?: string | null
          telefono?: string | null
          usuario_id: string
        }
        Update: {
          actualizado_en?: string
          capacidad_maxima?: number
          creado_en?: string
          descripcion?: string | null
          especialidad?: string | null
          id?: string
          matricula?: string | null
          pais?: string | null
          telefono?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_asesores_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles_de_gasto: {
        Row: {
          activo: boolean
          creado_en: string
          criterio_regla: Json | null
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          criterio_regla?: Json | null
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          creado_en?: string
          criterio_regla?: Json | null
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      perfiles_usuarios: {
        Row: {
          actualizado_en: string
          ahorro_objetivo: number | null
          creado_en: string
          id: string
          ingreso_estimado: number | null
          moneda_preferida: string | null
          notificar_email: boolean
          notificar_push: boolean
          objetivo_financiero: string | null
          ocupacion: string | null
          pais: string | null
          telefono: string | null
          tema: string | null
          umbral_alerta: number | null
          usuario_id: string
        }
        Insert: {
          actualizado_en?: string
          ahorro_objetivo?: number | null
          creado_en?: string
          id?: string
          ingreso_estimado?: number | null
          moneda_preferida?: string | null
          notificar_email?: boolean
          notificar_push?: boolean
          objetivo_financiero?: string | null
          ocupacion?: string | null
          pais?: string | null
          telefono?: string | null
          tema?: string | null
          umbral_alerta?: number | null
          usuario_id: string
        }
        Update: {
          actualizado_en?: string
          ahorro_objetivo?: number | null
          creado_en?: string
          id?: string
          ingreso_estimado?: number | null
          moneda_preferida?: string | null
          notificar_email?: boolean
          notificar_push?: boolean
          objetivo_financiero?: string | null
          ocupacion?: string | null
          pais?: string | null
          telefono?: string | null
          tema?: string | null
          umbral_alerta?: number | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_usuarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      recomendaciones_financieras: {
        Row: {
          ahorro_potencial: number | null
          asesor_id: string | null
          cliente_id: string
          creado_en: string
          estado: Database["public"]["Enums"]["estado_recomendacion"]
          icono: string | null
          id: string
          leida: boolean
          leida_en: string | null
          mensaje: string
          origen: Database["public"]["Enums"]["origen_recomendacion"]
          pasos_implementacion: string[] | null
          prioridad: Database["public"]["Enums"]["prioridad_recomendacion"]
          problema: string | null
          solucion: string | null
          tipo: Database["public"]["Enums"]["tipo_recomendacion"]
          titulo: string
        }
        Insert: {
          ahorro_potencial?: number | null
          asesor_id?: string | null
          cliente_id: string
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_recomendacion"]
          icono?: string | null
          id?: string
          leida?: boolean
          leida_en?: string | null
          mensaje: string
          origen: Database["public"]["Enums"]["origen_recomendacion"]
          pasos_implementacion?: string[] | null
          prioridad?: Database["public"]["Enums"]["prioridad_recomendacion"]
          problema?: string | null
          solucion?: string | null
          tipo: Database["public"]["Enums"]["tipo_recomendacion"]
          titulo: string
        }
        Update: {
          ahorro_potencial?: number | null
          asesor_id?: string | null
          cliente_id?: string
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_recomendacion"]
          icono?: string | null
          id?: string
          leida?: boolean
          leida_en?: string | null
          mensaje?: string
          origen?: Database["public"]["Enums"]["origen_recomendacion"]
          pasos_implementacion?: string[] | null
          prioridad?: Database["public"]["Enums"]["prioridad_recomendacion"]
          problema?: string | null
          solucion?: string | null
          tipo?: Database["public"]["Enums"]["tipo_recomendacion"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "recomendaciones_financieras_asesor_id_fkey"
            columns: ["asesor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recomendaciones_financieras_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          cliente_id: string
          estado_procesamiento: Database["public"]["Enums"]["estado_ticket"]
          id: string
          nombre_archivo: string | null
          subido_en: string
          tamano_bytes: number | null
          tipo_mime: string | null
          url_archivo: string
        }
        Insert: {
          cliente_id: string
          estado_procesamiento?: Database["public"]["Enums"]["estado_ticket"]
          id?: string
          nombre_archivo?: string | null
          subido_en?: string
          tamano_bytes?: number | null
          tipo_mime?: string | null
          url_archivo: string
        }
        Update: {
          cliente_id?: string
          estado_procesamiento?: Database["public"]["Enums"]["estado_ticket"]
          id?: string
          nombre_archivo?: string | null
          subido_en?: string
          tamano_bytes?: number | null
          tipo_mime?: string | null
          url_archivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          actualizado_en: string
          biografia: string | null
          creado_en: string
          email: string | null
          estado: Database["public"]["Enums"]["estado_usuario"]
          foto_perfil_url: string | null
          id: string
          nombre_completo: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          ultimo_acceso: string | null
        }
        Insert: {
          actualizado_en?: string
          biografia?: string | null
          creado_en?: string
          email?: string | null
          estado?: Database["public"]["Enums"]["estado_usuario"]
          foto_perfil_url?: string | null
          id: string
          nombre_completo: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          ultimo_acceso?: string | null
        }
        Update: {
          actualizado_en?: string
          biografia?: string | null
          creado_en?: string
          email?: string | null
          estado?: Database["public"]["Enums"]["estado_usuario"]
          foto_perfil_url?: string | null
          id?: string
          nombre_completo?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          ultimo_acceso?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      advisor_dashboard_view: {
        Row: {
          asesor_id: string | null
          clientes_activos: number | null
          clientes_con_transacciones_ultimos_30: number | null
          clientes_transacciones_ultima_semana: number | null
          gasto_promedio_ultimos_30: number | null
          gasto_ultimos_30_dias: number | null
          recomendaciones_pendientes: number | null
          total_clientes: number | null
          ultima_transaccion: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_de_clientes_asesor_id_fkey"
            columns: ["asesor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      category_distribution_view: {
        Row: {
          cantidad: number | null
          categoria_id: string | null
          categoria_nombre: string | null
          cliente_id: string | null
          maximo: number | null
          minimo: number | null
          porcentaje: number | null
          promedio: number | null
          ranking: number | null
          total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gastos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_de_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      client_anomaly_view: {
        Row: {
          avg_90_dias: number | null
          categoria_id: string | null
          categoria_nombre: string | null
          cliente_id: string | null
          comercio: string | null
          fecha_gasto: string | null
          id: string | null
          monto: number | null
          percentil_95: number | null
          stddev_90_dias: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gastos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_de_gasto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      consumption_stats_view: {
        Row: {
          cantidad_gastos: number | null
          categorias_unicas: number | null
          cliente_id: string | null
          comercios_unicos: number | null
          desviacion_estandar: number | null
          gasto_promedio: number | null
          gasto_total: number | null
          monto_maximo: number | null
          monto_minimo: number | null
          periodo_fin: string | null
          periodo_inicio: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gastos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_evolution_view: {
        Row: {
          cantidad_transacciones: number | null
          cliente_id: string | null
          gasto_mes: number | null
          gasto_mes_anterior: number | null
          mes: string | null
          promedio_transaccion: number | null
          variacion_porcentual: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gastos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      analisis_ocr_cliente_referencia: {
        Args: { p_gasto_id: string; p_ticket_id: string }
        Returns: string
      }
      calcular_zscore: {
        Args: { p_mean: number; p_stddev: number; p_value: number }
        Returns: number
      }
      contar_clientes_activos: {
        Args: { p_asesor_id: string }
        Returns: number
      }
      es_asesor_asignado_a_cliente: {
        Args: { p_cliente_id: string }
        Returns: boolean
      }
      es_service_role: { Args: never; Returns: boolean }
      obtener_asesor_disponible: { Args: never; Returns: string }
      obtener_gastos_inusuales: {
        Args: { p_cliente_id: string; p_dias?: number }
        Returns: {
          categoria_id: string
          comercio: string
          fecha_gasto: string
          gasto_id: string
          monto: number
          percentil_95: number
          zscore: number
        }[]
      }
    }
    Enums: {
      estado_ocr: "pendiente" | "procesado" | "fallido"
      estado_recomendacion: "pendiente" | "completada" | "descartada"
      estado_ticket: "subido" | "procesando" | "procesado" | "error"
      estado_usuario: "activo" | "inactivo"
      origen_gasto: "manual" | "ticket"
      origen_recomendacion: "sistema" | "asesor"
      prioridad_recomendacion: "baja" | "media" | "alta"
      rol_usuario: "cliente" | "asesor"
      tipo_mensaje_asesor: "mensaje" | "ticket"
      tipo_recomendacion: "sugerencia" | "alerta" | "observacion"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estado_ocr: ["pendiente", "procesado", "fallido"],
      estado_recomendacion: ["pendiente", "completada", "descartada"],
      estado_ticket: ["subido", "procesando", "procesado", "error"],
      estado_usuario: ["activo", "inactivo"],
      origen_gasto: ["manual", "ticket"],
      origen_recomendacion: ["sistema", "asesor"],
      prioridad_recomendacion: ["baja", "media", "alta"],
      rol_usuario: ["cliente", "asesor"],
      tipo_mensaje_asesor: ["mensaje", "ticket"],
      tipo_recomendacion: ["sugerencia", "alerta", "observacion"],
    },
  },
} as const
