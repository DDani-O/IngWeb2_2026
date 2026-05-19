# Arquitectura Completa: Sistema de Asignación Automática de Clientes a Asesores
## FinTrack Backend - NestJS + Supabase

**Fecha**: 2026-05-18  
**Responsable**: Arquitecto Backend Senior  
**Estado**: Plan Detallado (Listo para Implementación)

---

## 📋 TABLA DE CONTENIDOS

1. [Análisis Arquitectónico](#análisis-arquitectónico)
2. [Decisiones de Diseño](#decisiones-de-diseño)
3. [Cambios en Base de Datos](#cambios-en-base-de-datos)
4. [Implementación Backend](#implementación-backend)
5. [Endpoints Finales](#endpoints-finales)
6. [Testing & Validación](#testing--validación)

---

## 🎯 ANÁLISIS ARQUITECTÓNICO

### Contexto Actual

#### Módulos Existentes
```
backend/src/modules/
├── auth/          ← Registro, Login, creación de perfiles iniciales
├── users/         ← GET /users/me, PATCH /users/me
├── advisor/       ← Dashboard, clientes, recomendaciones
├── expenses/      ← Gastos, análisis
└── categories/    ← Categorías de gasto
```

#### Flujo Actual de Registro
```
POST /auth/register (cliente)
  ↓
auth.service.register()
  ├─ Create auth.users (Supabase Auth)
  ├─ Insert usuarios table
  ├─ Insert perfiles_usuarios table
  └─ Return JWT token
  
⚠️ PROBLEMA: No hay asignación automática a asesor
```

#### Tablas Relevantes (Estado Actual)
```sql
usuarios (id, rol, nombre_completo, email, estado, creado_en)
{% if rol = 'asesor' %}
perfiles_asesores (id, usuario_id, matricula, especialidad, descripcion)
asignaciones_de_clientes (id, asesor_id, cliente_id, activo, asignado_en)
{% endif %}
```

### Problemas Identificados

| Problema | Impacto | Solución |
|----------|--------|----------|
| Asignación manual en frontend | Clientes sin asesor en BD | Algoritmo en auth.service |
| Sin columna `capacidad_maxima` | No se puede limitar clientes | Agregar a perfiles_asesores |
| Sin conteo dinámico | Datos inconsistentes | Usar COUNT() en queries |
| Sin endpoint GET /advisor/profile | Frontend hace mocks | Crear endpoint |
| Sin endpoint PATCH /advisor/profile | No se puede editar | Crear endpoint |

---

## 🏗️ DECISIONES DE DISEÑO

### ✅ Decisión 1: Integrar en Módulo `advisor` (NO crear nuevo módulo)

#### Justificación Técnica

| Criterio | Opción 1: Nuevo módulo `assignments` | Opción 2: Integrar en `advisor` ✅ |
|----------|---------------------------------------|----------------------------------|
| **SRP** | El módulo queda con 3 responsabilidades | Responsabilidad cohesiva (asesores) |
| **Cohesión** | Baja (assignment no tiene servicios de advisor) | Alta (asignación es gobernada por asesor) |
| **Reutilización** | Duplicaría Supabase Client, Guards | Reutiliza infraestructura existente |
| **Complejidad** | +6 archivos, inyecciones cruzadas | +3 archivos, código en lugar existente |
| **Testing** | Más complejos (dependencias circulares) | Más simples (estructura establecida) |
| **Escalabilidad** | ✗ Dificulta futuros cambios en advisor | ✓ Crece naturalmente con advisor |

**Conclusión**: Integrar en `advisor` module porque los asesores son el dominio central de esta funcionalidad.

---

### ✅ Decisión 2: Algoritmo de Asignación Balanceado

```typescript
// Seleccionar asesor con MENOS clientes
async selectAvailableAdvisor(capacity?: number): Promise<string | null> {
  const result = await this.supabase
    .from('asignaciones_de_clientes')
    .select('asesor_id, count(cliente_id) as active_count')
    .eq('activo', true)
    .group('asesor_id')
    .having(`COUNT(*) < ${capacity || DEFAULT_CAPACITY}`)
    .order('active_count', { ascending: true })
    .limit(1);
    
  return result.data?.[0]?.asesor_id ?? null;
}
```

**Justificación**:
- Load balancing: Distribuye equitativamente
- Escalable: O(1) si hay índice
- Previene concentración en un alone asesor

---

### ✅ Decisión 3: Cálculo Dinámico de `clientes_activos`

```sql
-- NO persistir clientes_activos
-- En su lugar, SIEMPRE calcular con:

SELECT 
  pa.id, 
  pa.usuario_id,
  pa.capacidad_maxima,
  COUNT(ac.cliente_id) FILTER (WHERE ac.activo) as clientes_activos
FROM perfiles_asesores pa
LEFT JOIN asignaciones_de_clientes ac ON pa.usuario_id = ac.asesor_id
WHERE pa.id = $1
GROUP BY pa.id, pa.usuario_id, pa.capacidad_maxima;
```

**Ventajas**:
- ✓ Siempre actualizado (sin degradación)
- ✓ Una sola fuente de verdad (la relación activa)
- ✓ Evita race conditions en concurrencia

---

### ✅ Decisión 4: RolesGuard Existente para Protección

Reutilizar guards existentes:
```typescript
@Controller('advisor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('asesor')
export class AdvisorController {
  // Solo asesores pueden acceder
}

@Roles('cliente')  // O si es público
@Post('auth/register')
export register() { }
```

---

## 🗄️ CAMBIOS EN BASE DE DATOS

### Migración 0007: Agregar Campos a Perfiles Asesores

```sql
-- ============================================================================
-- FILE: backend/database/migrations/0007_assignments_feature.sql
-- DESCRIPCIÓN: Agregar capacidad máxima, teléfono, país a perfiles_asesores
-- ============================================================================

BEGIN;

-- =========================================================
-- 1. Agregar Columnas a perfiles_asesores
-- =========================================================

ALTER TABLE public.perfiles_asesores
ADD COLUMN capacidad_maxima SMALLINT NOT NULL DEFAULT 5
  CONSTRAINT chk_capacidad_maxima_positiva CHECK (capacidad_maxima > 0);

ALTER TABLE public.perfiles_asesores
ADD COLUMN telefono TEXT NULL;

ALTER TABLE public.perfiles_asesores
ADD COLUMN pais TEXT NULL;

-- =========================================================
-- 2. Commentarios Documentativos
-- =========================================================

COMMENT ON COLUMN public.perfiles_asesores.capacidad_maxima IS
  'Capacidad máxima de clientes que este asesor puede tener. Editable por el asesor.';

COMMENT ON COLUMN public.perfiles_asesores.telefono IS
  'Teléfono de contacto del asesor. Utilizado para comunicación con clientes.';

COMMENT ON COLUMN public.perfiles_asesores.pais IS
  'País o región donde el asesor opera. Filtro potencial para asignaciones.';

-- =========================================================
-- 3. Índices para Asignación Automática
-- =========================================================

-- Índice para obtener asignaciones activas de un asesor
CREATE INDEX IF NOT EXISTS idx_asignaciones_asesor_activo
ON public.asignaciones_de_clientes(asesor_id, activo DESC)
WHERE activo = true;

-- Índice para contar clientes activos de un asesor (CRITICAL para asignación)
CREATE INDEX IF NOT EXISTS idx_asignaciones_count_activos
ON public.asignaciones_de_clientes(asesor_id)
WHERE activo = true;

-- Índice para búsqueda rápida de asignación existente (evite duplicados)
CREATE INDEX IF NOT EXISTS idx_asignaciones_unique_lookup
ON public.asignaciones_de_clientes(cliente_id, asesor_id)
WHERE activo = true;

-- =========================================================
-- 4. Función para Contar Clientes Activos (Uso en queries)
-- =========================================================

CREATE OR REPLACE FUNCTION public.contar_clientes_activos(p_asesor_id uuid)
RETURNS INTEGER LANGUAGE sql STABLE AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.asignaciones_de_clientes
    WHERE asesor_id = p_asesor_id AND activo = true;
$$;

COMMENT ON FUNCTION public.contar_clientes_activos(uuid) IS
  'Calcula dinámicamente cantidad de clientes activos asignados a un asesor.';

-- =========================================================
-- 5. Función para Obtener Asesor Disponible (Asignación automática)
-- =========================================================

CREATE OR REPLACE FUNCTION public.obtener_asesor_disponible(
  p_capacidad_minima SMALLINT DEFAULT 5
)
RETURNS uuid LANGUAGE sql STABLE AS $$
    SELECT u.id
    FROM public.usuarios u
    INNER JOIN public.perfiles_asesores pa ON u.id = pa.usuario_id
    WHERE u.rol = 'asesor' 
      AND u.estado = 'activo'
      AND pa.capacidad_maxima > 0
      AND (
        SELECT COUNT(ac.cliente_id)
        FROM public.asignaciones_de_clientes ac
        WHERE ac.asesor_id = u.id AND ac.activo = true
      ) < pa.capacidad_maxima
    ORDER BY (
      SELECT COUNT(ac.cliente_id)
      FROM public.asignaciones_de_clientes ac
      WHERE ac.asesor_id = u.id AND ac.activo = true
    ) ASC
    LIMIT 1;
$$;

COMMENT ON FUNCTION public.obtener_asesor_disponible(SMALLINT) IS
  'Obtiene el asesor activo con menos clientes que tenga capacidad disponible.';

-- =========================================================
-- 6. Trigger para Validar Capacidad en Inserciones
-- =========================================================

CREATE OR REPLACE FUNCTION public.validar_capacidad_asesor_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_capacidad SMALLINT;
  v_clientes_actuales INTEGER;
BEGIN
  -- Obtener capacidad del asesor
  SELECT capacidad_maxima INTO v_capacidad
  FROM public.perfiles_asesores
  WHERE usuario_id = NEW.asesor_id;
  
  IF v_capacidad IS NULL THEN
    RAISE EXCEPTION 'El asesor no existe o no tiene perfil';
  END IF;
  
  -- Contar clientes activos actuales
  SELECT COUNT(*)::INTEGER INTO v_clientes_actuales
  FROM public.asignaciones_de_clientes
  WHERE asesor_id = NEW.asesor_id AND activo = true;
  
  -- Validar que no exceda capacidad
  IF v_clientes_actuales >= v_capacidad THEN
    RAISE EXCEPTION 'El asesor ha alcanzado su capacidad máxima de % clientes', v_capacidad;
  END IF;
  
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_validar_capacidad_asesor ON public.asignaciones_de_clientes;
CREATE TRIGGER trg_validar_capacidad_asesor
BEFORE INSERT ON public.asignaciones_de_clientes
FOR EACH ROW
EXECUTE FUNCTION public.validar_capacidad_asesor_insert();

-- =========================================================
-- 7. Actualizar Política de RLS para perfiles_asesores
-- =========================================================

-- Los asesores pueden ver su propio perfil
DROP POLICY IF EXISTS "perfiles_asesores_select" ON public.perfiles_asesores;
CREATE POLICY "perfiles_asesores_select" ON public.perfiles_asesores
  FOR SELECT
  USING (usuario_id = auth.uid() OR (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'asesor');

-- Los asesores pueden actualizar su propio perfil
DROP POLICY IF EXISTS "perfiles_asesores_update" ON public.perfiles_asesores;
CREATE POLICY "perfiles_asesores_update" ON public.perfiles_asesores
  FOR UPDATE
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- =========================================================
-- 8. Actualizar Documentación de RLS
-- =========================================================

COMMENT ON POLICY "perfiles_asesores_select" ON public.perfiles_asesores IS
  'Cada asesor ve su propio perfil. El cálculo de clientes_activos se hace dinámicamente con COUNT.';

COMMIT;
```

#### Justificación de Cambios

| Campo | Agregar | Por qué | Cálculado |
|-------|---------|--------|----------|
| `capacidad_maxima` | ✅ | Es editable, variable por asesor | No |
| `telefono` | ✅ | Contacto del asesor, visible en dashboard | No |
| `pais` | ✅ | Filtro futuro para asignaciones locales | No |
| `clientes_activos` | ❌ | Siempre usar COUNT() de asignaciones | **Sí** |
| `años_experiencia` | ❌ | Puede sacarse (innecesario) | N/A |

#### Índices & Performance

```sql
idx_asignaciones_asesor_activo
  → Para: SELECT * FROM asignaciones WHERE asesor_id = X AND activo = true
  → Caso de uso: Obtener clientes del asesor en dashboard
  → Cost: O(log n)

idx_asignaciones_count_activos
  → Para: COUNT(*) WHERE asesor_id = X AND activo = true
  → Caso de uso: Validar capacidad antes de asignar
  → Cost: O(1) con PARTIAL INDEX

idx_asignaciones_unique_lookup
  → Para: Detectar asignación existente antes de insertar
  → Caso de uso: Evitar duplicados
  → Cost: O(log n)
```

---

## 👨‍💻 IMPLEMENTACIÓN BACKEND

### Paso 1: DTOs (Validación de Entrada)

**Archivo**: `backend/src/modules/advisor/dto/update-advisor-profile.dto.ts`

```typescript
import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  MaxLength,
  IsInt,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para actualizar el perfil del asesor.
 * Solo el asesor puede actualizar su propio perfil.
 * Campos editables: capacidad_maxima, telefono, pais, especialidad, descripcion
 */
export class UpdateAdvisorProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  specialty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  maxCapacity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;
}
```

**Archivo**: `backend/src/modules/advisor/dto/get-advisor-profile.dto.ts`

```typescript
/**
 * DTO de Respuesta: Perfil del Asesor
 * Incluye campo calculado: clientes_activos (COUNT dinámico)
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
  activeClientsCount!: number;  // ← CALCULADO con COUNT()
  phone!: string | null;
  country!: string | null;
  photo!: string | null;
  createdAt!: string;
  updatedAt!: string;
}
```

**Archivo**: `backend/src/modules/advisor/dto/index.ts`

```typescript
export * from './update-advisor-profile.dto';
export * from './get-advisor-profile.dto';
export * from './advisor-clients-query.dto';
export * from './advisor-client-expenses-query.dto';
export * from './advisor-messages-query.dto';
export * from './advisor-recommendations-query.dto';
export * from './create-advisor-message.dto';
export * from './create-advisor-recommendation.dto';
export * from './update-recommendation.dto';
export * from './advisor-message-type.enum';
export * from './advisor-recommendation-types.enum';
```

---

### Paso 2: Extender AdvisorService

**Modificar**: `backend/src/modules/advisor/advisor.service.ts`

Agregar estos métodos al final de la clase (ANTES de END):

```typescript
// ================================================
// NUEVOS MÉTODOS: Gestión de Asignaciones
// ================================================

/**
 * Obtiene el asesor disponible con menos clientes.
 * Validaciones:
 * - El asesor debe estar activo
 * - No debe haber alcanzado capacidad máxima
 * 
 * @returns UUID del asesor, o null si no hay disponibles
 */
async selectAvailableAdvisor(): Promise<string | null> {
  const { data, error } = await this.supabase.rpc(
    'obtener_asesor_disponible',
    {}
  );

  if (error) {
    console.error('Error selecting available advisor:', error);
    return null;
  }

  return data || null;
}

/**
 * Asigna un cliente a un asesor automáticamente.
 * 
 * Lógica:
 * 1. Obtener asesor disponible (función SQL)
 * 2. Si no hay, devolver warning sin romper
 * 3. Crear asignación con activo=true
 * 
 * @param clientId UUID del cliente a asignar
 * @returns { assigned: boolean, advisorId?: string, warning?: string }
 */
async assignClientToAdvisor(clientId: string): Promise<{
  assigned: boolean;
  advisorId?: string;
  warning?: string;
}> {
  try {
    // 1. Obtener asesor disponible balanceado
    const advisorId = await this.selectAvailableAdvisor();

    if (!advisorId) {
      // No hay asesores disponibles - permitir que el cliente se registre
      // pero sin asignación. Logger registra el evento.
      console.warn(`No available advisors for client ${clientId}`);
      return {
        assigned: false,
        warning: 'No hay asesores disponibles en este momento',
      };
    }

    // 2. Crear asignación
    const { error } = await this.supabase
      .from('asignaciones_de_clientes')
      .insert({
        asesor_id: advisorId,
        cliente_id: clientId,
        activo: true,
      });

    if (error) {
      // Podría ser duplicate (cliente ya asignado)
      if (error.code === '23505') {
        console.warn(`Client ${clientId} already assigned`);
        return {
          assigned: false,
          warning: 'El cliente ya está asignado a un asesor',
        };
      }

      // Error de capacidad (validación en trigger)
      if ((error.message || '').includes('capacidad')) {
        const alternativeAdvisor = await this.selectAvailableAdvisor();
        if (alternativeAdvisor) {
          const { error: retryError } = await this.supabase
            .from('asignaciones_de_clientes')
            .insert({
              asesor_id: alternativeAdvisor,
              cliente_id: clientId,
              activo: true,
            });
          if (!retryError) {
            return { assigned: true, advisorId: alternativeAdvisor };
          }
        }
        return {
          assigned: false,
          warning: 'No hay capacidad disponible en asesores',
        };
      }

      throw error;
    }

    return { assigned: true, advisorId };
  } catch (err) {
    console.error('Error assigning client to advisor:', err);
    return {
      assigned: false,
      warning: 'Error en la asignación automática',
    };
  }
}

/**
 * Cuenta dinámicamente los clientes activos de un asesor.
 * 
 * @param advisorId UUID del asesor
 * @returns Cantidad de clientes activos
 */
async countActiveClientsForAdvisor(advisorId: string): Promise<number> {
  const { count, error } = await this.supabase
    .from('asignaciones_de_clientes')
    .select('*', { count: 'exact', head: true })
    .eq('asesor_id', advisorId)
    .eq('activo', true);

  if (error) {
    console.error('Error counting active clients:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Obtiene el perfil del asesor (GET /advisor/profile)
 * Incluye conteo dinámico de clientes activos
 * 
 * @param user JWT payload del asesor autenticado
 * @returns GetAdvisorProfileDto con datos calculados
 */
async getAdvisorProfile(user: JwtPayload): Promise<GetAdvisorProfileDto> {
  const payload = this.ensureAdvisor(user);

  // Obtener datos del asesor
  const { data: advisorRow, error: advisorError } = await this.supabase
    .from('perfiles_asesores')
    .select('*')
    .eq('usuario_id', payload.sub)
    .single();

  if (advisorError || !advisorRow) {
    throw new NotFoundException('Perfil del asesor no encontrado');
  }

  // Obtener datos de usuario
  const { data: userRow, error: userError } = await this.supabase
    .from('usuarios')
    .select('id, nombre_completo, email, foto_perfil_url, creado_en, actualizado_en')
    .eq('id', payload.sub)
    .single();

  if (userError || !userRow) {
    throw new NotFoundException('Usuario no encontrado');
  }

  // Contar clientes activos dinámicamente
  const activeClientsCount = await this.countActiveClientsForAdvisor(payload.sub);

  return {
    id: advisorRow.id,
    userId: advisorRow.usuario_id,
    email: payload.email,
    fullName: userRow.nombre_completo,
    licenseNumber: advisorRow.matricula,
    specialty: advisorRow.especialidad,
    description: advisorRow.descripcion,
    maxCapacity: advisorRow.capacidad_maxima,
    activeClientsCount, // ← CALCULADO
    phone: advisorRow.telefono,
    country: advisorRow.pais,
    photo: userRow.foto_perfil_url,
    createdAt: advisorRow.creado_en,
    updatedAt: advisorRow.actualizado_en,
  };
}

/**
 * Actualiza el perfil del asesor (PATCH /advisor/profile)
 * 
 * Campos editables:
 * - specialty, description, maxCapacity, phone, country
 * 
 * NO editable: licenseNumber, email
 * 
 * @param user JWT payload del asesor
 * @param dto UpdateAdvisorProfileDto con cambios
 * @returns GetAdvisorProfileDto actualizado
 */
async updateAdvisorProfile(
  user: JwtPayload,
  dto: UpdateAdvisorProfileDto,
): Promise<GetAdvisorProfileDto> {
  const payload = this.ensureAdvisor(user);

  // Validaciones de negocio
  if (dto.maxCapacity !== undefined && dto.maxCapacity < 1) {
    throw new BadRequestException('La capacidad debe ser al menos 1');
  }

  // Construir objeto de actualización (solo campos presentes)
  const updateData: Record<string, unknown> = {};

  if (dto.specialty !== undefined) {
    updateData.especialidad = dto.specialty;
  }
  if (dto.description !== undefined) {
    updateData.descripcion = dto.description;
  }
  if (dto.maxCapacity !== undefined) {
    // Validar que no sea menor que clientes activos actuales
    const activeCount = await this.countActiveClientsForAdvisor(payload.sub);
    if (dto.maxCapacity < activeCount) {
      throw new BadRequestException(
        `Capacidad mínima debe ser al menos ${activeCount} (clientes activos actuales)`,
      );
    }
    updateData.capacidad_maxima = dto.maxCapacity;
  }
  if (dto.phone !== undefined) {
    updateData.telefono = dto.phone;
  }
  if (dto.country !== undefined) {
    updateData.pais = dto.country;
  }

  // Realizar actualización
  const { error } = await this.supabase
    .from('perfiles_asesores')
    .update(updateData)
    .eq('usuario_id', payload.sub);

  if (error) {
    throw new InternalServerErrorException('Error al actualizar el perfil');
  }

  // Retornar perfil actualizado
  return this.getAdvisorProfile(user);
}

/**
 * Helper: Asegurar que el usuario es asesor
 */
private ensureAdvisor(user: JwtPayload): JwtPayload {
  if (!user || user.role !== 'asesor') {
    throw new ForbiddenException('Solo asesores pueden acceder a este recurso');
  }
  return user;
}
```

---

### Paso 3: Extender AdvisorController

**Modificar**: `backend/src/modules/advisor/advisor.controller.ts`

Agregar estos endpoints:

```typescript
/**
 * GET /advisor/profile
 * Obtiene el perfil actual del asesor con clientes activos calculados
 */
@Get('profile')
getProfile(@CurrentUser() user: JwtPayload) {
  return this.advisorService.getAdvisorProfile(user);
}

/**
 * PATCH /advisor/profile
 * Actualiza el perfil del asesor
 * 
 * Campos editables: specialty, description, maxCapacity, phone, country
 */
@Patch('profile')
updateProfile(
  @CurrentUser() user: JwtPayload,
  @Body() dto: UpdateAdvisorProfileDto,
) {
  return this.advisorService.updateAdvisorProfile(user, dto);
}
```

---

### Paso 4: Integrar en AuthService

**Modificar**: `backend/src/modules/auth/auth.service.ts`

En el método `register()`, después de crear el perfil del cliente, agregar la asignación automática:

```typescript
async register(dto: RegisterDto): Promise<AuthResponse> {
  const { email, password, fullName, role } = dto;

  // ... (método existente hasta aquí) ...

  const { error: roleProfileError } = await this.createRoleProfile(
    role,
    userId,
    dto,
  );

  if (roleProfileError) {
    // ... (error handling existente) ...
  }

  // 🆕 NUEVO: Asignar cliente a asesor automáticamente
  if (role === UserRoleEnum.Cliente) {
    // Inyectar AdvisorService o hacerlo directamente
    // Opción: inyectar en constructor
    const assignmentResult = await this.assignClientToAdvisor(userId);
    
    // No romper el registro aunque falle la asignación
    if (!assignmentResult.assigned && assignmentResult.warning) {
      console.warn(`Client ${userId} registered but not assigned:`, assignmentResult.warning);
    }
  }

  const token = this.jwtService.sign({
    sub: userId,
    email,
    role: profile.rol,
  });

  return {
    access_token: token,
    user: this.toAuthUser(email, profile),
  };
}

// 🆕 NUEVO: Método para asignación automática en AuthService
private async assignClientToAdvisor(clientId: string): Promise<{
  assigned: boolean;
  warning?: string;
}> {
  try {
    // Obtener asesor disponible
    const { data: advisorData, error: advisorError } = await this.supabase.rpc(
      'obtener_asesor_disponible',
      {}
    );

    if (advisorError || !advisorData) {
      return {
        assigned: false,
        warning: 'No hay asesores disponibles',
      };
    }

    // Crear asignación
    const { error: assignError } = await this.supabase
      .from('asignaciones_de_clientes')
      .insert({
        asesor_id: advisorData,
        cliente_id: clientId,
        activo: true,
      });

    if (assignError) {
      console.error('Assignment error:', assignError);
      return {
        assigned: false,
        warning: 'Error al asignar asesor',
      };
    }

    return { assigned: true };
  } catch (err) {
    console.error('Error in assignClientToAdvisor:', err);
    return {
      assigned: false,
      warning: 'Error no esperado en asignación',
    };
  }
}
```

**Alternativa más limpia**: Inyectar `AssignmentService` en `AuthService`

```typescript
constructor(
  @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  private readonly jwtService: JwtService,
  private readonly advisorService: AdvisorService, // ← Inyectar
) {}

// En register():
if (role === UserRoleEnum.Cliente) {
  await this.advisorService.assignClientToAdvisor(userId);
}
```

---

### Paso 5: Imports en AdvisorModule

**Modificar**: `backend/src/modules/advisor/advisor.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { SupabaseModule } from "../../common/supabase/supabase.module";
import { AdvisorController } from "./advisor.controller";
import { AdvisorService } from "./advisor.service";

@Module({
  imports: [SupabaseModule],
  controllers: [AdvisorController],
  providers: [AdvisorService],
  exports: [AdvisorService], // ← NUEVO: Exportar para que AuthModule lo use
})
export class AdvisorModule {}
```

**Modificar**: `backend/src/modules/auth/auth.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { SupabaseModule } from "../../common/supabase/supabase.module";
import { AdvisorModule } from "../advisor/advisor.module"; // ← NUEVO
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    SupabaseModule,
    AdvisorModule, // ← NUEVO
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET"),
        signOptions: { expiresIn: "24h" },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
```

---

## 🔌 ENDPOINTS FINALES

### Nuevos Endpoints

#### 1. GET /advisor/profile
```
Método: GET
Path: /advisor/profile
Auth: JwtAuthGuard + Roles('asesor')
Response: GetAdvisorProfileDto
Código: 200

Respuesta Ejemplo:
{
  "id": "uuid-perfil",
  "userId": "uuid-usuario",
  "email": "asesor@fintrack.com",
  "fullName": "Juan Pérez",
  "licenseNumber": "MAT-2026-001",
  "specialty": "Finanzas Corporativas",
  "description": "Especialista en gestión de riesgo",
  "maxCapacity": 5,
  "activeClientsCount": 3,
  "phone": "+54 9 11 2345 6789",
  "country": "Argentina",
  "photo": "https://...",
  "createdAt": "2026-05-01T10:00:00Z",
  "updatedAt": "2026-05-18T14:30:00Z"
}
```

#### 2. PATCH /advisor/profile
```
Método: PATCH
Path: /advisor/profile
Auth: JwtAuthGuard + Roles('asesor')
Body: UpdateAdvisorProfileDto
Response: GetAdvisorProfileDto
Código: 200

Request Ejemplo:
{
  "specialty": "Finanzas Personales",
  "description": "Asesor en inversiones y ahorro",
  "maxCapacity": 10,
  "phone": "+54 9 11 2345 6789",
  "country": "Argentina"
}

Validaciones:
- maxCapacity debe ser >= clientes_activos actuales
- phone: max 20 caracteres
- country: max 80 caracteres
```

#### 3. GET /advisor/dashboard (Existente, usar datos reales)
```
Ya existe, ahora usa:
- asignaciones_de_clientes.activo = true
- COUNT dinámico de clientes
- Cálculos sobre gastos reales
```

#### 4. GET /advisor/clients (Existente, mejorado)
```
Ya existe, ahora:
- Filtra por asignaciones activas
- Ordena por clientes activos
- Incluye datos de perfil de asesor
```

---

## 🧪 TESTING & VALIDACIÓN

### Scenario 1: Registro de Cliente → Asignación Automática

**Test case**:
```typescript
describe('Auth.register + Assignment', () => {
  it('should automatically assign client to least-loaded advisor', async () => {
    // 1. Crear dos asesores
    const advisor1 = await registerAdvisor('advisor1@test.com');
    const advisor2 = await registerAdvisor('advisor2@test.com');

    // 2. Asignar 3 clientes al advisor1
    for (let i = 0; i < 3; i++) {
      await registerClient(`client${i}@test.com`);
    }

    // 3. Registrar nuevo cliente
    const newClient = await registerClient('newclient@test.com');

    // 4. Verificar asignación al advisor2 (menos clientes)
    const assignments = await db
      .from('asignaciones_de_clientes')
      .select('*')
      .eq('cliente_id', newClient.id);

    expect(assignments.data[0].asesor_id).toBe(advisor2.id);
  });

  it('should warn when no advisors available', async () => {
    // 1. crear asesor con capacidad=1
    const advisor = await registerAdvisor(..., { maxCapacity: 1 });

    // 2. asignar 1 cliente al asesor
    await registerClient('client1@test.com');

    // 3. registrar otro cliente
    const response = await registerClient('client2@test.com');

    // 4. verificar que se registra pero no se asigna
    expect(response.warning).toContain('No hay asesores');
    expect(response.assigned).toBe(false);
  });
});
```

### Scenario 2: Actualizar Perfil del Asesor

**Test case**:
```typescript
describe('Advisor Profile Updates', () => {
  it('should update advisor profile', async () => {
    const advisor = await registerAdvisor('advisor@test.com');

    const response = await patchAdvisorProfile(advisor.token, {
      specialty: 'Finanzas Personales',
      maxCapacity: 15,
      phone: '+54 9 11 2345 6789',
    });

    expect(response.specialty).toBe('Finanzas Personales');
    expect(response.maxCapacity).toBe(15);
    expect(response.phone).toBe('+54 9 11 2345 6789');
  });

  it('should reject capacity lower than active clients', async () => {
    const advisor = await registerAdvisor('advisor@test.com', { maxCapacity: 5 });

    // asignar 3 clientes
    for (let i = 0; i < 3; i++) {
      await registerClient(`client${i}@test.com`);
    }

    // intentar bajar capacidad a 2
    const response = await patchAdvisorProfile(advisor.token, {
      maxCapacity: 2,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('capacidad mínima');
  });
});
```

### Scenario 3: Dashboard del Asesor (Datos Reales)

**Test case**:
```typescript
describe('Advisor Dashboard', () => {
  it('should return real assignment data', async () => {
    const advisor = await registerAdvisor('advisor@test.com');
    const client = await registerClient(`client1@test.com`);

    // crear algunos gastos
    await createExpense(client.token, { amount: 100, category: 'Food' });
    await createExpense(client.token, { amount: 50, category: 'Transport' });

    // obtener dashboard
    const dashboard = await getAdvisorDashboard(advisor.token);

    expect(dashboard.advisor.totalClients).toBe(1);
    expect(dashboard.clients[0].id).toBe(client.id);
    expect(dashboard.stats.totalExpenses).toBe(150);
  });
});
```

### Checklist de Validación

- [ ] Migración SQL ejecutada en Supabase
- [ ] Índices creados correctamente
- [ ] DTOs validan campos correctamente
- [ ] GET /advisor/profile retorna activeClientsCount calculado
- [ ] PATCH /advisor/profile rechaza capacidad < clientes activos
- [ ] Registro de cliente llamaselecciona asesor disponible
- [ ] Si no hay asesores, devuelve warning pero NO rompe registro
- [ ] Dashboard del asesor muestra solo clientes activos
- [ ] COUNT dinámico no genera N+1 queries
- [ ] RLS permite que asesor vea/actualice su propio perfil
- [ ] RLS previene que asesor vea perfil de otro asesor

---

## 📊 RESUMEN DE CAMBIOS

| Tipo | Archivo | Acción | LOC |
|------|---------|--------|-----|
| **SQL** | `0007_assignments_feature.sql` | CREATE | ~250 |
| **DTO** | `update-advisor-profile.dto.ts` | CREATE | ~30 |
| **DTO** | `get-advisor-profile.dto.ts` | CREATE | ~20 |
| **Service** | `advisor.service.ts` | EXTEND (+5 métodos) | ~200 |
| **Controller** | `advisor.controller.ts` | EXTEND (+2 endpoints) | ~15 |
| **Service** | `auth.service.ts` | MODIFY (integrar asignación) | ~50 |
| **Module** | `advisor.module.ts` | MODIFY (exportar service) | ~2 |
| **Module** | `auth.module.ts` | MODIFY (importar advisor) | ~2 |
| | | **TOTAL** | **~570** |

---

## 🚀 ORDEN DE IMPLEMENTACIÓN

1. ✅ **Crear migración SQL** → Ejecutar en Supabase (0007_assignments_feature.sql)
2. ✅ **Crear DTOs** → UpdateAdvisorProfileDto, GetAdvisorProfileDto
3. ✅ **Extender AdvisorService** → +5 métodos nuevos
4. ✅ **Extender AdvisorController** → +2 endpoints nuevos
5. ✅ **Importar en modules** → AdvisorModule exporta, AuthModule importa
6. ✅ **Integrar assignClientToAdvisor en AuthService.register()**
7. ✅ **Compilar y testear**
8. ✅ **Actualizar frontend** para consumir nuevos endpoints

---

## ✅ VALIDACIÓN FINAL

```bash
# Compilar sin errores
npm run build

# Tests unitarios
npm run test -- advisor.service advisor.controller auth.service

# Build production
npm run build

# Verificar en localhost:3000
curl http://localhost:3000/advisor/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

**FIN DEL DOCUMENTO**

Arquitecto Backend Senior | FinTrack 2026  
Especialidad: NestJS + Supabase + PostgreSQL
