# Tareas — Spec 003

## Fase 1 — Contratos y validación

- [x] **T-42** Crear DTO público de búsqueda con `q`, categoría, tag, autor, fechas y paginación.
- [x] **T-43** Crear DTO editorial de búsqueda con filtros de estado y permisos.
- [x] **T-44** Añadir tests de validación para parámetros inválidos y fechas.

## Fase 2 — Backend público

- [x] **T-45** Extender `GET /public/news` con búsqueda textual.
- [x] **T-46** Añadir filtros públicos de categoría, tag, autor y fechas.
- [x] **T-47** Garantizar resultados únicos, orden estable y paginación.
- [x] **T-48** Añadir tests e2e de búsqueda pública y compatibilidad con portada/categoría.

## Fase 3 — Backend editorial

- [x] **T-49** Crear `GET /news/manage` con respuesta paginada.
- [x] **T-50** Aplicar visibilidad por rol: author propio, editor y admin global.
- [x] **T-51** Añadir filtros editoriales por texto, estado, taxonomía, autor y fechas.
- [x] **T-52** Añadir tests de `401`, `403`, filtros y aislamiento de author.

## Fase 4 — Frontend público

- [x] **T-53** Ampliar el cliente público de noticias con los parámetros de búsqueda.
- [x] **T-54** Crear la página Server Component `/buscar`.
- [x] **T-55** Crear formulario responsive, resultados, estado vacío y paginación.
- [x] **T-56** Añadir enlace al buscador en el navbar y conservar filtros entre páginas.

## Fase 5 — Backoffice

- [x] **T-57** Añadir filtros de búsqueda al listado administrativo de noticias.
- [x] **T-58** Integrar `/news/manage` mediante TanStack Query y Axios autenticado.
- [x] **T-59** Mantener acciones editoriales y actualizar resultados tras mutations.
- [x] **T-60** Añadir manejo visual de errores y estados de carga.

## Fase 6 — Cierre

- [x] **T-61** Ejecutar lint, typecheck, tests y build del monorepo.
- [ ] **T-62** Verificar manualmente búsqueda pública y editorial en móvil, tablet y desktop.
- [x] **T-63** Confirmar que las páginas públicas continúan siendo Server Components.
