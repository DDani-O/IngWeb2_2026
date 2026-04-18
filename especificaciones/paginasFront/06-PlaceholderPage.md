# Especificación: Página de Contenido en Desarrollo (Placeholder)

## DESCRIPCIÓN GENERAL

La Página de Contenido en Desarrollo es una página genérica reutilizable que sirve como placeholder para secciones que aún están en construcción. Se utiliza para temporalmente ocupar rutas que existirán en el futuro pero que aún no tienen implementación. La página es configurable vía parámetros URL, permitiendo personalizar el mensaje, ícono y botón de acción sin tener que crear múltiples archivos separados.

**Objetivos principales:**
- Proporcionar feedback al usuario sobre pages en construcción
- Permitir navegación de vuelta (no dejar al usuario atrapado)
- Mantener consistencia visual con el resto del sitio
- Ser reutilizable para múltiples secciones temporales
- Facilitar desarrollo iterativo (agregar páginas gradualmente)

---

## ESTRUCTURA VISUAL

### 1. Barra de Navegación Superior
- **Logo de FinTrack** (clickeable, enlace a inicio)
- **Zona derecha:**
  - Icono de notificaciones (si usuario está autenticado)
  - Icono de perfil (si usuario está autenticado)
- **Tema:** Navbar oscura, consistente

### 2. Contenido Central
- **Estructura de columna única, centrada verticalmente**
- **Padding generoso:** Margen superior e inferior

#### **Ícono Principal**
- **Tamaño grande:** 80x80px o similar
- **Símbolo visual:** Ícono relevante al contenido, o ícono genérico de construcción (🚧, 🏗️, etc.)
- **Color:** Color primario (turquesa/cyan)
- **Animación (opcional):** Pulse suave, rotación lenta, o similar
- **Configuración:** Via parámetro URL (`?icon=`)

#### **Título**
- **Tamaño:** H1 o muy grande
- **Texto:** Configurable vía parámetro URL (`?title=`)
- **Ejemplos:** "Coming Soon", "Página en Desarrollo", "En Construcción", etc.
- **Por defecto:** "Página en Construcción"

#### **Descripción**
- **Tamaño:** Body text (16px)
- **Contenido:** Explicación breve del estado, por qué la página está en construcción
- **Configuración:** Via parámetro URL (`?description=`)
- **Ejemplos:** 
  - "Esta sección aún está en desarrollo y estará disponible pronto."
  - "Estamos trabajando en nuevas características para mejorar tu experiencia."
- **Por defecto:** "Estamos trabajando en esta sección. Vuelve pronto."
- **Ancho máximo:** ~600px para legibilidad

#### **Botón Primario: Volver Atrás**
- **Texto:** "← Volver Atrás" o similar
- **Acción:** Utiliza `history.back()` para retornar a la página anterior
- **Color:** Color primario
- **Tema:** Botón destacado, fácil de encontrar
- **Configuración (opcional):** Via parámetro URL (`?backText=`)

#### **Botón Secundario (Opcional)**
- **Texto:** Configurable vía parámetro URL (`?ctaText=`)
- **Acción:** Navega a URL configurable (`?ctaUrl=`) o ejecuta acción específica
- **Ejemplos:**
  - "Ir a Dashboard" → `/usuario/dashboard` o `/asesor/dashboard`
  - "Ver Recomendaciones" → `/usuario/recomendaciones`
  - "Contactar Soporte" → Abre modal de contacto
- **Color:** Color secundario (gris, etc.)
- **Tema:** Botón menos prominente que el primario
- **Mostrar:** Solo si se proporciona parámetro `?ctaText=`

#### **Elemento Visual Auxiliar (Opcional)**
- **Imagen o video de fondo:** Sutil, no intrusiva
- **Ejemplo:** Animación de construcción simple, patrón geométrico, etc.
- **Opacidad:** Baja (background only)
- **Configuración:** Via parámetro URL (`?bgImage=`)

### 3. Footer
- **Mínimo:** Copyright, enlace a soporte
- **Tema:** Consistente

---

## ELEMENTOS INTERACTIVOS

### Botón "Volver Atrás"
- **Click:** Ejecuta `window.history.back()`
- **Hover:** Cambio sutil de color, cursor pointer
- **Accesibilidad:** Tab-focusable, Enter para activar
- **Fallback:** Si no hay historial previo, navega a `/` (home)

### Botón Secundario (si existe)
- **Click:** Navega a URL especificada en `?ctaUrl=`
- **Hover:** Cambio sutil de color
- **Validación:** URL debe ser relativa o en dominio permitido (seguridad)

### Responsive Behavior
- **Desktop:** Contenido centrado con padding generoso
- **Tablet:** Contenido centrado con padding reducido
- **Móvil:** Contenido centrado, full-width con padding mínimo

---

## DATOS REQUERIDOS

### Configuración via Parámetros URL
Todos los parámetros son opcionales, con valores por defecto proporcionados.

| Parámetro | Descripción | Ejemplo | Por Defecto |
|-----------|-------------|---------|-------------|
| `page` | Nombre de la página en construcción (solo informativo) | `?page=historial` | `(none)` |
| `title` | Título principal | `?title=Historial de Gastos` | "Página en Construcción" |
| `description` | Descripción/explicación | `?description=Estamos trabajando...` | "Estamos trabajando en esta sección. Vuelve pronto." |
| `icon` | Ícono Font Awesome o emoji | `?icon=fa-history` o `?icon=🕐` | "🚧" (construcción) |
| `backText` | Texto del botón volver | `?backText=Atrás` | "← Volver Atrás" |
| `ctaText` | Texto del botón secundario | `?ctaText=Ir a Dashboard` | `(none - botón oculto)` |
| `ctaUrl` | URL del botón secundario | `?ctaUrl=/usuario/dashboard` | `(none)` |
| `bgImage` | URL de imagen de fondo | `?bgImage=/assets/img/construction.svg` | `(none - sin fondo)` |

### Estructura de Datos
```
{
  "config": {
    "page": "historial",
    "title": "Historial de Gastos",
    "description": "Estamos trabajando en esta sección...",
    "icon": "fa-history",
    "backText": "← Volver Atrás",
    "ctaText": "Ir a Dashboard",
    "ctaUrl": "/usuario/dashboard",
    "bgImage": null
  }
}
```

---

## ESTILOS Y TEMA

### Paleta de Colores
- **Color Primario:** Turquesa/Cyan (#00BCD4)
- **Color Oscuro Principal:** Casi negro (#1a1a1a)
- **Fondo secundario:** Gris oscuro (#2a2a2a)
- **Texto principal:** Blanco (#ffffff)
- **Texto secundario:** Gris claro (#b0b0b0)

### Tipografía
- **Título:** Poppins, bold (700), 36px (desktop), 28px (móvil)
- **Descripción:** Inter, regular (400), 16px
- **Botones:** Inter, medium (500), 16px

### Efectos Visuales
- **Ícono:** Posible animación pulse o rotación lenta (opcional)
- **Botones:** Transición suave (0.3s), hover con cambio de color
- **Fondo:** Gradiente sutil si `bgImage` se proporciona
- **Transiciones:** Fade-in suave al cargar

### Tema
- **Modo oscuro obligatorio**
- **Alto contraste para accesibilidad**
- **Diseño minimalista, enfoque en contenido central**

---

## COMPORTAMIENTO RESPONSIVO

### Breakpoints
- **Desktop:** ≥992px
- **Tablet:** 768px - 991px
- **Móvil:** <768px

### Adaptaciones
- **Desktop:**
  - Ícono: 80x80px
  - Título: 36px
  - Descripción: 16px
  - Padding: Generoso (100px+ arriba/abajo)
  - Botones: Ancho máximo 300px

- **Tablet:**
  - Ícono: 70x70px
  - Título: 32px
  - Descripción: 16px (sin cambios)
  - Padding: Medio (60px+ arriba/abajo)
  - Botones: Ancho máximo 250px

- **Móvil:**
  - Ícono: 60x60px
  - Título: 28px
  - Descripción: 15px
  - Padding: Mínimo (30px arriba/abajo, 20px lados)
  - Botones: Full-width con padding lateral mínimo
  - Stack vertical para botones

### Comportamiento táctil
- Botones: Mínimo 44x44px
- Tap targets: Fáciles de activar con dedo
- Scroll: Suave si contenido excede viewport

---

## COMPONENTES REQUERIDOS

### Componentes de Base
- **Button:** Para botones volver y CTA
- **Navbar:** Barra superior con logo

### Utilidades
- **Parseador de parámetros URL:** Extraer y validar parámetros
- **Validador de URLs:** Asegurar URLs válidas (seguridad)
- **Icon renderer:** Para renderizar Font Awesome o emojis

---

## FLUJOS DE USUARIO

### Flujo 1: Usuario Accidental Llega a Página en Construcción
1. Usuario intenta acceder a una sección no disponible
2. Sistema lo redirecciona a `/utils/placeholder?page=sectionName`
3. Página muestra ícono, título, descripción
4. Usuario lee el mensaje
5. Clickea "Volver Atrás"
6. Retorna a página anterior

### Flujo 2: Usuario Intenta Acceder a Historial (Ejemplo)
1. Usuario clickea "Historial de Gastos" en sidebar
2. Se redirecciona a `/usuario/historial` (no existe)
3. Sistema redirige a `/utils/placeholder?page=historial&title=Historial de Gastos&description=...&icon=fa-history&ctaText=Ir a Dashboard&ctaUrl=/usuario/dashboard`
4. Página muestra información personalizada
5. Usuario puede:
   - Clickear "Volver Atrás" para ir al dashboard
   - Clickear "Ir a Dashboard" para ir explícitamente
6. Página se comporta bien en móvil, tablet, desktop

### Flujo 3: Múltiples Secciones en Construcción
- Sistema utiliza el mismo `placeholder.html` para múltiples secciones
- Solo cambian los parámetros URL
- Ejemplos:
  - `/utils/placeholder?page=reportes&title=Reportes Financieros`
  - `/utils/placeholder?page=inversiones&title=Mis Inversiones`
  - `/utils/placeholder?page=ahorro&title=Planes de Ahorro`

---

## NOTAS TÉCNICAS

### Consideraciones de Arquitectura
- **Reutilizabilidad máxima:** Un único archivo para múltiples secciones
- **Parámetros URL:** Configuración sin cambiar código
- **Sin estado:** Página stateless, no requiere backend
- **Fallback:** Valores por defecto si parámetros no se proporcionan
- **Seguridad:** Validar URLs para evitar injection

### Interacción con Backend
- **GET:** No requiere interacción con backend
- **POST:** No requiere interacción con backend
- **Caché:** Puede cachearse indefinidamente

### Performance
- **Carga rápida:** Contenido estático, sin API calls
- **Tamaño:** Minimal (solo HTML, CSS básico, JS mínimo para parsing URL)
- **Recursos:** Ícono vía Font Awesome CDN, imagen de fondo (si aplica)

### Accesibilidad
- Atributos `aria-label` en botones
- Navegación por teclado (Tab, Enter)
- Contraste WCAG AA+
- Texto descriptivo en lugar de solo ícono

### Seguridad
- **URL Validation:** Validar `ctaUrl` antes de navegar
  - Permitir: URLs relativas (`/usuario/dashboard`), rutas válidas
  - Rechazar: URLs absolutas a dominios externos, `javascript:`, `data:`
- **XSS Prevention:** Escapar parámetros URL antes de renderizar
- **Inyección:** Validar y sanitizar todos los parámetros

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Móvil: iOS Safari 14+, Chrome Android 90+

---

## REGLAS DE COMPORTAMIENTO

1. **Parámetros por defecto:** Si faltan parámetros, usar valores por defecto
2. **URL inválida para CTA:** Si `ctaUrl` es inválida, ocultar botón CTA
3. **Sin historial:** Si `history.back()` no tiene entrada anterior, navegar a `/`
4. **Validación strict:** Solo permitir URLs relativas para `ctaUrl`
5. **Encoding de URL:** Soportar caracteres especiales (UTF-8) en parámetros
6. **Navegación:** Mantener navbar visible para consistencia

---

## EJEMPLOS DE USO

### Ejemplo 1: Historial de Gastos
```
/utils/placeholder?page=historial&title=Historial de Gastos&description=Pronto podrás ver el registro completo de tus gastos&icon=fa-history&ctaText=Ir a Dashboard&ctaUrl=/usuario/dashboard
```
**Resultado:** Página muestra "Historial de Gastos", con botones para volver o ir a dashboard

### Ejemplo 2: Mis Reportes
```
/utils/placeholder?page=reportes&title=Mis Reportes&description=Los reportes personalizados estarán disponibles pronto&icon=📊
```
**Resultado:** Página muestra "Mis Reportes", solo botón volver (sin CTA)

### Ejemplo 3: Asesor - Mis Clientes (Future)
```
/utils/placeholder?page=clientes&title=Gestión de Clientes&description=Sistema de gestión completo de tu cartera de clientes&icon=fa-users&ctaText=Volver al Dashboard&ctaUrl=/asesor/dashboard
```
**Resultado:** Página muestra para asesor, con navegación personalizada

---

## METADATA

- **Route:** `/utils/placeholder` (o variable según parámetros)
- **HTTP Methods:** GET (solo lectura)
- **Autenticación:** Opcional (puede usarse autenticado o no)
- **Roles permitidos:** Todos
- **Tema:** Dark mode obligatorio
- **Responsivo:** Sí (mobile-first)
- **Reutilizable:** Sí (múltiples secciones via parámetros URL)

---

## NOTAS FINALES

- Esta página es un puente temporal durante desarrollo
- Cuando una sección está lista, se reemplaza la ruta con la página real
- No debería usarse en producción final, solo durante desarrollo iterativo
- Mantener simple y amigable para no frustrar usuarios
- Proporcionar alternativas claras de navegación

