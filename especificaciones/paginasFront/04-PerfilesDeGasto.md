# Especificación: Perfiles de Gasto (actualizada mayo 2026)

## DESCRIPCIÓN GENERAL

La página de Perfiles de Gasto (`/usuario/perfiles`) es un **explorador informativo y educativo**. Presenta el catalogo de perfiles financieros disponibles en el sistema, con descripcion, caracteristicas, consejos y tabla comparativa.

**REGLA DE NEGOCIO CRITICA:** El cliente NO puede asignarse un perfil a si mismo. Los perfiles son asignados exclusivamente por el asesor financiero (via panel del asesor). El cliente solo puede consultar informacion sobre los perfiles.

**Objetivos:**
- Educar al usuario sobre los diferentes perfiles de gasto financiero
- Mostrar cuál es su perfil activo actual (asignado por el asesor)
- Explicar las caracteristicas de cada perfil
- Facilitar comparacion entre perfiles
- Proveer tips practicos para mejorar habitos financieros

---

## ESTRUCTURA VISUAL

### 1. Barra de Navegación Superior
- **Logo de FinTrack** (clickeable, enlace a inicio)
- **Breadcrumb:** "Dashboard > Perfiles de Gasto"
- **Zona derecha:**
  - Icono de notificaciones
  - Icono de perfil (dropdown)
- **Tema:** Navbar oscura, consistente

### 2. Barra Lateral (Sidebar)
- **Misma estructura que dashboard de usuario**
- **Items de navegación:**
  - Dashboard
  - Cargar Gasto
  - Historial de Gastos
  - **Perfiles de Gasto** - actual (resaltado)
  - Recomendaciones
  - Configuración
- **Tema:** Consistente

### 3. Sección Header/Título
- **Título principal:** "Perfiles de Gasto"
- **Subtítulo:** "Descubre cuál es tu perfil de consumo y recibe recomendaciones personalizadas"
- **Breve descripción:** Explicación de qué son los perfiles (1-2 párrafos)
- **Tema:** Fondo neutral, texto claro

### 4. Sección de Tres Tarjetas de Perfiles
- **Estructura:** Grid de 3 tarjetas grandes, una por cada perfil
- **Breakpoints:** 3 columnas desktop, 1-2 tablet, 1 móvil

#### **Tarjeta 1: Perfil Drácula (Ahorrador)**
- **Emoji/Icono:** 🧛 (Drácula o similar)
- **Nombre del perfil:** "Drácula"
- **Tagline:** "El Ahorrador" o similar
- **Descripción:** Párrafo describiendo este perfil (2-3 líneas)
  - Ej: "Eres alguien que controla cada peso. Registras gastos constantemente, evitas compras impulsivas y priorizas el ahorro. Tu disciplina es tu fortaleza."
- **Lista de Características:** 4-5 puntos sobre este perfil
  - Ej: "Registra gastos diarios", "Gasto controlado", "Ahorra más del 30%", etc.
- **Indicador de perfil activo:** badge "Tu perfil actual" si este es el perfil asignado al cliente
- **Sin boton de seleccion:** el cliente no puede cambiar su propio perfil
- **Tema:** Card con borde en color principal (turquesa), background oscuro

#### **Tarjeta 2: Perfil Equilibrista (Equilibrado)**
- **Emoji/Icono:** 🤹 (Equilibrista o similar)
- **Nombre del perfil:** "Equilibrista"
- **Tagline:** "El Equilibrado"
- **Descripción:** Párrafo describiendo este perfil (2-3 líneas)
  - Ej: "Buscas balance entre disfrutar y ahorrar. Registras gastos regularmente, pero permites pequeños gastos discretos. Ahorras modestamente pero de forma consistente."
- **Lista de Características:** 4-5 puntos
  - Ej: "Balance entre gasto y ahorro", "Algunos gastos discretos permitidos", "Ahorra 15-25%", etc.
- **Indicador de perfil activo:** badge "Tu perfil actual" si corresponde
- **Sin boton de seleccion**
- **Tema:** Card similar, posiblemente con borde mas destacado

#### **Tarjeta 3: Perfil Espíritu Libre (Derrochador)**
- **Emoji/Icono:** 🌪️ (Espíritu libre o similar)
- **Nombre del perfil:** "Espíritu Libre"
- **Tagline:** "El Derrochador"
- **Descripción:** Párrafo describiendo este perfil (2-3 líneas)
  - Ej: "Eres impulsivo con tus gastos. No sueles registrar cada compra y prefieres disfrutar del momento. Poco enfoque en ahorrar, más en vivir."
- **Lista de Características:** 4-5 puntos
  - Ej: "Gastos impulsivos frecuentes", "Bajo seguimiento de gastos", "Poco o nada de ahorro", "Vives el presente", etc.
- **Indicador de perfil activo:** badge si corresponde
- **Sin boton de seleccion**
- **Tema:** Card similar, con tonalidad visual diferente (opcional)

### 5. Sección de Tips/Consejos
- **Sección expandible/acordeón:** "Tips para cada Perfil"
- **Cada perfil tiene su propia sección de tips:**

  **Tips para Drácula (Ahorrador):**
  - "Establece objetivos de ahorro mensuales"
  - "Considera inversión a largo plazo"
  - "No sacrifiques calidad de vida por ahorrar"
  - "Revisa presupuesto mensualmente"

  **Tips para Equilibrista (Equilibrado):**
  - "Mantén una proporción 70/30 (gasto/ahorro)"
  - "Registra gastos regularmente"
  - "Permite pequeños caprichos controlados"
  - "Revisa y ajusta presupuesto trimestral"

  **Tips para Espíritu Libre (Derrochador):**
  - "Intenta registrar gastos mínimo 2 veces por semana"
  - "Establece un presupuesto flexible pero real"
  - "Identifica gastos innecesarios"
  - "Comienza con pequeños ahorros"

- **Presentación:** Cards o list items, cada uno con ícono representativo
- **Tema:** Fondo neutro, texto legible

### 6. Tabla Comparativa
- **Título:** "Comparación de Perfiles"
- **Estructura:** Tabla de 4 columnas (Característica, Drácula, Equilibrista, Espíritu Libre)
- **Filas de comparación:**
  - Frecuencia de registro de gastos
  - Tolerancia a gastos impulsivos
  - Porcentaje de ahorro típico
  - Objetivo principal
  - Riesgo financiero
  - Seguimiento necesario
  - Herramientas recomendadas
- **Responsividad:** En móvil, convertir a layout vertical o con scroll horizontal
- **Tema:** Filas alternas de colores, encabezado destacado

### 7. Sección de Llamada a la Acción
- **Título:** "¿Listo para comenzar?"
- **Subtítulo:** "Selecciona tu perfil arriba y recibe recomendaciones personalizadas"
- **Botón primario:** "Ir a mi Dashboard" (navega de vuelta a dashboard)
- **Botón secundario:** "Ver Recomendaciones" (navega a /usuario/recomendaciones)
- **Tema:** Fondo principal o gradiente

### 8. Footer
- **Mínimo:** Copyright, enlace a soporte
- **Tema:** Consistente

---

## ELEMENTOS INTERACTIVOS

### Tarjetas de Perfil
- **Hover:** Sombra elevada, cambio sutil de color de borde
- **Sin interaccion de seleccion:** las tarjetas son solo informativas
- **Badge "Tu perfil actual":** aparece en la tarjeta del perfil asignado por el asesor

### Sección de Tips (Acordeón)
- **Click en encabezado de perfil:** Expande/colapsa tips
- **Solo un perfil expandido a la vez (opcional)**
- **Animación:** Slide-down suave

### Tabla Comparativa
- **Hover en fila:** Cambio sutil de fondo
- **Responsive:** En móvil, columnas se pueden hacer scrolleables horizontalmente
- **Click en celda:** Resalta fila o columna (opcional)

### Botones de Navegación
- **"Ir a mi Dashboard":** Navega a `/usuario/dashboard`
- **"Ver Recomendaciones":** Navega a `/usuario/recomendaciones`
- **Sin endpoint de seleccion para el cliente:** la pagina es de solo lectura

### Sidebar/Navegación
- **Click en item:** Navega a página correspondiente
- **Móvil:** Hamburguesa abre/cierra offcanvas

---

## DATOS REQUERIDOS

### Datos de Perfil de Usuario (del Backend)
- Perfil de consumo actual del usuario
- Nombre de usuario
- Email

### Datos de Perfiles (Estáticos o del Backend)
- Para cada uno de los 3 perfiles:
  - ID del perfil
  - Nombre (Drácula, Equilibrista, Espíritu Libre)
  - Emoji/Icono
  - Descripción completa
  - Lista de características (4-5 items)
  - Lista de tips (3-4 items)
  - Datos para tabla comparativa

### Estructura de Datos Esperada
```
{
  "user": {
    "name": "Juan",
    "email": "juan@mail.com",
    "activeProfile": "Drácula"
  },
  "profiles": [
    {
      "id": 1,
      "name": "Drácula",
      "emoji": "🧛",
      "tagline": "El Ahorrador",
      "description": "Eres alguien que...",
      "characteristics": ["...", "...", "...", "..."],
      "tips": ["...", "...", "...", "..."],
      "tableData": {
        "registryFrequency": "Diario",
        "impulseTolerance": "Muy baja",
        "savingsPercentage": ">30%",
        "mainGoal": "Maximizar ahorro",
        "financialRisk": "Muy bajo",
        "trackingNeeded": "Diario",
        "recommendedTools": "Excel, App de presupuesto"
      }
    },
    { /* Equilibrista */ },
    { /* Espíritu Libre */ }
  ]
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
- **Color Drácula:** Púrpura o azul oscuro (#663399 o similar)
- **Color Equilibrista:** Turquesa/Cyan (color primario)
- **Color Espíritu Libre:** Naranja o rojo (#ff6b6b o similar)

### Tipografía
- **Encabezados:** Poppins, bold (700)
- **Cuerpo:** Inter, regular (400)
- **Tamaños:** H1=32px, H2=24px, H3=18px, Body=16px

### Efectos Visuales
- **Tarjetas de perfil:** Borde coloreado, sombra en hover
- **Botones:** Color principal, transición suave
- **Acordeón:** Animación slide-down
- **Tabla:** Filas alternas, hover effect
- **Badges:** "Perfil Actual" con color destacado

### Tema
- **Modo oscuro obligatorio**
- **Alto contraste para accesibilidad**
- **Tres colores de perfil diferenciados**

---

## COMPORTAMIENTO RESPONSIVO

### Breakpoints
- **Desktop:** ≥992px
- **Tablet:** 768px - 991px
- **Móvil:** <768px

### Adaptaciones
- **Desktop:**
  - Sidebar fija a la izquierda
  - 3 tarjetas de perfil en una fila
  - Tips en acordeón side-by-side
  - Tabla con scroll horizontal si necesario
  - Layout: Navbar + Sidebar + Content

- **Tablet:**
  - Sidebar colapsable
  - 2 tarjetas por fila (1 abajo)
  - Tips apilados
  - Tabla: Scroll horizontal si necesario
  - Fuentes reducidas

- **Móvil:**
  - Sidebar: Offcanvas (hamburguesa)
  - 1 tarjeta por fila (stack vertical)
  - Tips: Acordeón expandible individual
  - Tabla: Scroll horizontal (layout vertical con scroll)
  - Botones CTA: Stack vertical

### Comportamiento táctil
- Botones: Mínimo 44x44px
- Tarjetas: Tap para abrir detalles (opcional)
- Acordeón: Tap para expandir/colapsar
- Tabla: Swipe horizontal para scroll

---

## COMPONENTES REQUERIDOS

### Componentes de Base
- **Button:** Acciones primaria, secundaria
- **Card:** Tarjetas de perfil, contenedores
- **FormInput:** Si hay filtros (opcional)
- **Navbar:** Barra superior
- **Sidebar:** Navegación lateral

### Componentes Específicos
- **ConsumptionProfile:** Tarjeta individual de perfil (nombre, descripción, características, botón)
- **SummaryCard:** Para tabla comparativa (opcional)
- **Accordion:** Para section de tips
- **Table/Comparison:** Tabla de comparación

### Utilidades
- **Toast notifications:** Confirmación de selección de perfil
- **Badge:** "Perfil Actual"
- **Icons:** Emojis o íconos Font Awesome
- **Responsive Table:** Scroll horizontal en móvil

---

## FLUJOS DE USUARIO

### Flujo 1: Explorar Perfiles
1. Usuario navega desde dashboard o menú
2. Llega a `/usuario/perfiles`
3. Lee descripción general
4. Explora tarjetas de los 3 perfiles
5. Lee características de cada uno
6. Expande tips para ver consejos

### Flujo 2: Comparar Perfiles
1. Usuario consulta tabla comparativa
2. Compara características entre perfiles
3. Analiza diferencias clave
4. Identifica qué perfil se adapta más

### Flujo 3: Ver perfil activo
1. La pagina carga los perfiles desde `GET /users/spending-profiles`
2. El perfil activo del cliente viene de `GET /users/me` (campo `spendingProfile`)
3. La tarjeta correspondiente muestra el badge "Tu perfil actual"
4. El cliente puede explorar los demas perfiles de forma informativa

### Flujo 4: Actuar sobre Selección
1. Después de elegir perfil, usuario tiene 2 opciones:
   - Click "Ir a mi Dashboard" → regresa a `/usuario/dashboard`
   - Click "Ver Recomendaciones" → navega a `/usuario/recomendaciones`

### Flujo 5: Navegar Rápida
1. Usuario puede usar sidebar para navegar a otras secciones
2. O usar botones CTA al final de la página

---

## NOTAS TÉCNICAS

### Consideraciones de Arquitectura
- **Reutilización:** Button, Card, ConsumptionProfile usados múltiples veces
- **Estado local:** Perfil actual del usuario (puede venir del backend al cargar)
- **Composición:** Page = Navbar + Sidebar + Header + ProfileCards + Tips + Comparison Table + CTA Section + Footer
- **Ciclo de vida:** Fetch datos de perfil al montar, actualizar en localStorage cuando cambia

### Interaccion con Backend
- **GET /users/spending-profiles:** Obtiene lista de perfiles disponibles (catalogo completo)
- **GET /users/me:** Obtiene perfil activo actual del cliente (`spendingProfile`, `spendingProfileSource`)
- **Sin POST:** el cliente no puede cambiar su perfil via API

### Performance
- Todos los datos estáticos (se pueden hardcodear después de primera consulta)
- Lazy load de imágenes (emojis/íconos)
- Tabla: No necesita virtualización (solo 3 perfiles)

### Accesibilidad
- Atributos `aria-label` en botones
- Navegación por teclado (Tab, Enter)
- Contraste WCAG AA+
- Descripciones de perfiles en texto plano

### Seguridad
- Token de sesión requerido
- Validación de rol (solo usuario regular)
- HTTPS obligatorio
- CORS headers

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Móvil: iOS Safari 14+, Chrome Android 90+

---

## REGLAS DE COMPORTAMIENTO

1. **Al cargar:** Mostrar badge "Tu perfil actual" en la tarjeta del perfil asignado por el asesor
2. **Sin seleccion:** No hay botones de seleccion de perfil. El cliente es un observador.
3. **Perfiles dinamicos:** Los perfiles se cargan desde la API (no hardcodeados en frontend)
4. **Sin perfil asignado:** Mostrar mensaje informativo "Tu asesor aun no ha asignado un perfil"
5. **Errores de carga:** Mostrar estado de error con opcion de reintentar

---

## METADATA

- **Route:** `/usuario/perfiles`
- **HTTP Methods:** GET (fetch perfiles) — sin POST para el cliente
- **Autenticacion:** Requerida (rol: cliente)
- **Roles permitidos:** cliente (no asesor)
- **Tema:** Dark mode obligatorio
- **Responsivo:** Sí (mobile-first)

