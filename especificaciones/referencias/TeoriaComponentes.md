# Referencia teórica — Componentes y routing (material de Ingeniería Web)

Extracto del material de estudio de la materia. Los ejemplos originales están en Vue/React; el proyecto usa **JS vanilla**, así que los conceptos deben trasladarse (props → opciones del constructor/`mount`, eventos → callbacks o `CustomEvent`, slots/children → puntos de inserción de contenido).

## 1. Qué es un componente

- Un componente es una **pieza independiente de interfaz que puede reutilizarse muchas veces** dentro de la aplicación: botón, tarjeta, tabla, formulario, barra de navegación, modal o una pantalla entera. La diferencia entre un botón y una navbar es tamaño y complejidad, no naturaleza.
- Problema que resuelve (el monolito): copiar el mismo elemento en varias pantallas obliga a modificarlo N veces cuando cambia el diseño. Con un único componente, el cambio se hace una vez y toda la app lo hereda.
- Beneficios: reutilización, menos duplicación, mantenimiento, escalabilidad, testing de piezas aisladas, trabajo en equipo sin pisarse. Analogía: piezas de LEGO.

## 2. Responsabilidad única (SRP)

- Un componente hace **una sola cosa**. Un `DashboardButtonUserCardNavbar` que hace de todo no es un componente, es un problema.
- Diagnóstico: si al explicar qué hace hay que decir "y además…", tiene demasiadas responsabilidades. Criterios numéricos (líneas, cantidad de props) son síntomas posibles, no el criterio.

## 3. La pantalla es una ilusión: composición

- No se diseñan pantallas enteras: una pantalla es la **composición** de piezas simples (Login = Logo + FormContainer con dos Input y un Button).

## 4. Atomic Design

| Nivel | Qué es | Ejemplos |
|---|---|---|
| Átomos | Pieza más chica e indivisible | Button, Input, Label, Icon, Checkbox |
| Moléculas | Grupo chico de átomos con una función concreta | InputEmail (Label + Input + Error), SearchBar |
| Organismos | Secciones completas y autónomas | LoginForm, Navbar, ProductCard |
| Templates | Esqueleto de la pantalla, sin datos reales | AuthLayout, DashboardLayout |
| Pages | Pantalla final con datos reales | Página de Login |

Una molécula es un grupo funcional mínimo; un organismo puede ocupar por sí solo una región de la pantalla.

## 5. Comunicación: datos bajan, avisos suben

- **Padre → hijo: props.** Entrada de datos, como argumentos de una función. Solo lectura: el hijo nunca las modifica.
- **Hijo → padre: eventos.** El hijo avisa que pasó algo; el padre, dueño del dato, decide qué hacer (Vue `emit`, React callback).
- **Contenido arbitrario: slots / children** para inyectar marcado dentro de un componente (`<Card><Button/></Card>`).
- Si el hijo necesita "cambiar" una prop, no la toca: emite un evento. Copiar la prop a una variable local crea una segunda fuente de verdad que se desincroniza.

Ejemplo de referencia (React): el Modal no decide si está abierto; lo decide el padre con `open`, y el hijo pide cerrarse con `onClose`.

```jsx
function Button({ text, variant = 'primary', disabled = false, onClick }) {
  return <button className={variant} disabled={disabled} onClick={onClick}>{text}</button>
}
// padre
<Button text="Abrir" onClick={() => setAbierto(true)} />
<Modal open={abierto} title="Aviso" onClose={() => setAbierto(false)}>Contenido</Modal>
```

## 6. Props: buenas y malas prácticas

| Buenas | Malas |
|---|---|
| Props chicas y tipadas | Props ambiguas: `data`, `info`, `obj`, `values` |
| Nombres descriptivos | Sobrecarga de datos que no se usan |
| Valores por defecto definidos | Imposible deducir qué necesita el componente |

## 7. Diagnóstico arquitectónico

| Buen diseño | Error |
|---|---|
| Pequeño y predecible | Componentes gigantes |
| Solo presentación | Lógica de negocio mezclada |
| Reutilizable e independiente | Duplicar componentes similares |
| **Agnóstico al contexto** | **Componentes demasiado específicos** |
| Props explícitas y claras | Demasiadas props acopladas |
| Arquitectura desacoplada | Acoplar componentes entre sí |

Otro error: no reutilizar componentes que ya existen.

Flujo de diseño: primero se define la **API pública** (responsabilidad, props, eventos), después se implementa.

## 8. Datos y servicios

- Un componente no debería saber de dónde vienen los datos, solo cómo mostrarlos.
- Anti-patrón: llamadas a la API y lógica de negocio dentro del componente de vista. Estándar: centralizar el acceso a datos en servicios (`services/`). Prueba de buena separación: reemplazar el backend (mock → real) cambiando solo el servicio, sin tocar componentes.

## 9. Routing, layouts y guards (SPA)

- El router responde una sola pregunta: **según la URL actual, qué componente renderizo**. Rutas públicas, protegidas y siempre una ruta 404.
- Layout = estructura estática reutilizable que envuelve rutas hijas (DashboardLayout con navbar/sidebar, AuthLayout). Si navbar/sidebar/footer se copian en todas las pantallas, falta un layout. El layout se monta una vez y solo cambia el contenido interior (`<RouterView>` / `<Outlet>`).
- Rutas dinámicas: parámetros en la URL (`/products/:id`).
- Navegación declarativa (enlaces) y programática (tras una acción, p. ej. login).
- Guards: se decide de forma centralizada antes de entrar a la ruta (requiere auth, requiere rol). Un guard es experiencia de usuario, no seguridad: la seguridad la impone el backend validando el token.
- Restauración de sesión: si el guard evalúa antes de restaurar la sesión desde `localStorage`, expulsa a quien sí tenía sesión.
