# Plan 001 — Plataforma de Noticias (MVP)

Basado en la spec `docs/specs/001-news-platform.md` (v1.0) y la constitución.

## 0. Estado actual

- `newspapper/`: NestJS 11 scaffold vacío (sin ORM, sin BD, sin auth).
- `newspapper-frontend/`: Next.js (App Router) scaffold.
- Sin `package.json` raíz de workspace.

## 1. Decisiones técnicas (justificación + alternativa descartada)

**D0 — Nombres de paquetes**: crear `package.json` raíz con workspaces `newspapper` (backend) y `newspapper-frontend` (frontend), y actualizar AGENTS.md.
Alternativa descartada: renombrar carpetas a `backend/`/`frontend/` — rompe configs existentes sin beneficio.

**D1 — ORM: Drizzle + PostgreSQL**. Esquema en TypeScript puro, tipado inferido sin paso de generación, SQL explícito y ligero; encaja con TS estricto.
Alternativas descartadas: Prisma (generación de cliente y binarios extra para un MVP), TypeORM (decoradores menos estrictos), MongoDB (el dominio es relacional).

**D2 — Auth: `@nestjs/jwt` + guard global + decorator `@Roles()`**. Estándar NestJS, sin dependencias pesadas. RF-060, RF-024/025.
Alternativa descartada: Passport/Auth.js — más capas para un JWT simple.

**D3 — Scheduling: `@nestjs/schedule` (cron cada minuto)**. RF-011.
Alternativa descartada: cola externa (BullMQ/Redis) — infraestructura innecesaria para el MVP.

**D4 — Cuerpo rich text: JSON tipado propio** (array de bloques: paragraph/heading/list/image) validado con DTO + `class-validator`. RF-030.
Alternativa descartada: HTML sanitizado — superficie XSS mayor y validación menos estricta.

**D5 — Slug**: generado del título si no se indica, normalizado (minúsculas, sin acentos, guiones), índice único en BD. RF-031/032.

**D6 — Imágenes**: almacenamiento en disco local servido como estático (tabla `Media` con url, mime, size, alt). RF-033.
Alternativa descartada: S3/Cloudinary — sobrecoste para MVP; la entidad `Media` permite migrarlo después.

**D7 — Concurrencia optimista**: campo `version` (int) en `News`, actualización con `WHERE version = ?` → 409 si 0 filas afectadas. RF-035.
Alternativa descartada: locks pesimistas — innecesarios.

**D8 — Frontend público**: Server Components consumiendo la API REST con `fetch` y revalidación; SEO con `generateMetadata` (title, description, canonical, Open Graph). Backoffice: Client Components. RF-050/051.
Alternativa descartada: estado global (Zustand/Redux) — no requerido por la spec.

**D9 — UI: Tailwind CSS**, mobile-first con utilidades y HTML semántico.
Alternativa descartada: CSS Modules — más código a mantener para utilidades responsive.

## 2. Módulos backend (NestJS, por dominio)

| Módulo | Contenido | RF cubiertos |
|---|---|---|
| `news` | Controller público (GET list/by-slug), controller gestión (CRUD + transiciones), `NewsService`, `StateMachine` (matriz), `SlugService` | RF-001/002/003/004/005, RF-010/011/012/013, RF-030/031/032/035, RF-040/041/043 |
| `categories` | CRUD; borrado bloqueado con noticias asociadas | RF-022, RF-034, RF-043 |
| `tags` | CRUD idem | RF-022, RF-034, RF-043 |
| `authors` | CRUD entidad `Author` | RF-023, RF-043 |
| `users` | Gestión de usuarios (Admin), hash bcrypt | RF-020/023 |
| `auth` | Login→JWT, guard global, `@Roles()` | RF-024/025, RF-060/061 |
| `media` | Upload (validación mime/5 MB), delete tolerante | RF-033 |
| `scheduling` | Cron cada minuto: `scheduled` → `published` | RF-011 |

Separación Controller → Service → Repository (Drizzle) en todos.

### DTOs principales

- `CreateNewsDto`: title, summary, body (`RichTextBlock[]`), imageId?, categoryId, authorId, tagIds[], publishedAt?
- `UpdateNewsDto`: parcial + `version`
- `TransitionDto`: targetState
- `PaginationQueryDto`: page/size con defaults
- Respuestas: `NewsPublicDto`, `NewsAdminDto`

## 3. Modelo de datos (Drizzle / PostgreSQL)

```
users(id, email unique, passwordHash, role: author|editor|admin, authorId?)
authors(id, name, bio?, photoUrl?, userId?)
categories(id, name, slug unique)
tags(id, name, slug unique)
media(id, url, mime, size, alt?)
news(id, title, slug unique, summary, body jsonb, imageId?, categoryId,
     authorId, status: draft|inReview|scheduled|published|archived,
     publishedAt?, version int, createdAt, updatedAt)
news_tags(newsId, tagId)
```

Índices: `news(status, publishedAt desc)`, `news.slug` único, `categories.slug` único, `tags.slug` único.

## 4. Frontend (App Router)

| Ruta | Tipo | RF |
|---|---|---|
| `/` portada | Server Component + `generateMetadata` | RF-001, RF-050/051 |
| `/categoria/[slug]` | Server Component paginado | RF-002, RF-050/051 |
| `/noticia/[slug]` | Server Component, `notFound()` en 404 | RF-003/004, RF-050/051 |
| `/admin/...` (login, lista, editor de noticias) | Client Components | RF-021–026, RF-043 |

HTML semántico (`header/nav/main/article/aside/footer`), Tailwind mobile-first (D9).

## 5. Estrategia de tests

**Backend (Jest + supertest)** — por regla de negocio (constitución #5):

- *Unitarios*: `StateMachine` (todas las transiciones válidas + cada inválida → 409), `SlugService` (normalización, duplicado), paginación (defaults, límites, fuera de rango).
- *Integración/e2e por módulo*: éxito, 400 (DTO inválido), 401 (sin token), 403 (rol insuficiente, p. ej. `Author` intenta publicar), 404 (inexistente o archivada en público), 409 (slug duplicado, transición inválida, concurrencia, borrado de categoría con noticias), borrado físico solo en `draft` (RF-013).
- *Scheduling*: datos con `publishedAt` pasado → transición aplicada (RF-011), usando reloj controlado.
- BD de test: PostgreSQL dedicado (docker/servicio de CI); no SQLite (incompatible con `jsonb`).

**Frontend**: render de páginas con datos mock (portada, categoría, detalle, 404), metadatos generados; verificación manual mobile/tablet/desktop.

## 6. Secuencia de implementación

1. Workspace raíz + actualizar AGENTS.md (D0).
2. Drizzle + PostgreSQL + migración inicial + seed (D1).
3. Auth + users (RF-060/061, RF-020–025).
4. Categories/tags/authors (RF-043, RF-034).
5. News core: state machine, slug, CRUD, paginación (RF-001–013, 030–035, 040–043).
6. Media (RF-033, D6).
7. Scheduling (RF-011, D3).
8. Frontend público (RF-001–005, 050–051).
9. Backoffice `/admin` (RF-021–026, 043).
10. Criterios de finalización: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` verdes.

## 7. Riesgos / pendientes

- Variables de entorno: crear `.env.example` con `DATABASE_URL`, `JWT_SECRET` (RF-061). Secretos solo en entorno, nunca en repo.
- Drizzle + NestJS requiere integración manual (provider); mantenerse simple, sin wrapper innecesario (constitución #9).
