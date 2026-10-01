# Spec 006 — Cierre y QA del MVP

- **Estado**: Propuesta
- **Versión**: 1.0
- **Depende de**: Specs 001, 002, 003, 004 y 005

## 1. Propósito

Cerrar el MVP del periódico mediante una auditoría técnica, funcional, visual y documental de las capacidades implementadas en las specs anteriores.

Esta spec no añade módulos de negocio mayores. Su objetivo es encontrar y corregir inconsistencias, completar validaciones pendientes y dejar el producto verificable para uso local y una futura preparación de despliegue.

## 2. Alcance funcional

La revisión incluirá:

- lectura pública de portada, categorías, búsqueda y detalle de noticias;
- autenticación, registro, refresh token, logout y sesiones en cookie segura;
- roles `author`, `editor` y `admin`;
- creación, edición, revisión, publicación, programación y archivado de noticias;
- imágenes principales e imágenes dentro de secciones del cuerpo;
- gestión de autores, usuarios, categorías, tags y configuración;
- comentarios, moderación y reacciones;
- paginación, filtros y estados de carga, vacío, error y conflicto;
- integración de Axios, Zustand y TanStack Query;
- composición visual y responsive del sitio público y backoffice.

## 3. Requisitos de cierre

### 3.1 Calidad técnica

El proyecto SHALL pasar sin errores:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter newspapper test:e2e
```

Los fallos actuales de la suite, incluidos los relacionados con noticias públicas y búsqueda de categorías, SHALL investigarse y corregirse o documentarse como bloqueadores explícitos antes del cierre.

### 3.2 API y seguridad

- Los endpoints públicos actuales SHALL conservar sus contratos y respuestas compatibles.
- Los DTOs SHALL validar entradas inválidas con `400`.
- Los recursos inexistentes SHALL responder `404`.
- La falta de autenticación SHALL responder `401`.
- Los permisos insuficientes SHALL responder `403`.
- Los conflictos de estado, concurrencia, duplicados o reacciones SHALL responder `409` cuando corresponda.
- Nunca se expondrán `passwordHash`, refresh tokens, secretos, emails no públicos ni rutas internas de almacenamiento.
- Las reglas de autorización SHALL permanecer validadas en backend.

### 3.3 Persistencia y ejecución local

- Las migraciones Drizzle SHALL aplicarse sobre PostgreSQL limpio.
- El seed SHALL ser idempotente.
- Docker Compose SHALL iniciar PostgreSQL y la API con la configuración documentada.
- Los datos SHALL persistir después de reiniciar los contenedores sin eliminar el volumen de PostgreSQL.
- La limpieza y rotación de refresh tokens SHALL funcionar según la configuración vigente.

### 3.4 Frontend, accesibilidad y responsive

- Las páginas públicas SHALL continuar siendo Server Components salvo componentes interactivos aislados.
- Las rutas administrativas SHALL separar shells servidor de componentes cliente interactivos.
- La navegación SHALL funcionar en móvil, tablet y desktop.
- Los formularios SHALL tener labels asociados, errores comprensibles y foco visible.
- Los controles interactivos SHALL tener objetivos táctiles mínimos de 44px.
- Los estados no dependerán únicamente del color.
- Se respetará `prefers-reduced-motion`.
- Las páginas SHALL conservar metadata SEO y HTML semántico.

## 4. Matriz de aceptación

### Público

- La portada muestra noticias publicadas ordenadas y paginadas.
- La búsqueda combina texto, filtros y fechas sin romper la portada.
- Las categorías y el detalle de noticia funcionan con y sin imágenes.
- Las imágenes relativas se resuelven contra la API.
- Solo se muestran públicamente comentarios publicados.
- Las reacciones muestran conteos sin exponer información privada.

### Backoffice

- `author` crea y envía sus noticias a revisión, pero no publica.
- `editor` revisa y publica noticias en `inReview`.
- `admin` puede gestionar usuarios, catálogo, configuración y flujo editorial.
- Las acciones se ocultan o rechazan según rol y estado.
- Las mutaciones actualizan correctamente las listas y el caché.
- La renovación automática del access token permite repetir una petición protegida una sola vez.

### Datos y seguridad

- El registro público siempre crea usuarios `author` sin sesión automática.
- El access token solo vive en memoria del frontend.
- El refresh token solo aparece en cookie `HttpOnly` y se persiste como hash.
- No se puede eliminar el último administrador ni cambiar el propio rol.
- Las operaciones sobre noticias respetan ownership, versión y máquina de estados.

## 5. Fuera de alcance

- Nuevos roles o permisos de negocio.
- Nuevos proveedores de almacenamiento.
- Cambios de ORM o de framework.
- Newsletter, notificaciones, suscripciones, multi-idioma o aplicaciones nativas.
- Tema oscuro.
- Funcionalidades no descritas en las Specs 001–005.

## 6. Criterio de finalización

La Spec 006 se considerará completada cuando todas sus tareas estén marcadas, las validaciones automatizadas pasen, las comprobaciones manuales estén documentadas y no existan fallos conocidos sin una decisión explícita de bloqueo.

