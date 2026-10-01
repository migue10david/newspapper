# Spec 001 — Plataforma de Noticias (MVP)

- **Estado**: Aprobada
- **Versión**: 1.0
- **Ubicación**: `docs/specs/001-news-platform.md`

## 1. Propósito (POR QUÉ)

Definir el MVP del periódico digital: **lectura pública** y **gestión editorial**, garantizando una base coherente con la constitución (stack, calidad, tests, límites) antes de escribir código.

## 2. Decisiones de dominio

1. **Identidad**: `Author` es una entidad separada de `User`. Un `User` de backoffice puede estar vinculado a un perfil `Author`; la noticia referencia `Author`.
2. **Autenticación**: JWT bearer (access token) para los endpoints de gestión; credenciales solo vía variables de entorno.
3. **Matriz de transiciones de estado**:
   - `draft` → `inReview`, `archived`
   - `inReview` → `draft`, `published`, `scheduled`
   - `scheduled` → `draft`, `published` (vía job o cancelación manual a `draft`)
   - `published` → `archived`
   - `archived` → (estado final, sin transiciones)
4. **Programación**: un job periódico (cada minuto) pasa `scheduled` → `published` cuando `publishedAt <= now`. No se garantiza exactitud al segundo.
5. **Archivado en público**: una noticia `archived` se comporta como no publicada (HTTP 404).

## 3. Requisitos Funcionales (EARS)

### 3.1 Contenido público

- **RF-001**: WHEN un visitante solicita la portada, THE SYSTEM SHALL mostrar las noticias `published` ordenadas por `publishedAt` descendente con desempate por `_id` descendente, y paginadas como el resto de listados (ver RF-040).
- **RF-002**: WHEN un visitante solicita una categoría válida, THE SYSTEM SHALL mostrar solo noticias `published` de esa categoría, paginadas.
- **RF-003**: WHEN un visitante solicita una noticia por slug, THE SYSTEM SHALL devolver (endpoint API público y página renderizada que lo consume) título, resumen, cuerpo, imagen destacada, autor, categoría, tags y fecha de publicación.
- **RF-004**: IF una noticia no existe, no está `published` o está `archived`, THEN THE SYSTEM SHALL devolver HTTP 404 sin revelar su existencia.
- **RF-005**: WHEN un listado no tiene resultados, THE SYSTEM SHALL devolver colección vacía con HTTP 200.

### 3.2 Ciclo de vida editorial

- **RF-010**: THE SYSTEM SHALL soportar los estados: `draft`, `inReview`, `scheduled`, `published`, `archived`, conforme a la matriz de transiciones de la sección 2.
- **RF-011**: WHEN una noticia `scheduled` alcanza su `publishedAt`, THE SYSTEM SHALL publicarla automáticamente mediante el job de programación definido en la sección 2.
- **RF-012**: IF una transición de estado no está en la matriz de transiciones, THEN THE SYSTEM SHALL rechazarla con HTTP 409.
- **RF-013**: THE SYSTEM SHALL permitir borrado físico solo de noticias en `draft` (por su autor o un `Admin`); las noticias `published` no se pueden borrar, solo archivar (por `Editor` o `Admin`).

### 3.3 Roles y permisos

- **RF-020**: THE SYSTEM SHALL soportar los roles `Author`, `Editor` y `Admin`.
- **RF-021**: WHEN un `Author` actúa, THE SYSTEM SHALL permitir crear y editar sus propias noticias en `draft`/`inReview` y enviarlas a revisión; no podrá borrar, publicar ni programar.
- **RF-022**: WHEN un `Editor` actúa, THE SYSTEM SHALL permitir editar, publicar, programar y archivar cualquier noticia y gestionar tags/categorías.
- **RF-023**: WHEN un `Admin` actúa, THE SYSTEM SHALL permitir además gestionar usuarios, autores y configuración.
- **RF-024**: IF un usuario autenticado intenta una acción fuera de su rol, THEN THE SYSTEM SHALL devolver HTTP 403.
- **RF-025**: IF un usuario no autenticado accede al backoffice/API de gestión, THEN THE SYSTEM SHALL devolver HTTP 401.
- **RF-026**: WHEN un endpoint de gestión recibe una petición errónea, THE SYSTEM SHALL responder: 404 si el recurso no existe, 400 si el DTO es inválido, y 409 ante conflicto de estado, slug duplicado o concurrencia.
- **RF-027**: WHEN un `Admin` gestiona usuarios, THE SYSTEM SHALL permitir listar usuarios, crear usuarios con los roles existentes y actualizar el rol de otro usuario sin exponer `passwordHash`.
- **RF-028**: IF un usuario no es `Admin`, THEN THE SYSTEM SHALL rechazar la gestión de usuarios con HTTP 403; un `Admin` no podrá cambiar su propio rol ni dejar el sistema sin administradores.

### 3.4 Campos de noticia

- **RF-030**: THE SYSTEM SHALL persistir por noticia: título, slug único, resumen, cuerpo (rich text en JSON tipado, sanitizado en backend), imagen destacada, categoría, autor, tags y `publishedAt` opcional.
- **RF-031**: IF falta un campo obligatorio o el slug está duplicado, THEN THE SYSTEM SHALL rechazar la petición con HTTP 400 y errores por campo.
- **RF-032**: THE SYSTEM SHALL normalizar el slug (minúsculas, sin acentos, guiones) y mantenerlo inmutable tras `published`, salvo intervención de un `Admin`.
- **RF-033**: THE SYSTEM SHALL aceptar imagen destacada opcional en formato jpg/png/webp de máximo 5 MB; si el asset se elimina, la noticia queda sin imagen sin bloquear su publicación.
- **RF-034**: IF se intenta eliminar una categoría o tag con noticias asociadas, THEN THE SYSTEM SHALL rechazarlo con HTTP 409.
- **RF-035**: WHEN se actualiza una noticia, THE SYSTEM SHALL exigir control de concurrencia optimista mediante `updatedAt`/revisión; si no coincide, devolver HTTP 409.

### 3.5 API

- **RF-040**: WHEN se solicita un listado paginado, THE SYSTEM SHALL aceptar `page` (entero ≥ 1, default 1) y `size` (entero 1–50, default 20), devolviendo metadatos de paginación; `page` fuera de rango devuelve colección vacía con HTTP 200.
- **RF-041**: IF `page` o `size` son inválidos, THEN THE SYSTEM SHALL devolver HTTP 400.
- **RF-042**: THE SYSTEM SHALL exponer los endpoints de lectura pública sin autenticación y los de gestión exclusivamente autenticados.
- **RF-043**: THE SYSTEM SHALL exponer para gestión: `POST/GET/PATCH/DELETE` sobre `news`, `categories`, `tags` y `authors`, sujetos a RF-024/025/026.

### 3.6 Presentación y SEO

- **RF-050**: THE SYSTEM SHALL renderizar las páginas públicas con HTML semántico y metadatos SEO nativos de Next.js: title, description, canonical y Open Graph básico por página.
- **RF-051**: THE SYSTEM SHALL ser responsive en móvil, tablet y desktop con enfoque mobile-first.

### 3.7 Autenticación

- **RF-060**: WHEN un usuario envía email y contraseña válidos al endpoint de login, THE SYSTEM SHALL devolver un JWT de acceso.
- **RF-061**: THE SYSTEM SHALL almacenar secretos (clave JWT, credenciales) únicamente en variables de entorno, nunca en el repositorio.
- **RF-062**: WHEN el login es válido, THE SYSTEM SHALL emitir un refresh token opaco, persistir únicamente su hash asociado al usuario y enviarlo en una cookie `HttpOnly`.
- **RF-063**: THE SYSTEM SHALL mantener el access token con una duración de 1 hora y el refresh token con una duración de 7 días.
- **RF-064**: WHEN se solicita renovar la sesión con un refresh token válido, THE SYSTEM SHALL invalidar el token anterior, emitir uno nuevo y devolver un nuevo access token.
- **RF-065**: WHEN un usuario cierra sesión, THE SYSTEM SHALL eliminar el refresh token persistido y limpiar su cookie.
- **RF-066**: WHEN un refresh token está vencido o es inválido, THE SYSTEM SHALL responder HTTP 401; los tokens vencidos SHALL eliminarse de la base de datos mediante uso o limpieza periódica.
- **RF-067**: THE SYSTEM SHALL permitir varias sesiones simultáneas por usuario, aislando la rotación y revocación por refresh token.
- **RF-068**: WHEN el login del frontend es válido, THE SYSTEM SHALL mantener el access token únicamente en memoria y determinar el rol desde su payload JWT; `admin` SHALL navegar a `/admin` y los demás roles SHALL navegar a `/`.
- **RF-069**: WHEN el frontend inicia una sesión administrativa, THE SYSTEM SHALL intentar restaurarla mediante `/auth/refresh` y adjuntar el access token válido como bearer token a las peticiones protegidas.
- **RF-070**: WHEN una petición protegida del frontend recibe HTTP 401, THE SYSTEM SHALL ejecutar un refresh coordinado, reintentar una sola vez la petición original y redirigir a `/admin/login` si el refresh falla.
- **RF-071**: WHEN un visitante se registra con un email válido y una contraseña de al menos 8 caracteres, THE SYSTEM SHALL crear una cuenta con rol `author` sin emitir tokens ni iniciar sesión automáticamente.
- **RF-072**: IF el email ya está registrado, THEN THE SYSTEM SHALL rechazar el registro público con HTTP 409.
- **RF-073**: THE SYSTEM SHALL aceptar únicamente email y contraseña en el registro público; el rol SHALL ser asignado por el backend y no podrá ser enviado por el cliente.
- **RF-074**: WHEN un usuario tiene una sesión activa, THE SYSTEM SHALL mostrar en el navbar su email y rol, junto con el acceso al panel para `admin` y la acción de cerrar sesión.
- **RF-075**: WHEN un usuario autorizado crea una noticia, THE SYSTEM SHALL asociarla al perfil `Author` vinculado a su usuario e ignorar cualquier `authorId` enviado por el cliente; si la cuenta `author`/`admin` aún no tiene perfil, THE SYSTEM SHALL provisionarlo automáticamente.
- **RF-076**: WHEN un `Author` actúa sobre noticias, THE SYSTEM SHALL permitirle crear, editar sus propias noticias en `draft`/`inReview` y enviarlas de `draft` a `inReview`; no podrá modificar noticias ajenas ni publicar.
- **RF-080**: WHEN un `Admin` actúa sobre una noticia en `draft`, THE SYSTEM SHALL permitirle enviarla a `inReview`; la publicación SHALL continuar requiriendo que la noticia esté en `inReview`.
- **RF-077**: WHEN un `Editor` revisa una noticia `inReview`, THE SYSTEM SHALL permitirle editarla y aprobarla mediante la transición `inReview` → `published`; no podrá crear noticias.
- **RF-078**: WHEN un `Admin` crea una noticia, THE SYSTEM SHALL asociarla al perfil `Author` vinculado a su usuario; además SHALL permitirle editar cualquier noticia y ejecutar las transiciones editoriales permitidas.
- **RF-079**: THE SYSTEM SHALL permitir a un `Admin` vincular o desvincular un perfil `Author` de un usuario `author`; las noticias gestionadas SHALL respetar esa vinculación.

## 4. Fuera de alcance original y extensiones posteriores

La versión inicial de esta spec dejó fuera las siguientes capacidades:

- comentarios, likes/reacciones, búsqueda avanzada, compartir social, newsletter, notificaciones push, paywall/suscripciones, multi-idioma, AMP, apps nativas y preview de borradores por token.

Posteriormente, comentarios y reacciones fueron definidos e implementados en la Spec 005, y la búsqueda avanzada en la Spec 003. Estas specs posteriores amplían el MVP y prevalecen sobre la exclusión original para esas capacidades concretas. El resto continúa fuera de alcance.

## 5. Criterios de finalización

1. Todos los RF implementados y verificables con tests (éxito, 400, 401, 403, 404, 409 según aplique).
2. `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build` pasan.
3. Portada, categoría, noticia 404 y gestión CRUD funcionan en los 3 tamaños de pantalla.
4. Permisos validados en backend; contratos API consistentes con esta spec.
