# Especificación: Perfiles de Gasto

> Reescrita en la Fase 0 del refactor (ver `../DiagnosticoRefactor.md` §6, decisión 2). El perfil de gasto lo **asigna el sistema automáticamente**. El cliente no puede elegirlo ni se le presenta otro perfil como meta a alcanzar. Se eliminaron el botón "Seleccionar este perfil", las guías "Cómo llegar a ser…" y la sección "¿Querés cambiar de perfil?".

## DESCRIPCIÓN GENERAL

Página informativa con los 3 perfiles de consumo que usa FinTrack (extra opcional 16 de la consigna, "Perfil financiero del usuario"). Muestra cuál es el perfil asignado al cliente y explica cómo se asigna.

## ESTRUCTURA VISUAL

1. **Navbar y sidebar** del cliente (layout compartido).
2. **Encabezado:** "Conoce tus Perfiles" y el texto "FinTrack te asigna uno automáticamente a partir de tus gastos".
3. **Tarjetas de perfil** (una por perfil, apiladas): emoji, nombre, frase, descripción y lista de características. La tarjeta del perfil asignado se resalta (`profile-card--active`) y muestra el badge "Tu perfil actual, asignado automáticamente". No hay botones de selección.
4. **Tabla comparativa:** ratio de ahorro, control de gastos, flexibilidad, riesgo financiero y diversión, una columna por perfil.
5. **"Cómo se asigna tu perfil":** texto que explica que el sistema analiza las categorías, montos y frecuencia de los gastos y actualiza el perfil solo. Botones "Volver a mi Dashboard" y "Ver Recomendaciones" (pestaña nueva).

## DATOS

- **Perfil asignado al cliente:** tabla `clasificacion_de_perfil` (registro vigente del cliente), con `perfil_id` → `perfiles_de_gasto`. Lo calcula el backend con `perfiles_de_gasto.criterio_regla`.
- **Catálogo de perfiles:** `perfiles_de_gasto` (nombre, descripción). El contenido visual (emoji, frase, características, comparativa) es estático del front.

## INTERACCIÓN CON EL BACKEND

- `GET /spending-profiles` — catálogo.
- `GET /auth/me` — el perfil vigente viene en `perfil_cliente.perfil_de_gasto`.

No hay endpoints de escritura: el cliente no modifica su perfil. La regla de asignación está en la spec general §10.6.

## METADATA

- **Ruta:** `#/cliente/perfiles`
- **Autenticación:** requerida (rol `cliente`)
- **Responsive:** sí
