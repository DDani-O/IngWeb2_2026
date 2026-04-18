# Especificación: Landing Page (Página de Inicio)

## DESCRIPCIÓN GENERAL

La Landing Page es la puerta de entrada a la plataforma FinTrack. Sirve como página pública que presenta el servicio a nuevos usuarios, destacando propuestas de valor, ventajas competitivas, testimonios de clientes satisfechos y planes de precios. Incluye acceso a formularios de login y registro, permitiendo que nuevos usuarios se registren como usuarios regulares o asesores financieros.

**Ubicación técnica (implementación actual):** la landing se implementa directamente en `frontend/index.html` (shell principal) y su orquestación de navegación/eventos está en `frontend/app.js`. No se usa carpeta `pages/public`.

**Objetivos principales:**
- Informar sobre las características y beneficios de la plataforma
- Captar nuevos usuarios (usuarios regulares y asesores)
- Dirigir usuarios existentes al login
- Generar confianza a través de testimonios y propuestas claras

---

## ESTRUCTURA VISUAL

### 1. Barra de Navegación Superior
- **Logo de FinTrack** (clickeable, enlace a inicio)
- **Menú de navegación** con opciones:
  - Inicio
  - Características
  - Ventajas
  - Planes
  - Testimonios
- **Botones de autenticación** (lado derecho):
  - Botón "Ingresar" (abre modal de login)
  - Botón "Registrarse" (abre modal de registro)
- **Tema:** Navbar oscura (color primario) con logo/texto en color principal (turquesa/cyan)

### 2. Sección Hero
- **Eslogan principal:** Título grande llamativo sobre la propuesta de valor
- **Subtítulo descriptivo:** Breve explicación del beneficio principal
- **Imagen o video de fondo:** Representación visual de gestión financiera
- **Botón CTA primario:** "Comenzar Gratis" o similar (abre modal de registro)
- **Botón CTA secundario:** "Ver Características" (scroll a sección de features)
- **Tema:** Fondo degradado o imagen, texto blanco/claro, alto contraste

### 3. Carrusel de Marcas/Partners
- **Título:** "Confían en FinTrack"
- **Carrusel con logos** de empresas o instituciones (mock data inicial)
- **Logos rotan** o se pueden navegar con flechas
- **Tema:** Fondo neutral, logos en escala de grises

### 4. Sección de Características
- **Título de sección:** "Características Principales"
- **Subtítulo:** Descripción breve de lo que ofrece
- **Grid de 4-6 tarjetas de características**, cada una con:
  - Icono representativo (Font Awesome)
  - Título corto
  - Descripción breve (2-3 líneas)
  - Tema: Fondo oscuro, bordes sutiles, icono en color principal
- **Distribución:** Responsive (3 columnas en desktop, 2 en tablet, 1 en móvil)

### 5. Sección de Ventajas
- **Título:** "¿Por qué elegir FinTrack?"
- **Estructura alternada** (texto-imagen, imagen-texto) con 3 ventajas principales
- **Cada ventaja contiene:**
  - Titulo descriptivo
  - Párrafo explicativo (2-4 líneas)
  - Puntos clave en lista (3-4 items)
  - Imagen o ícono grande ilustrativo
- **Tema:** Fondo alterno (oscuro/ligeramente más claro), buen contraste

### 6. Sección de Testimonios
- **Título:** "Lo que dicen nuestros usuarios"
- **Carrusel o grid** de tarjetas de testimonios (3-4 visibles)
- **Cada tarjeta incluye:**
  - Foto de perfil del usuario (circular)
  - Nombre y rol/profesión
  - Rating en estrellas (1-5)
  - Texto del testimonio (2-3 líneas)
  - Cita destacada o comentario
- **Navegación:** Botones anterior/siguiente o puntos indicadores
- **Tema:** Tarjetas con borde sutil, fondo semitransparente

### 7. Sección de Planes/Precios
- **Título:** "Planes y Precios"
- **Subtítulo:** "Elige el plan que mejor se adapte a tus necesidades"
- **Grid de 3 tarjetas de precios:**
  - Plan 1 (Básico/Gratuito)
  - Plan 2 (Pro/Estándar) - **Destacado como recomendado**
  - Plan 3 (Premium/Empresarial)
- **Cada tarjeta incluye:**
  - Nombre del plan
  - Precio mensual (o "Gratis")
  - Descripción corta del plan
  - Lista de características incluidas (5-7 items)
  - Botón CTA para contratar/registrarse
  - Insignia de "Más Popular" (si aplica)
- **Tema:** Plan recomendado con borde destacado en color principal, otros más sutiles

### 8. Sección de Llamada a la Acción (CTA)
- **Fondo:** Color principal o gradiente destacado
- **Contenido:**
  - Título motivador
  - Subtítulo breve
  - Dos botones CTA: "Registrarse Ahora" y "Ver Demostración"
- **Tema:** Alto contraste, botones grandes, fácilmente clickeables

### 9. Footer
- **Estructura de 4 columnas:**
  - **Columna 1:** Logo + descripción breve de la empresa + redes sociales
  - **Columna 2:** Enlaces de producto (Features, Pricing, Security)
  - **Columna 3:** Enlaces de empresa (Sobre nosotros, Blog, Careers)
  - **Columna 4:** Enlaces legales (Privacidad, Términos, Contacto)
- **Pie:** Copyright, año actual, derechos reservados
- **Tema:** Fondo muy oscuro, texto en gris claro, enlaces en color principal

---

## ELEMENTOS INTERACTIVOS

### Modal de Login
- **Campos:**
  - Email (input type="email")
  - Contraseña (input type="password")
- **Opciones:**
  - "Recuerda mis datos" (checkbox)
  - "¿Olvidaste tu contraseña?" (enlace)
- **Botones:**
  - "Ingresar" (submit, color principal)
  - "Cancelar" (cierra modal)
- **Footer del modal:** "¿No tienes cuenta?" + enlace a registro

### Modal de Registro
- **Tres opciones de tipo de usuario:**
  - Usuario Regular (radio button)
  - Asesor Financiero (radio button)
  - (Selector determina qué formulario se muestra)
- **Campos para Usuario Regular:**
  - Nombre completo
  - Email
  - Contraseña
  - Confirmar contraseña
  - Aceptar términos (checkbox)
- **Campos para Asesor:**
  - Nombre completo
  - Email profesional
  - Contraseña
  - Confirmar contraseña
  - Número de cédula profesional
  - Área de especialización (dropdown)
  - Aceptar términos (checkbox)
- **Botones:**
  - "Registrarse" (submit, color principal)
  - "Cancelar" (cierra modal)
- **Footer del modal:** "¿Ya tienes cuenta?" + enlace a login

### Acciones en Botones
- **"Comenzar Gratis":** Abre modal de registro con opción "Usuario Regular" preseleccionada
- **"Ingresar":** Abre modal de login
- **"Registrarse":** Abre modal de registro
- **Scroll automático:** Menú clickeable navega a secciones correspondientes
- **Navegación modal:** Cerrar modal = Esc key o botón X

---

## DATOS REQUERIDOS

### Datos Estáticos (Hardcodeados o en config)
- Textos de propuestas de valor
- Descripción de características (título, descripción, ícono)
- Información de ventajas (textos, puntos clave)
- Descripciones de planes (nombre, precio, features)
- Enlaces de redes sociales
- Enlaces footer

### Datos Dinámicos (Mock o Backend)
- **Carrusel de marcas:** Array de logos + nombres
- **Testimonios:** Array de objetos con: nombre, rol, rating, texto
- **Precios:** Objeto con datos de planes (name, price, features, highlighted)

### Estructura de Datos Esperada (JSON)
```
{
  "features": [
    { "icon": "fas fa-...", "title": "...", "description": "..." }
  ],
  "testimonials": [
    { "name": "...", "role": "...", "rating": 5, "text": "..." }
  ],
  "plans": [
    { "name": "...", "price": "...", "features": [...], "highlighted": false }
  ],
  "brands": [
    { "name": "...", "logo": "url" }
  ]
}
```

---

## ESTILOS Y TEMA

### Paleta de Colores
- **Color Primario:** Turquesa/Cyan (#00BCD4 o similar)
- **Color Oscuro Principal:** Casi negro (#1a1a1a o #0d0d0d)
- **Color Gris Claro:** Para texto secundario (#b0b0b0 o #c0c0c0)
- **Color Blanco:** Para texto principal (#ffffff)
- **Colores Acentos:** Verde para éxito, rojo para alertas

### Tipografía
- **Encabezados:** Fuente sans-serif moderna (Poppins o Inter)
- **Cuerpo:** Fuente sans-serif legible (Inter o Roboto)
- **Tamaños:** H1=48px, H2=36px, H3=24px, Body=16px
- **Peso:** Encabezados bold/700, cuerpo regular/400

### Efectos Visuales
- **Hover en botones:** Cambio de color + sombra, transición suave (0.3s)
- **Hover en tarjetas:** Elevación sutil (box-shadow), escala ligera (1.02x)
- **Transiciones:** Suaves (ease-in-out, 300-500ms)
- **Bordes redondeados:** Tarjetas 8px, botones 6px
- **Sombras:** Sutiles, oscuras, para profundidad

### Tema Oscuro
- La Landing Page usa tema oscuro por defecto
- Alto contraste para accesibilidad
- Fondos degradados sutiles para profundidad
- Sin tema claro (solo oscuro)

---

## COMPORTAMIENTO RESPONSIVO

### Breakpoints
- **Desktop:** ≥992px (3 columnas para grillas)
- **Tablet:** 768px - 991px (2 columnas, fonts ajustadas)
- **Móvil:** <768px (1 columna, fonts reducidos, padding menor)

### Adaptaciones por dispositivo
- **Hero:** Fuente reducida en móvil, imagen de fondo responsiva
- **Carruseles:** Touchable en móvil, teclado en desktop
- **Modales:** Ancho 90% en móvil, 500px en desktop
- **Navbar:** Menú hamburguesa en móvil (<992px), menú expandido en desktop
- **Footer:** Columnas reordenadas a 1-2 columnas en móvil

### Comportamiento táctil
- Botones: Mínimo 44x44px para toque
- Espaciado: Mayor padding en móvil para facilitar navegación
- Carruseles: Deslizable con gestos (swipe)

---

## COMPONENTES REQUERIDOS

### Componentes de Base
- **Button:** Botones de acción (primario, secundario, tamaños)
- **Card:** Tarjetas para características, testimonios, planes
- **Modal:** Modales para login y registro
- **FormInput:** Campos de formulario (email, password, text, select)
- **SectionHeader:** Encabezados de secciones con título y subtítulo

### Componentes Específicos
- **FeatureCard:** Tarjeta con ícono, título y descripción
- **TestimonialCard:** Tarjeta con foto, nombre, rating y texto
- **PricingCard:** Tarjeta de plan con precio, features y botón CTA
- **Carousel/Slider:** Carrusel para marcas y testimonios
- **SocialButtons:** Botones de redes sociales en footer

### Utilidades
- **Navegación suave:** Scroll a secciones vía anclas
- **Validación de formularios:** Email válido, contraseñas coinciden, campos requeridos
- **Gestos táctiles:** Soporte para swipe en carruseles (móvil)

---

## FLUJOS DE USUARIO

### Flujo 1: Nuevo Usuario Regular
1. Llega a Landing Page
2. Lee características y testimonios
3. Clickea "Comenzar Gratis"
4. Completa modal de registro como "Usuario Regular"
5. Registra email, nombre, contraseña
6. Acepta términos y condiciones
7. Clickea "Registrarse"
8. (Post-registro: redirección a dashboard de usuario)

### Flujo 2: Nuevo Asesor
1. Llega a Landing Page
2. Lee información de planes
3. Selecciona plan Pro/Premium
4. Clickea botón de suscripción
5. Modal abre con opción de "Asesor Financiero"
6. Completa formulario con datos profesionales
7. Confirma y se registra
8. (Post-registro: redirección a onboarding de asesor)

### Flujo 3: Usuario Existente
1. Llega a Landing Page
2. Clickea "Ingresar"
3. Completa modal de login
4. Ingresa email y contraseña
5. (Post-login: redirección a dashboard según rol)

### Flujo 4: Navegación Interna
1. Usuario clickea en menú (Características, Ventajas, etc.)
2. Página hace scroll automático a sección correspondiente
3. Usuario lee contenido
4. Retorna a menú o scroll a siguiente sección

---

## NOTAS TÉCNICAS

### Consideraciones de Arquitectura
- **Reutilización de componentes:** Button, Card, Modal, FormInput usados en múltiples secciones
- **Composición:** FeatureCard = Card + Icon + Text; TestimonialCard = Card + Avatar + Rating + Text
- **Estado local:** Modal abierto/cerrado, tipo de usuario seleccionado en registro
- **Sin persistencia:** Landing Page no requiere guardado en localStorage (excepto preferencias de usuario logueado)

### Interacción con Backend
- **Login:** POST /auth/login (email, password) → Token + User data
- **Registro Usuario:** POST /auth/register/user (email, password, name) → Token + User data
- **Registro Asesor:** POST /auth/register/advisor (email, password, name, cedula, specialty) → Token + User data
- **Validaciones frontend:** Email formato válido, contraseña longitud mínima
- **Errores esperados:** Email duplicado, credenciales inválidas, servidor no disponible

### Performance
- Lazy load de imágenes (especialmente en sección de ventajas)
- Carrusel optim. para reducir repaints
- Estilos compilados a single CSS file
- Modales: DOM elementos creados pero hidden (no removidos)

### Accesibilidad
- Atributos `aria-label` en botones e iconos
- Navegación por teclado (Tab, Enter, Esc)
- Contraste de colores cumple WCAG AA
- Textos descriptivos en formarios (labels)

### Seguridad
- Contraseñas no se guardan en localStorage (solo token)
- HTTPS obligatorio para login/registro
- CSRF tokens en formularios (si backend lo requiere)
- XSS protection: sanitizar inputs

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Móvil: iOS Safari 14+, Chrome Android 90+

---

## REGLAS DE COMPORTAMIENTO

1. **Al cargar la página:** Mostrar navbar + hero, el resto en scroll
2. **Al hacer click en "Ingresar":** Abrir modal de login, no navegar
3. **Al hacer click en "Registrarse":** Abrir modal de registro, no navegar
4. **Al cerrar modal:** Mantener scroll en el lugar (no saltar a top)
5. **En móvil:** Menú hamburguesa en navbar, carruseles touchables
6. **Validación:** Mostrar errores en tiempo real en formularios
7. **Redirección post-autenticación:** Depende del rol (usuario → /usuario/dashboard, asesor → /asesor/dashboard)

---

## METADATA

- **Route:** `/` (raíz)
- **HTTP Method:** GET (solo lectura)
- **Autenticación:** No requerida (página pública)
- **Roles permitidos:** Cualquiera (incluyendo no autenticados)
- **Tema:** Dark mode por defecto
- **Responsivo:** Sí (mobile-first)

