# Faltantes de Backend - FinTrack

Fecha: 2026-05-18
Contexto: integracion frontend-backend local (backend :3000, frontend :5500). Este listado resume funcionalidades del frontend que aun usan mock o requieren nuevos endpoints.

## Funcionalidades sin endpoint
1) Asignacion de clientes para el asesor. Actualizar el dashboard del asesor con los datos reales de la bd de cada cliente que le fue asignado.

2) Patrones de consumo / analitica
- UI: /usuario/patrones
- Esperado: GET /users/me/consumption-analysis (highlights, stats, category distribution, monthly evolution, unusual expenses)
- BD: tabla analisis_de_consumo existe
- Estado: no hay endpoint ni calculo agregado
- Actualizar el dashboard del cliente con los datos reales de la bd

3) Editar BD de perfil_asesor: telefono, clientes activos (no debe ser editable si no que lo debe traer de conta rla cantidad de asignaciones que tiene en la BD), capacidad máxima (debe ser editable), pais
    Sincronizar la informacion mostrada en edicion de perfil de asesor con los datos reales de la BD, eliminando campos inutiles como anos de experiencia

4) OCR de tickets
- UI: /usuario/cargar-gasto (boton "Analizar ticket")
- Esperado: POST /tickets/upload (multipart/form-data), subir a storage, Gemini OCR, crear gasto, retornar 202 con ticketId/estado
- Estado: no existe modulo/endpoint tickets en backend

5) Perfiles de gasto (spending profiles)
- UI: /usuario/perfiles
- Esperado: GET /spending-profiles (listado de perfiles), GET /users/me/profile (perfil activo), PATCH /users/me/profile (cambiar perfil)
- BD: tablas perfiles_de_gasto, clasificacion_de_perfil existen
- Estado: no hay endpoints ni servicios

6) Estado de recomendaciones para cliente
- UI: /usuario/recomendaciones (acciones "Marcar completada" / "Descartar")
- Esperado: PATCH /users/me/recommendations/:id (status, read)
- Estado: solo GET /users/me/recommendations; no endpoint para actualizar

7) Los perfiles son asignados por el asesor y el usuario no puede establecerlo para si mismo. Se debe modificar el dashboard del cliente en la parte del perfil activo para q el boton de cambiar perfil sea consultar posibles perfiles.

8) Modificar la pantalla de perfiles para que sea meramente informativa, el cliente no debe poder seleccionar ninguna.

9) Revisar panel cliente para que la tarjeta del usuario diga cuenta cliente en lugar de editar perfil en front.

10) Editar ciudad en perfil de cliente para q sea pais.

11) Mensajeria cliente-asesor (chat del dashboard usuario)
- UI: /usuario/dashboard (modal de chat)
- Esperado: endpoints para cliente (ej. GET /users/me/messages, POST /users/me/messages)
- Estado: solo existe /advisor/messages (role asesor). Cliente no puede enviar/leer mensajes via API.

## Limitaciones actuales
- Reportes de asesor: /advisor/reports responde con datos fijos (no provienen de BD). Considerar persistencia real.

## Notas
- El dashboard de usuario actualmente usa mocks. Puede construirse en frontend con /expenses, /expenses/summary y /users/me/recommendations, pero no hay endpoint de agregacion dedicado (/users/me/dashboard).
