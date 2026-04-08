# Base de Datos - Gestión de Gastos

Base de datos PostgreSQL/Supabase para la plataforma de gestión de gastos.

## 🚀 Quick Start

**Para levantar la BD en Supabase:**

1. Abrir el editor SQL de Supabase
2. Copiar el contenido de: `migrations/0001_init_schema.sql`
3. Ejecutar ✅

**¡Listo!** La BD estará 100% operativa.

---

## 📁 Estructura de Directorios

```
backend/src/database/
├── migrations/
│   └── 0001_init_schema.sql    ← ÚNICO ARCHIVO NECESARIO
├── functions/                   (referencia/modularización futura)
├── policies/                    (referencia/modularización futura)
└── README.md
```

---

## 📖 Qué contiene `0001_init_schema.sql`

Un único archivo que define todo lo necesario:

✅ **Extensiones**: pgcrypto  
✅ **Tipos ENUM**: 8 tipos para estados, roles y clasificaciones  
✅ **Tablas**: 12 tablas principales + relaciones  
✅ **Funciones**: Validadores y funciones de autorización  
✅ **Triggers**: 16 triggers para integridad de datos  
✅ **Seguridad**: Políticas RLS en todas las tablas  
✅ **Constraints**: Validaciones de negocio

---

## 📁 Directorios de Referencia

Los directorios `functions/` y `policies/` contienen los mismos componentes **separados por categoría**. Útil si en el futuro quieres:
- Modificar una función específica
- Cambiar una política de seguridad
- Mantener componentes versionados por separado

**Nota**: No necesitas usarlos ahora. El `init_schema.sql` es autosuficiente.

## Componentes Principales

### Tablas Principales
- **usuarios** - Registro de usuarios (cliente/asesor)
- **gastos** - Transacciones de gastos
- **tickets** - Archivos subidos para OCR
- **recomendaciones_financieras** - Sistema de alertas/sugerencias

### Tablas de Referencia
- **categorias_de_gasto** - Categorías predefinidas
- **perfiles_de_gasto** - Clasificaciones de usuarios

### Tablas de Análisis
- **analisis_ocr** - Resultados de OCR
- **analisis_de_consumo** - Reportes periódicos
- **clasificacion_de_perfil** - Scores de usuarios

### Tablas de Relaciones
- **perfiles_usuarios** - Perfil extendido del cliente
- **perfiles_asesores** - Perfil extendido del asesor
- **asignaciones_de_clientes** - Mapeo asesor ↔ cliente

## Seguridad

La plataforma implementa:
- **RLS** - Row Level Security en todas las tablas
- **Validación de Roles** - Triggers que validan roles de usuario
- **Integridad Referencial** - Constraints en relaciones
- **Auditoría** - Campos `creado_en` y `actualizado_en` en cada registro

## Desarrollo

Para modificar el esquema:
1. Crear nuevo archivo numerado en `migrations/`
2. Para lógica: agregar archivo en `functions/`
3. Para seguridad: agregar archivo en `policies/`
4. Actualizar READMEs correspondientes

## Notas Importantes

⚠️ **No modificar el archivo `0001_init_schema.sql`** - Es el esquema base
✅ Usar modularización para nuevas funciones y políticas  
✅ Mantener versionado en git antes de ejecutar cambios
✅ Siempre hacer backup antes de cambios en producción
