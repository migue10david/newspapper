# Plan 002 — Catálogo editorial y configuración

## 1. Backend

1. Añadir la tabla singleton `site_settings` y su migración Drizzle.
2. Añadir defaults idempotentes al seed.
3. Incorporar paginación y búsqueda administrativa para categorías y tags.
4. Corregir la actualización de slugs para no detectar el propio registro como duplicado.
5. Añadir el módulo de configuración con endpoint público y actualización protegida para `admin`.
6. Cubrir errores `400`, `401`, `403`, `404` y `409` mediante tests.

## 2. Frontend

1. Ampliar los clientes Axios de taxonomía y configuración.
2. Crear `/admin/catalog` con pestañas, búsqueda, paginación y formularios Zod.
3. Crear `/admin/settings` con formulario exclusivo para administradores.
4. Añadir enlaces al navbar según el rol.
5. Consumir configuración pública desde el layout con fallback seguro.
6. Usar TanStack Query en el backoffice para cachear consultas, coordinar mutations e invalidar listados después de cambios.
7. Mantener las páginas administrativas como Server Components y extraer la interacción a componentes cliente.

## 3. Calidad

- Mantener los endpoints públicos actuales sin cambios incompatibles.
- Mantener autorización en backend como autoridad final.
- Mantener las páginas públicas y su consumo de configuración/noticias en Server Components con Axios.
- Ejecutar lint, typecheck, tests y build del monorepo.
