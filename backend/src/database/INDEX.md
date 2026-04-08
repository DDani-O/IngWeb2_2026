# Índice de Archivos SQL - Base de Datos

Listado de componentes de la base de datos PostgreSQL/Supabase.

## 📋 ÚNICO ARCHIVO NECESARIO

| Archivo | Contenido | Estado |
|---------|-----------|--------|
| `migrations/0001_init_schema.sql` | **TODO lo necesario** | ✅ Listo para usar |

**Este archivo único incluye:**
- ✅ Extensión `pgcrypto`
- ✅ 8 tipos ENUM
- ✅ 12 tablas principales
- ✅ Funciones y validadores
- ✅ Triggers
- ✅ Políticas RLS
- ✅ Integridad referencial



---

## 📁 Archivos Modularizados (Referencia)

Los siguientes directorios contienen los mismos componentes separados por categoría, útiles para **futuras modificaciones**:

### `functions/` - 12 archivos
Funciones SQL, triggers y validadores (ya incluidos en init_schema.sql)

### `policies/` - 12 archivos  
Políticas de RLS por tabla (ya incluidas en init_schema.sql)

---

## 📊 Resumen de Componentes

| Componente | Cantidad | Estado |
|-----------|----------|--------|
| Tablas | 12 | En init_schema.sql |
| Funciones | 15 | En init_schema.sql |
| Triggers | 16 | En init_schema.sql |
| Políticas RLS | 30+ | En init_schema.sql |

---

## 🚀 Deploy en Supabase

1. Abrir editor SQL de Supabase
2. Copiar `migrations/0001_init_schema.sql`
3. Pegar y ejecutar
4. ✅ Base de datos operativa
