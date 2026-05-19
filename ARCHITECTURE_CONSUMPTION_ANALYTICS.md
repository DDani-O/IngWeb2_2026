# Arquitectura de Análisis de Consumo y Analítica Financiera - FinTrack

**Versión**: 1.0  
**Arquitecto**: Backend Senior - NestJS + Supabase + PostgreSQL  
**Fecha**: 2026-05-18  
**Estado**: Propuesta Técnica

---

## ÍNDICE

1. [Análisis de la Situación Actual](#análisis-de-la-situación-actual)
2. [Problemas Identificados](#problemas-identificados)
3. [Decisiones Arquitectónicas](#decisiones-arquitectónicas)
4. [Propuesta de Solución](#propuesta-de-solución)
5. [Estructura de Módulos](#estructura-de-módulos)
6. [Implementación Detallada](#implementación-detallada)
7. [Algoritmos Reales](#algoritmos-reales)
8. [Estrategia de Cache](#estrategia-de-cache)
9. [Índices y Optimización](#índices-y-optimización)
10. [Endpoints Finales](#endpoints-finales)

---

## Análisis de la Situación Actual

### Estado del Schema (0006_full_schema_v1.sql)

#### Tabla: `analisis_de_consumo`

```sql
CREATE TABLE IF NOT EXISTS public.analisis_de_consumo (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    periodo_inicio date NOT NULL,
    periodo_fin date NOT NULL,
    gasto_total numeric(12,2) NOT NULL,
    gasto_promedio numeric(12,2) NULL,
    categoria_dominante_id uuid NULL REFERENCES public.categorias_de_gasto(id) ON DELETE SET NULL,
    comercio_mas_frecuente text NULL,
    dia_mayor_gasto smallint NULL,
    cantidad_gastos int NOT NULL,
    gastos_inusuales_detectados int NOT NULL DEFAULT 0,
    creado_en timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_analisis_consumo_dia CHECK (dia_mayor_gasto IS NULL OR (dia_mayor_gasto BETWEEN 1 AND 7)),
    CONSTRAINT uq_analisis_consumo UNIQUE (cliente_id, periodo_inicio, periodo_fin)
);
```

**Problema**: Esta tabla tiene un UNIQUE constraint que sugiere que debería actuar como "cache" perión mensual. Sin embargo:
- No hay mecanismo que la mantenga sincronizada con cambios en `gastos`
- No tiene triggers de invalidación
- No hay endpoints que la usen

#### Tabla: `gastos`

```sql
CREATE TABLE IF NOT EXISTS public.gastos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    categoria_id uuid NOT NULL REFERENCES public.categorias_de_gasto(id) ON DELETE RESTRICT,
    comercio text NOT NULL,
    fecha_gasto date NOT NULL,
    monto numeric(12,2) NOT NULL,
    descripcion text NULL,
    origen public.origen_gasto NOT NULL,
    moneda char(3) NOT NULL DEFAULT 'ARS',
    ticket_principal_id uuid NULL REFERENCES public.tickets(id) ON DELETE SET NULL,
    ocr_estado public.estado_ocr NOT NULL DEFAULT 'pendiente',
    ocr_confianza numeric(5,2) NULL,
    creado_en timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now()
);
```

**Source of Truth**: Esta es la tabla autorizada. Todos los cálculos deben derivarse de aquí.

---

## Problemas Identificados

### 1. **Inconsistencia de Datos**
- `analisis_de_consumo` puede quedar obsoleta si `gastos` se actualiza
- No hay triggers que recomputen análisis
- Riesgo de datos contradictorios entre tablas

### 2. **Falta de Detección de Anomalías**
- Campo `gastos_inusuales_detectados` existe pero nadie lo calcula
- Sin algoritmo definido (z-score, IQR, percentiles, etc.)
- Sin umbral configurable

### 3. **Diseño Incompleto del Dashboard**
- No hay agregación para asesor que vea TODOS sus clientes
- No hay cálculos de "riesgo", "categoría dominante global", etc.
- Frontend mockea datos en lugar de usar endpoints reales

### 4. **Falta de Endpoints**
- No existe `GET /users/me/consumption-analysis`
- No existe `GET /users/me/dashboard`
- No existe `GET /advisor/dashboard`
- No existe `GET /advisor/clients/{clientId}/consumption-analysis`

### 5. **Overhead de Persistencia**
- Guardar análisis pre-computados requiere:
  - Space en BD
  - Mantenimiento de triggers
  - Invalidación de cache
  - Risk de desvincronización

### 6. **Falta de Escalabilidad**
- Queries N+1 al asesor ver múltiples clientes
- Sin índices sobre campos de análisis
- Sin materialized views para queries complejas

---

## Decisiones Arquitectónicas

### Decisión 1: ¿Persistir `analisis_de_consumo`?

#### Opciones Evaluadas

| Opción | Ventaja | Desventaja | Recomendación |
|--------|---------|-----------|----------------|
| **A) Persistir (tabla)** | Fast queries | Riesgo inconsistencia, overhead mantenimiento, duplicación de datos | ❌ NO |
| **B) PostgreSQL VIEW** | Always fresh, NO duplicación, Simple SQL | Lento si query es compleja | ⚠️ PARCIAL |
| **C) MATERIALIZED VIEW** | Fast queries, Fresh cada refresh | Requiere refresh programado, lag de datos | ✅ SÍ |
| **D) Calcular on-demand** | Siempre fresh, NO overhead | Lento, impacto en performance | ✅ SÍ (Híbrido) |
| **E) Cache Redis** | Ultra-fast, flexible | Complejidad extra, TTL management | ⚠️ OPCIONAL |

#### **DECISIÓN FINAL: Híbrida**

```
┌─────────────────────────────────────────────────────────┐
│  Frontend solicita /users/me/consumption-analysis       │
└────────────────┬────────────────────────────────────────┘
                 │
         ┌───────▼────────────┐
         │  Cache Redis       │  TTL: 10 min
         │  (opcional)        │
         └───────┬────────────┘
                 │ (MISS)
         ┌───────▼──────────────────────────┐
         │  NestJS Service calculates:      │
         │  - Ejecuta queries SQL           │
         │  - Detecta anomalías en memoria  │
         │  - Formatea response             │
         └───────┬──────────────────────────┘
                 │
         ┌───────▼──────────────────────────────────────┐
         │  PostgreSQL             Queries optimizadas: │
         │  - VIEW consumption_stats                     │
         │  - COUNT/SUM/AVG en SQL                       │
         │  - Índices sobre (cliente_id, fecha_gasto)   │
         └──────────────────────────────────────────────┘

VENTAJAS:
✅ Datos siempre frescos (source of truth = gastos)
✅ NO duplicación de datos
✅ Anomalía detection en memoria (flexible, tuneable)
✅ Optional cache para dashboards heavy
✅ Escalable (índices optimizados)
✅ Fácil de mantener (lógica centralizada)
```

### Decisión 2: Dónde Hacer los Cálculos

| Cálculo | SQL | NestJS | Frontend | Justificación |
|---------|-----|--------|----------|---------------|
| Período de análisis | ✅ (GROUP BY período) | | | Agregación pura, SQL es óptimo |
| Gasto total/promedio/count | ✅ (SUM/AVG/COUNT) | | | Agregaciones en BD |
| Categoría dominante | ✅ (ORDER BY COUNT DESC LIMIT 1) | | | SQL es eficiente |
| Comercio más frecuente | ✅ (GROUP BY comercio) | | | SQL |
| Día de mayor gasto | ✅ (EXTRACT DOW) | | | SQL |
| Z-score anomalía | | ✅ (Stdev en memoria) | | Lógica compleja, necesita NestJS |
| Flagging "inusual" | | ✅ (Comparación con promedio) | | Post-process |
| Formateo de response | | ✅ | | DTO validation |
| Visualización gráficos | | | ✅ | Frontend responsabilidad |

**DECISIÓN**: SQL hace todo lo que puede, NestJS hace anomalía detection y formateo.

### Decisión 3: Estructura de Módulos

Opciones:

```
A) Crear nuevo módulo analytics/
   ├── analytics.controller.ts
   ├── analytics.service.ts
   ├── dto/
   └── analytics.module.ts

B) Reutilizar expenses/ + extender
   ├── expenses.service.ts (add methods)
   └── expenses.controller.ts (add endpoints)

C) Crear módulo shared consumption/
   ├── consumption-analysis.service.ts
   └── consumption-analysis.module.ts
```

**DECISIÓN**: **Opción A (nuevo módulo `analytics/`)**

**Razón**: 
- Separación de concerns (expenses = CRUD línea, analytics = agregación)
- SRP (Single Responsibility)
- Reutilizable por advisor, users, dashboard, etc.
- Más fácil de testear
- Escala mejor

### Decisión 4: Detección de Anomalías - Algoritmo

Opciones:

| Algoritmo | Complejidad | Precisión | Recomendación |
|-----------|-------------|-----------|---------------|
| **Z-score** | O(n) | Media | ✅ Recomendado |
| **IQR (Q1, Q3)** | O(n log n) | Alta | ✅ Alternativa |
| **MAD (Median Abs Dev)** | O(n log n) | Alta | ✅ Alternativa |
| **Umbral fijo** | O(1) | Baja | ❌ No robusto |
| **Percentiles** | O(n log n) | Media | ⚠️ OK |

**DECISIÓN: Hybrid (Z-score + Percentile)**

```typescript
Para cada gasto:
  1. Calcular media y stdev de gastos en la categoría (últimos 30 días)
  2. Calcular z-score: z = (gasto - media) / stdev
  3. Si |z| > 2.5: INUSUAL (criterio: desviación de 2.5σ)
  4. Además: si gasto > percentil_95 de la categoría: INUSUAL

Resultado: Combina rigor estadístico con regla de percentil pragmática
```

---

## Propuesta de Solución

### Cambios a la Base de Datos

#### 1. Crear VIEW: `consumption_stats_view`

```sql
CREATE OR REPLACE VIEW public.consumption_stats_view AS
  SELECT
    g.cliente_id,
    DATE_TRUNC('MONTH', g.fecha_gasto)::date AS periodo_inicio,
    (DATE_TRUNC('MONTH', g.fecha_gasto) + INTERVAL '1 month' - INTERVAL '1 day')::date AS periodo_fin,
    SUM(g.monto) AS gasto_total,
    AVG(g.monto) AS gasto_promedio,
    COUNT(*) AS cantidad_gastos,
    COUNT(DISTINCT g.categoria_id) AS categorias_unicas,
    MAX(g.monto) AS monto_maximo,
    MIN(g.monto) AS monto_minimo,
    COUNT(DISTINCT g.comercio) AS comercios_unicos
  FROM public.gastos g
  WHERE g.cliente_id IS NOT NULL
  GROUP BY g.cliente_id, DATE_TRUNC('MONTH', g.fecha_gasto);
```

#### 2. Crear VIEW: `category_distribution_view`

```sql
CREATE OR REPLACE VIEW public.category_distribution_view AS
  SELECT
    g.cliente_id,
    g.categoria_id,
    cg.nombre,
    COUNT(*) AS cantidad,
    SUM(g.monto) AS total,
    ROUND(100.0 * SUM(g.monto) / SUM(SUM(g.monto)) OVER (PARTITION BY g.cliente_id), 2) AS porcentaje,
    AVG(g.monto) AS promedio,
    ROW_NUMBER() OVER (PARTITION BY g.cliente_id ORDER BY SUM(g.monto) DESC) AS ranking
  FROM public.gastos g
  JOIN public.categorias_de_gasto cg ON g.categoria_id = cg.id
  WHERE g.cliente_id IS NOT NULL
  GROUP BY g.cliente_id, g.categoria_id, cg.nombre;
```

#### 3. Crear VIEW: `monthly_evolution_view`

```sql
CREATE OR REPLACE VIEW public.monthly_evolution_view AS
  SELECT
    g.cliente_id,
    DATE_TRUNC('MONTH', g.fecha_gasto)::date AS mes,
    SUM(g.monto) AS gasto_mes,
    COUNT(*) AS cantidad_transacciones,
    ROUND(SUM(g.monto) / COUNT(*), 2) AS promedio_transaccion,
    LAG(SUM(g.monto)) OVER (PARTITION BY g.cliente_id ORDER BY DATE_TRUNC('MONTH', g.fecha_gasto)) AS gasto_mes_anterior,
    ROUND(100.0 * (SUM(g.monto) - LAG(SUM(g.monto)) OVER (PARTITION BY g.cliente_id ORDER BY DATE_TRUNC('MONTH', g.fecha_gasto))) / LAG(SUM(g.monto)) OVER (PARTITION BY g.cliente_id ORDER BY DATE_TRUNC('MONTH', g.fecha_gasto)), 2) AS variacion_porcentual
  FROM public.gastos g
  WHERE g.cliente_id IS NOT NULL
  GROUP BY g.cliente_id, DATE_TRUNC('MONTH', g.fecha_gasto);
```

#### 4. Crear VIEW: `advisor_dashboard_view`

```sql
CREATE OR REPLACE VIEW public.advisor_dashboard_view AS
  SELECT
    ac.asesor_id,
    COUNT(DISTINCT ac.cliente_id) AS total_clientes,
    COUNT(DISTINCT CASE WHEN ac.activo = true THEN ac.cliente_id END) AS clientes_activos,
    SUM(g.monto) FILTER (WHERE g.creado_en >= NOW() - INTERVAL '30 days') AS gasto_últimos_30_días,
    ROUND(AVG(g.monto) FILTER (WHERE g.creado_en >= NOW() - INTERVAL '30 days'), 2) AS gasto_promedio_últimos_30,
    COUNT(DISTINCT g.cliente_id) AS clientes_con_transacciones_últimas_semana,
    MAX(g.creado_en) AS última_transacción
  FROM public.asignaciones_de_clientes ac
  LEFT JOIN public.gastos g ON ac.cliente_id = g.cliente_id
  GROUP BY ac.asesor_id;
```

#### 5. Índices Nuevos

```sql
-- Para consumption_stats_view
CREATE INDEX IF NOT EXISTS idx_gastos_cliente_fecha ON public.gastos(
    cliente_id, 
    fecha_gasto DESC
);

CREATE INDEX IF NOT EXISTS idx_gastos_cliente_categoria ON public.gastos(
    cliente_id, 
    categoria_id
);

-- Para anomalía detection (últimos 30 días)
CREATE INDEX IF NOT EXISTS idx_gastos_cliente_reciente ON public.gastos(
    cliente_id, 
    creado_en DESC
) WHERE creado_en >= NOW() - INTERVAL '90 days';

-- Para advisor dashboard
CREATE INDEX IF NOT EXISTS idx_asignaciones_asesor_activo ON public.asignaciones_de_clientes(
    asesor_id, 
    activo
);

-- Para monthly evolution
CREATE INDEX IF NOT EXISTS idx_gastos_cliente_mes ON public.gastos(
    cliente_id, 
    DATE_TRUNC('MONTH', fecha_gasto)
);
```

#### 6. NO ELIMINAR `analisis_de_consumo`

Mantener la tabla por compatibilidad con posibles reports legacy, pero NO la usaremos en nueva lógica.

---

## Estructura de Módulos

### Diagrama de Dependencias

```
┌────────────────────────────────────────────────────┐
│  app.module.ts                                     │
├────────────────────────────────────────────────────┤
│ - SupabaseModule                                   │
│ - AuthModule                                       │
│ - UsersModule                                      │
│ - AdvisorModule                                    │
│ - ExpensesModule                                   │
│ - CategoriesModule                                 │
│ - AnalyticsModule       ← NUEVO                    │
│ - DashboardModule       ← NUEVO (Opcional)        │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  AnalyticsModule                                   │
├────────────────────────────────────────────────────┤
│ Imports:                                           │
│ - SupabaseModule (para acceso a BD)               │
│ - CategoriesModule (para nombres de categorías)  │
│                                                   │
│ Providers:                                         │
│ - ConsumptionAnalyticsService                     │
│ - AnomalyDetectionService                         │
│                                                   │
│ Controllers:                                       │
│ - AnalyticsController                             │
│                                                   │
│ Exports:                                           │
│ - ConsumptionAnalyticsService                     │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  UsersModule (EXTENDIDO)                           │
├────────────────────────────────────────────────────┤
│ Módulos existentes +                              │
│ Imports: AnalyticsModule ← NUEVO IMPORT           │
│                                                   │
│ Agrega en UsersController:                         │
│ - @Get('dashboard')                               │
│ - @Get('consumption-analysis')                    │
│ - @Get('recommendations') (existente)             │
│ - @Get('messages') (existente)                    │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  AdvisorModule (EXTENDIDO)                         │
├────────────────────────────────────────────────────┤
│ Módulos existentes +                              │
│ Imports: AnalyticsModule ← NUEVO IMPORT           │
│                                                   │
│ Agrega en AdvisorController:                       │
│ - @Get('dashboard')       (dashboard agregado)    │
│ - @Get('risk-assessment') (clientes en riesgo)   │
│ - @Get('clients/:id/analysis') (análisis cliente)│
└────────────────────────────────────────────────────┘
```

### Árbol de Carpetas

```
backend/
├── src/
│   ├── modules/
│   │   ├── analytics/                    ← NUEVO
│   │   │   ├── analytics.controller.ts
│   │   │   ├── analytics.module.ts
│   │   │   ├── analytics.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── consumption-analysis.dto.ts
│   │   │   │   ├── consumption-highlights.dto.ts
│   │   │   │   ├── category-distribution.dto.ts
│   │   │   │   ├── monthly-evolution.dto.ts
│   │   │   │   ├── unusual-expenses.dto.ts
│   │   │   │   └── index.ts
│   │   │   ├── services/
│   │   │   │   ├── consumption-analytics.service.ts
│   │   │   │   ├── anomaly-detection.service.ts
│   │   │   │   └── index.ts
│   │   │   ├── types/
│   │   │   │   ├── consumption.types.ts
│   │   │   │   └── anomaly.types.ts
│   │   │   └── constants/
│   │   │       └── analytics.constants.ts
│   │   │
│   │   ├── users/                       ← MODIFICADO
│   │   │   ├── users.controller.ts      (agregar dashboard endpoint)
│   │   │   ├── users.service.ts         (agregar método de dashboard)
│   │   │   └── ... (resto igual)
│   │   │
│   │   ├── advisor/                     ← MODIFICADO
│   │   │   ├── advisor.controller.ts    (agregar dashboard endpoint)
│   │   │   ├── advisor.service.ts       (agregar método de dashboard)
│   │   │   └── ... (resto igual)
│   │   │
│   │   ├── expenses/                    ← SIN CAMBIOS
│   │   └── ... (resto igual)
│   │
│   └── ... (resto igual)
│
└── database/
    └── migrations/
        └── 0008_analytics_views_and_indexes.sql   ← NUEVO
```

---

## Implementación Detallada

### 1. DTO: ConsumptionAnalysisDto

```typescript
// src/modules/analytics/dto/consumption-analysis.dto.ts

import { Expose, Type } from 'class-transformer';
import { IsNumber, IsObject, IsArray } from 'class-validator';

export class ConsumptionHighlightsDto {
  @Expose()
  @IsNumber()
  totalExpense: number;

  @Expose()
  @IsNumber()
  averageExpense: number;

  @Expose()
  @IsNumber()
  transactionCount: number;

  @Expose()
  @IsNumber()
  uniqueCategories: number;

  @Expose()
  @IsNumber()
  maxExpense: number;

  @Expose()
  @IsString()
  mostFrequentMerchant: string;

  @Expose()
  @IsNumber()
  dayOfHighestExpense: number; // 1-7 (Monday-Sunday)
}

export class CategoryDistributionDto {
  @Expose()
  @IsUUID()
  categoryId: string;

  @Expose()
  @IsString()
  categoryName: string;

  @Expose()
  @IsNumber()
  amount: number;

  @Expose()
  @IsNumber()
  percentage: number;

  @Expose()
  @IsNumber()
  transactionCount: number;

  @Expose()
  @IsNumber()
  averagePerTransaction: number;

  @Expose()
  @IsNumber()
  ranking: number; // 1 = highest spending
}

export class MonthlyEvolutionEntryDto {
  @Expose()
  @IsString()
  month: string; // YYYY-MM

  @Expose()
  @IsNumber()
  totalExpense: number;

  @Expose()
  @IsNumber()
  transactionCount: number;

  @Expose()
  @IsNumber()
  averagePerTransaction: number;

  @Expose()
  @IsNumber()
  variationPercentage: number | null; // null para primer mes

  @Expose()
  @IsNumber()
  trend: number; // 1 = up, -1 = down, 0 = stable
}

export class UnusualExpenseDto {
  @Expose()
  @IsUUID()
  expenseId: string;

  @Expose()
  @IsString()
  merchant: string;

  @Expose()
  @IsNumber()
  amount: number;

  @Expose()
  @IsString()
  category: string;

  @Expose()
  @IsString()
  date: string; // YYYY-MM-DD

  @Expose()
  @IsNumber()
  zScore: number;

  @Expose()
  @IsString()
  reason: string; // 'HIGH_ZSCORE' | 'ABOVE_95_PERCENTILE' | 'SPIKE_IN_CATEGORY'

  @Expose()
  @IsNumber()
  anomalyScore: number; // 0-1 (confidence)
}

export class ConsumptionAnalysisDto {
  @Expose()
  @Type(() => ConsumptionHighlightsDto)
  @IsObject()
  highlights: ConsumptionHighlightsDto;

  @Expose()
  @Type(() => CategoryDistributionDto)
  @IsArray()
  categoryDistribution: CategoryDistributionDto[];

  @Expose()
  @Type(() => MonthlyEvolutionEntryDto)
  @IsArray()
  monthlyEvolution: MonthlyEvolutionEntryDto[];

  @Expose()
  @Type(() => UnusualExpenseDto)
  @IsArray()
  unusualExpenses: UnusualExpenseDto[];

  @Expose()
  @IsString()
  periodStart: string; // YYYY-MM-DD

  @Expose()
  @IsString()
  periodEnd: string; // YYYY-MM-DD

  @Expose()
  @IsNumber()
  generatedAt: number; // timestamp
}
```

### 2. Service: ConsumptionAnalyticsService

```typescript
// src/modules/analytics/services/consumption-analytics.service.ts

import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../../common/supabase/supabase.provider';
import { plainToInstance } from 'class-transformer';
import {
  ConsumptionAnalysisDto,
  ConsumptionHighlightsDto,
  CategoryDistributionDto,
  MonthlyEvolutionEntryDto,
  UnusualExpenseDto,
} from '../dto';
import { AnomalyDetectionService } from './anomaly-detection.service';

@Injectable()
export class ConsumptionAnalyticsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly anomalyDetection: AnomalyDetectionService,
  ) {}

  /**
   * Obtener análisis de consumo completo del cliente
   * @param clientId - UUID del cliente
   * @param monthsBack - Cuántos meses atrás incluir (default: 12)
   */
  async getConsumptionAnalysis(
    clientId: string,
    monthsBack: number = 12,
  ): Promise<ConsumptionAnalysisDto> {
    // 1. Validar que cliente existe
    const { data: clientExists, error: clientError } = await this.supabase
      .from('usuarios')
      .select('id')
      .eq('id', clientId)
      .eq('rol', 'cliente')
      .single();

    if (clientError || !clientExists) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // 2. Obtener highlights
    const highlights = await this._getHighlights(clientId, monthsBack);

    // 3. Obtener distribución por categoría
    const categoryDistribution = await this._getCategoryDistribution(
      clientId,
      monthsBack,
    );

    // 4. Obtener evolución mensual
    const monthlyEvolution = await this._getMonthlyEvolution(
      clientId,
      monthsBack,
    );

    // 5. Detectar gastos inusuales
    const unusualExpenses = await this._getUnusualExpenses(
      clientId,
      monthsBack,
    );

    // 6. Calcular período
    const now = new Date();
    const periodEnd = now;
    const periodStart = new Date();
    periodStart.setMonth(periodStart.getMonth() - monthsBack);

    return plainToInstance(ConsumptionAnalysisDto, {
      highlights,
      categoryDistribution,
      monthlyEvolution,
      unusualExpenses,
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0],
      generatedAt: Date.now(),
    });
  }

  /**
   * Obtener highlights de consumo
   */
  private async _getHighlights(
    clientId: string,
    monthsBack: number,
  ): Promise<ConsumptionHighlightsDto> {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - monthsBack);

    const { data, error } = await this.supabase
      .from('gastos')
      .select(
        `
        monto,
        comercio,
        categoria_id,
        fecha_gasto
      `,
      )
      .eq('cliente_id', clientId)
      .gte('creado_en', monthsAgo.toISOString())
      .order('fecha_gasto', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      return {
        totalExpense: 0,
        averageExpense: 0,
        transactionCount: 0,
        uniqueCategories: 0,
        maxExpense: 0,
        mostFrequentMerchant: 'N/A',
        dayOfHighestExpense: 0,
      };
    }

    const totalExpense = data.reduce((sum, e) => sum + e.monto, 0);
    const averageExpense = totalExpense / data.length;
    const maxExpense = Math.max(...data.map((e) => e.monto));

    // Día de la semana con mayor gasto
    const expensesByDay = data.reduce((acc, e) => {
      const date = new Date(e.fecha_gasto);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const financialDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convertir a 1-7 (Monday-Sunday)
      acc[financialDay] = (acc[financialDay] || 0) + e.monto;
      return acc;
    }, {} as Record<number, number>);

    const dayOfHighestExpense = Object.entries(expensesByDay).sort(
      ([, a], [, b]) => b - a,
    )[0]?.[0] ?? 0;

    // Comercio más frecuente
    const merchantFrequency = data.reduce(
      (acc, e) => {
        acc[e.comercio] = (acc[e.comercio] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const mostFrequentMerchant = Object.entries(merchantFrequency).sort(
      ([, a], [, b]) => b - a,
    )[0]?.[0] ?? 'N/A';

    // Categorías únicas
    const uniqueCategories = new Set(data.map((e) => e.categoria_id)).size;

    return {
      totalExpense: Number(totalExpense.toFixed(2)),
      averageExpense: Number(averageExpense.toFixed(2)),
      transactionCount: data.length,
      uniqueCategories,
      maxExpense: Number(maxExpense.toFixed(2)),
      mostFrequentMerchant,
      dayOfHighestExpense: Number(dayOfHighestExpense),
    };
  }

  /**
   * Obtener distribución por categoría (top 10)
   */
  private async _getCategoryDistribution(
    clientId: string,
    monthsBack: number,
  ): Promise<CategoryDistributionDto[]> {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - monthsBack);

    const { data, error } = await this.supabase
      .from('gastos')
      .select(
        `
        monto,
        categoria_id,
        categorias_de_gasto (
          id,
          nombre
        )
      `,
      )
      .eq('cliente_id', clientId)
      .gte('creado_en', monthsAgo.toISOString());

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const categoryMap = new Map<
      string,
      { name: string; amount: number; count: number }
    >();

    let totalAmount = 0;

    // Agrupar por categoría
    data.forEach((expense) => {
      const categoryId = expense.categoria_id;
      const categoryName = expense.categorias_de_gasto?.nombre || 'Unknown';
      const amount = Number(expense.monto);

      totalAmount += amount;

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          name: categoryName,
          amount: 0,
          count: 0,
        });
      }

      const cat = categoryMap.get(categoryId)!;
      cat.amount += amount;
      cat.count += 1;
    });

    // Convertir a array y calcular porcentajes
    let ranking = 1;
    const distribution = Array.from(categoryMap.entries())
      .sort(([, a], [, b]) => b.amount - a.amount)
      .slice(0, 10) // Top 10
      .map(([categoryId, cat]) => ({
        categoryId,
        categoryName: cat.name,
        amount: Number(cat.amount.toFixed(2)),
        percentage: Number(
          ((cat.amount / totalAmount) * 100).toFixed(2),
        ),
        transactionCount: cat.count,
        averagePerTransaction: Number(
          (cat.amount / cat.count).toFixed(2),
        ),
        ranking: ranking++,
      }));

    return distribution.map((d) =>
      plainToInstance(CategoryDistributionDto, d),
    );
  }

  /**
   * Obtener evolución mensual (últimos N meses)
   */
  private async _getMonthlyEvolution(
    clientId: string,
    monthsBack: number,
  ): Promise<MonthlyEvolutionEntryDto[]> {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - monthsBack);

    const { data, error } = await this.supabase
      .from('gastos')
      .select('monto, fecha_gasto')
      .eq('cliente_id', clientId)
      .gte('creado_en', monthsAgo.toISOString())
      .order('fecha_gasto', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Agrupar por mes
    const monthlyData = new Map<
      string,
      { total: number; count: number; transactions: number[] }
    >();

    data.forEach((expense) => {
      const date = new Date(expense.fecha_gasto);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { total: 0, count: 0, transactions: [] });
      }

      const month = monthlyData.get(monthKey)!;
      month.total += Number(expense.monto);
      month.count += 1;
      month.transactions.push(Number(expense.monto));
    });

    // Convertir a array y calcular variaciones
    const evolution: MonthlyEvolutionEntryDto[] = [];
    let previousTotal: number | null = null;

    Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([monthKey, data]) => {
        const variationPercentage =
          previousTotal !== null && previousTotal !== 0
            ? Number(
              (((data.total - previousTotal) / previousTotal) * 100).toFixed(2),
            )
            : null;

        const trend =
          variationPercentage === null
            ? 0
            : variationPercentage > 5
              ? 1
              : variationPercentage < -5
                ? -1
                : 0;

        evolution.push({
          month: monthKey,
          totalExpense: Number(data.total.toFixed(2)),
          transactionCount: data.count,
          averagePerTransaction: Number(
            (data.total / data.count).toFixed(2),
          ),
          variationPercentage,
          trend,
        });

        previousTotal = data.total;
      });

    return evolution.map((e) =>
      plainToInstance(MonthlyEvolutionEntryDto, e),
    );
  }

  /**
   * Detectar gastos inusuales usando anomaly detection
   */
  private async _getUnusualExpenses(
    clientId: string,
    monthsBack: number,
  ): Promise<UnusualExpenseDto[]> {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - monthsBack);

    const { data, error } = await this.supabase
      .from('gastos')
      .select(
        `
        id,
        monto,
        comercio,
        fecha_gasto,
        categoria_id,
        categorias_de_gasto (nombre)
      `,
      )
      .eq('cliente_id', clientId)
      .gte('creado_en', monthsAgo.toISOString())
      .order('fecha_gasto', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Usar servicio de anomalía detection
    const unusual = await this.anomalyDetection.detectAnomalies(
      data.map((e) => ({
        id: e.id,
        amount: Number(e.monto),
        merchant: e.comercio,
        date: e.fecha_gasto,
        categoryId: e.categoria_id,
        categoryName: e.categorias_de_gasto?.nombre || 'Unknown',
      })),
    );

    return unusual.map((u) =>
      plainToInstance(UnusualExpenseDto, {
        expenseId: u.id,
        merchant: u.merchant,
        amount: u.amount,
        category: u.categoryName,
        date: u.date,
        zScore: Number(u.zScore.toFixed(2)),
        reason: u.reason,
        anomalyScore: Number(u.anomalyScore.toFixed(2)),
      }),
    );
  }
}
```

### 3. Service: AnomalyDetectionService

```typescript
// src/modules/analytics/services/anomaly-detection.service.ts

import { Injectable } from '@nestjs/common';

interface ExpenseRecord {
  id: string;
  amount: number;
  merchant: string;
  date: string;
  categoryId: string;
  categoryName: string;
}

interface AnomalyResult extends ExpenseRecord {
  zScore: number;
  reason: 'HIGH_ZSCORE' | 'ABOVE_95_PERCENTILE' | 'SPIKE_IN_CATEGORY';
  anomalyScore: number;
}

@Injectable()
export class AnomalyDetectionService {
  /**
   * Detectar gastos inusuales usando múltiples técnicas
   */
  async detectAnomalies(expenses: ExpenseRecord[]): Promise<AnomalyResult[]> {
    if (expenses.length < 5) return []; // Necesitar al menos 5 registros

    const anomalies: AnomalyResult[] = [];

    // Agrupar por categoría
    const byCategory = this._groupByCategory(expenses);

    expenses.forEach((expense) => {
      const categoryExpenses = byCategory.get(expense.categoryId) || [];

      // 1. Calcular Z-score dentro de la categoría
      const { zScore, mean, stdev } = this._calculateZScore(
        expense.amount,
        categoryExpenses.map((e) => e.amount),
      );

      // 2. Calcular percentil
      const percentile = this._calculatePercentile(
        expense.amount,
        categoryExpenses.map((e) => e.amount),
      );

      // 3. Detectar si es anomalía
      const isHighZScore = Math.abs(zScore) > 2.5; // 2.5σ
      const isAbove95Percentile = percentile > 95;

      if (isHighZScore || isAbove95Percentile) {
        const reason = isHighZScore
          ? 'HIGH_ZSCORE'
          : 'ABOVE_95_PERCENTILE';

        // Calcular anomaly score (0-1)
        const anomalyScore = Math.min(
          1,
          (Math.abs(zScore) / 3 + percentile / 100) / 2,
        );

        anomalies.push({
          ...expense,
          zScore,
          reason,
          anomalyScore,
        });
      }
    });

    // Retornar top anomalías (máximo 10)
    return anomalies
      .sort((a, b) => b.anomalyScore - a.anomalyScore)
      .slice(0, 10);
  }

  /**
   * Agrupar gastos por categoría
   */
  private _groupByCategory(
    expenses: ExpenseRecord[],
  ): Map<string, ExpenseRecord[]> {
    const grouped = new Map<string, ExpenseRecord[]>();

    expenses.forEach((expense) => {
      if (!grouped.has(expense.categoryId)) {
        grouped.set(expense.categoryId, []);
      }
      grouped.get(expense.categoryId)!.push(expense);
    });

    return grouped;
  }

  /**
   * Calcular Z-score
   */
  private _calculateZScore(
    value: number,
    population: number[],
  ): { zScore: number; mean: number; stdev: number } {
    if (population.length < 2)
      return { zScore: 0, mean: value, stdev: 0 };

    const mean = population.reduce((a, b) => a + b) / population.length;
    const variance =
      population.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) /
      population.length;
    const stdev = Math.sqrt(variance);

    const zScore = stdev === 0 ? 0 : (value - mean) / stdev;

    return { zScore, mean, stdev };
  }

  /**
   * Calcular percentil
   */
  private _calculatePercentile(value: number, population: number[]): number {
    if (population.length === 0) return 0;

    const sorted = [...population].sort((a, b) => a - b);
    const count = sorted.filter((x) => x <= value).length;

    return (count / sorted.length) * 100;
  }
}
```

### 4. Extender Users Module

```typescript
// src/modules/users/users.controller.ts

// Agregar estos imports y endpoints:

import { ConsumptionAnalyticsService } from '../analytics/services/consumption-analytics.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly consumptionAnalytics: ConsumptionAnalyticsService,
  ) {}

  // ... existing endpoints ...

  /**
   * GET /api/v1/users/me/consumption-analysis
   * Obtener análisis de consumo del usuario actual
   */
  @Get('me/consumption-analysis')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente')
  async getConsumptionAnalysis(
    @CurrentUser() user: JwtPayload,
    @Query('monthsBack') monthsBack?: number,
  ) {
    return this.consumptionAnalytics.getConsumptionAnalysis(
      user.sub,
      monthsBack || 12,
    );
  }

  /**
   * GET /api/v1/users/me/dashboard
   * Obtener dashboard integrado del cliente
   */
  @Get('me/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente')
  async getDashboard(@CurrentUser() user: JwtPayload) {
    return this.usersService.getClientDashboard(user.sub);
  }
}
```

### 5. Extender Advisor Module

```typescript
// src/modules/advisor/advisor.controller.ts

import { ConsumptionAnalyticsService } from '../analytics/services/consumption-analytics.service';

@Controller('advisor')
export class AdvisorController {
  constructor(
    private readonly advisorService: AdvisorService,
    private readonly consumptionAnalytics: ConsumptionAnalyticsService,
  ) {}

  // ... existing endpoints ...

  /**
   * GET /api/v1/advisor/dashboard
   * Dashboard agregado con info de todos los clientes del asesor
   */
  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('asesor')
  async getDashboard(@CurrentUser() user: JwtPayload) {
    return this.advisorService.getAdvisorDashboard(user.sub);
  }

  /**
   * GET /api/v1/advisor/clients/:clientId/consumption-analysis
   * Obtener análisis de consumo de un cliente específico
   */
  @Get('clients/:clientId/consumption-analysis')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('asesor')
  async getClientAnalysis(
    @CurrentUser() user: JwtPayload,
    @Param('clientId') clientId: string,
  ) {
    // Verificar que el cliente está asignado al asesor
    const isAssigned = await this.advisorService.isClientAssodToAdvisor(
      user.sub,
      clientId,
    );
    if (!isAssigned) {
      throw new ForbiddenException('No tienes acceso a este cliente');
    }

    return this.consumptionAnalytics.getConsumptionAnalysis(clientId, 12);
  }

  /**
   * GET /api/v1/advisor/risk-assessment
   * Clientes con mayores riesgos financieros
   */
  @Get('risk-assessment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('asesor')
  async getRiskAssessment(@CurrentUser() user: JwtPayload) {
    return this.advisorService.getRiskAssessment(user.sub);
  }
}
```

---

## Algoritmos Reales

### Z-Score Anomaly Detection

```
Para cada gasto G en categoría C:

1. Obtener todos los gastos en C (últimos 30 días)
2. Calcular:
   - media μ = Σ gastos / n
   - desviación σ = √(Σ(gasto - μ)²/n)
3. Z-score = (G - μ) / σ

4. Si |Z| > 2.5:  ANOMALÍA
   - Interpretación: Gasto 2.5 desviaciones estándar lejos de la media
   - Probabilidad: ~1.2% de ocurrencia en distribución normal
   - Confianza: ALTA

Ejemplo:
  Categoría "Alimentos"
  Gastos últimos 30 días: [100, 120, 150, 130, 140, ...]
  Media: 125
  Stdev: 15
  
  Nuevo gasto: 250
  Z-score = (250 - 125) / 15 = 8.33
  
  → ANOMALÍA (z > 2.5)
  → Motivo: HIGH_ZSCORE
  → Confianza: 0.95 (muy seguro)
```

### Percentile + IQR Fallback

```
Técnica complementaria al Z-score:

1. Ordenar gastos en categoría: [a₁, a₂, ..., aₙ] (sorted)
2. Calcular percentil del gasto actual
3. Si percentil > 95: Considerado INUSUAL

Por qué ambas técnicas:
- Z-score: Detecta outliers matemáticos
- Percentile: Detecta gastos extremadamente altos (práctico)

Combinación: Si CUALQUIERA se cumple → ANOMALÍA
```

---

## Estrategia de Cache

### Opción 1: Redis Cache (Recomendado para Escalabilidad)

```typescript
// src/modules/analytics/services/consumption-analytics.service.ts

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ConsumptionAnalyticsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly anomalyDetection: AnomalyDetectionService,
  ) {}

  async getConsumptionAnalysis(
    clientId: string,
    monthsBack: number = 12,
  ): Promise<ConsumptionAnalysisDto> {
    const cacheKey = `consumption:${clientId}:${monthsBack}`;
    const ttl = 10 * 60 * 1000; // 10 minutos

    // 1. Intentar obtener del cache
    const cached = await this.cacheManager.get<ConsumptionAnalysisDto>(
      cacheKey,
    );
    if (cached) return cached;

    // 2. Si no está en cache, calcular
    const analysis = await this._computeConsumptionAnalysis(
      clientId,
      monthsBack,
    );

    // 3. Guardar en cache
    await this.cacheManager.set(cacheKey, analysis, ttl);

    return analysis;
  }

  /**
   * Invalidar cache cuando se crea/actualiza un gasto
   */
  async invalidateClientCache(clientId: string): Promise<void> {
    const pattern = `consumption:${clientId}:*`;
    // Implementar invalidación con patrón (depende de cache-manager)
    const keys = await this.cacheManager.get(pattern);
    // Redis: DEL consumption:clientId:*
  }
}
```

### Opción 2: In-Memory Cache (Para Deployments Simples)

```typescript
// Si no se quiere usar Redis, usar Map en memoria:

@Injectable()
export class ConsumptionAnalyticsService {
  private cache = new Map<string, { data: any; expiresAt: number }>();

  async getConsumptionAnalysis(clientId: string, monthsBack: number = 12) {
    const cacheKey = `consumption:${clientId}:${monthsBack}`;
    const ttl = 10 * 60 * 1000; // 10 min

    // Verificar cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // Calcular
    const analysis = await this._computeConsumptionAnalysis(
      clientId,
      monthsBack,
    );

    // Guardar
    this.cache.set(cacheKey, {
      data: analysis,
      expiresAt: Date.now() + ttl,
    });

    return analysis;
  }
}
```

### Invalidación de Cache en AuthService

```typescript
// src/modules/auth/auth.service.ts
// Cuando se crea/actualiza un gasto

import { ConsumptionAnalyticsService } from '../analytics/services/consumption-analytics.service';

@Injectable()
export class AuthService {
  constructor(
    // ... otros
    private readonly consumptionAnalytics: ConsumptionAnalyticsService,
  ) {}

  async onExpenseCreated(clientId: string): Promise<void> {
    // Invalidar cache del cliente
    await this.consumptionAnalytics.invalidateClientCache(clientId);
  }
}
```

---

## Índices y Optimización

### Índices Críticos en SQL

```sql
-- 1. Para queries de consumption stats (PRIMARY)
CREATE INDEX IF NOT EXISTS idx_gastos_cliente_fecha 
  ON public.gastos(cliente_id, fecha_gasto DESC)
  WHERE creado_en >= NOW() - INTERVAL '90 days';

-- 2. Para anomalía detection (por categoría)
CREATE INDEX IF NOT EXISTS idx_gastos_cliente_categoria 
  ON public.gastos(cliente_id, categoria_id, monto);

-- 3. Para advisor dashboard (índice de asignaciones)
CREATE INDEX IF NOT EXISTS idx_asignaciones_asesor_activo 
  ON public.asignaciones_de_clientes(asesor_id, activo);

-- 4. Para evolución mensual
CREATE INDEX IF NOT EXISTS idx_gastos_mes 
  ON public.gastos(cliente_id, DATE_TRUNC('MONTH', fecha_gasto));

-- 5. Para búsquedas por rango de fechas (report generation)
CREATE INDEX IF NOT EXISTS idx_gastos_fecha_rango 
  ON public.gastos(fecha_gasto DESC) 
  WHERE cliente_id IS NOT NULL;
```

### Query Plan Analysis

```sql
-- Verificar que el índice es usado:

EXPLAIN ANALYZE
SELECT 
  SUM(g.monto) as total,
  COUNT(*) as transacciones
FROM public.gastos g
WHERE g.cliente_id = 'uuid-xxx'
  AND g.fecha_gasto >= NOW() - INTERVAL '30 days'
  AND g.fecha_gasto <= NOW();

-- OUTPUT debe mostrar: Index Scan usando idx_gastos_cliente_fecha
-- Cost debe ser bajo (< 100)
```

### Recomendaciones de Particionamiento (Escala >1M registros)

```sql
-- Particionar tabla gastos por cliente (si llega a 10M+ registros):

ALTER TABLE public.gastos
  ADD CONSTRAINT chk_cliente_part CHECK (cliente_id IS NOT NULL);

CREATE TABLE public.gastos_cliente_new (
  LIKE public.gastos,
  CONSTRAINT chk_cliente_part CHECK (cliente_id IS NOT NULL)
);

-- PERO: Para FinTrack 2026 actual (100k+ clientes), no es necesario aún.
-- Usar índices es suficiente.
```

---

## Endpoints Finales

### Resumen Ejecutivo

```
┌─────────────────────────────────────────────────────────────┐
│  NUEVOS ENDPOINTS - CONSUMPTION ANALYTICS & DASHBOARDS      │
└─────────────────────────────────────────────────────────────┘

[Cliente / Usuario]
───────────────────

GET /api/v1/users/me/consumption-analysis
  Query params:
    - monthsBack (default: 12)
  Response:
    {
      highlights: { totalExpense, averageExpense, ... },
      categoryDistribution: [ { categoryId, categoryName, ... } ],
      monthlyEvolution: [ { month, totalExpense, trend, ... } ],
      unusualExpenses: [ { expenseId, amount, zScore, reason, ... } ],
      periodStart: "2025-05-18",
      periodEnd: "2026-05-18",
      generatedAt: 1716007304000
    }
  Auth: Requiere JWT (role: cliente)
  Cache: Redis 10 min
───────────────────

GET /api/v1/users/me/dashboard
  Response:
    {
      profile: { fullName, email, ... },
      summary: {
        totalBalance: 50000,
        monthlyAverage: 2500,
        lastExpense: { amount, merchant, date },
        riskLevel: "MEDIUM"
      },
      recentExpenses: [ ... ],
      recommendations: [ ... ],
      consumptionHighlights: { ... }
    }
  Auth: Requiere JWT (role: cliente)
  Cache: Redis 15 min
───────────────────

[Asesor/Advisor]
────────────────

GET /api/v1/advisor/dashboard
  Response:
    {
      advisorProfile: { fullName, licenseNumber, ... },
      statistics: {
        totalClients: 24,
        activeClients: 20,
        totalAssignedValue: 600000,
        averageClientValue: 25000,
        recentTransactions: 145,
        lastUpdate: "2026-05-18T21:50:00Z"
      },
      clientsByRisk: [
        {
          clientId, clientName, riskLevel, totalSpent, flaggedExpenses,
          lastActivity: "2026-05-18"
        }
      ],
      topCategories: [
        { categoryName, totalAmount, clientCount }
      ],
      alerts: [
        { type, message, severity, affectedClients }
      ]
    }
  Auth: Requiere JWT (role: asesor)
  Cache: Redis 20 min (más fresco = más costo)
───────────────────

GET /api/v1/advisor/clients/:clientId/consumption-analysis
  Query params:
    - monthsBack (default: 12)
  Response: (same as user consumption-analysis)
  Auth: Requiere JWT (role: asesor) + Verificar asignación
  Cache: Redis 10 min
───────────────────

GET /api/v1/advisor/risk-assessment
  Response:
    {
      highRiskClients: [
        {
          clientId,
          clientName,
          riskScore: 0.85,
          concerns: ["High unusualExpenses", "Spike in discretionary"],
          recommendedAction: "Schedule consultation"
        }
      ],
      alerts: [ ... ]
    }
  Auth: Requiere JWT (role: asesor)
  Cache: Redis 30 min
───────────────────

[Analytics (solo para otros módulos)]
──────────────────────────────────

POST /api/v1/analytics/sync (service-role only)
  Body: { clientId, force: boolean }
  Purpose: Forzar recalcular análisis (manual refresh)
  Auth: Service role + API key
───────────────────

Event-driven (cuando se crea gasto):
────────────────────────────────────

ON expense/create
  → Emit: analytics.clientCacheInvalidated(clientId)
  → ExpensesService → ConsumptionAnalyticsService.invalidateClientCache()
  → Advisor cache también invalidada (si hay conexión)
```

### Ejemplo de Respuesta Completa

```json
{
  "highlights": {
    "totalExpense": 45230.50,
    "averageExpense": 287.45,
    "transactionCount": 157,
    "uniqueCategories": 8,
    "maxExpense": 3500.00,
    "mostFrequentMerchant": "Supermercado Jumbo",
    "dayOfHighestExpense": 5
  },
  "categoryDistribution": [
    {
      "categoryId": "uuid-cat-1",
      "categoryName": "Alimentos",
      "amount": 18500.00,
      "percentage": 40.93,
      "transactionCount": 82,
      "averagePerTransaction": 225.61,
      "ranking": 1
    },
    {
      "categoryId": "uuid-cat-2",
      "categoryName": "Transporte",
      "amount": 8200.00,
      "percentage": 18.14,
      "transactionCount": 41,
      "averagePerTransaction": 200.00,
      "ranking": 2
    }
  ],
  "monthlyEvolution": [
    {
      "month": "2025-05",
      "totalExpense": 3200.00,
      "transactionCount": 11,
      "averagePerTransaction": 290.91,
      "variationPercentage": null,
      "trend": 0
    },
    {
      "month": "2025-06",
      "totalExpense": 3850.00,
      "transactionCount": 13,
      "averagePerTransaction": 296.15,
      "variationPercentage": 20.31,
      "trend": 1
    }
  ],
  "unusualExpenses": [
    {
      "expenseId": "uuid-exp-1",
      "merchant": "Tienda Electrónica XYZ",
      "amount": 3500.00,
      "category": "Tecnología",
      "date": "2026-05-15",
      "zScore": 3.21,
      "reason": "HIGH_ZSCORE",
      "anomalyScore": 0.92
    }
  ],
  "periodStart": "2025-05-18",
  "periodEnd": "2026-05-18",
  "generatedAt": 1716007304000
}
```

---

## Próximos Pasos para Implementación

### Fase 1: Base de Datos (1-2 horas)
- [ ] Ejecutar migración 0008 (views + índices)
- [ ] Verificar que no hay conflictos con schema existente
- [ ] Testear queries manual en Supabase

### Fase 2: Backend Core (3-4 horas)
- [ ] Crear módulo `analytics/`
- [ ] Implementar DTOs
- [ ] Implementar `ConsumptionAnalyticsService`
- [ ] Implementar `AnomalyDetectionService`
- [ ] Crear `AnalyticsController`
- [ ] Test de endpoints

### Fase 3: Integración (2-3 horas)
- [ ] Extender `UsersController` con consumption-analysis y dashboard
- [ ] Extender `AdvisorController` con dashboard y risk-assessment
- [ ] Integración de cache
- [ ] Invalidación de cache en creación de gastos

### Fase 4: Frontend (2-3 horas)
- [ ] Actualizar /usuario/patrones → Consumir GET /users/me/consumption-analysis
- [ ] Actualizar /usuario/dashboard → Consumir GET /users/me/dashboard
- [ ] Actualizar /asesor/dashboard → Consumir GET /advisor/dashboard
- [ ] Crear gráficos (Chart.js, recharts, etc.)

### Fase 5: Testing & Optimization (2 horas)
- [ ] Test de queries SQL (EXPLAIN ANALYZE)
- [ ] Load testing (simular múltiples usuarios)
- [ ] Optimizar índices si es necesario
- [ ] Validación de anomalías con datos conocidos

**Total Estimado**: 10-15 horas

---

## Conclusión

La propuesta **Hybrid Approach** (on-demand + opcional cache) es:

✅ **Escalable**: Índices optimizados, sin duplicación de datos  
✅ **Consistente**: Always-fresh, source of truth = gastos  
✅ **Mantenible**: Lógica centralizada en NestJS  
✅ **Flexible**: Anomalía detection tuneable (z-score + percentile)  
✅ **Performante**: Cache opcional, TTL pragmático  
✅ **Producción-ready**: Sin requisitos de infraestructura extra

---

**Documento creado por**:  Arquitecto Backend Senior - NestJS + Supabase + PostgreSQL Analytics  
**Versión**: v1.0  
**Estado**: Listo para implementación
