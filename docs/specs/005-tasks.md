# Tareas — Spec 005

## Fase 1 — Modelo y contratos

- [x] **T-64** Crear enums de estados de comentario y tipos de reacción.
- [x] **T-65** Crear tablas `comments` y `news_reactions` con claves, índices y restricción única.
- [x] **T-66** Crear y aplicar la migración Drizzle.
- [x] **T-67** Crear DTOs con validación para comentarios, reacciones, moderación y paginación.

## Fase 2 — Comentarios backend

- [x] **T-68** Implementar creación autenticada de comentarios sobre noticias publicadas.
- [x] **T-69** Implementar edición y eliminación lógica de comentarios propios.
- [x] **T-70** Aplicar control de concurrencia mediante `version`.
- [x] **T-71** Implementar consulta pública de comentarios publicados.
- [x] **T-72** Implementar listado administrativo paginado y filtrable.
- [x] **T-73** Implementar moderación `pending → published/hidden` para editor y admin.
- [x] **T-74** Cubrir permisos, noticias no publicadas, comentarios ajenos y errores HTTP.

## Fase 3 — Reacciones backend

- [x] **T-75** Implementar reacciones `like` y `useful`.
- [x] **T-76** Garantizar una única reacción por usuario y noticia.
- [x] **T-77** Implementar cambio, retirada e idempotencia de reacciones.
- [x] **T-78** Exponer conteos públicos sin información sensible.
- [x] **T-79** Añadir tests de reacciones y noticias no publicadas.

## Fase 4 — Cliente API y frontend público

- [x] **T-80** Crear tipos y cliente Axios para comentarios y reacciones.
- [x] **T-81** Integrar la consulta de interacciones en el detalle público.
- [x] **T-82** Crear formulario de comentarios autenticado con React Hook Form y Zod.
- [x] **T-83** Implementar edición y eliminación de comentarios propios.
- [x] **T-84** Crear controles de reacción con estados activo, carga, error y sesión requerida.
- [x] **T-85** Integrar TanStack Query e invalidación de caché.

## Fase 5 — Moderación y accesibilidad

- [x] **T-86** Crear la vista administrativa de moderación para editor y admin.
- [x] **T-87** Mostrar correctamente estados pendiente, publicado, oculto y eliminado.
- [x] **T-88** Añadir manejo visual de errores `401`, `403`, `404`, `409` y conexión.
- [x] **T-89** Revisar navegación por teclado, labels, foco visible y objetivos táctiles.
- [ ] **T-90** Verificar responsive en móvil, tablet y desktop.

## Fase 6 — Cierre

- [x] **T-91** Ejecutar lint, typecheck, tests y build del monorepo.
- [x] **T-92** Ejecutar `pnpm --filter newspapper test:e2e` y corregir fallos.
  - Se añadió cierre explícito de la aplicación y el pool en el e2e base para evitar handles abiertos.
- [x] **T-93** Confirmar que los contratos públicos actuales de noticias siguen funcionando.
- [ ] **T-94** Completar la comprobación manual del flujo de comentarios, moderación y reacciones.
