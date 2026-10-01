# Spec 002 — Gestión de categorías, tags y configuración del sitio

- **Estado**: Implementada
- **Versión**: 1.0
- **Depende de**: Spec 001 — Plataforma de Noticias

## 1. Propósito

Ampliar el backoffice para que el equipo editorial gestione el catálogo de categorías y tags, y para que un administrador configure la identidad pública del periódico.

## 2. Requisitos funcionales

### 2.1 Categorías y tags

- **RF-201**: THE SYSTEM SHALL conservar `GET /categories` y `GET /tags` como endpoints públicos que devuelven arrays ordenados alfabéticamente.
- **RF-202**: WHEN un `Editor` o `Admin` solicita el catálogo administrativo, THE SYSTEM SHALL devolver resultados paginados y permitir búsqueda por nombre o slug.
- **RF-203**: WHEN un `Editor` o `Admin` crea o edita una categoría o tag, THE SYSTEM SHALL validar nombre y slug, mantener el slug único y devolver el recurso actualizado.
- **RF-204**: IF el slug ya existe, THEN THE SYSTEM SHALL responder HTTP 409.
- **RF-205**: IF el recurso no existe, THEN THE SYSTEM SHALL responder HTTP 404.
- **RF-206**: IF el DTO es inválido, THEN THE SYSTEM SHALL responder HTTP 400.
- **RF-207**: IF una categoría o tag tiene noticias asociadas, THEN THE SYSTEM SHALL bloquear su eliminación con HTTP 409.
- **RF-208**: IF un `Author` o visitante intenta una operación administrativa, THEN THE SYSTEM SHALL responder HTTP 403 o HTTP 401 respectivamente.

### 2.2 Configuración del sitio

- **RF-220**: THE SYSTEM SHALL almacenar una única configuración con `siteName`, `description`, `logoUrl` y `updatedAt`.
- **RF-221**: WHEN se solicita `GET /public/settings`, THE SYSTEM SHALL devolver únicamente los campos públicos de la configuración sin autenticación.
- **RF-222**: WHEN un `Admin` actualiza `PATCH /settings`, THE SYSTEM SHALL validar y persistir la configuración singleton.
- **RF-223**: IF un usuario no es `Admin`, THEN THE SYSTEM SHALL responder HTTP 403 al modificar la configuración.
- **RF-224**: THE SYSTEM SHALL crear valores iniciales mediante seed y conservarlos si ya existe configuración.
- **RF-225**: THE SYSTEM SHALL permitir usar `logoUrl` con una URL absoluta o una ruta local servida por el módulo de media existente.

### 2.3 Frontend

- **RF-240**: THE SYSTEM SHALL exponer `/admin/catalog` para categorías y tags a `Editor` y `Admin`.
- **RF-241**: THE SYSTEM SHALL exponer `/admin/settings` exclusivamente a `Admin`.
- **RF-242**: THE SYSTEM SHALL gestionar los formularios con React Hook Form y Zod, mostrando errores de validación y API.
- **RF-243**: THE SYSTEM SHALL usar la configuración pública en el nombre, descripción, logo, footer y metadata básica del sitio, con fallback local si la API no responde.

## 3. Contratos API

```text
GET    /categories
GET    /categories/manage?page=1&size=20&search=
POST   /categories
PATCH  /categories/:id
DELETE /categories/:id

GET    /tags
GET    /tags/manage?page=1&size=20&search=
POST   /tags
PATCH  /tags/:id
DELETE /tags/:id

GET    /public/settings
PATCH  /settings
```

Los listados administrativos devuelven `{ items, page, size, total }`. Los endpoints públicos existentes de categorías y tags mantienen su respuesta actual.

## 4. Criterios de finalización

1. Migración y seed idempotentes para la configuración singleton.
2. Tests backend de permisos, validación, duplicados, búsqueda, paginación, 404 y eliminación bloqueada.
3. Tests frontend de API, formularios, roles, errores y fallback público.
4. `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build` pasan.
5. Las pantallas administrativas son responsive y no rompen el editor de noticias ni las páginas públicas.

## 5. Fuera de alcance

- Nuevos roles.
- Borrado lógico de categorías o tags.
- Configuración avanzada de reglas editoriales.
- Nuevo sistema de almacenamiento de imágenes.

## 6. Arquitectura del cliente administrativo

- Las consultas y mutations autenticadas del backoffice usan TanStack Query sobre los clientes Axios existentes.
- El `QueryClientProvider` se limita al layout administrativo y respeta la inicialización de la sesión en memoria.
- Las páginas administrativas permanecen como Server Components; formularios, listados y acciones interactivas se implementan en componentes cliente.
- Las páginas públicas conservan sus consultas server-side y no dependen de TanStack Query para renderizar noticias o configuración.
