# Row Level Security (RLS) - Supabase

Este directorio contiene todas las políticas de seguridad a nivel de filas para la plataforma de gestión de gastos.

## Orden de Ejecución

Las políticas deben ejecutarse DESPUÉS de que todas las funciones estén definidas. El orden dentro de políticas no es crítico ya que cada tabla es independiente:

1. **01_usuarios.sql** - Políticas para tabla `usuarios`
2. **02_perfiles_usuarios.sql** - Políticas para tabla `perfiles_usuarios`
3. **03_perfiles_asesores.sql** - Políticas para tabla `perfiles_asesores`
4. **04_asignaciones_de_clientes.sql** - Políticas para tabla `asignaciones_de_clientes`
5. **05_categorias_de_gasto.sql** - Políticas para tabla `categorias_de_gasto`
6. **06_gastos.sql** - Políticas para tabla `gastos`
7. **07_tickets.sql** - Políticas para tabla `tickets`
8. **08_analisis_ocr.sql** - Políticas para tabla `analisis_ocr`
9. **09_recomendaciones_financieras.sql** - Políticas para tabla `recomendaciones_financieras`
10. **10_perfiles_de_gasto.sql** - Políticas para tabla `perfiles_de_gasto`
11. **11_clasificacion_de_perfil.sql** - Políticas para tabla `clasificacion_de_perfil`
12. **12_analisis_de_consumo.sql** - Políticas para tabla `analisis_de_consumo`

## Estructura

- Un archivo por tabla para claridad y mantenimiento
- Cada archivo habilita RLS y define todas las políticas (SELECT, INSERT, UPDATE, DELETE)
- Los nombres numerados permiten identificar dependencias lógicas

## Conceptos Clave

### Sistemas de Roles
- **Clientes**: Usuarios finales que gestiona gastos
- **Asesores**: Profesionales que atienden clientes
- **Service Role**: Rol privilegiado para procesos internos

### Principios de Seguridad

1. **auth.uid()** - Compara con el ID del usuario autenticado
2. **es_asesor_asignado_a_cliente()** - Verifica relación asesor-cliente
3. **Principio de Mínimo Privilegio** - Cada usuario solo ve/modifica lo suyo

### Patrones Comunes

- Clientes: Solo ven/modifican sus propios registros
- Asesores: Ven registros de clientes asignados
- Operaciones restringidas por estado (ej: tickets en estado 'error' se pueden eliminar)

## Notas Importantes

- RLS está habilitada en todas las tablas
- Las políticas se aplican automáticamente en todas las operaciones
- Los `drop policy if exists` previenen errores de re-ejecución
- El order de las políticas import poco dentro del mismo archivo
