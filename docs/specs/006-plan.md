# Plan — Spec 006: Cierre y QA del MVP

## Objetivo

Auditar y cerrar el MVP existente sin introducir cambios de arquitectura ni funcionalidades de negocio mayores.

## Fases

### 1. Auditoría de alcance y documentación

- Comparar las Specs 001–005 con el código y sus tareas.
- Identificar tareas pendientes, IDs duplicados, criterios obsoletos y contratos desalineados.
- Actualizar la documentación únicamente cuando refleje comportamiento ya implementado o una corrección aprobada.

### 2. Corrección de la suite backend

- Ejecutar tests unitarios y e2e.
- Investigar los fallos actuales de noticias públicas y categorías.
- Corregir código o tests según el contrato vigente, sin eliminar cobertura.
- Añadir casos faltantes para errores, permisos, concurrencia y compatibilidad.

### 3. Auditoría de contratos y seguridad

- Revisar endpoints públicos y administrativos.
- Confirmar códigos HTTP y DTOs.
- Revisar respuestas para evitar secretos, hashes y datos internos.
- Validar autenticación, cookies, refresh coordinado y autorización por rol.

### 4. Validación editorial y de datos

- Verificar el ciclo completo `draft → inReview → published`.
- Verificar programación, archivado, ownership y versiones.
- Confirmar imágenes principales, bloques inline, media y persistencia.
- Validar migraciones, seed, índices y reinicio de Docker Compose.

### 5. Validación del frontend

- Revisar Server Components y límites de Client Components.
- Confirmar TanStack Query, invalidaciones y estados de sesión.
- Revisar páginas públicas, backoffice, comentarios, reacciones y formularios.
- Ejecutar pruebas de build, typecheck y lint.

### 6. Revisión manual y cierre

- Probar flujos principales en móvil, tablet y desktop.
- Revisar teclado, foco, contraste, labels y `prefers-reduced-motion`.
- Registrar resultados y limitaciones.
- Marcar tareas solo después de cumplir sus criterios.

## Restricciones

- No cambiar Next.js, NestJS, Drizzle, Axios, Zustand, TanStack Query ni la librería UI.
- No añadir dependencias salvo que una validación demuestre una necesidad imprescindible y sea aprobada.
- No cambiar contratos públicos sin documentar compatibilidad.
- No considerar una suite verde si existen errores silenciados o tests eliminados.

## Resultado esperado

Un MVP reproducible localmente, con cobertura de los flujos críticos, documentación coherente, validaciones automatizadas verdes y una revisión manual registrada para los tres tamaños de pantalla.

## Hallazgos iniciales de auditoría

- La Spec 001 todavía enumera búsqueda avanzada, comentarios y reacciones como fuera de alcance; esas capacidades están definidas posteriormente en las Specs 003 y 005 y deben considerarse extensiones aprobadas del MVP.
- `docs/specs/005-tasks.md` reutiliza identificadores que ya aparecen en `004-tasks.md`; se conservará el historial y la Spec 006 usará la numeración T-95 en adelante.
- Las tareas de cierre manual y de validación de las Specs 001–005 no están completamente marcadas, aunque existen validaciones automatizadas parciales. No se marcarán automáticamente hasta verificar sus criterios completos.
- T-98 confirmó 23 suites y 122 tests correctos. El listado público se corrigió usando `NULLS LAST` para `publishedAt`; la prueba de búsqueda de categorías pasó aislada y en la suite completa sin requerir un cambio adicional.

## Informe de cierre parcial

- `pnpm lint`: correcto.
- `pnpm typecheck`: correcto.
- `pnpm test`: correcto; frontend 27 tests y backend 23 suites con 122 tests.
- `pnpm build`: correcto para backend y frontend.
- `pnpm --filter newspapper test:e2e`: correcto; 1 suite y 1 test.
- Docker Compose, migraciones, seed idempotente, reinicio de contenedores y endpoint público de settings: verificados.
- Pendiente: revisión manual de móvil, tablet y desktop para portada, búsqueda, noticia, login, backoffice, comentarios y configuración. También quedan pendientes las tareas históricas que dependen exclusivamente de esa comprobación.
