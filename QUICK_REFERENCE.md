# Quick Reference - Sistema de Asignación

## 📖 Índice Rápido

### Documentos Principales
1. **IMPLEMENTATION_SUMMARY.md** ← LEER PRIMERO (2 min)
2. **ARCHITECTURE_ASSIGNMENT_SYSTEM.md** (25 min)  
3. **IMPLEMENTATION_GUIDE.md** (10 min)
4. **Este archivo** - Quick reference (5 min)

---

## 🔌 Endpoints

### GET /advisor/profile
```bash
curl -X GET http://localhost:3000/api/v1/advisor/profile \
  -H "Authorization: Bearer $TOKEN"

Response:
{
  "id": "uuid",
  "maxCapacity": 5,
  "activeClientsCount": 3,  ← DINÁMICO
  "phone": "+54 9 ...",
  "country": "Argentina"
}
```

### PATCH /advisor/profile
```bash
curl -X PATCH http://localhost:3000/api/v1/advisor/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "maxCapacity": 10,
    "phone": "+54 9 11 2345 6789",
    "country": "Argentina"
  }'
```

---

## 🧬 Arquitectura Resumida

```
POST /auth/register (cliente)
  ↓
auth.service.register()
  ├─ Crea usuario en Supabase Auth
  ├─ Crea perfil cliente en BD
  └─ 🆕 Llama assignClientToAdvisorAuto()
      └─ Función SQL obtener_asesor_disponible()
         └─ Retorna asesor con menos clientes
             └─ INSERT en asignaciones_de_clientes
```

---

## 📊 Nuevos Métodos

### AdvisorService

```typescript
// 1. Selecciona asesor con menos clientes
selectAvailableAdvisor(): Promise<string | null>

// 2. Asigna cliente a asesor (mejor esfuerzo)
assignClientToAdvisor(clientId): Promise<{assigned, advisorId?, warning?}>

// 3. Cuenta clientes del asesor
countActiveClientsForAdvisor(advisorId): Promise<number>

// 4. Obtiene perfil actual (GET endpoint)
getAdvisorProfile(user): Promise<GetAdvisorProfileDto>

// 5. Actualiza perfil (PATCH endpoint)
updateAdvisorProfile(user, dto): Promise<GetAdvisorProfileDto>
```

---

## 🗄️ Cambios en BD

### Nuevas Columnas (perfiles_asesores)
```sql
capacidad_maxima SMALLINT NOT NULL DEFAULT 5
telefono TEXT NULL
pais TEXT NULL
```

### Función SQL
```sql
obtener_asesor_disponible() → uuid
-- Retorna asesor activo con menos clientes
-- Considera capacidad_maxima automáticamente
```

### Índices
```sql
idx_asignaciones_asesor_activo      -- Rápido listar clientes
idx_asignaciones_count_activos      -- COUNT instantáneo
idx_asignaciones_unique_lookup      -- Evitar duplicados
```

---

## 🧪 Testing Rápido

```bash
# 1. Registrar asesor
TOKEN_A=$(curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "adv1@test.com",
    "password": "Pass123!",
    "fullName": "Asesor 1",
    "role": "asesor",
    "licenseNumber": "MAT-001",
    "specialty": "Finanzas"
  }' | jq -r .access_token)

# 2. Registrar cliente (se asigna automáticamente)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cli1@test.com",
    "password": "Pass123!",
    "fullName": "Cliente 1",
    "role": "cliente"
  }'

# 3. Obtener perfil del asesor
curl -X GET http://localhost:3000/api/v1/advisor/profile \
  -H "Authorization: Bearer $TOKEN_A" | jq

# Expected: activeClientsCount === 1

# 4. Editar perfil
curl -X PATCH http://localhost:3000/api/v1/advisor/profile \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{
    "maxCapacity": 15,
    "phone": "+54 9 11 2345 6789"
  }' | jq
```

---

## 🔄 Flujos Clave

### ¿Qué pasa cuando registra un cliente?
```
1. Se crea usuario en auth.users (Supabase Auth)
2. Se inserta en usuarios table
3. Se crea perfil_usuario
4. 🆕 Función SQL obtener_asesor_disponible() 
   - Busca asesor activo con menos clientes
   - Verifica capacidad_maxima < clientes_actuales
5. Si existe: INSERT en asignaciones_de_clientes
6. Si NO existe: Log warning, cliente se crea igual
7. Retorna JWT
```

### ¿Cómo se calcula activeClientsCount?
```
NO se persiste.

Cada vez que GET /advisor/profile:
  SELECT COUNT(*) FROM asignaciones_de_clientes
  WHERE asesor_id = ? AND activo = true
  
= SIEMPRE actualizado, sin degradación
```

### ¿Cómo valida capacidad?
```
Nivel BD (Trigger):
  BEFORE INSERT on asignaciones_de_clientes
  IF COUNT(*) >= capacidad_maxima THEN ERROR

Nivel App (Service):
  PATCH /advisor/profile
  IF new_capacity < activeClientsCount THEN ERROR
```

---

## 🛠️ Debugging Común

### "No hay asesores disponibles"
```sql
SELECT pa.usuario_id, pa.capacidad_maxima, 
       COUNT(ac.cliente_id) as clientes
FROM perfiles_asesores pa
LEFT JOIN asignaciones_de_clientes ac 
  ON pa.usuario_id = ac.asesor_id AND ac.activo = true
GROUP BY pa.usuario_id
HAVING COUNT(ac.cliente_id) >= pa.capacidad_maxima;

-- Aumentar capacidad:
UPDATE perfiles_asesores SET capacidad_maxima = 20;
```

### "activeClientsCount inconsistente"
```sql
-- Validar integridad
SELECT cliente_id, COUNT(DISTINCT asesor_id) as asesores
FROM asignaciones_de_clientes
WHERE activo = true
GROUP BY cliente_id
HAVING COUNT(*) > 1;

-- Si hay resultados, limpiar:
DELETE FROM asignaciones_de_clientes 
WHERE activo = false;
```

### "Error 23505 unique constraint"
```sql
-- Verificar duplicados
SELECT asesor_id, cliente_id, COUNT(*)
FROM asignaciones_de_clientes
WHERE activo = true
GROUP BY asesor_id, cliente_id
HAVING COUNT(*) > 1;

-- Limpiar:
DELETE FROM asignaciones_de_clientes 
WHERE ctid NOT IN (
  SELECT MAX(ctid) 
  FROM asignaciones_de_clientes 
  WHERE activo = true
  GROUP BY asesor_id, cliente_id
);
```

---

## 📋 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| advisor.service.ts | +5 métodos |
| advisor.controller.ts | +2 endpoints |
| auth.service.ts | +asignación automática |
| advisor.module.ts | +export AdvisorService |
| 0007_assignments_feature.sql | +Schema, Functions, Triggers |

---

## ✅ Validación

```bash
# Build sin errores
npm run build

# Verificar migración en Supabase
SELECT * FROM information_schema.routines 
WHERE routine_name = 'obtener_asesor_disponible';

# Servidor inicia
npm run start:dev

# Endpoints funcionan
curl http://localhost:3000/api/v1/advisor/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎓 Conceptos Clave

### Asignación Automática Balanceada
- Función SQL elige asesor con MENOS clientes
- O(log n) con índices
- Distribuye carga equitativamente
- No rompe si no hay disponibles

### Cálculo Dinámico
- `activeClientsCount` = COUNT(*) en vivo
- No se persiste (siempre actualizado)
- Garantiza consistencia
- 0 race conditions

### Capacidad Editable
- Asesor puede cambiar maxCapacity
- Validado: NO puede bajar < clientes actuales
- Trigger en BD lo implementa también
- Double-check en app

---

## 🚀 Próximos Pasos Frontend

```typescript
// Dashboard del asesor
GET /advisor/profile
Response.maxCapacity      → Mostrar límite
Response.activeClientsCount → Mostrar disponibilidad

// Editar perfil
PATCH /advisor/profile
  maxCapacity, phone, country

// Listar clientes (existente, pero ahora con datos reales)
GET /advisor/clients
  Filtra por asignaciones activas
  Muestra clientes reales
```

---

**Versión**: Final ✅  
**Última actualización**: 2026-05-18  
**Estado**: Listo para producción
