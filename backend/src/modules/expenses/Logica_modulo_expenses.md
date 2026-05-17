# Módulo de Gastos (Expenses)

## Descripción General
El módulo de gastos gestiona todas las operaciones CRUD relacionadas con los gastos personales de los usuarios. Utiliza Supabase como base de datos y está protegido con autenticación JWT y roles.

## Estructura del Módulo

```
expenses/
├── dto/
│   ├── create-expense.dto.ts    # DTO para crear gastos
│   ├── update-expense.dto.ts    # DTO para actualizar gastos
│   ├── query-expenses.dto.ts    # DTO para filtros de consulta
│   └── summary-query.dto.ts     # DTO para consulta de resumen
├── expenses.controller.ts        # Controlador HTTP
├── expenses.service.ts           # Lógica de negocio
└── expenses.module.ts           # Definición del módulo
```

## Base de Datos

### Tabla: `gastos`
- **id**: UUID (primary key)
- **cliente_id**: UUID (foreign key a usuarios)
- **categoria_id**: UUID (foreign key a categorias_de_gasto)
- **comercio**: string (nombre del comercio)
- **fecha_gasto**: date (fecha del gasto)
- **monto**: numeric (monto del gasto)
- **descripcion**: string (notas opcionales)
- **origen**: string (manual, ocr, etc.)
- **moneda**: string (ARS por defecto)
- **ticket_principal_id**: string (URL de imagen del ticket)
- **ocr_estado**: string (estado del procesamiento OCR)
- **ocr_confianza**: numeric (nivel de confianza del OCR)
- **creado_en**: timestamp
- **actualizado_en**: timestamp

### Relación con `categorias_de_gasto`
Cada gasto pertenece a una categoría. La relación se resuelve con JOIN para obtener el nombre de la categoría.

## DTOs (Data Transfer Objects)

### CreateExpenseDto
Valida la creación de un nuevo gasto:
- **amount**: number (mínimo 0.01, máximo 2 decimales)
- **merchant**: string (máximo 100 caracteres)
- **categoryId**: UUID v4 (obligatorio)
- **date**: string (formato ISO date)
- **notes**: string (opcional, máximo 500 caracteres)

### UpdateExpenseDto
Valida la actualización de un gasto (todos los campos opcionales):
- **amount**: number (mínimo 0.01, máximo 2 decimales)
- **merchant**: string (máximo 100 caracteres)
- **categoryId**: UUID v4
- **date**: string (formato ISO date)
- **notes**: string (máximo 500 caracteres)

### QueryExpensesDto
Filtros para la consulta de gastos:
- **page**: number (mínimo 1, default: 1)
- **limit**: number (mínimo 1, máximo 100, default: 10)
- **categoryId**: UUID v4 (filtro por categoría)
- **from**: string (fecha inicio, formato ISO)
- **to**: string (fecha fin, formato ISO)
- **search**: string (búsqueda en comercio y descripción, máximo 100 caracteres)

### SummaryQueryDto
Parámetros para el resumen mensual:
- **month**: string (formato YYYY-MM, validado con regex)

## Servicios (ExpensesService)

### findAll(userId, query)
**Propósito**: Listar gastos con paginación y filtros.

**Lógica**:
1. Calcula offset basado en page y limit
2. Construye query a Supabase con JOIN a categorías
3. Aplica filtros condicionales:
   - categoryId: filtra por categoría
   - from/to: rango de fechas
   - search: búsqueda case-insensitive en comercio y descripción
4. Ordena por fecha_gasto descendente
5. Retorna datos formateados con metadata de paginación

**Respuesta**:
```typescript
{
  data: Expense[],
  pagination: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

### getSummary(userId, query)
**Propósito**: Generar resumen estadístico de gastos por mes.

**Lógica**:
1. Valida formato del mes (YYYY-MM)
2. Calcula primer y último día del mes
3. Consulta gastos del mes con JOIN a categorías
4. Calcula estadísticas:
   - totalMonth: suma de todos los gastos
   - expenseCount: cantidad de gastos
   - averageExpense: promedio de gastos
   - totalByCategory: agrupación por categoría
   - highestExpense: gasto de mayor monto
5. Retorna resumen formateado

**Respuesta**:
```typescript
{
  totalMonth: number,
  totalByCategory: Array<{categoryId, categoryName, totalAmount}>,
  expenseCount: number,
  averageExpense: number,
  highestExpense: Expense | null
}
```

### findOne(userId, id)
**Propósito**: Obtener un gasto específico por ID.

**Lógica**:
1. Consulta gasto por ID y userId (seguridad)
2. Si no existe, lanza NotFoundException
3. Formatea respuesta con nombres de campos en inglés

**Respuesta**: Expense formateado

### create(userId, dto)
**Propósito**: Crear un nuevo gasto.

**Lógica**:
1. Valida que la categoría existe en la base de datos
2. Si no existe, lanza BadRequestException
3. Inserta gasto con:
   - cliente_id: userId del token
   - origen: "manual"
   - moneda: "ARS"
4. Retorna gasto creado formateado

**Respuesta**: Expense formateado

### update(userId, id, dto)
**Propósito**: Actualizar un gasto existente.

**Lógica**:
1. Verifica que el gasto existe y pertenece al usuario
2. Si viene categoryId, valida que la categoría existe
3. Construye objeto de actualización solo con campos proporcionados
4. Actualiza en base de datos
5. Retorna gasto actualizado formateado

**Respuesta**: Expense formateado

### remove(userId, id)
**Propósito**: Eliminar un gasto.

**Lógica**:
1. Verifica que el gasto existe y pertenece al usuario
2. Elimina de la base de datos
3. No retorna contenido (HTTP 204)

### formatExpense(expense)
**Propósito**: Método privado para formatear datos de base de datos a respuesta API.

**Transformaciones**:
- monto → amount (convertido a Number)
- comercio → merchant
- categoria_id → categoryId
- fecha_gasto → date
- descripcion → notes
- ticket_principal_id → ticketImageUrl
- cliente_id → userId
- creado_en → createdAt
- Incluye categoryName de la relación

## Controlador (ExpensesController)

### Seguridad
- **@UseGuards(JwtAuthGuard, RolesGuard)**: Requiere JWT y rol
- **@Roles("cliente")**: Solo usuarios con rol "cliente"
- **@CurrentUser()**: Inyecta el userId del token JWT

### Endpoints

#### GET /expenses
- **Query**: QueryExpensesDto
- **Respuesta**: Lista paginada de gastos
- **Lógica**: Llama a findAll()

#### GET /expenses/summary
- **Query**: SummaryQueryDto (month: YYYY-MM)
- **Respuesta**: Resumen estadístico mensual
- **Lógica**: Llama a getSummary()

#### GET /expenses/:id
- **Param**: id (UUID)
- **Respuesta**: Gasto específico
- **Lógica**: Llama a findOne()

#### POST /expenses
- **Body**: CreateExpenseDto
- **Respuesta**: Gasto creado
- **Lógica**: Llama a create()

#### PATCH /expenses/:id
- **Param**: id (UUID)
- **Body**: UpdateExpenseDto
- **Respuesta**: Gasto actualizado
- **Lógica**: Llama a update()

#### DELETE /expenses/:id
- **Param**: id (UUID)
- **Respuesta**: HTTP 204 (sin contenido)
- **Lógica**: Llama a remove()

## Flujo de Datos Típico

### Creación de Gasto
1. Usuario envía POST /expenses con CreateExpenseDto
2. JwtAuthGuard valida token y extrae userId
3. RolesGuard verifica rol "cliente"
4. Controller llama a service.create(userId, dto)
5. Service valida categoría existe
6. Service inserta en tabla gastos
7. Service formatea respuesta
8. Controller retorna gasto creado

### Consulta con Filtros
1. Usuario envía GET /expenses?page=1&limit=10&categoryId=xxx&from=2024-01-01
2. Guards validan autenticación y rol
3. Controller llama a service.findAll(userId, query)
4. Service aplica filtros dinámicamente
5. Service calcula paginación
6. Service formatea cada gasto
7. Controller retorna lista con metadata

## Consideraciones Importantes

1. **Seguridad**: Todas las operaciones verifican que el gasto pertenece al usuario (cliente_id)
2. **Validación**: DTOs usan class-validator para validación automática
3. **Transformación**: Nombres de campos en BD (español) se transforman a inglés en la API
4. **Relaciones**: JOIN con categorias_de_gasto para obtener nombre de categoría
5. **Paginación**: Implementada con offset/limit y metadata de totalPages
6. **Búsqueda**: Case-insensitive usando ilike en comercio y descripción
7. **Moneda**: Por defecto ARS, preparado para multi-moneda
8. **Origen**: Distingue entre gastos manuales y OCR

## Errores Comunes

- **NotFoundException**: Gasto no encontrado o no pertenece al usuario
- **BadRequestException**: Categoría no existe, formato inválido, error de BD
- **ValidationError**: DTO no cumple validaciones (class-validator)
