# Tareas — Spec 004

## Fase 1 — Fundamentos visuales

- [x] **T-64** Definir tokens visuales de color, tipografía, espaciado, bordes, radios, sombras y breakpoints.
- [x] **T-65** Definir la escala tipográfica editorial responsive para titulares, cuerpo y metadata.
- [x] **T-66** Documentar estados visuales, contraste, foco, disabled, loading y `prefers-reduced-motion`.

## Fase 2 — Componentes base

- [x] **T-67** Configurar shadcn/ui sobre Next.js, Tailwind y TypeScript sin añadir otra librería UI paralela.
- [x] **T-68** Generar y personalizar componentes `Button`, `Input`, `Select`, `Badge` y `Alert` desde shadcn/ui.
- [x] **T-69** Crear componentes `Card`, `EmptyState`, `LoadingState`, `Pagination` y `PageHeader` reutilizando la base de shadcn/ui.
- [x] **T-70** Añadir variantes responsive y estados accesibles a los componentes base.

## Fase 3 — Estructura pública

- [x] **T-71** Normalizar navbar, contenedor principal y footer público.
- [x] **T-72** Rediseñar la portada con jerarquía de noticia principal y contenido secundario.
- [x] **T-73** Rediseñar búsqueda, categorías y paginación conservando sus contratos actuales.
- [x] **T-74** Rediseñar el detalle de noticia y sus bloques de autor, tags, imagen y contenido.
- [x] **T-75** Revisar jerarquía semántica, metadata visible y estados vacíos públicos.

## Fase 4 — Estructura administrativa

- [x] **T-76** Crear shell visual separado para el backoffice.
- [x] **T-77** Normalizar navegación responsive y sección activa por rol.
- [x] **T-78** Rediseñar dashboard, listado editorial y filtros de noticias.
- [x] **T-79** Rediseñar editor de noticia y acciones de transición editorial.
- [x] **T-80** Rediseñar catálogo, usuarios, roles y configuración.
- [x] **T-81** Normalizar feedback de carga, vacío, error, éxito, permisos y conflictos.

## Fase 5 — Accesibilidad y responsive

- [x] **T-82** Verificar navegación completa por teclado y foco visible.
- [x] **T-83** Verificar labels, errores asociados y anuncios `aria-live`.
- [x] **T-84** Verificar contraste WCAG 2.2 AA y ausencia de estados comunicados solo por color.
- [x] **T-85** Verificar objetivos táctiles mínimos de 44px y `prefers-reduced-motion`.
- [ ] **T-86** Realizar revisión visual manual en móvil, tablet y desktop.

## Fase 6 — Cierre

- [x] **T-87** Ejecutar `pnpm lint`.
- [x] **T-88** Ejecutar `pnpm typecheck`.
- [x] **T-89** Ejecutar `pnpm test`.
- [x] **T-90** Ejecutar `pnpm build`.
- [x] **T-91** Confirmar que no se modificaron contratos API ni se añadió otra librería UI distinta de shadcn/ui.
