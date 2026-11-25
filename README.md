# FinTrack 2026

## 1) Resumen de la app

FinTrack es una aplicacion web para educacion y acompanamiento financiero.

- Perfil cliente: registra gastos (manual o por ticket), ve su historial, patrones de consumo, el perfil de gasto que le asigna el sistema y las recomendaciones que recibe.
- Perfil asesor: monitorea a sus clientes, revisa indicadores y les envia recomendaciones.
- Objetivo: ayudar a mejorar habitos financieros con una experiencia clara, guiada y centrada en acciones concretas.

## 2) Como funciona el frontend

El frontend esta construido como una SPA (Single Page Application) con JavaScript modular y enrutamiento por hash.

- Entrada principal: `index.html` carga la landing publica, modales de autenticacion y el bootstrap de la app.
- Navegacion: el router interpreta rutas tipo `#/...` y carga la vista correspondiente sin recargar toda la pagina.
- Control de acceso por rol:
	- Cliente (`#/cliente/*`): dashboard, carga de gastos, historial, patrones, recomendaciones, perfil de cuenta y perfiles de gasto.
	- Asesor (`#/asesor/*`): dashboard, clientes y perfil del asesor.
- Autenticacion actual: mock (simulada), con persistencia de sesion en `localStorage`.
- Datos actuales: mock (simulados), preparados para conectar un backend real despues.

Flujo general:

1. Se abre la landing.
2. El usuario inicia sesion o se registra en modal.
3. La app valida credenciales y rol.
4. Redirige a la ruta protegida correspondiente.
5. Cada pantalla monta su logica de interaccion (filtros, acciones, graficos, modales, etc.).

## 3) Como levantar y testear el frontend (paso a paso)

Importante: no abras `index.html` directamente con `file://`. Debe ejecutarse con servidor HTTP local.

### Opcion A: Python (recomendada)

1. Abre una terminal.
2. Entra a la carpeta del frontend:

```bash
cd frontend
```

3. Inicia un servidor local:

```bash
python3 -m http.server 5500
```

4. Deja esa terminal abierta.
5. Abre el navegador y entra a:

```text
http://localhost:5500
```

6. Verifica que cargue la landing.

### Opcion B: Node (si no tienes Python)

1. Abre una terminal y entra a `frontend`.
2. Ejecuta:

```bash
npx serve -l 5500 .
```

3. Abre:

```text
http://localhost:5500
```

### Credenciales de prueba

- Cliente:
	- correo: `cliente@fintrack.local`
	- clave: `Fintrack2026*`
- Asesor:
	- correo: `asesor@fintrack.local`
	- clave: `Fintrack2026*`

### Checklist rapido de testing manual

1. Landing carga correctamente.
2. Modal de login abre y cierra sin errores.
3. Login de cliente redirige a `#/cliente/dashboard`.
4. Login de asesor redirige a dashboard de asesor.
5. Sin sesion, rutas protegidas redirigen al inicio/login.
6. En recomendaciones: probar filtros, "Marcar como leida" y "Ver detalle".
7. En perfil de cuenta: editar datos y tema, guardar y confirmar persistencia al recargar. Perfiles de gasto es solo informativa (sin seleccion).
8. Probar logout y confirmar regreso a landing.
9. Una ruta inexistente (p. ej. `#/no-existe`) muestra "Ruta no encontrada" y "Volver Atras" regresa a la pagina anterior.

### Como detener el servidor

- En la terminal donde corre el servidor, presiona `Ctrl + C`.

