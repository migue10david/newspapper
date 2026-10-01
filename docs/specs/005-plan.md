# Plan 005 — Interacción de usuarios con noticias

## 1. Modelo de datos y contratos

1. Crear enums para estados de comentario y tipos de reacción.
2. Crear tablas `comments` y `news_reactions` con claves foráneas, índices y restricción única por usuario y noticia.
3. Crear migración Drizzle y actualizar el seed solo si son necesarios datos iniciales de catálogo.
4. Crear DTOs de comentarios, reacciones, moderación y paginación.

## 2. Backend de comentarios

1. Crear servicio y controller de comentarios.
2. Implementar creación autenticada sobre noticias publicadas.
3. Implementar edición y eliminación lógica del comentario propio.
4. Aplicar `version` para edición y moderación.
5. Implementar listado administrativo paginado y filtrable.
6. Implementar publicación y ocultación para `editor` y `admin`.
7. Exponer únicamente comentarios publicados en el endpoint público.

## 3. Backend de reacciones

1. Crear servicio de reacciones con operaciones idempotentes.
2. Implementar creación o reemplazo de `like`/`useful`.
3. Implementar retirada segura de reacción.
4. Calcular conteos públicos por tipo sin exponer usuarios.
5. Rechazar reacciones sobre noticias no publicadas.

## 4. Frontend

1. Crear clientes API y tipos para comentarios, reacciones y moderación.
2. Añadir la consulta pública de interacciones al detalle de noticia.
3. Crear formulario autenticado de comentarios con validación y feedback.
4. Añadir edición y eliminación de comentarios propios.
5. Añadir controles de reacción accesibles.
6. Crear la vista administrativa de moderación.
7. Integrar TanStack Query, invalidaciones y manejo del refresh automático.
8. Mantener las páginas públicas como Server Components salvo los bloques interactivos.

## 5. Tests y validación

- Tests unitarios de DTOs, estados, permisos, idempotencia y concurrencia.
- Tests backend de comentarios, moderación, reacciones, noticias no publicadas y datos no existentes.
- Tests e2e de `401`, `403`, `404`, `409` y aislamiento entre usuarios.
- Tests frontend del cliente API, validaciones, mutations, invalidación y estados de UI.
- Verificación de que solo comentarios publicados aparecen en público.
- Validación final:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter newspapper test:e2e
```

- Comprobación manual responsive en móvil, tablet y desktop.

