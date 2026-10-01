# Tareas — Plan 001 (<30 min cada una, ordenadas por dependencia)

Deriva de `docs/specs/001-plan.md` y `docs/specs/001-news-platform.md`.

## Fase 0 — Base

- [x] **T-01** Crear `package.json` raíz con workspaces (`newspapper`, `newspapper-frontend`) y scripts raíz.
  - RF: — (infra). **Hecho cuando**: `pnpm install` en raíz funciona y `pnpm --filter <pkg> test` invoca ambos paquetes.
- [x] **T-02** Actualizar `AGENTS.md` a nombres reales (`newspapper`, `newspapper-frontend`).
  - RF: — (D0). **Hecho cuando**: AGENTS.md no menciona `frontend/` ni `backend/` como carpetas.

## Fase 1 — Datos (D1)

- [x] **T-03** Instalar/configurar Drizzle + PostgreSQL y `.env.example` (`DATABASE_URL`, `JWT_SECRET`). Dep: T-01.
  - RF-061. **Hecho cuando**: conexión exitosa y `.env.example` en repo sin secretos reales.
- [x] **T-04** Definir esquema Drizzle (users, authors, categories, tags, media, news, news_tags + índices). Dep: T-03.
  - RF-030 (parcial). **Hecho cuando**: migración generada y aplicada; tablas existen con índices.
- [x] **T-05** Seed mínimo (1 admin, 1 editor, 1 autor, 1 categoría, 2 tags). Dep: T-04.
  - RF-020. **Hecho cuando**: script de seed inserta y es idempotente.

## Fase 2 — Auth (D2)

- [x] **T-06** Módulo `users` con hash bcrypt y CRUD básico (Admin). Dep: T-04.
  - RF-020/023. **Hecho cuando**: crear usuario persiste con hash (no texto plano).
- [x] **T-07** Login JWT: `POST /auth/login`, firma con `JWT_SECRET`. Dep: T-06.
  - RF-060/061. **Hecho cuando**: credenciales válidas → JWT; inválidas → 401.
- [x] **T-08** Guard global + `@Roles()` decorator con 401/403. Dep: T-07.
  - RF-024/025/042. **Hecho cuando**: endpoint protegido devuelve 401 sin token y 403 con rol insuficiente.

## Fase 3 — Catálogo

- [x] **T-09** Módulo `categories` CRUD con slug único y bloqueo de borrado. Dep: T-08.
  - RF-034/043. **Hecho cuando**: DELETE con noticias asociadas → 409; sin asociadas → 200.
- [x] **T-10** Módulo `tags` CRUD idem. Dep: T-08.
  - RF-034/043. **Hecho cuando**: igual que T-09.
- [x] **T-11** Módulo `authors` CRUD. Dep: T-08.
  - RF-023/043. **Hecho cuando**: Admin gestiona autores; non-admin → 403.

## Fase 4 — News core

- [x] **T-12** `SlugService` (normalización, unicidad, inmutabilidad). Dep: T-03.
  - RF-031/032. **Hecho cuando**: tests unitarios pasan (acentos, mayúsculas, duplicados).
- [x] **T-13** `StateMachine` con matriz de transiciones. Dep: —.
  - RF-010/012. **Hecho cuando**: cada transición inválida lanza conflicto; válidas permitidas.
- [x] **T-14** Módulo `news`: create/update con DTOs, rich text validado, version optimista. Dep: T-09/10/11/12/13.
  - RF-030/031/035. **Hecho cuando**: update con `version` incorrecta → 409; campo inválido → 400.
- [x] **T-15** Endpoints gestión news (CRUD + transición) con permisos por rol. Dep: T-14.
  - RF-013/021/022/023/026/043. **Hecho cuando**: Author no puede publicar (403); borrado solo `draft` (409/403 si no).
- [x] **T-16** Endpoints públicos: portada, por categoría, por slug; paginación + 404. Dep: T-15.
  - RF-001/002/003/004/005/040/041. **Hecho cuando**: sin auth devuelven 200; no publicada → 404; `size>50` → 400.

## Fase 5 — Media y scheduling

- [x] **T-17** Módulo `media`: upload (jpg/png/webp, ≤5 MB) + borrado tolerante. Dep: T-08.
  - RF-033. **Hecho cuando**: formato inválido o >5 MB → 400; noticia sobrevive sin imagen.
- [x] **T-18** Job cron que publica `scheduled` vencidas. Dep: T-14.
  - RF-011. **Hecho cuando**: noticia con `publishedAt` pasado aparece `published` tras ejecutar el job.

## Fase 6 — Frontend público (D8/D9)

- [x] **T-19** Layout base + Tailwind + cliente API tipado (`.env` con URL backend). Dep: T-16.
  - RF-051. **Hecho cuando**: layout renderiza `header/nav/main/footer` responsivo.
- [x] **T-20** Página `/` portada paginada. Dep: T-19.
  - RF-001/050/051. **Hecho cuando**: muestra published ordenadas; metadata completa.
- [x] **T-21** Página `/categoria/[slug]`. Dep: T-19.
  - RF-002/050/051. **Hecho cuando**: lista filtrada con paginación.
- [x] **T-22** Página `/noticia/[slug]` con `notFound()` y OG. Dep: T-19.
  - RF-003/004/050/051. **Hecho cuando**: noticia no publicada → 404; OG presente en `<head>`.

## Fase 7 — Backoffice

- [x] **T-23** Login admin + manejo de token. Dep: T-19, T-07.
  - RF-060. **Hecho cuando**: login válido guarda token y redirige.
- [x] **T-24** Lista del panel editorial de noticias (estados, filtros). Dep: T-23, T-15.
  - RF-021/022/026. **Hecho cuando**: Author solo ve/edita lo suyo.
- [x] **T-25** Editor de noticia (formulario de contenido + acciones de transición por rol). Dep: T-24, T-17.
  - RF-010/012/013/021/022/030–035. **Hecho cuando**: botones visibles según rol y estado; errores 400/409 mostrados.
- [x] **T-28** Registro público de autores con formulario validado. Dep: T-19, T-07.
  - RF-071/072/073. **Hecho cuando**: registro válido crea un `author`, email duplicado devuelve 409 y no se crea sesión.
- [x] **T-29** Datos del usuario autenticado en el navbar. Dep: T-23.
  - RF-074. **Hecho cuando**: el navbar muestra email, rol, panel de admin y logout según la sesión.
- [x] **T-30** Panel admin de usuarios y asignación de roles. Dep: T-23, T-06.
  - RF-027/028. **Hecho cuando**: Admin lista, crea y cambia roles; no se expone `passwordHash` ni se puede eliminar el último admin.
- [x] **T-31** Flujo editorial por roles y vinculación de perfiles Author. Dep: T-24, T-25, T-30.
  - RF-075–080. **Hecho cuando**: Author y Admin envían borradores a revisión, Editor/Admin aprueban y las acciones respetan el estado editorial.

## Fase 8 — Cierre

- [x] **T-26** Suite e2e backend completa (códigos por RF). Dep: T-18.
  - RF: todos los de backend. **Hecho cuando**: `pnpm test` y `test:e2e` cubren 400/401/403/404/409.
- [ ] **T-27** Verificación final: lint, typecheck, test, build + responsive manual. Dep: T-25, T-26.
  - RF: criterios de finalización. **Automatizado**: lint, typecheck, test y builds de los dos paquetes pasan; queda pendiente la comprobación visual manual en mobile/tablet/desktop.

---

**Notas**: 31 tareas, todas <30 min; dependencias explícitas y sin ciclos.
