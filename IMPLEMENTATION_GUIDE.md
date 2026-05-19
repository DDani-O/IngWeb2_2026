# Guía de Implementación Ejecutable - Sistema de Asignación Automática

## ⚠️ IMPORTANTE: URLs Correctas

**El servidor tiene prefijo global `/api/v1`**

Todos los endpoints usan:
```
http://localhost:3000/api/v1/{endpoint}
```

**NO** use `/auth/register` → Use `/api/v1/auth/register`

Ver [API_URLS_REFERENCE.md](./API_URLS_REFERENCE.md) para listado completo de endpoints.

---

## ✅ RESUMEN EJECUTIVO

Se completó la implementación del sistema de asignación automática de clientes a asesores:

### Componentes Implementados

#### 1️⃣ Base de Datos (SQL)
- ✅ Migración 0007_assignments_feature.sql
  - Columnas nuevas: `capacidad_maxima`, `telefono`, `pais`
  - Función SQL: `obtener_asesor_disponible()` (balanceo automático)
  - Índices: Para queries rápidas sin N+1
  - Triggers: Validación de capacidad antes de insertar asignaciones
  - Policies de RLS: Asesores ven/editan solo su perfil

#### 2️⃣ Backend (NestJS)
- ✅ **AdvisorService** (5 nuevos métodos)
  - `selectAvailableAdvisor()` → Obtiene asesor con menos clientes
  - `assignClientToAdvisor()` → Crea asignación sin romper
  - `countActiveClientsForAdvisor()` → COUNT dinámico
  - `getAdvisorProfile()` → GET /advisor/profile con datos reales
  - `updateAdvisorProfile()` → PATCH /advisor/profile

- ✅ **AdvisorController** (2 nuevos endpoints)
  - `GET /advisor/profile` → Perfil con clientes activos
  - `PATCH /advisor/profile` → Edita capacity, phone, country, etc.

- ✅ **AuthService** (integración)
  - `assignClientToAdvisorAuto()` → Llamado en register()
  - Asignación automática balanceada al registrar cliente
  - No rompe el flujo si falla

#### 3️⃣ DTOs (Validación)
- ✅ `UpdateAdvisorProfileDto` → Validaciones class-validator
- ✅ `GetAdvisorProfileDto` → Response con clientes_activos calculado

---

## 🚀 PASOS PARA EJECUTAR

### Paso 1: Ejecutar Migración SQL en Supabase

```bash
# Copiar contenido de:
# backend/database/migrations/0007_assignments_feature.sql

# Ir a Supabase → SQL Editor → Pegar y ejecutar

# ⚠️ Importante: Ejecutar en orden de sucursales
# 1. Primero la nueva migración (0007)
# 2. Verificar que no hay errores
# 3. Testear antes de pasar a producción
```

**Validar que ejecutó:**
```sql
-- En Supabase SQL Editor, ejecutar:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='perfiles_asesores' 
ORDER BY ordinal_position;

-- Debe mostrar: capacidad_maxima, telefono, pais
```

### Paso 2: Compilar Backend

```bash
cd backend
npm run build

# Si pasa sin errores ✅
# Si hay errores: revisar import errors
```

### Paso 3: Iniciar Servidor

```bash
cd backend
npm run start:dev

# Debe escuchar en http://localhost:3000
```

### Paso 4: Testear Endpoints

#### Escenario A: Registrar cliente (asignación automática)

```bash
# 1. Registrar un asesor primero
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "advisor1@fintrack.com",
    "password": "SecurePass123!",
    "fullName": "Juan García",
    "role": "asesor",
    "licenseNumber": "MAT-2026-001",
    "specialty": "Finanzas Personales"
  }'

# Guardar el token en $ADVISOR_TOKEN

# 2. Registrar un cliente (se asignará automáticamente)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client1@fintrack.com",
    "password": "SecurePass123!",
    "fullName": "María López",
    "role": "cliente",
    "occupation": "Ingeniera"
  }'

# Guardar el token en $CLIENT_TOKEN

# Verificar en BD:
# SELECT * FROM asignaciones_de_clientes WHERE activo = true;
# client1 debe estar asignado a advisor1
```

#### Escenario B: Obtener perfil del asesor

```bash
curl -X GET http://localhost:3000/api/v1/advisor/profile \
  -H "Authorization: Bearer $ADVISOR_TOKEN"

# Response esperado:
{
  "id": "uuid-perfil",
  "userId": "uuid-usuario",
  "email": "advisor1@fintrack.com",
  "fullName": "Juan García",
  "licenseNumber": "MAT-2026-001",
  "specialty": "Finanzas Personales",
  "description": null,
  "maxCapacity": 5,
  "activeClientsCount": 1,    # ← CALCULADO DINÁMICAMENTE
  "phone": null,
  "country": null,
  "photo": null,
  "createdAt": "2026-05-18T...",
  "updatedAt": "2026-05-18T..."
}
```

#### Escenario C: Actualizar perfil del asesor

```bash
curl -X PATCH http://localhost:3000/api/v1/advisor/profile \
  -H "Authorization: Bearer $ADVISOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "specialty": "Inversiones y Bolsa",
    "maxCapacity": 10,
    "phone": "+54 9 11 2345 6789",
    "country": "Argentina"
  }'

# Response: Perfil actualizado con los nuevos valores
```

#### Escenario D: Registrar múltiples clientes (verificar balanceo)

```bash
# Crear 2 asesores
ADVISOR1_TOKEN=... # (token del primer asesor)
ADVISOR2_TOKEN=... # (registrar segundo asesor como en Escenario A)

# Registrar 3 clientes
# - Cliente 1: Se asignará a Advisor1 (0 clientes)
# - Cliente 2: Se asignará a Advisor1 (1 cliente)
# - Cliente 3: Se asignará a Advisor2 (0 clientes) <- balanceo

for i in {1..5}; do
  curl -X POST http://localhost:3000/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"client$i@fintrack.com\",
      \"password\": \"SecurePass123!\",
      \"fullName\": \"Cliente $i\",
      \"role\": \"cliente\"
    }"
done

# Verificar en BD:
SELECT ac.asesor_id, COUNT(*) as client_count
FROM asignaciones_de_clientes ac
WHERE ac.activo = true
GROUP BY ac.asesor_id;

# Debe mostrar distribución equilibrada
```

---

## 📋 CHECKLIST DE VALIDACIÓN

- [ ] Migración SQL ejecutada sin errores en Supabase
- [ ] `npm run build` pasa sin errores
- [ ] Server inicia con `npm run start:dev`
- [ ] Registrar asesor funciona correctamente
- [ ] Registrar cliente crea asignación automática
- [ ] GET /advisor/profile retorna `activeClientsCount` correcto
- [ ] PATCH /advisor/profile actualiza correctamente
- [ ] Registrar múltiples clientes → se distribuyen entre asesores
- [ ] Tabla `asignaciones_de_clientes` tiene datos correctos
- [ ] No aparecen errores en console

---

## 🔍 DEBUGGING

### Problema: "Migración no ejecutó"
```sql
-- Verificar si está creada
SELECT * FROM information_schema.routines 
WHERE routine_name = 'obtener_asesor_disponible';

-- Si no existe, copiar y ejecutar 0007_assignments_feature.sql nuevamente
```

### Problema: "Error 23505 duplicate key" al asignar
```sql
-- Verificar si hay asignaciones duplicadas
SELECT cliente_id, COUNT(*) 
FROM asignaciones_de_clientes 
GROUP BY cliente_id 
HAVING COUNT(*) > 1;

-- Limpiar si es necesario:
DELETE FROM asignaciones_de_clientes 
WHERE activo = false;
```

### Problema: "No available advisors" warning
**Causa**: Todos los asesores alcanzaron capacidad máxima  
**Solución**:
```sql
-- Aumentar capacidad:
UPDATE perfiles_asesores SET capacidad_maxima = 10;

-- O crear nuevo asesor
```

---

## 📊 ESTADÍSTICAS POST-IMPLEMENTACIÓN

### Consultas Eficientes (Sin N+1)

```sql
-- 1. Obtener perfil del asesor con clientes activos
SELECT 
  pa.id,
  pa.usuario_id,
  pa.capacidad_maxima,
  COUNT(ac.cliente_id) FILTER (WHERE ac.activo = true) as clientes_activos
FROM perfiles_asesores pa
LEFT JOIN asignaciones_de_clientes ac ON pa.usuario_id = ac.asesor_id
WHERE pa.usuario_id = $1
GROUP BY pa.id;

-- Cost: O(log n) con índices

-- 2. Seleccionar asesor más disponible
SELECT u.id
FROM usuarios u
JOIN perfiles_asesores pa ON u.id = pa.usuario_id
WHERE COUNT(ac.cliente_id) < pa.capacidad_maxima
ORDER BY COUNT(ac.cliente_id) ASC
LIMIT 1;

-- Cost: O(log n) con índices
```

### Índices Creados

| Índice | Tabla | Campos | Efecto |
|--------|-------|--------|--------|
| `idx_asignaciones_asesor_activo` | asignaciones_de_clientes | (asesor_id, activo) | Rápido obtener clientes del asesor |
| `idx_asignaciones_count_activos` | asignaciones_de_clientes | (asesor_id) WHERE activo | COUNT(*) instantáneo |
| `idx_asignaciones_unique_lookup` | asignaciones_de_clientes | (cliente_id, asesor_id) | Evitar duplicados |

---

## 🎯 PRÓXIMOS PASOS FRONTENDOBLE

El frontend puede ahora:

1. **Usar GET /advisor/profile** para dashboard real
   - Mostrar `maxCapacity` y `activeClientsCount`
   - Botón "Editar Disponibilidad"

2. **Usar PATCH /advisor/profile** para editar
   - Cambiar capacidad máxima
   - Actualizar teléfono, país

3. **GET /advisor/dashboard** (existente) ahora usa datos reales
   - `totalClients` es COUNT dinámico
   - Filtro por asignaciones activas

4. **GET /advisor/clients** muestra SOLO clientes asignados
   - Ordenados por fecha de asignación

---

## 📚 DOCUMENTACION TÉCNICA

Ver: [ARCHITECTURE_ASSIGNMENT_SYSTEM.md](../ARCHITECTURE_ASSIGNMENT_SYSTEM.md)  
Contiene: Decisiones arquitectónicas, DTOs, Servicios, SQL, Testing

---

**Arquitecto**: Backend Senior - NestJS + Supabase  
**Estado**: Implementación completada ✅  
**Fecha**: 2026-05-18
