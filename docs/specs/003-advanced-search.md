# Spec 003 — Búsqueda avanzada de noticias

- **Estado**: Propuesta aprobada
- **Versión**: 1.0
- **Ubicación**: `docs/specs/003-advanced-search.md`

## 1. Propósito

Permitir que los lectores encuentren noticias publicadas mediante texto y filtros editoriales, y que los usuarios del backoffice localicen contenidos de acuerdo con su rol.

La búsqueda utilizará PostgreSQL mediante consultas `ILIKE` y conservará los contratos públicos actuales de noticias.

## 2. Alcance

La spec incluye:

- búsqueda pública de noticias publicadas;
- filtros por texto, categoría, tag, autor y rango de fechas;
- paginación y orden estable;
- búsqueda autenticada para el backoffice editorial;
- visibilidad por rol;
- integración con las páginas públicas y el panel de noticias.

Quedan fuera de alcance la búsqueda sobre el cuerpo JSON de la noticia, autocompletado, sugerencias, relevancia ponderada, historial de búsquedas y búsquedas guardadas.

## 3. Requisitos funcionales

### 3.1 Búsqueda pública

- **RF-301**: WHEN un visitante solicita `GET /public/news`, THE SYSTEM SHALL aceptar filtros opcionales de texto, categoría, tag, autor y fechas.
- **RF-302**: WHEN se recibe `q`, THE SYSTEM SHALL buscar sin distinguir mayúsculas/minúsculas en título, resumen y nombre del autor.
- **RF-303**: WHEN se recibe `category`, THE SYSTEM SHALL filtrar por el slug de la categoría.
- **RF-304**: WHEN se recibe `tag`, THE SYSTEM SHALL filtrar por el slug del tag asociado.
- **RF-305**: WHEN se recibe `author`, THE SYSTEM SHALL filtrar por el identificador o slug definido para el autor.
- **RF-306**: WHEN se reciben `from` o `to`, THE SYSTEM SHALL filtrar por `publishedAt` usando límites inclusivos en UTC.
- **RF-307**: THE SYSTEM SHALL incluir únicamente noticias con estado `published` en las respuestas públicas.
- **RF-308**: THE SYSTEM SHALL combinar todos los filtros recibidos mediante una condición lógica `AND`.
- **RF-309**: THE SYSTEM SHALL ordenar los resultados por `publishedAt` descendente y, como desempate, por `id` descendente.
- **RF-310**: THE SYSTEM SHALL devolver la respuesta paginada `{ items, page, size, total }`.
- **RF-311**: IF la búsqueda no encuentra resultados, THEN THE SYSTEM SHALL devolver HTTP 200 con `items: []`.
- **RF-312**: THE SYSTEM SHALL mantener compatibles las consultas existentes que solo utilizan `page`, `size` y `category`.

### 3.2 Búsqueda editorial

- **RF-320**: THE SYSTEM SHALL exponer `GET /news/manage` para búsqueda autenticada y paginada.
- **RF-321**: THE SYSTEM SHALL aceptar en `/news/manage` los filtros `q`, `status`, `category`, `tag`, `author`, `from`, `to`, `page` y `size`.
- **RF-322**: WHEN un `author` consulta `/news/manage`, THE SYSTEM SHALL devolver únicamente sus propias noticias.
- **RF-323**: WHEN un `editor` o `admin` consulta `/news/manage`, THE SYSTEM SHALL permitir consultar todas las noticias de gestión.
- **RF-324**: THE SYSTEM SHALL conservar el endpoint actual `GET /news` y su contrato para evitar incompatibilidades con clientes existentes.
- **RF-325**: THE SYSTEM SHALL devolver DTOs de gestión sin `passwordHash`, tokens ni secretos.
- **RF-326**: THE SYSTEM SHALL mantener las reglas actuales de autorización, control de versión y estados editoriales.

### 3.3 Validación y errores

- **RF-330**: IF `page` no es un entero mayor o igual que 1, THEN THE SYSTEM SHALL devolver HTTP 400.
- **RF-331**: IF `size` no es un entero entre 1 y 50, THEN THE SYSTEM SHALL devolver HTTP 400.
- **RF-332**: IF una fecha no cumple el formato ISO esperado, THEN THE SYSTEM SHALL devolver HTTP 400.
- **RF-333**: IF un filtro excede su longitud máxima o contiene un formato inválido, THEN THE SYSTEM SHALL devolver HTTP 400.
- **RF-334**: IF un usuario no autenticado solicita `/news/manage`, THEN THE SYSTEM SHALL devolver HTTP 401.
- **RF-335**: IF un usuario no tiene permisos para consultar gestión editorial, THEN THE SYSTEM SHALL devolver HTTP 403.
- **RF-336**: THE SYSTEM SHALL devolver resultados vacíos, no errores, cuando un slug válido no corresponde a ningún recurso editorial.

## 4. Contratos HTTP

### 4.1 Endpoint público

```text
GET /public/news
```

Parámetros opcionales:

```text
q=elecciones
category=politica
tag=internacional
author=author-id-or-slug
from=2026-01-01
to=2026-01-31
page=1
size=20
```

La respuesta `200` conservará el formato `{ items, page, size, total }` y los campos públicos actuales de cada noticia.

### 4.2 Endpoint editorial

```text
GET /news/manage?page=&size=&q=&status=&category=&tag=&author=&from=&to=
Authorization: Bearer <access-token>
```

La respuesta `200` será paginada y contendrá DTOs de gestión con estado, versión, categoría y autor, sin credenciales ni secretos.

## 5. Reglas técnicas

- La consulta pública siempre añadirá `status = published`.
- Las relaciones con tags deberán evitar noticias duplicadas cuando coincidan varios registros relacionados.
- Los filtros de texto se normalizarán recortando espacios externos.
- `from` representa el inicio inclusivo del día indicado y `to` el final inclusivo del día indicado en UTC.
- Las consultas deberán reutilizar los servicios y DTOs del módulo de noticias.
- No se añadirá infraestructura externa ni un motor de búsqueda separado.
- Los índices nuevos solo se añadirán si la revisión del esquema demuestra que son necesarios para los filtros soportados.

## 6. Frontend

- Crear la ruta pública `/buscar` como Server Component.
- Leer los filtros desde `searchParams` y conservarlos al paginar.
- Añadir un formulario accesible para texto, categoría, tag, autor y fechas.
- Mostrar resultados, contador total, paginación y estado vacío.
- Mostrar errores de API sin romper el layout público.
- Mantener `/`, `/categoria/[slug]` y `/noticia/[slug]` como Server Components.
- Añadir filtros de búsqueda al listado `/admin/news` mediante el cliente autenticado y TanStack Query.
- Mantener el refresh automático del access token para las consultas editoriales.

## 7. Tests y criterios de aceptación

La funcionalidad se considerará terminada cuando:

1. La búsqueda pública filtre por texto, categoría, tag, autor y fechas.
2. Las noticias no publicadas no aparezcan nunca en el endpoint público.
3. La paginación y el orden sean estables.
4. El endpoint editorial respete las diferencias entre `author`, `editor` y `admin`.
5. Los endpoints actuales de portada y categoría continúen funcionando sin cambios incompatibles.
6. Se cubran errores `400`, `401` y `403`.
7. Las páginas públicas sigan siendo Server Components y sean responsive.
8. Pasen `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build`.
