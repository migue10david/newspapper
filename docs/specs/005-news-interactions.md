# Spec 005 — Interacción de usuarios con noticias

- **Estado**: Propuesta aprobada
- **Versión**: 1.0
- **Ubicación**: `docs/specs/005-news-interactions.md`

## 1. Propósito

Permitir que los usuarios autenticados participen en la conversación alrededor de las noticias mediante comentarios y reacciones, manteniendo la lectura pública, la moderación editorial y la privacidad de los usuarios.

## 2. Alcance

La spec incluye:

- comentarios planos sobre noticias publicadas;
- edición y eliminación lógica de comentarios propios;
- moderación de comentarios por `editor` y `admin`;
- reacciones `like` y `useful`;
- una reacción por usuario y noticia;
- consulta pública de comentarios publicados y conteos de reacciones;
- integración con el detalle público de la noticia y el backoffice.

Quedan fuera de alcance las respuestas anidadas, menciones, adjuntos, notificaciones, reportes de abuso, reputación, login social y comentarios anónimos.

## 3. Requisitos funcionales

### 3.1 Comentarios públicos y de usuarios

- **RF-501**: WHEN un visitante consulta las interacciones de una noticia publicada, THE SYSTEM SHALL devolver únicamente comentarios con estado `published`.
- **RF-502**: WHEN un usuario autenticado crea un comentario sobre una noticia publicada, THE SYSTEM SHALL crear el comentario con estado `pending`.
- **RF-503**: THE SYSTEM SHALL asociar cada comentario al usuario autenticado y a una noticia existente.
- **RF-504**: THE SYSTEM SHALL impedir comentarios sobre noticias que no estén `published`.
- **RF-505**: THE SYSTEM SHALL permitir a un usuario editar únicamente sus propios comentarios.
- **RF-506**: WHEN un comentario publicado es editado por su autor, THE SYSTEM SHALL devolverlo a estado `pending`.
- **RF-507**: THE SYSTEM SHALL permitir al autor solicitar la eliminación lógica de sus propios comentarios.
- **RF-508**: THE SYSTEM SHALL conservar el registro eliminado para trazabilidad y no mostrarlo en la consulta pública.
- **RF-509**: THE SYSTEM SHALL mantener los comentarios en un único nivel, sin respuestas anidadas.

### 3.2 Moderación

- **RF-520**: THE SYSTEM SHALL permitir a `editor` y `admin` consultar comentarios pendientes, publicados y ocultos.
- **RF-521**: THE SYSTEM SHALL permitir a `editor` y `admin` cambiar un comentario entre `pending`, `published` y `hidden`.
- **RF-522**: WHEN un comentario pasa a `published`, THE SYSTEM SHALL hacerlo visible en el endpoint público.
- **RF-523**: WHEN un comentario pasa a `hidden`, THE SYSTEM SHALL retirarlo de la respuesta pública sin eliminar su trazabilidad.
- **RF-524**: THE SYSTEM SHALL rechazar las acciones de moderación de `author` con HTTP 403.
- **RF-525**: THE SYSTEM SHALL exigir control de concurrencia mediante `version` en edición y moderación.

### 3.3 Reacciones

- **RF-530**: THE SYSTEM SHALL soportar inicialmente las reacciones `like` y `useful`.
- **RF-531**: WHEN un usuario autenticado registra una reacción, THE SYSTEM SHALL asociarla a su usuario y a una noticia publicada.
- **RF-532**: THE SYSTEM SHALL impedir más de una reacción activa por usuario y noticia.
- **RF-533**: THE SYSTEM SHALL permitir cambiar la reacción activa de una noticia.
- **RF-534**: THE SYSTEM SHALL permitir retirar la reacción activa.
- **RF-535**: Los visitantes podrán consultar los conteos públicos, pero no crear, cambiar ni retirar reacciones.
- **RF-536**: Las operaciones repetidas de establecer la misma reacción deberán ser idempotentes.

### 3.4 Autorización y errores

- **RF-540**: IF una operación protegida no incluye una sesión válida, THEN THE SYSTEM SHALL devolver HTTP 401.
- **RF-541**: IF un usuario autenticado intenta modificar un comentario ajeno o moderar sin rol suficiente, THEN THE SYSTEM SHALL devolver HTTP 403.
- **RF-542**: IF la noticia o comentario no existe, THEN THE SYSTEM SHALL devolver HTTP 404.
- **RF-543**: IF un DTO, tipo de reacción, texto o versión es inválido, THEN THE SYSTEM SHALL devolver HTTP 400.
- **RF-544**: IF una versión no coincide o se viola una restricción única, THEN THE SYSTEM SHALL devolver HTTP 409.
- **RF-545**: Las respuestas nunca expondrán emails, tokens, hashes, datos internos de moderación ni secretos.

## 4. Modelo de datos

### 4.1 `comments`

La tabla deberá contener como mínimo:

- `id` UUID;
- `newsId` con referencia a `news`;
- `userId` con referencia a `users`;
- `body` de texto;
- `status` con valores `pending`, `published` y `hidden`;
- `version` entero para concurrencia optimista;
- `createdAt`, `updatedAt` y `deletedAt` opcional.

La relación será de muchos comentarios para una noticia y muchos comentarios para un usuario. No habrá `parentId` en esta versión.

### 4.2 `news_reactions`

La tabla deberá contener como mínimo:

- `newsId` con referencia a `news`;
- `userId` con referencia a `users`;
- `type` con valores `like` y `useful`;
- `createdAt`, `updatedAt`.

La combinación `(newsId, userId)` será única. Se añadirán índices para consultar reacciones por noticia y usuario.

## 5. Contratos HTTP

### 5.1 Consulta pública

```text
GET /public/news/:slug/interactions
```

Respuesta `200`:

```json
{
  "comments": [
    {
      "id": "comment-id",
      "body": "Comentario publicado",
      "author": { "id": "user-id", "displayName": "Nombre público" },
      "createdAt": "2026-01-01T12:00:00.000Z"
    }
  ],
  "reactions": { "like": 4, "useful": 2 },
  "totalComments": 1
}
```

Solo se expondrán comentarios `published` y noticias `published`.

### 5.2 Comentarios del usuario

```text
POST   /news/:id/comments
PATCH  /comments/:id
DELETE /comments/:id
```

El cuerpo de creación y actualización será:

```json
{ "body": "Texto del comentario" }
```

Las operaciones de edición incluirán `version` para evitar sobrescribir cambios concurrentes. La eliminación será lógica y responderá con `204`.

### 5.3 Reacciones

```text
PUT    /news/:id/reaction
DELETE /news/:id/reaction
```

El cuerpo de `PUT` será:

```json
{ "type": "like" }
```

`PUT` creará o reemplazará la reacción del usuario. `DELETE` retirará la reacción y será seguro si no existe.

### 5.4 Moderación

```text
GET   /comments/manage?page=&size=&status=&newsId=
PATCH /comments/:id/moderation
```

El cuerpo de moderación será:

```json
{ "status": "published", "version": 1 }
```

Este contrato solo estará disponible para `editor` y `admin`.

## 6. Backend

- Crear módulos, servicios, controllers, DTOs, enums, migraciones e índices específicos de interacciones.
- Mantener separación controller → service → acceso Drizzle.
- Validar en backend el estado publicado de la noticia antes de crear comentarios o reacciones.
- Resolver el nombre público del autor sin exponer credenciales.
- Aplicar concurrencia optimista a comentarios y moderación.
- Mantener eliminación lógica de comentarios.
- No modificar ni romper los contratos actuales de noticias públicas.

## 7. Frontend

- Añadir cliente Axios para interacciones públicas y autenticadas.
- Mantener el detalle público de noticia como Server Component y extraer comentarios/reacciones a componentes cliente cuando necesiten estado o sesión.
- Mostrar comentarios publicados, estado vacío, carga, error y necesidad de iniciar sesión.
- Permitir crear, editar y eliminar comentarios propios.
- Mostrar reacciones con estados activo, inactivo, carga y error.
- Crear una vista de moderación dentro del backoffice para `editor` y `admin`.
- Integrar consultas y mutations mediante TanStack Query.
- Invalidar interacciones después de crear, editar, eliminar, moderar o cambiar una reacción.
- Mantener navegación por teclado, etiquetas accesibles y objetivos táctiles mínimos de 44px.

## 8. Criterios de aceptación

La spec se considerará implementada cuando:

1. Un usuario autenticado pueda comentar una noticia publicada.
2. Un visitante no autenticado no pueda comentar ni reaccionar.
3. Los comentarios nuevos aparezcan como pendientes y no sean visibles públicamente.
4. `editor` y `admin` puedan publicar u ocultar comentarios.
5. Un usuario pueda editar y eliminar únicamente sus comentarios.
6. Un comentario editado vuelva a moderación.
7. Cada usuario tenga como máximo una reacción por noticia.
8. Sea posible cambiar y retirar una reacción.
9. Las respuestas públicas no expongan información sensible.
10. Se cubran errores `400`, `401`, `403`, `404` y `409`.
11. Se mantenga la compatibilidad de los endpoints públicos existentes.
12. Pasen las validaciones indicadas en `005-tasks.md`.

