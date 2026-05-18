# Faltantes de Backend - FinTrack

Fecha: 2026-05-18
Contexto: integracion frontend-backend local (backend :3000, frontend :5500). Este listado resume funcionalidades del frontend que aun usan mock o requieren nuevos endpoints.

## Funcionalidades sin endpoint
1) OCR de tickets
- UI: /usuario/cargar-gasto (boton "Analizar ticket")
- Esperado: POST /tickets/upload (multipart/form-data), subir a storage, Gemini OCR, crear gasto, retornar 202 con ticketId/estado
- Estado: no existe modulo/endpoint tickets en backend

2) Perfiles de gasto (spending profiles)
- UI: /usuario/perfiles
- Esperado: GET /spending-profiles (listado de perfiles), GET /users/me/profile (perfil activo), PATCH /users/me/profile (cambiar perfil)
- BD: tablas perfiles_de_gasto, clasificacion_de_perfil existen
- Estado: no hay endpoints ni servicios

3) Patrones de consumo / analitica
- UI: /usuario/patrones
- Esperado: GET /users/me/consumption-analysis (highlights, stats, category distribution, monthly evolution, unusual expenses)
- BD: tabla analisis_de_consumo existe
- Estado: no hay endpoint ni calculo agregado

4) Mensajeria cliente-asesor (chat del dashboard usuario)
- UI: /usuario/dashboard (modal de chat)
- Esperado: endpoints para cliente (ej. GET /users/me/messages, POST /users/me/messages)
- Estado: solo existe /advisor/messages (role asesor). Cliente no puede enviar/leer mensajes via API.

5) Estado de recomendaciones para cliente
- UI: /usuario/recomendaciones (acciones "Marcar completada" / "Descartar")
- Esperado: PATCH /users/me/recommendations/:id (status, read)
- Estado: solo GET /users/me/recommendations; no endpoint para actualizar

## Limitaciones actuales
- Reportes de asesor: /advisor/reports responde con datos fijos (no provienen de BD). Considerar persistencia real.

## Notas
- El dashboard de usuario actualmente usa mocks. Puede construirse en frontend con /expenses, /expenses/summary y /users/me/recommendations, pero no hay endpoint de agregacion dedicado (/users/me/dashboard).
