# Indice de archivos SQL — FinTrack 2026

Ultima actualizacion: mayo 2026.

---

## Migraciones (ejecutar en orden)

| Archivo | Descripcion | Estado |
|---------|-------------|--------|
| `migrations/0001_init_schema.sql` | Schema completo: ENUMs, tablas, funciones, triggers, RLS | ✅ Base |
| `migrations/0002_*.sql` — `0009_*.sql` | Parches incrementales: vistas, funciones adicionales, ajustes de RLS, filtros de fecha | ✅ Aplicar en orden |
| `migrations/0010_ciudad_to_pais.sql` | Renombrar columna `ciudad` → `pais` en `perfiles_usuarios` | ✅ Aplicar |

**Forma de aplicar en Supabase:**
1. Abrir el editor SQL de Supabase.
2. Pegar y ejecutar cada archivo en orden numerado.
3. Para un deploy fresco: ejecutar `0001` primero, luego los demas en orden.

---

## Seeds (datos iniciales)

| Archivo | Descripcion |
|---------|-------------|
| `seeds/seed_gastos_2026.sql` | Gastos de prueba para testing |
| `seeds/seed_perfiles_de_gasto.sql` | 7 perfiles financieros con metadata completa (emoji, caracteristicas, tips, umbrales) |

---

## Componentes del schema

| Componente | Cantidad |
|-----------|----------|
| ENUMs | 10 |
| Tablas | 13 |
| Views SQL | 5 |
| Funciones SQL | 8 |
| Triggers | 16+ |
| Politicas RLS | 30+ |

---

## Tablas

Ver detalle completo en `DB_SCHEMA_SUMMARY.md`.

| Tabla | Proposito |
|-------|-----------|
| `usuarios` | Usuarios del sistema |
| `perfiles_usuarios` | Preferencias del cliente |
| `perfiles_asesores` | Datos del asesor |
| `asignaciones_de_clientes` | Relacion asesor ↔ cliente |
| `categorias_de_gasto` | Catalogo global de categorias |
| `gastos` | Gastos registrados |
| `tickets` | Imagenes subidas para OCR |
| `analisis_ocr` | Resultados del procesamiento OCR |
| `recomendaciones_financieras` | Recomendaciones del asesor o sistema |
| `mensajes_asesor` | Mensajeria asesor ↔ cliente |
| `perfiles_de_gasto` | Catalogo de perfiles financieros |
| `clasificacion_de_perfil` | Perfil asignado a un cliente |
| `analisis_de_consumo` | Snapshots historicos (sin escritura activa) |

---

## Archivos modularizados (referencia)

Los directorios `functions/` y `policies/` contienen los mismos componentes separados por tabla, utiles para modificaciones puntuales sin tocar el schema completo.
