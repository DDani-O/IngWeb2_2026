# Especificación: Dashboard de Usuario

## DESCRIPCIÓN GENERAL

El Dashboard de Usuario es la página principal después del login para usuarios regulares. Proporciona una vista integral de la salud financiera del usuario con estadísticas, tendencias de gastos, análisis de patrones de consumo, y recomendaciones personalizadas de un asesor financiero. Es el hub central desde el cual el usuario accede a todas las funcionalidades principales de la plataforma.

**Objetivos principales:**
- Presentar resumen ejecutivo de finanzas personales
- Mostrar tendencias y patrones de gasto
- Facilitar carga de nuevos gastos
- Conectar con asesor financiero
- Acceso rápido a secciones principales (historial, recomendaciones, perfiles)

---

## ESTRUCTURA VISUAL

### 1. Barra de Navegación Superior
- **Logo de FinTrack** (clickeable, enlace a inicio)
- **Breadcrumb o sección actual** (ej: "Dashboard")
- **Zona derecha:**
  - Icono de notificaciones (campana) con badge de contador
  - Icono de perfil/usuario (abre menú desplegable)
  - Menú desplegable con: Ver Perfil, Configuración, Cerrar Sesión
- **Tema:** Navbar oscura, consistente con resto de sitio

### 2. Barra Lateral (Sidebar) Colapsable
- **Posición:** Izquierda, con opción offcanvas en móvil
- **Items de navegación:**
  - Dashboard (icono home) - actual
  - Cargar Gasto (icono plus/upload)
  - Historial de Gastos (icono history)
  - Perfiles de Gasto (icono chart)
  - Recomendaciones (icono lightbulb)
  - Configuración (icono settings)
- **Estado del item:** Resaltado si es la página actual (color principal)
- **Comportamiento:**
  - Desktop: Sidebar fija o colapsable vía botón
  - Móvil: Offcanvas (hamburguesa abre/cierra)
- **Tema:** Fondo ligeramente más claro, íconos en color principal

### 3. Sección Hero/Bienvenida
- **Saludo personalizado:** "Hola, [Nombre del Usuario]"
- **Fecha/Hora actual** o mensaje contextual (ej: "Buenos días")
- **Dos elementos lado a lado:**
  - **Calendario pequeño:** Mes actual con días, permite ver y seleccionar fechas
  - **Alertas activas:** Lista pequeña de alertas importantes (ej: "Gasto alto detectado", "Recomendación nueva")
- **Botón CTA:** "Cargar nuevo gasto" (enlace a página de cargar gasto)
- **Tema:** Fondo neutral, texto claro, calendario interactivo

### 4. Sección de Estadísticas (Stats Cards)
- **Tres tarjetas grandes con números destacados:**
  - **Tarjeta 1:** Total gastado (este mes)
    - Número grande (ej: "$2,450.50")
    - Subtítulo: "Este mes"
    - Cambio porcentual: "+5% vs mes anterior" (en color rojo/verde)
    - Ícono descriptivo
  - **Tarjeta 2:** Presupuesto disponible
    - Número grande
    - Subtítulo: "Presupuesto restante"
    - Barra de progreso visual (usable/total)
    - Ícono descriptivo
  - **Tarjeta 3:** Gastos promedio diario
    - Número grande (ej: "$78.50/día")
    - Subtítulo: "Promedio este mes"
    - Comparación con mes anterior
    - Ícono descriptivo
- **Distribución:** 3 columnas en desktop, stack en móvil
- **Tema:** Fondo ligeramente oscuro, números en color principal

### 5. Sección de Perfil de Consumo Activo
- **Componente ConsumptionProfile:**
  - Nombre del perfil activo (ej: "Drácula", "Equilibrista", "Espíritu Libre")
  - Descripción breve del perfil
  - Categorías incluidas en el perfil
  - Botón: "Cambiar perfil" (enlaza a /usuario/perfiles)
- **Tema:** Card prominente, color del perfil como acento

### 6. Sección de Tarjetas Resumen (Summary Cards)
- **Dos o tres tarjetas con información complementaria:**
  - **Tarjeta 1:** Última transacción
    - Tipo de gasto
    - Monto
    - Fecha
    - Categoría
  - **Tarjeta 2:** Próximo pago (si aplica)
    - Descripción
    - Fecha
    - Monto
  - **Tarjeta 3:** Notificación importante
    - Ícono de advertencia
    - Mensaje
    - Botón de acción (si aplica)
- **Tema:** Tarjetas ordenadas en grid, responsive

### 7. Sección de Gráficos
- **Subtítulo:** "Análisis de Gastos" o "Tendencias"
- **Tres gráficos visualizados con Chart.js:**

  **Gráfico 1 - Línea: "Gastos por Día (Últimas 2 semanas)"**
  - Eje X: Días de la semana
  - Eje Y: Monto en dinero
  - Línea azul/turquesa mostrando tendencia
  - Tooltip al hover mostrando día y monto

  **Gráfico 2 - Pastel: "Gastos por Categoría (Este mes)"**
  - Segmentos de colores diferentes para cada categoría
  - Leyenda al lado o abajo
  - Porcentaje visible en cada segmento
  - Label con categoría al hover

  **Gráfico 3 - Barras: "Gasto Mensual (Últimos 6 meses)"**
  - Eje X: Meses
  - Eje Y: Monto total
  - Barras de color consistente
  - Tooltip mostrando mes y monto
  - Línea de promedio superpuesta (gris claro)

- **Responsividad:** En móvil, los gráficos se apilan verticalmente
- **Tema:** Fondo del canvas consistente, ejes visibles pero sutiles

### 8. Sección de Conexión con Asesor
- **Toast/Card destacada en esquina o sección fija:**
  - Icono de asesor
  - Mensaje: "¿Preguntas sobre tus gastos?" o similar
  - Nombre del asesor asignado (si aplica)
  - Botón: "Contactar Asesor"
  - Botón: "Ver perfil del asesor"
- **Comportamiento:** Clickear botón abre modal de chat/contacto
- **Tema:** Fondo color principal con baja opacidad, texto claro

### 9. Footer
- **Mínimo:** Copyright, enlace a soporte, enlace a términos
- **Opcional:** Enlaces útiles adicionales
- **Tema:** Consistente con resto de sitio

---

## ELEMENTOS INTERACTIVOS

### Sidebar/Navegación
- **Click en item:** Navega a página correspondiente
- **Estado activo:** Resalta item actual
- **En móvil:** Hamburguesa abre/cierra offcanvas
- **Soporte teclado:** Navegación por Tab

### Stats Cards
- **Hover:** Sombra elevada, cambio sutil de color
- **Click:** Posible filtrado por período (opcional)
- **Animación:** Números cuentan desde 0 al cargar (opcional)

### Gráficos
- **Hover:** Tooltip con información exacta
- **Legendas clickeables:** Mostrar/ocultar datos del gráfico
- **Responsivo:** En móvil, se pueden desplazar horizontalmente
- **Reload datos:** Botón para actualizar gráficos (si datos vienen del backend)

### Modal de Chat/Contacto Asesor
- **Estructura:**
  - Foto/perfil del asesor
  - Campo de texto para mensaje
  - Botón "Enviar"
  - Botón "Cerrar"
- **Funcionalidad:** Envío de mensaje inicia conversación o abre chat persistente

### Notificaciones
- **Badge en navbar:** Muestra número de notificaciones no leídas
- **Click:** Abre panel o página de notificaciones
- **Toast notifications:** Para alertas en tiempo real (ej: "Gasto registrado correctamente")

### Perfil de Usuario (Dropdown)
- **Items:**
  - Ver mi perfil
  - Configuración
  - Cerrar sesión
- **Separador visual entre items**
- **Última opción con color diferente (cerrar sesión)**

---

## DATOS REQUERIDOS

### Datos de Usuario (del Backend)
- Nombre completo
- Email
- Perfil de consumo activo
- Rol (siempre "usuario")

### Datos de Estadísticas (del Backend)
- Total gastado este mes
- Presupuesto total
- Gastos promedio diario
- Comparativas con mes anterior (porcentajes)
- Última transacción registrada
- Próximas fechas de pago importantes

### Datos para Gráficos (del Backend)
- Gastos diarios (últimas 2 semanas)
- Distribución por categoría (este mes)
- Gastos mensuales (últimos 6 meses)

### Datos de Asesor (del Backend)
- Nombre del asesor asignado
- Foto de perfil del asesor
- Estado de conexión/disponibilidad

### Datos de Alertas (del Backend)
- Lista de alertas activas
- Tipo de alerta (warning, info, success)
- Mensaje descriptivo
- Acción asociada (si aplica)

### Estructura de Datos Esperada
```
{
  "user": {
    "name": "Juan",
    "email": "juan@mail.com",
    "activeProfile": "Drácula",
    "role": "usuario"
  },
  "stats": {
    "totalSpentThisMonth": 2450.50,
    "budgetAvailable": 1549.50,
    "dailyAverage": 78.50,
    "changePercentage": 5,
    "lastTransaction": { ... },
    "nextPayment": { ... }
  },
  "charts": {
    "dailyExpenses": [ { date: "2026-04-12", amount: 150 }, ... ],
    "categoryDistribution": [ { category: "Alimentación", amount: 500 }, ... ],
    "monthlyExpenses": [ { month: "Febrero", amount: 2200 }, ... ]
  },
  "advisor": { name, photo, available },
  "alerts": [ { type, message, action } ]
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
- **Verde:** Para aumentos/positivos (#4caf50)
- **Rojo:** Para disminuciones/alertas (#f44336)

### Tipografía
- **Encabezados:** Poppins o Inter, bold (700)
- **Cuerpo:** Inter o Roboto, regular (400)
- **Tamaños:** H1=32px, H2=24px, H3=18px, Body=16px

### Efectos Visuales
- **Tarjetas:** Borde sutil, sombra en hover
- **Botones:** Fondo principal, transición 0.3s
- **Gráficos:** Líneas/barras suaves, tooltip con fondo oscuro
- **Transiciones:** Fade-in para componentes al cargar

### Tema
- **Modo oscuro por defecto**
- **Alto contraste para accesibilidad**
- **Sin modo claro (opcional: agregar después)**

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
  - Gráficos: 3 en una fila o 2+1
  - Layout: Navbar + Sidebar + Content

- **Tablet:**
  - Sidebar colapsable (icono toggle)
  - Stats cards: 2 columnas
  - Gráficos: stack vertical 2+1 o 1+1+1
  - Fuentes: ligeramente reducidas

- **Móvil:**
  - Sidebar: Offcanvas (hamburguesa)
  - Stats cards: Stack 1 columna
  - Gráficos: Stack vertical
  - Hero: Saludo pequeño, calendario oculto o reducido
  - Footer: Comprimido, sin hover effects

### Comportamiento táctil
- Botones: Mínimo 44x44px
- Offcanvas: Deslizable con gestos
- Gráficos: Tooltips al tap
- Scroll: Suave (no jerárquico)

---

## COMPONENTES REQUERIDOS

### Componentes de Base
- **Button:** Botones de acción (primaria, secundaria)
- **Card:** Contenedores para stats, resúmenes, alertas
- **Modal:** Para chat/contacto con asesor
- **FormInput:** Campos en modal de mensajes
- **Navbar:** Barra superior con notificaciones y perfil

### Componentes Específicos
- **StatsCard:** Tarjeta de estadística con número, cambio %, ícono
- **SummaryCard:** Tarjeta resumen pequeña (última transacción, próximo pago)
- **NotificationCard:** Tarjeta de alerta/notificación
- **ProfileCard:** Card con perfil de consumo activo
- **ConsumptionProfile:** Componente de perfil de gasto
- **ChartComponent:** Wrapper para Chart.js (reutilizable para 3 gráficos)

### Utilidades
- **Sidebar:** Navegación colapsable/offcanvas
- **Toast notifications:** Alertas emergentes
- **Dropdown menu:** Para perfil de usuario
- **Calendar widget:** Calendario interactivo pequeño

---

## FLUJOS DE USUARIO

### Flujo 1: Entrada Principal
1. Usuario inicia sesión (login exitoso)
2. Se redirecciona a `/usuario/dashboard`
3. Carga el dashboard con datos del usuario
4. Ve saludo, stats, gráficos, perfil activo
5. Puede navegar a otras secciones vía sidebar

### Flujo 2: Cargar Nuevo Gasto
1. Usuario clickea "Cargar Gasto" en sidebar o hero
2. Navega a `/usuario/cargar-gasto`
3. Completa formulario
4. Regresa a dashboard (posible modal de éxito)
5. Dashboard se actualiza con nuevo gasto

### Flujo 3: Ver Historial de Gastos
1. Usuario clickea "Historial" en sidebar
2. Navega a `/usuario/historial`
3. Ve lista de transacciones
4. Puede buscar, filtrar, descargar
5. Retorna a dashboard vía back button

### Flujo 4: Contactar Asesor
1. Usuario ve notificación de asesor disponible
2. Clickea "Contactar Asesor" en toast/card
3. Modal se abre con chat
4. Usuario escribe mensaje
5. Envía y modal se actualiza
6. Puede cerrar modal y continuar en dashboard

### Flujo 5: Navegar Perfil de Consumo
1. Usuario ve "Perfil de Consumo" en sección
2. Lee información del perfil activo
3. Clickea "Cambiar perfil"
4. Navega a `/usuario/perfiles`
5. Retorna a dashboard (perfil actualizado)

### Flujo 6: Ver Notificaciones
1. Usuario ve badge de notificación en navbar
2. Clickea icono de campana
3. Panel/página de notificaciones se abre
4. Lee y gestiona notificaciones
5. Retorna a dashboard

---

## NOTAS TÉCNICAS

### Consideraciones de Arquitectura
- **Reutilización:** StatsCard, SummaryCard, Modal, Button usados múltiples veces
- **Estado local:** Usuario autenticado, datos del dashboard en memoria
- **Composición:** Dashboard = Navbar + Sidebar + Hero + Stats + Profile + SummaryCards + Charts + Toast
- **Ciclo de vida:** Fetch datos al montar, actualizar en intervalos (opcional)

### Interacción con Backend
- **GET /usuario/dashboard:** Obtiene todos los datos (user, stats, charts, alerts, advisor)
- **POST /gastos:** Cargar nuevo gasto (desde página separada)
- **GET /notificaciones:** Obtener notificaciones
- **POST /mensajes:** Enviar mensaje a asesor
- **GET /asesor/perfil:** Datos del asesor asignado

### Performance
- Lazy load de gráficos (Chart.js se inicializa solo cuando visible)
- Caché de datos en localStorage (invalidar cuando se carga nuevo gasto)
- Debounce en búsquedas (si aplica)
- Compresión de imágenes de asesor

### Accesibilidad
- Atributos `aria-label` en botones e íconos
- Navegar por teclado (Tab, Enter, Esc)
- Contraste WCAG AA+
- Descripciones en gráficos vía atributos alt

### Seguridad
- Token de sesión en localStorage
- Validación de rol (solo usuario regular)
- HTTPS obligatorio
- Headers de CORS

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Móvil: iOS Safari 14+, Chrome Android 90+

---

## REGLAS DE COMPORTAMIENTO

1. **Al cargar:** Mostrar skeleton loaders mientras se fetch datos
2. **Datos vacíos:** Si no hay gastos, mostrar mensaje "Sin gastos registrados" con CTA
3. **Gráficos:** Actualizar en tiempo real si datos cambian
4. **Notificaciones:** Mostrar toast popup en esquina inferior derecha
5. **Errores:** Mostrar modal o alert con mensaje de error
6. **Timeout:** Si backend tarda >5s, mostrar retry button
7. **Cierre de sesión:** Limpiar localStorage y redirigir a login

---

## METADATA

- **Route:** `/usuario/dashboard`
- **HTTP Methods:** GET (fetch datos), POST (enviar mensajes)
- **Autenticación:** Requerida (rol: usuario)
- **Roles permitidos:** Usuario regular (no asesor)
- **Tema:** Dark mode obligatorio
- **Responsivo:** Sí (mobile-first)

