# Plan 003 — Búsqueda avanzada de noticias

## 1. Backend

1. Crear DTOs de consulta pública y editorial con validación de filtros, fechas y paginación.
2. Ampliar `GET /public/news` sin romper los parámetros actuales.
3. Añadir `GET /news/manage` con paginación, filtros y autorización por rol.
4. Implementar búsqueda textual con PostgreSQL `ILIKE` sobre título, resumen y autor.
5. Añadir filtros por categoría, tag, autor, estado y rango de fechas.
6. Evitar duplicados al consultar relaciones con tags.
7. Mantener DTOs separados para respuestas públicas y administrativas.

## 2. Frontend público

1. Ampliar el cliente API con los nuevos parámetros de búsqueda.
2. Crear `/buscar` como Server Component.
3. Añadir formulario accesible y responsive.
4. Implementar resultados vacíos, errores y paginación conservando los filtros.
5. Añadir acceso al buscador desde el navbar.
6. Mantener las páginas públicas actuales con Axios server-side.

## 3. Backoffice

1. Añadir filtros de búsqueda al listado de noticias.
2. Consumir `/news/manage` mediante TanStack Query y Axios autenticado.
3. Mantener la visibilidad por rol y el refresh coordinado de sesión.
4. Invalidar o refrescar resultados después de transiciones y ediciones.
5. Mostrar errores `401`, `403`, `400` y de conexión.

## 4. Tests y calidad

- Tests unitarios de normalización y validación de consultas.
- Tests de servicio para texto, filtros combinados, fechas, paginación y duplicados.
- Tests e2e de permisos, resultados vacíos y compatibilidad pública.
- Tests frontend del cliente API, parámetros, paginación y estados de UI.
- Validación final:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
