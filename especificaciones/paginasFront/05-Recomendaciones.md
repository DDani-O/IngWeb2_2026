# Especificación: Recomendaciones Financieras

## DESCRIPCIÓN GENERAL

La página de Recomendaciones Financieras presenta al usuario un conjunto de sugerencias personalizadas emitidas por su asesor financiero. Estas recomendaciones son tácticas específicas para mejorar su gestión de gastos, ahorrar dinero o cambiar hábitos de consumo. Las recomendaciones se agrupan por prioridad (Alta, Media) y presentan de forma clara el problema identificado, la solución propuesta, el ahorro potencial estimado y los pasos de implementación. El usuario puede ver, descartar o marcar recomendaciones como completadas.

**Objetivos principales:**
- Presentar recomendaciones personalizadas del asesor
- Mostrar impacto financiero de cada recomendación
- Facilitar seguimiento de recomendaciones
- Motivar al usuario a implementar cambios
- Permitir interacción (marcar como vista, completada, descartada)

---

## ESTRUCTURA VISUAL

### 1. Barra de Navegación Superior
- **Logo de FinTrack** (clickeable)
- **Breadcrumb:** "Dashboard > Recomendaciones"
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
  - Perfiles de Gasto
  - **Recomendaciones** - actual (resaltado)
  - Configuración
- **Tema:** Consistente

### 3. Sección Header/Título
- **Título principal:** "Mis Recomendaciones Financieras"
- **Subtítulo:** "Sugerencias personalizadas de tu asesor para mejorar tus finanzas"
- **Filtros/Opciones:**
  - Filtro por prioridad: "Todas" (default), "Alta", "Media"
  - Filtro por estado: "Todas" (default), "Pendiente", "En Progreso", "Completada", "Descartada"
  - Ordenamiento: "Más Reciente", "Mayor Ahorro", "Por Prioridad"
- **Contador:** "X recomendaciones totales" o badge con cantidad
- **Tema:** Fondo neutral, texto claro

### 4. Sección de Resumen (Summary Box)
- **Tarjeta destacada con datos agregados:**
  - **"Ahorro Potencial Total":** Suma de todos los ahorros potenciales ($XX,XXX)
  - **"Recomendaciones Activas":** Contador (ej: 5 de 8)
  - **"Completadas Este Mes":** Contador (ej: 3)
  - **"Impacto Estimado":** Porcentaje o monto (ej: "Podrías ahorrar 15% de tu gasto mensual")
- **Tema:** Fondo principal con baja opacidad, números destacados en color primario

### 5. Grupo de Recomendaciones - PRIORIDAD ALTA
- **Encabezado grupal:** "Prioridad Alta" (con ícono de exclamación o fuego)
- **Lista de recomendaciones agrupadas:**

  Para cada recomendación (tarjeta):
  - **Icono de prioridad:** Rojo/naranja brillante
  - **Encabezado:** Título corto de la recomendación (ej: "Reduce gastos en streaming")
  - **Emoji o icono representativo:** Para visualizar rápidamente el tema
  - **Problema identificado:** Descripción breve del problema (1-2 párrafos)
    - Ej: "Notamos que tienes suscripciones activas que no usas regularmente"
  - **Solución propuesta:** Qué se recomienda hacer (1-2 párrafos)
    - Ej: "Te recomendamos cancelar servicios no utilizados y mantener solo los esenciales"
  - **Ahorro potencial:** Monto estimado ($XXX/mes o %)
    - Ej: "💰 Podrías ahorrar: $450/mes"
  - **Pasos de implementación:** Numbered list (3-5 pasos)
    1. Paso 1
    2. Paso 2
    3. Paso 3
  - **Fecha de envío:** "Enviado el 15 de Abril"
  - **Estado/Botones de acción:**
    - Botón "Marcar como Completada" (azul)
    - Botón "Descartar" (gris/secundario)
    - Botón "Ver Detalle Completo" (abre modal si hay más contenido)
  - **Estado actual:** Badge mostrando estado ("Pendiente", "En Progreso", "Completada", "Descartada")

- **Cantidad:** Mostrar todas las recomendaciones de prioridad alta
- **Tema:** Cards con borde izquierdo rojo/naranja, background oscuro

### 6. Grupo de Recomendaciones - PRIORIDAD MEDIA
- **Encabezado grupal:** "Prioridad Media" (con ícono de información)
- **Estructura idéntica a las de prioridad alta**
- **Diferencia visual:** Borde izquierdo amarillo/naranja
- **Cantidad:** Mostrar todas las recomendaciones de prioridad media

### 7. Sección de Recomendaciones Completadas (Opcional)
- **Collapsible section:** "Recomendaciones Completadas"
- **Muestra de últimas 3-5 completadas**
- **Cada una:**
  - Título de la recomendación (tachado o atenuado)
  - Ahorro logrado (con checkmark verde)
  - Fecha completada
- **Botón:** "Ver todas las completadas" (abre página o modal)
- **Tema:** Card con borde verde, texto atenuado

### 8. Sección de Llamada a la Acción
- **Mensaje:** "¿Preguntas sobre estas recomendaciones?"
- **Botón:** "Contactar a tu Asesor" (abre modal de chat o navega a inbox)
- **Tema:** Fondo principal

### 9. Footer
- **Mínimo:** Copyright, enlace a soporte
- **Tema:** Consistente

---

## ELEMENTOS INTERACTIVOS

### Filtros y Ordenamiento
- **Dropdown de prioridad:** Filtra recomendaciones por Alta/Media
- **Dropdown de estado:** Filtra por Pendiente/En Progreso/Completada/Descartada
- **Dropdown de ordenamiento:** Ordena por reciente, mayor ahorro, prioridad
- **Actualización en tiempo real:** Las tarjetas se actualizan al cambiar filtros
- **Contador dinámico:** Se actualiza según filtros aplicados

### Tarjetas de Recomendación
- **Hover:** Sombra elevada, cambio sutil de color
- **Botón "Marcar como Completada":**
  - Actualiza estado a "Completada"
  - Tarjeta se mueve a sección completadas (si no se muestra actualmente)
  - Badge de estado se actualiza
  - Counter de "Completadas Este Mes" aumenta
  - Toast confirma: "¡Recomendación completada!"
- **Botón "Descartar":**
  - Abre modal de confirmación: "¿Descartar esta recomendación?"
  - Si confirma, estado cambia a "Descartada"
  - Tarjeta se quita de la vista (o se atenúa)
  - Toast confirma: "Recomendación descartada"
  - Opción "Deshacer" en el toast
- **Botón "Ver Detalle Completo":**
  - Abre modal con información completa
  - Modal incluye todos los campos de la tarjeta + información adicional (asesor, contexto, enlaces útiles)
  - Botón "Cerrar" cierra modal

### Modal de Detalle Completo
- **Encabezado:** Título de la recomendación
- **Cuerpo:** Información completa (problema, solución, pasos)
- **Asesor responsable:** Nombre y foto del asesor que envió
- **Botones:** "Marcar Completada", "Descartar", "Cerrar"
- **Tema:** Fondo oscuro, texto claro, colores consistentes

### Modal de Contactar Asesor
- **Título:** "Contactar a tu Asesor"
- **Campos:**
  - Asunto (pre-filled: "Pregunta sobre recomendaciones")
  - Mensaje (textarea)
- **Botones:** "Enviar", "Cancelar"
- **Tema:** Consistente con resto de modales

### Sidebar/Navegación
- **Click en item:** Navega a página correspondiente
- **Móvil:** Hamburguesa abre/cierra offcanvas

---

## DATOS REQUERIDOS

### Datos de Usuario (del Backend)
- Nombre completo
- Email
- Rol (usuario)

### Datos de Recomendaciones (del Backend)
- Lista de recomendaciones activas con:
  - ID
  - Título
  - Problema (descripción)
  - Solución (descripción)
  - Prioridad (Alta/Media/Baja)
  - Ahorro potencial (monto o porcentaje)
  - Pasos de implementación (array)
  - Fecha de envío
  - Estado (Pendiente, En Progreso, Completada, Descartada)
  - ID del asesor que la envió
  - Información adicional (contexto, enlaces)

### Datos del Asesor (del Backend)
- Para cada recomendación:
  - Nombre del asesor
  - Foto de perfil del asesor
  - Email de contacto

### Estadísticas (del Backend)
- Ahorro potencial total (suma)
- Total de recomendaciones activas
- Recomendaciones completadas este mes
- Impacto estimado (porcentaje del gasto mensual)

### Estructura de Datos Esperada
```
{
  "user": {
    "name": "Juan",
    "email": "juan@mail.com",
    "role": "usuario"
  },
  "stats": {
    "totalSavingsPotential": 3500.75,
    "activeRecommendations": 5,
    "completedThisMonth": 3,
    "estimatedImpact": "15%"
  },
  "recommendations": [
    {
      "id": 1,
      "title": "Reduce gastos en streaming",
      "problem": "Notamos que tienes suscripciones activas...",
      "solution": "Te recomendamos cancelar servicios...",
      "priority": "Alta",
      "savingsPotential": 450,
      "implementationSteps": ["Paso 1", "Paso 2", "Paso 3"],
      "dateSent": "2026-04-15",
      "status": "Pendiente",
      "advisorId": 5,
      "advisorName": "Carlos Gómez",
      "advisorPhoto": "url",
      "advisorEmail": "carlos@advisor.com",
      "additionalInfo": "..."
    },
    { /* más recomendaciones */ }
  ],
  "completedRecommendations": [
    { id, title, savingsAchieved, completedDate },
    { /* más completadas */ }
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
- **Prioridad Alta:** Rojo (#f44336) o Naranja (#ff6b6b)
- **Prioridad Media:** Amarillo (#ffb74d) u Naranja claro (#ff9800)
- **Prioridad Baja:** Gris (#9e9e9e)
- **Completada:** Verde (#4caf50)
- **Descartada:** Gris oscuro (#616161)

### Tipografía
- **Encabezados:** Poppins, bold (700)
- **Cuerpo:** Inter, regular (400)
- **Tamaños:** H1=32px, H2=24px, H3=18px, Body=16px, Small=14px

### Efectos Visuales
- **Tarjetas:** Borde izquierdo coloreado (según prioridad), sombra
- **Botones:** Color principal, transición suave
- **Badges de estado:** Colores según prioridad/estado
- **Hover:** Tarjetas se elevan, sombra aumenta
- **Transiciones:** Suaves (0.3s)

### Tema
- **Modo oscuro obligatorio**
- **Alto contraste para accesibilidad**
- **Colores de prioridad diferenciados**

---

## COMPORTAMIENTO RESPONSIVO

### Breakpoints
- **Desktop:** ≥992px
- **Tablet:** 768px - 991px
- **Móvil:** <768px

### Adaptaciones
- **Desktop:**
  - Sidebar fija a la izquierda
  - Filtros en row horizontal
  - Tarjetas de recomendación full-width
  - Summary box prominente

- **Tablet:**
  - Sidebar colapsable
  - Filtros en row horizontal (o stackeados si espacio)
  - Tarjetas full-width pero con padding reducido
  - Fuentes ligeramente reducidas

- **Móvil:**
  - Sidebar: Offcanvas (hamburguesa)
  - Filtros: Stack vertical o dropdown para ahorrar espacio
  - Tarjetas: Full-width, padding comprimido
  - Summary box: Reducida a 2 o 1 fila de datos
  - Botones: Stack vertical
  - Pasos: Listados verticalmente sin números de columna

### Comportamiento táctil
- Botones: Mínimo 44x44px
- Offcanvas: Deslizable con gestos
- Filtros: Dropdown facilita selección táctil
- Modales: Tamaño 90% viewport en móvil
- Cards: Tap para ver detalles (opcional)

---

## COMPONENTES REQUERIDOS

### Componentes de Base
- **Button:** Acciones primaria, secundaria
- **Card:** Contenedores para recomendaciones, summary
- **Modal:** Detalle completo, contactar asesor
- **FormInput:** Campos en modal de contacto
- **Navbar:** Barra superior
- **Sidebar:** Navegación lateral

### Componentes Específicos
- **RecommendationCard:** Tarjeta de recomendación (con problema, solución, ahorro, pasos, botones)
- **SummaryCard:** Card de resumen de ahorros y estadísticas
- **PriorityBadge:** Badge visual de prioridad
- **StatusBadge:** Badge visual de estado
- **RecommendationGroup:** Agrupador de recomendaciones por prioridad

### Utilidades
- **Toast notifications:** Confirmación de acciones
- **Badges:** Estado, prioridad
- **Icons:** Font Awesome para prioridades
- **Dropdowns:** Para filtros y ordenamiento
- **Modal:** Para detalles y contacto

---

## FLUJOS DE USUARIO

### Flujo 1: Ver Recomendaciones
1. Usuario navega a `/usuario/recomendaciones`
2. Carga la página con todas las recomendaciones
3. Ve summary box con estadísticas
4. Ve lista de recomendaciones agrupadas por prioridad
5. Lee título, problema, solución, ahorro potencial
6. Ve pasos de implementación

### Flujo 2: Filtrar y Ordenar
1. Usuario selecciona filtro de prioridad (ej: "Alta")
2. Tarjetas se actualizan mostrando solo alta prioridad
3. Selecciona filtro de estado (ej: "Pendiente")
4. Tarjetas se actualizan nuevamente
5. Selecciona ordenamiento (ej: "Mayor Ahorro")
6. Orden de tarjetas cambia
7. Counter se actualiza dinámicamente

### Flujo 3: Marcar Recomendación Completada
1. Usuario lee una recomendación
2. Implementa los pasos sugeridos
3. Clickea "Marcar como Completada"
4. Estado cambia a "Completada"
5. Tarjeta se mueve a sección completadas (o se atenúa)
6. Toast confirma: "¡Recomendación completada!"
7. Counter "Completadas Este Mes" aumenta

### Flujo 4: Descartar Recomendación
1. Usuario decide que no quiere implementar una recomendación
2. Clickea "Descartar"
3. Modal de confirmación aparece
4. Usuario confirma
5. Estado cambia a "Descartada"
6. Tarjeta desaparece de vistas activas
7. Toast muestra con opción "Deshacer"

### Flujo 5: Ver Detalles Completos
1. Usuario quiere más información sobre una recomendación
2. Clickea "Ver Detalle Completo"
3. Modal abre con información extendida
4. Incluye nombre del asesor, contexto adicional, enlaces útiles
5. Puede marcar completada o descartar desde el modal
6. Cierra modal

### Flujo 6: Contactar Asesor
1. Usuario tiene pregunta sobre recomendaciones
2. Clickea "Contactar a tu Asesor"
3. Modal se abre con campo de mensaje
4. Escribe su pregunta
5. Clickea "Enviar"
6. Mensaje se registra en inbox del asesor
7. Toast confirma envío
8. Modal se cierra

---

## NOTAS TÉCNICAS

### Consideraciones de Arquitectura
- **Reutilización:** Button, Card, Modal, Badge usados múltiples veces
- **Estado local:** Filtros seleccionados, recomendaciones mostradas
- **Composición:** Page = Navbar + Sidebar + Header + Filters + SummaryBox + RecommendationGroups + CTA + Footer
- **Ciclo de vida:** Fetch datos al montar, actualizar estado local cuando se marca completada/descartada

### Interacción con Backend
- **GET /usuario/recomendaciones:** Obtiene lista de recomendaciones del usuario
- **PUT /recomendaciones/:id:** Actualiza estado de recomendación (body: { status: "Completada" | "Descartada" })
- **POST /mensajes:** Envía mensaje de contacto a asesor
- **Respuesta:** { success: true, updatedRecommendation: { ... } }

### Performance
- Lazy load de tarjetas (si hay muchas)
- Caché de datos en localStorage
- Actualización UI inmediata (optimistic update)
- Sincronización con backend en background

### Accesibilidad
- Atributos `aria-label` en botones
- Navegación por teclado (Tab, Enter, Esc)
- Contraste WCAG AA+
- Descripciones claras de recomendaciones

### Seguridad
- Token de sesión requerido
- Validación de rol (solo usuario regular)
- HTTPS obligatorio
- CORS headers
- Validación de entrada en formularios

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Móvil: iOS Safari 14+, Chrome Android 90+

---

## REGLAS DE COMPORTAMIENTO

1. **Al cargar:** Mostrar todas las recomendaciones agrupadas por prioridad
2. **Filtros por defecto:** "Todas" (prioridad), "Todas" (estado), "Más Reciente" (ordenamiento)
3. **Actualización inmediata:** UI se actualiza al marcar completada/descartar (optimistic update)
4. **Sincronización backend:** Enviar cambios al servidor en background
5. **Deshacer:** Si marca completada/descartada, puede deshacer con botón en toast (10s)
6. **Validación:** No permitir acciones inválidas (ej: marcar descartada como completada)
7. **Errores:** Si falla la actualización, mostrar modal con retry

---

## METADATA

- **Route:** `/usuario/recomendaciones`
- **HTTP Methods:** GET (fetch recomendaciones), PUT (actualizar estado), POST (enviar mensaje)
- **Autenticación:** Requerida (rol: usuario)
- **Roles permitidos:** Usuario regular (no asesor)
- **Tema:** Dark mode obligatorio
- **Responsivo:** Sí (mobile-first)

