# Módulo de Categorías (Categories)

## Descripción
El módulo de categorías gestiona las categorías de gastos del sistema. Utiliza la tabla **`categorias_de_gasto`** (tabla unificada) que soporta:
- **Categorías globales**: Compartidas por todos los usuarios (donde `cliente_id = NULL`)
- **Categorías personalizadas**: Específicas de un usuario (donde `cliente_id = UUID del usuario`)

## Estructura del Módulo

```
categories/
├── dto/
│   └── category.dto.ts          # DTO para la respuesta de categoría
├── categories.controller.ts     # Controlador HTTP
├── categories.service.ts        # Lógica de negocio
└── categories.module.ts         # Definición del módulo
```

## Entidad: Tabla `categorias_de_gasto`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `nombre` | text | Nombre de la categoría (ej: "Alimentación") |
| `icono` | text | Emoji o símbolo (ej: "🍔") |
| `cliente_id` | UUID (nullable) | FK a `usuarios.id`. **NULL = categoría global** |
| `categoria_sistema` | boolean | Indica si es una categoría del sistema |
| `creado_en` | timestamptz | Timestamp de creación |
| `actualizado_en` | timestamptz | Timestamp de última actualización |

**Constraint**: `UNIQUE (nombre, cliente_id)` - Evita duplicados de nombres por usuario

## API Endpoints

### GET `/api/v1/categories`
Retorna **todas las categorías**: las globales (donde `cliente_id = NULL`) + las del usuario autenticado.

**Headers**:
```
Authorization: Bearer {JWT_TOKEN}
```

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nombre": "Alimentación",
    "icono": "🍔",
    "cliente_id": null,
    "categoria_sistema": true,
    "is_global": true
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "nombre": "Mi categoría personal",
    "icono": "⭐",
    "cliente_id": "usr-123",
    "categoria_sistema": false,
    "is_global": false
  }
]
```
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Mi categoría personal",
    "icon": "⭐",
    "user_id": "usr-123",
    "is_global": false
  }
]
```

### GET `/api/v1/categories/global`
Retorna solo las categorías globales (no requiere autenticación pero el endpoint está protegido).

### GET `/api/v1/categories/my`
Retorna solo las categorías personalizadas del usuario autenticado.

## Instalación

### 📌 Importante

**Este módulo ya utiliza la tabla `categorias_de_gasto` unificada** (no crea una tabla separada `categories`).

Asegúrate de que tu tabla `categorias_de_gasto` tenga estos campos:
- `id` (UUID, PK)
- `nombre` (text)
- `icono` (text)
- `cliente_id` (UUID nullable, FK a `usuarios.id`)
- `categoria_sistema` (boolean)

Si tu BD aún no tiene esta estructura, ejecuta la migración correspondiente en Supabase.

### El módulo ya está registrado en `AppModule`

El módulo se importa automáticamente en `src/app.module.ts`:
```typescript
import { CategoriesModule } from "./modules/categories/categories.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    ExpensesModule,
    CategoriesModule,  // ← Ya incluido
  ],
})
export class AppModule {}
```

## Uso en el Backend

### Inyectar el servicio en otro módulo

```typescript
import { CategoriesService } from "./modules/categories/categories.service";

@Injectable()
export class OtherService {
  constructor(private readonly categoriesService: CategoriesService) {}

  async getCategories(userId: string) {
    return this.categoriesService.findAll(userId);
  }
}
```

### Métodos disponibles en `CategoriesService`

#### `findAll(userId: string): Promise<CategoryDto[]>`
- Retorna **todas las categorías**: globales (donde `cliente_id = NULL`) + categorías del usuario
- Ordenadas por nombre ascendente
- **Parámetro**: `userId` del token JWT autenticado

#### `findGlobal(): Promise<CategoryDto[]>`
- Retorna **solo categorías globales** (donde `cliente_id = NULL`)
- Ordenadas por nombre ascendente

#### `findUserCategories(userId: string): Promise<CategoryDto[]>`
- Retorna **solo categorías personalizadas** del usuario
- Ordenadas por nombre ascendente
- **Parámetro**: `userId` del usuario propietario

## Testing

### Con curl

**1. Obtener token de autenticación**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@fintrack.local","password":"Fintrack2026*"}'
```

**2. Usar el token para consultar categorías**
```bash
curl -X GET http://localhost:3000/api/v1/categories \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Con Postman

1. Crear request `POST` a `http://localhost:3000/api/v1/auth/login`
2. Body JSON:
   ```json
   {
     "email": "usuario@fintrack.local",
     "password": "Fintrack2026*"
   }
   ```
3. Copiar el `access_token` de la respuesta
4. Crear request `GET` a `http://localhost:3000/api/v1/categories`
5. En la pestaña `Headers`, agregar:
   - Key: `Authorization`
   - Value: `Bearer {TOKEN}`

## Seguridad

### Protección
- El endpoint requiere autenticación con JWT (`JwtAuthGuard`)
- Los usuarios solo ven sus propias categorías + las globales
- Las políticas de RLS en Supabase refuerzan esto a nivel de BD

### Validación
- Los errores se manejan con `BadRequestException`
- Si Supabase retorna un error, se envuelve en un mensaje amigable

## Próximas mejoras

- [ ] Crear endpoint `POST /api/v1/categories` para que usuarios creen categorías personalizadas
- [ ] Crear endpoint `PUT /api/v1/categories/:id` para editar
- [ ] Crear endpoint `DELETE /api/v1/categories/:id` para eliminar
- [ ] Agregar paginación si hay muchas categorías
- [ ] Validación de unicidad del nombre por usuario en el servicio
