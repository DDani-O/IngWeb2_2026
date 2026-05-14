# Funciones SQL - Supabase

Este directorio contiene todas las funciones SQL modularizadas para la plataforma de gestión de gastos.

## Orden de Ejecución

Las funciones deben ejecutarse en el siguiente orden:

1. **00_core_helpers.sql** - Funciones básicas del sistema
   - `es_service_role()` - Verifica si el usuario actual es service_role
   - `set_actualizado_en()` - Trigger que actualiza automáticamente `actualizado_en`

2. **01_authorization.sql** - Funciones de autorización
   - `es_asesor_asignado_a_cliente()` - Verifica si un asesor está asignado a un cliente
   - `analisis_ocr_cliente_referencia()` - Resuelve el cliente referenciado en OCR

3. **02_validar_usuarios.sql** - Validador para tabla `usuarios`
4. **03_validar_perfiles_usuarios.sql** - Validador para tabla `perfiles_usuarios`
5. **04_validar_perfiles_asesores.sql** - Validador para tabla `perfiles_asesores`
6. **05_validar_asignaciones_de_clientes.sql** - Validador para tabla `asignaciones_de_clientes`
7. **06_validar_gastos.sql** - Validador para tabla `gastos`
8. **07_validar_tickets.sql** - Validador para tabla `tickets`
9. **08_validar_recomendaciones_financieras.sql** - Validador complejo para recomendaciones
10. **09_validar_clasificacion_de_perfil.sql** - Validador para tabla `clasificacion_de_perfil`
11. **10_validar_analisis_de_consumo.sql** - Validador para tabla `analisis_de_consumo`
11. **11_validar_analisis_ocr.sql** - Validador para tabla `analisis_ocr`

## Estructura

- Cada archivo contiene una sola función/validador para fácil mantenimiento
- Los nombres están numerados para indicar el orden de dependencia
- Los validadores incluyen sus propios triggers

## Notas de Implementación

- Las funciones de validación se ejecutan automáticamente mediante triggers
- Los validadores usan `security definer` para permitir acceso a datos sensibles
- Las funciones de autorización son estables y seguras para cache
