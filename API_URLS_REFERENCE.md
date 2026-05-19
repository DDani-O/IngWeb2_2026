# ⚠️ IMPORTANTE: URLs Correctas con Prefijo API

## El Problema
El servidor tiene un **prefijo global** configurado:
```typescript
// backend/src/main.ts
app.setGlobalPrefix("api/v1");
```

## URLs Correctos (Con Prefijo)

### ✅ Autenticación
```bash
# Registrar
POST /api/v1/auth/register

# Login
POST /api/v1/auth/login
```

### ✅ Perfil del Asesor
```bash
# Obtener perfil
GET /api/v1/advisor/profile

# Actualizar perfil
PATCH /api/v1/advisor/profile
```

### ✅ Dashboard del Asesor (Existentes)
```bash
# Dashboard
GET /api/v1/advisor/dashboard

# Listar clientes
GET /api/v1/advisor/clients

# Detalles de cliente
GET /api/v1/advisor/clients/:clientId

# Gastos de cliente
GET /api/v1/advisor/clients/:clientId/expenses

# Recomendaciones
GET /api/v1/advisor/recommendations
POST /api/v1/advisor/recommendations
PATCH /api/v1/advisor/recommendations/:id
DELETE /api/v1/advisor/recommendations/:id

# Mensajes
GET /api/v1/advisor/messages
POST /api/v1/advisor/messages
PATCH /api/v1/advisor/messages/:messageId/read

# Reportes
GET /api/v1/advisor/reports
```

### ✅ Usuarios (Existentes)
```bash
# Obtener mi perfil
GET /api/v1/users/me

# Actualizar mi perfil
PATCH /api/v1/users/me

# Mis gastos
GET /api/v1/expenses

# Mis recomendaciones
GET /api/v1/users/me/recommendations

# Actualizar recomendación
PATCH /api/v1/users/me/recommendations/:id

# Mis mensajes
GET /api/v1/users/me/messages
POST /api/v1/users/me/messages
PATCH /api/v1/users/me/messages/:messageId/read

# Categorías
GET /api/v1/categories
```

---

## Ejemplo Completo: Registrar y Probar

```bash
# 1. Registrar un asesor
ADVISOR_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "advisor1@fintrack.com",
    "password": "SecurePass123!",
    "fullName": "Juan García",
    "role": "asesor",
    "licenseNumber": "MAT-2026-001",
    "specialty": "Finanzas Personales"
  }')

echo "$ADVISOR_RESPONSE" | jq .

# Guardar el token
ADVISOR_TOKEN=$(echo "$ADVISOR_RESPONSE" | jq -r '.access_token')
echo "Token del asesor: $ADVISOR_TOKEN"

# 2. Registrar un cliente (se asignará automáticamente)
curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client1@fintrack.com",
    "password": "SecurePass123!",
    "fullName": "María López",
    "role": "cliente",
    "occupation": "Ingeniera"
  }' | jq .

# 3. Obtener perfil del asesor (con clientes activos)
curl -s -X GET http://localhost:3000/api/v1/advisor/profile \
  -H "Authorization: Bearer $ADVISOR_TOKEN" | jq .

# 4. Actualizar perfil del asesor
curl -s -X PATCH http://localhost:3000/api/v1/advisor/profile \
  -H "Authorization: Bearer $ADVISOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "maxCapacity": 10,
    "phone": "+54 9 11 2345 6789",
    "country": "Argentina"
  }' | jq .

# 5. Obtener dashboard del asesor
curl -s -X GET http://localhost:3000/api/v1/advisor/dashboard \
  -H "Authorization: Bearer $ADVISOR_TOKEN" | jq .
```

---

## Instalación Local: Setup Completo

```bash
# 1. Entrar a la carpeta backend
cd backend

# 2. Compilar
npm run build

# 3. Iniciar servidor en watch mode (modo desarrollo)
npm run start:dev

# ✅ Servidor estará en: http://localhost:3000
# ✅ API en: http://localhost:3000/api/v1/

# En otra terminal, probar endpoints (ver arriba)
```

---

## Errores Comunes

### ❌ Error: "Cannot POST /auth/register"
**Causa**: Olvidó el prefijo `/api/v1/`  
**Solución**: Use `http://localhost:3000/api/v1/auth/register`

### ❌ Error: "Token invalido"
**Causa**: Token expirado o token mal formateado  
**Solución**: Registrar de nuevo para obtener nuevo token

### ❌ Error: "Campos no permitidos para el rol cliente"
**Causa**: Cliente está intentando editar campos de asesor  
**Solución**: Usar endpoints correctos según el rol

---

## Template: Setup Variables en Bash

```bash
#!/bin/bash

# Variables de servidor
SERVER="http://localhost:3000"
API_PREFIX="/api/v1"

# URLs de endpoints
AUTH_REGISTER="$SERVER$API_PREFIX/auth/register"
AUTH_LOGIN="$SERVER$API_PREFIX/auth/login"
ADVISOR_PROFILE="$SERVER$API_PREFIX/advisor/profile"
ADVISOR_DASHBOARD="$SERVER$API_PREFIX/advisor/dashboard"
ADVISOR_CLIENTS="$SERVER$API_PREFIX/advisor/clients"

# Registrar asesor
register_advisor() {
  curl -s -X POST "$AUTH_REGISTER" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$1\",
      \"password\": \"SecurePass123!\",
      \"fullName\": \"$2\",
      \"role\": \"asesor\",
      \"licenseNumber\": \"$3\",
      \"specialty\": \"$4\"
    }"
}

# Registrar cliente
register_client() {
  curl -s -X POST "$AUTH_REGISTER" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$1\",
      \"password\": \"SecurePass123!\",
      \"fullName\": \"$2\",
      \"role\": \"cliente\",
      \"occupation\": \"$3\"
    }"
}

# Obtener perfil del asesor
get_advisor_profile() {
  curl -s -X GET "$ADVISOR_PROFILE" \
    -H "Authorization: Bearer $1"
}

# Uso:
# TOKEN=$(register_advisor "adv@test.com" "Asesor 1" "MAT-001" "Finanzas" | jq -r '.access_token')
# get_advisor_profile "$TOKEN" | jq .
```

---

**Versión**: 1.0  
**Última actualización**: 2026-05-18  
**Estado**: Listo para usar ✅
