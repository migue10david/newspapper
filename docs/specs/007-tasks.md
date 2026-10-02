# Tareas — Spec 007: Engagement de lectores

Las tareas backend se ejecutarán en `backend`; las frontend en `frontend`. La integración final se realizará en `dev` después de validar ambas ramas.

## Fase 1 — Modelo y migraciones

- [x] **T-139** Crear tablas `saved_news` y `reading_history` con claves, índices y cascadas.
- [x] **T-140** Crear y aplicar la migración Drizzle.
- [x] **T-141** Añadir DTOs y tipos de paginación para engagement.

## Fase 2 — API de guardados

- [x] **T-142** Implementar `PUT /news/:id/save` idempotente.
- [x] **T-143** Implementar `DELETE /news/:id/save` seguro si no existe.
- [x] **T-144** Implementar `GET /me/saved-news` con paginación.
- [x] **T-145** Validar estado publicado, autenticación y aislamiento por usuario.

## Fase 3 — API de historial

- [x] **T-146** Implementar `POST /news/:id/read` idempotente.
- [x] **T-147** Implementar `GET /me/reading-history` ordenado por `lastReadAt`.
- [x] **T-148** Implementar eliminación individual y limpieza total del historial.
- [x] **T-149** Validar actualización de fecha, paginación, permisos y cascadas.

## Fase 4 — Tests backend

- [x] **T-150** Cubrir guardados repetidos, retirada y paginación.
- [x] **T-151** Cubrir historial repetido, actualización de fecha y limpieza.
- [x] **T-152** Cubrir `401`, `404`, `400`, noticias no publicadas y aislamiento entre usuarios.
- [x] **T-153** Cubrir eliminación de noticias y usuarios con datos de engagement.

## Fase 5 — Cliente frontend

- [ ] **T-154** Añadir tipos y cliente Axios de engagement.
- [ ] **T-155** Crear queries y mutations TanStack Query con invalidación.
- [ ] **T-156** Añadir acción de guardado al detalle público.
- [ ] **T-157** Crear `/mis-noticias-guardadas`.
- [ ] **T-158** Crear `/mi-historial`.
- [ ] **T-159** Añadir estados de carga, vacío, error, sesión requerida y refresh.

## Fase 6 — Compartir y accesibilidad

- [ ] **T-160** Añadir copiar enlace y enlaces de compartir con URL canónica.
- [ ] **T-161** Implementar fallback cuando `navigator.share` no esté disponible.
- [ ] **T-162** Revisar labels, foco, `aria-pressed`, anuncios y teclado.
- [ ] **T-163** Revisar objetivos táctiles, responsive y `prefers-reduced-motion`.

## Fase 7 — Integración por ramas

- [ ] **T-164** Validar backend en la rama `backend`.
- [ ] **T-165** Validar frontend en la rama `frontend`.
- [ ] **T-166** Integrar backend y frontend en `dev` sin sobrescribir cambios locales no relacionados.
- [ ] **T-167** Ejecutar validación completa en `dev`.
- [ ] **T-168** Realizar push de `dev` al remoto después de confirmar la integración.

## Criterio final

La Spec 007 estará completa cuando T-139 a T-168 estén verificadas, los tests pasen en `dev`, los contratos públicos existentes sigan funcionando y se haya registrado la comprobación responsive.
