# Especificación: Dashboard de Asesor

> Fase 0 del refactor (`../DiagnosticoRefactor.md` §6): se eliminaron la bandeja de entrada (inbox), los mensajes sin leer y la página de Reportes (comisiones, tareas, descargas) porque no forman parte de la consigna ni tienen respaldo en la BD. Las recomendaciones usan el modelo de `recomendaciones_financieras` (título, mensaje, tipo, prioridad; sin ahorro estimado). Los gráficos de la sección 8 se implementan en la Fase 3 y el análisis por cliente (`#/asesor/clientes/:id`), en la Fase 5.

## DESCRIPCIÓN GENERAL

El Dashboard de Asesor es la página principal para asesores financieros después del login. Proporciona una vista de gestión de clientes asignados, seguimiento de gastos de cada cliente, análisis de comportamiento de gastos y recomendaciones financieras para ofrecer. Es el hub de control desde el cual el asesor gestiona sus responsabilidades y clientes.

**Objetivos principales:**
- Visualizar cartera de clientes asignados
- Monitorear gastos y patrones de clientes
- Registrar y enviar recomendaciones financieras
- Acceso rápido a análisis y reportes de clientes

---

## ESTRUCTURA VISUAL

### 1. Barra de Navegación Superior
- **Logo de FinTrack** (clickeable, enlace a inicio)
- **Breadcrumb o sección actual** (ej: "Dashboard de Asesor")
- **Zona derecha:**
  - Icono de notificaciones (campana) con badge de contador
  - Icono de perfil/usuario (abre menú desplegable)
  - Menú desplegable: Ver Perfil, Configuración, Cerrar Sesión
- **Tema:** Navbar oscura, consistente

### 2. Barra Lateral (Sidebar) Colapsable
- **Items de navegación:**
  - Dashboard (icono home) - actual
  - Mis Clientes (icono people)
  - Perfil del Asesor (icono user)
- **Estado del item:** Resaltado si es página actual (color principal)
- **Comportamiento:**
  - Desktop: Sidebar fija o colapsable
  - Móvil: Offcanvas con hamburguesa
- **Tema:** Fondo ligeramente más claro, íconos en color principal

### 3. Sección Hero/Bienvenida
- **Saludo personalizado:** "Hola, [Nombre del Asesor]"
- **Subtítulo:** Información contextual (ej: "2 clientes con gastos inusuales")
- **Elementos lado a lado:**
  - **Calendario pequeño:** Mes actual, permite ver y seleccionar fechas
  - **Alertas/Tareas:** Lista pequeña de tareas pendientes (ej: "Cliente X no registra gastos hace 5 días", "Recomendación pendiente de envío")
- **Tema:** Fondo neutral, texto claro

### 4. Sección de Estadísticas (Stats Cards)
- **Tres tarjetas grandes con números destacados:**
  - **Tarjeta 1:** Total de clientes activos
    - Número grande (ej: "24")
    - Subtítulo: "Clientes asignados"
    - Cambio: "+2 este mes" (con indicador)
    - Ícono descriptivo
  - **Tarjeta 2:** Total de gastos supervisados
    - Número grande (ej: "$45,230.50")
    - Subtítulo: "Gastos combinados este mes"
    - Cambio porcentual: "vs mes anterior"
    - Ícono descriptivo
  - **Tarjeta 3:** Promedio de gastos por cliente
    - Número grande (ej: "$1,884.60")
    - Subtítulo: "Promedio por cliente"
    - Comparación con mes anterior
    - Ícono descriptivo
- **Distribución:** 3 columnas en desktop, stack en móvil
- **Tema:** Fondo ligeramente oscuro, números en color principal

### 5. Sección de Clientes
- **Título:** "Mis Clientes"
- **Componente:** Lista scrollable o grid de tarjetas de clientes
- **Cada tarjeta de cliente (AdvisorClientCard) contiene:**
  - Foto de perfil del cliente
  - Nombre y email
  - Gasto total del cliente este mes
  - Perfil de consumo del cliente
  - Estado (activo, inactivo, en espera)
  - Botones: "Ver Detalle", "Enviar recomendación"
- **Búsqueda/Filtros:**
  - Campo de búsqueda por nombre/email
  - Filtro por estado (activo, inactivo)
  - Filtro por perfil de consumo
- **Ordenamiento:** Por gasto total, por nombre, por actividad reciente
- **Paginación/Scroll:** Si hay más de 10 clientes, paginar o lazy load
- **Tema:** Tarjetas con borde sutil, foto destacada

### 7. Sección de Recomendaciones Recientes
- **Título:** "Recomendaciones Registradas"
- **Componente:** Grid o lista de últimas recomendaciones enviadas
- **Cada tarjeta contiene:**
  - Nombre del cliente destino
  - Título de la recomendación
  - Estado (sin leer / leída, según `leida`)
  - Botón: "Ver Detalles"
- **Botón CTA al final:** "Crear Nueva Recomendación" (abre modal o navega)
- **Tema:** Tarjetas compactas, estado con color indicador

### 8. Gráficos de Análisis
- **Dos o tres gráficos pequeños:**

  **Gráfico 1 - Pastel: "Distribución de Clientes por Perfil"**
  - Segmentos para cada perfil (Drácula, Equilibrista, Espíritu Libre)
  - Colores diferenciados
  - Leyenda con cantidad por perfil
  - Tooltip al hover

  **Gráfico 2 - Barras: "Gasto Total por Perfil de Cliente"**
  - Eje X: Perfiles de consumo
  - Eje Y: Monto total
  - Barras de color principal
  - Tooltip con monto exacto

  **Gráfico 3 - Línea: "Actividad de Clientes (Últimos 30 días)"**
  - Eje X: Días del mes
  - Eje Y: Número de clientes activos
  - Línea mostrando tendencia
  - Tooltip al hover

- **Tema:** Fondo consistente, ejes sutiles

### 9. Footer
- **Mínimo:** Copyright, enlace a soporte
- **Tema:** Consistente con sitio

---

## ELEMENTOS INTERACTIVOS

### Sidebar/Navegación
- **Click en item:** Navega a página correspondiente
- **Estado activo:** Resalta item actual
- **Móvil:** Hamburguesa abre/cierra offcanvas
- **Soporte teclado:** Navegación por Tab

### Buscar Clientes
- **Campo de búsqueda:** Input with debounce
- **Resultados en tiempo real:** Filtra lista mientras escribe
- **Filtros:** Dropdown para estado, perfil
- **Clear button:** Limpia búsqueda y filtros

### Tarjetas de Cliente
- **Hover:** Sombra elevada, cambio sutil de color
- **Click en "Ver Detalle":** Abre panel lateral o modal con detalles del cliente
- **Click en "Enviar recomendación":** Abre el modal de crear recomendación con el cliente preseleccionado

### Gráficos
- **Hover:** Tooltip con información exacta
- **Legendas clickeables:** Mostrar/ocultar segmentos
- **Responsivo:** En móvil se pueden desplazar

### Modal de Crear Recomendación
- **Campos:**
  - Selector de cliente
  - Título
  - Tipo: `sugerencia` · `alerta` · `observacion` (enum `tipo_recomendacion`)
  - Prioridad: `alta` · `media` · `baja` (enum `prioridad_recomendacion`, por defecto `media`)
  - Mensaje (textarea)
  - Botón "Guardar y Enviar"
  - Botón "Cancelar"
- **Validación:** Todos los campos requeridos

### Perfil de Usuario (Dropdown)
- **Items:** Ver Perfil, Configuración, Cerrar Sesión
- **Separador visual**
- **Última opción diferente (Cerrar Sesión)**

---

## DATOS REQUERIDOS

### Datos de Asesor (del Backend)
- Nombre completo
- Email
- Foto de perfil
- Rol (siempre "asesor")
- Número de clientes asignados

### Datos de Clientes (del Backend)
- Lista de clientes asignados con:
  - ID, nombre, email
  - Foto de perfil
  - Perfil de consumo
  - Gasto total este mes
  - Última actividad
  - Estado (activo, inactivo)

### Datos de Estadísticas (del Backend)
- Total clientes activos
- Total de gastos supervisados (este mes)
- Promedio de gastos por cliente
- Comparativas con mes anterior

### Datos de Recomendaciones (del Backend)
- Lista de últimas recomendaciones
- Cliente destino
- Título, tipo y prioridad
- Fecha enviada
- Leída (sí/no)

### Datos para Gráficos (del Backend)
- Distribución de clientes por perfil (conteo)
- Gasto total por perfil (suma)
- Actividad diaria de clientes (últimos 30 días)

### Estructura de Datos Esperada
```
{
  "advisor": {
    "name": "Carlos",
    "email": "carlos@advisor.com",
    "photo": "url",
    "role": "asesor",
    "totalClients": 24
  },
  "stats": {
    "activeClients": 24,
    "totalSpentThisMonth": 45230.50,
    "averagePerClient": 1884.60,
    "changePercentage": 8
  },
  "clients": [
    { id, name, email, photo, profile, totalSpent, lastActivity, status },
    ...
  ],
  "recommendations": [
    { id, clientName, title, type, priority, dateSent, read },
    ...
  ],
  "charts": {
    "profileDistribution": [ { profile: "Drácula", count: 8 }, ... ],
    "spendByProfile": [ { profile, total }, ... ],
    "dailyActivity": [ { date, activeCount }, ... ]
  },
  "alerts": [ { type, message } ]
}
```

---

## ESTILOS Y TEMA

### Paleta de Colores
- **Color Primario:** Turquesa/Cyan (#00BCD4)
- **Color Oscuro Principal:** Casi negro (#1a1a1a)
- **Fondo secundario:** Gris oscuro (#2a2a2a para cards)
- **Texto principal:** Blanco (#ffffff)
- **Texto secundario:** Gris claro (#b0b0b0)
- **Verde:** Para clientes activos (#4caf50)
- **Naranja:** Para clientes inactivos (#ff9800)
- **Rojo:** Para alertas (#f44336)

### Tipografía
- **Encabezados:** Poppins, bold (700)
- **Cuerpo:** Inter, regular (400)
- **Tamaños:** H1=32px, H2=24px, H3=18px, Body=16px

### Efectos Visuales
- **Tarjetas:** Borde sutil, sombra en hover
- **Botones:** Fondo principal, transición 0.3s
- **Gráficos:** Líneas/barras suaves, tooltip con fondo oscuro
- **Badges:** Estado con colores: verde (activo), naranja (inactivo), gris (espera)

### Tema
- **Modo oscuro obligatorio**
- **Alto contraste para accesibilidad**

---

## COMPORTAMIENTO RESPONSIVO

### Breakpoints
- **Desktop:** ≥992px
- **Tablet:** 768px - 991px
- **Móvil:** <768px

### Adaptaciones
- **Desktop:**
  - Sidebar fija a la izquierda
  - Stats cards: 3 columnas
  - Sección de clientes: Grid o tabla
  - Gráficos: 2-3 en una fila

- **Tablet:**
  - Sidebar colapsable
  - Stats cards: 2 columnas
  - Sección clientes: 2 tarjetas por fila
  - Gráficos: Stack 2+1
  - Fuentes reducidas

- **Móvil:**
  - Sidebar: Offcanvas (hamburguesa)
  - Stats cards: Stack 1 columna
  - Sección clientes: 1 tarjeta por fila
  - Gráficos: Stack vertical
  - Hero: Saludo pequeño, calendario oculto
  - Recomendaciones: Stack vertical

### Comportamiento táctil
- Botones: Mínimo 44x44px
- Offcanvas: Deslizable con gestos
- Tarjetas: Swipe para revelar acciones (opcional)
- Scroll suave en listas

---

## COMPONENTES REQUERIDOS

### Componentes de Base
- **Button:** Acciones primaria, secundaria
- **Card:** Contenedores para stats y clientes
- **Modal:** Para crear recomendaciones
- **FormInput:** Campos en modales
- **Navbar:** Barra superior con notificaciones y perfil

### Componentes Específicos
- **StatCardAdvanced:** Tarjeta de estadística con número, cambio %, ícono
- **SummaryCard:** Tarjeta resumen pequeña
- **ClientsList:** Componente lista de clientes con búsqueda/filtros
- **AdvisorClientCard:** Tarjeta individual de cliente
- **ChartComponent:** Wrapper para Chart.js (reutilizable)
- **ProfileCard:** Card con datos de asesor/cliente

### Utilidades
- **Sidebar:** Navegación colapsable/offcanvas
- **Toast notifications:** Alertas emergentes
- **Dropdown menu:** Para perfil de usuario
- **Search/Filter:** Búsqueda y filtros en cliente list
- **Badge:** Indicadores de estado (activo, inactivo, etc.)
- **Modal:** Crear recomendaciones

---

## FLUJOS DE USUARIO

### Flujo 1: Entrada Principal
1. Asesor inicia sesión (login exitoso)
2. Se redirecciona a `/asesor/dashboard`
3. Carga el dashboard con datos
4. Ve stats, lista de clientes y recomendaciones
5. Puede navegar a otras secciones vía sidebar

### Flujo 2: Gestionar Cliente
1. Asesor ve lista de clientes
2. Clickea "Ver Detalle" en una tarjeta de cliente
3. Panel lateral se abre con información completa
4. Ve gastos, perfiles, historial, últimas transacciones
5. Puede crear recomendaciones
6. Cierra panel y retorna a lista

### Flujo 3: Crear Recomendación
1. Asesor clickea "Crear Nueva Recomendación"
2. Modal abre con formulario
3. Selecciona cliente destino
4. Completa título, tipo y prioridad
5. Escribe el mensaje
6. Clickea "Guardar y Enviar"
7. El sistema la guarda (queda sin leer para el cliente)
8. Modal se cierra, lista se actualiza

### Flujo 4: Ver Recomendaciones
1. En la sección "Últimas Recomendaciones Enviadas" el asesor ve dos columnas: "Sin leer" y "Leídas"
2. Cada ítem muestra el cliente y el título de la recomendación

---

## NOTAS TÉCNICAS

### Consideraciones de Arquitectura
- **Reutilización:** StatCardAdvanced, Card, Modal, Button usados múltiples veces
- **Estado local:** Asesor autenticado, datos en memoria
- **Composición:** Dashboard = Navbar + Sidebar + Hero + Stats + ClientsList + Recommendations + Charts
- **Ciclo de vida:** Fetch datos al montar, actualizar en intervalos (opcional)

### Interacción con Backend
- **GET /asesor/dashboard:** Todos los datos (asesor, stats, clientes, recomendaciones, charts)
- **GET /clientes:** Lista de clientes (con búsqueda/filtros)
- **GET /clientes/:id:** Detalles de cliente específico
- **POST /recomendaciones:** Crear nueva recomendación
- **GET /recomendaciones:** Lista de recomendaciones del asesor

### Performance
- Lazy load de gráficos
- Paginación de lista de clientes (10 por página)
- Debounce en búsqueda (300ms)
- Caché de datos en localStorage
- Lazy load de imágenes de clientes

### Accesibilidad
- Atributos `aria-label` en botones e íconos
- Navegación por teclado (Tab, Enter, Esc)
- Contraste WCAG AA+
- Descripciones en gráficos

### Seguridad
- Token de sesión en localStorage
- Validación de rol (solo asesor)
- HTTPS obligatorio
- CORS headers

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Móvil: iOS Safari 14+, Chrome Android 90+

---

## REGLAS DE COMPORTAMIENTO

1. **Al cargar:** Mostrar skeleton loaders mientras se fetch datos
2. **Datos vacíos:** Si no hay clientes, mostrar mensaje "Sin clientes asignados"
3. **Gráficos:** Actualizar en tiempo real si datos cambian
4. **Notificaciones:** Toast popup en esquina inferior derecha
5. **Errores:** Mostrar modal o alert con mensaje
7. **Cierre de sesión:** Limpiar localStorage y redirigir a login

---

## METADATA

- **Route:** `/asesor/dashboard`
- **HTTP Methods:** GET (fetch datos), POST (crear recomendaciones)
- **Autenticación:** Requerida (rol: asesor)
- **Roles permitidos:** Asesor financiero (no usuario regular)
- **Tema:** Dark mode obligatorio
- **Responsivo:** Sí (mobile-first)

