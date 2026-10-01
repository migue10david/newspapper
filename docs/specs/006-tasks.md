# Tareas — Spec 006: Cierre y QA del MVP

Las tareas se ejecutarán en orden. Una tarea solo se marcará cuando su criterio esté verificado y no se hayan introducido cambios no relacionados.

## Fase 1 — Auditoría de documentación y alcance

- [x] **T-95** Comparar las Specs 001–005 con el código actual y listar diferencias verificables.
  - Hallazgos registrados en `006-plan.md`: extensiones posteriores de búsqueda/interacciones, tareas pendientes de cierre y validaciones que deben repetirse.
- [x] **T-96** Revisar tareas pendientes, IDs duplicados y criterios obsoletos sin borrar historial.
  - Se detectó reutilización de IDs T-64–T-94 entre `004-tasks.md` y `005-tasks.md`; la numeración de la Spec 006 comienza en T-95 para evitar más colisiones.
- [x] **T-97** Actualizar la documentación para reflejar comentarios, reacciones, imágenes y TanStack Query ya implementados.
  - La Spec 001 ahora distingue el alcance original de las extensiones aprobadas por las Specs 003 y 005.

## Fase 2 — Suite backend

- [x] **T-98** Ejecutar la suite backend completa y registrar todos los fallos reproducibles.
  - Resultado: 23 suites y 122 tests pasan con `pnpm --filter newspapper test`.
- [x] **T-99** Corregir el fallo e2e de listado público de noticias y conservar la ordenación y paginación esperadas.
  - Se ordenan fechas descendentes con `NULLS LAST`, evitando que noticias publicadas sin `publishedAt` desplacen las noticias fechadas de la primera página.
- [x] **T-100** Corregir el fallo de búsqueda paginada de categorías sin romper unicidad de slug.
  - La prueba pasó aislada y en la suite completa; no se reprodujo un defecto de implementación después de la auditoría.
- [x] **T-101** Revisar cobertura backend de `400`, `401`, `403`, `404` y `409` en los módulos críticos.
  - Se revisaron aserciones en auth, news, media, authors, settings e interacciones; los casos de conflicto de categorías/tags se cubren en tests de servicio.
- [x] **T-102** Confirmar que no existen tests eliminados, omitidos o desactivados para ocultar fallos.
  - No se encontraron usos de `skip`, `only`, `xdescribe`, `xit`, `xtest`, `@ts-ignore` o `@ts-nocheck` en los tests backend.

## Fase 3 — API, seguridad y autenticación

- [x] **T-103** Verificar compatibilidad de los endpoints públicos de noticias, búsqueda, categorías, tags e interacciones.
  - Las pruebas públicas de noticias, filtros, tags e interacciones pasan; los controllers conservan los endpoints públicos documentados.
- [x] **T-104** Revisar que las respuestas no expongan `passwordHash`, tokens, secretos ni rutas internas.
  - Los usuarios se transforman mediante `toPublicUser`; login/refresh devuelven solo `accessToken` y la cookie contiene el refresh token.
- [x] **T-105** Validar login, registro, refresh, rotación, logout y limpieza de refresh tokens.
  - Auth e2e y el servicio de refresh cubren rotación, expiración, logout y limpieza cron.
- [x] **T-106** Validar permisos de `author`, `editor` y `admin` en endpoints y servicios backend.
  - News, users, authors, settings e interactions cubren autenticación y autorización por rol.
- [x] **T-107** Confirmar validación de DTOs, errores HTTP y control de concurrencia.
  - DTOs y pruebas cubren validación de entrada; news e interactions cubren conflictos de versión y duplicados.

## Fase 4 — Flujo editorial y media

- [x] **T-108** Verificar creación y edición de noticias respetando ownership y perfil Author.
  - News e2e cubre ownership, perfiles vinculados y permisos de author/admin.
- [x] **T-109** Verificar transiciones `draft → inReview → published`, programación y archivado.
  - News, state machine y scheduling tests cubren transiciones válidas, inválidas y publicación programada.
- [x] **T-110** Verificar imágenes principales, bloques inline, textos alternativos y URLs relativas.
  - Media e2e y las pruebas del cliente cubren upload, alt, resolución de URL y payloads enriquecidos.
- [x] **T-111** Confirmar que noticias sin imagen, media retirada o archivos inválidos tienen comportamiento controlado.
  - Media e2e cubre formatos/tamaños inválidos y eliminación tolerante; news mantiene `imageId` opcional.

## Fase 5 — Interacciones, catálogo y configuración

- [x] **T-112** Verificar comentarios propios, moderación, eliminación lógica y control de versiones.
  - Interactions e2e cubre edición propia, eliminación lógica, moderación y conflictos de versión.
- [x] **T-113** Verificar reacciones únicas, cambio, retirada e idempotencia.
  - Interactions e2e cubre una reacción por usuario/noticia, cambio, retirada y repetición idempotente.
- [x] **T-114** Verificar búsqueda y paginación administrativa de categorías y tags.
  - Services y tests del cliente cubren búsqueda, paginación, mutaciones y slug único.
- [x] **T-115** Verificar configuración singleton, seed inicial y permisos exclusivos de `admin`.
  - Settings e2e y seed tests cubren singleton, valores iniciales e intervención exclusiva de admin.
- [x] **T-116** Confirmar actualización de caché tras mutations mediante TanStack Query.
  - Las mutations administrativas invalidan las claves de noticias, usuarios, taxonomía, settings e interacciones.

## Fase 6 — Frontend y arquitectura

- [x] **T-117** Confirmar que las páginas públicas continúan siendo Server Components.
  - Las páginas públicas no contienen `use client`; la interacción se extrae a componentes cliente.
- [x] **T-118** Confirmar separación entre shells servidor y componentes cliente del backoffice.
  - Las páginas administrativas son shells servidor y la interacción vive en componentes específicos.
- [x] **T-119** Verificar Axios autenticado, bearer token, cookies, refresh coordinado y reintento único.
  - Las pruebas del cliente autenticado cubren bearer, `withCredentials`, refresh y retry único.
- [x] **T-120** Revisar estados de carga, vacío, error, permisos, conflicto y sesión requerida.
  - Se revisaron los componentes públicos y administrativos y sus estados `LoadingState`, `EmptyState`, `Alert` y guard.
- [x] **T-121** Confirmar que no se persisten access tokens en `localStorage`, `sessionStorage` o TanStack Query.
  - No existen usos de esas APIs para tokens; Zustand mantiene el access token únicamente en memoria.

## Fase 7 — Accesibilidad y responsive

- [x] **T-122** Revisar navegación por teclado, foco visible, labels y errores asociados.
  - El CSS global define `focus-visible`; formularios y mensajes revisados conservan asociaciones `label`/error.
- [x] **T-123** Revisar contraste, estados no dependientes solo del color y anuncios accesibles.
  - Se mantienen tokens de contraste, variantes textuales de estados y regiones `aria-live`.
- [x] **T-124** Revisar objetivos táctiles, `prefers-reduced-motion` y navegación responsive.
  - Los controles principales usan objetivos `min-h-11`; existe regla global para `prefers-reduced-motion`.
- [ ] **T-125** Ejecutar comprobación manual de portada, búsqueda, noticia, login, backoffice, comentarios y configuración en móvil.
- [ ] **T-126** Ejecutar comprobación manual equivalente en tablet y desktop y registrar incidencias.

## Fase 8 — Docker, datos y migraciones

- [x] **T-127** Ejecutar `docker compose config` y verificar variables requeridas sin secretos en el repositorio.
  - `docker compose config` es válido; los valores sensibles tienen defaults explícitos de desarrollo y las variables de producción siguen siendo configurables.
- [x] **T-128** Levantar PostgreSQL y API, aplicar migraciones y ejecutar seed idempotente.
  - PostgreSQL y API iniciaron correctamente; migración y seed se ejecutaron dos veces sin error.
- [x] **T-129** Confirmar persistencia después de reiniciar contenedores sin eliminar el volumen de PostgreSQL.
  - Los contenedores se reiniciaron, PostgreSQL volvió a estado `healthy` y la configuración seed continuó disponible.
- [x] **T-130** Confirmar que la API y el frontend se comunican mediante los puertos documentados.
  - La API respondió en `http://localhost:3001` y `GET /public/settings` devolvió la configuración pública.

## Fase 9 — Limpieza y validación final

- [x] **T-131** Revisar imports, logs temporales, tipos inseguros y cambios no relacionados.
  - No se encontraron `any`, `TODO`, `FIXME` ni logs temporales; el `console.error` del seed es manejo explícito de errores.
- [x] **T-132** Ejecutar `pnpm lint` y corregir todos los errores provocados por el cierre.
- [x] **T-133** Ejecutar `pnpm typecheck` y corregir todos los errores de TypeScript.
- [x] **T-134** Ejecutar `pnpm test` y confirmar que toda la suite pasa.
  - Resultado: frontend 27 tests y backend 23 suites/122 tests correctos.
- [x] **T-135** Ejecutar `pnpm build` y confirmar que backend y frontend compilan.
- [x] **T-136** Ejecutar `pnpm --filter newspapper test:e2e` y confirmar los flujos críticos.
  - Resultado: 1 suite y 1 test correctos; se corrigió el cierre de recursos del e2e base.
- [x] **T-137** Revisar la documentación final y marcar las tareas pendientes de las Specs 001–005 que hayan quedado verificadas.
  - Se marcaron las validaciones automatizadas de Specs 004 y 005; las comprobaciones visuales/manuales siguen pendientes.
- [x] **T-138** Emitir el informe de cierre del MVP con resultados automatizados, revisión manual y limitaciones conocidas.
  - Informe registrado en `006-plan.md`; el cierre total permanece pendiente de la revisión visual manual.

## Criterio final

La Spec 006 se completa cuando T-95 a T-138 están verificadas, los comandos obligatorios pasan, la revisión responsive está registrada y no quedan bloqueadores sin documentar.
