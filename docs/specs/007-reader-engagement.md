# Spec 007 — Engagement de lectores

- **Estado**: Propuesta
- **Versión**: 1.0
- **Depende de**: Specs 001, 003, 004, 005 y 006

## 1. Propósito

Ampliar el MVP con herramientas que permitan a los lectores autenticados conservar y retomar contenido de interés, sin cambiar el flujo editorial ni romper las páginas públicas.

La primera versión cubrirá:

- noticias guardadas;
- historial de lectura;
- acciones de compartir mediante enlaces públicos.

## 2. Alcance funcional

### 2.1 Noticias guardadas

- Cualquier usuario autenticado podrá guardar una noticia publicada.
- Podrá retirar una noticia guardada.
- Una noticia solo podrá aparecer una vez por usuario.
- Guardar la misma noticia dos veces será idempotente.
- Las noticias no publicadas no podrán guardarse.
- El usuario podrá consultar su listado paginado de noticias guardadas.
- El listado conservará la información pública actual de cada noticia.
- Si una noticia guardada deja de estar publicada, no aparecerá en el listado público del usuario.

### 2.2 Historial de lectura

- Un usuario autenticado podrá registrar que ha abierto una noticia publicada.
- Registrar varias veces la misma noticia actualizará `lastReadAt` sin duplicar el registro.
- El historial se devolverá ordenado por `lastReadAt` descendente.
- El usuario podrá consultar su historial paginado.
- El usuario podrá eliminar una entrada concreta del historial.
- El usuario podrá limpiar todo su historial.
- El historial no será visible para otros usuarios ni para visitantes.

### 2.3 Compartir

- Las noticias publicadas mostrarán acciones para compartir.
- Se ofrecerá copiar el enlace público.
- Se ofrecerán enlaces para compartir en canales web comunes sin crear endpoints nuevos.
- La URL compartida será la URL canónica de `/noticia/:slug`.
- No se almacenarán datos personales ni métricas de compartición en esta versión.
- Si la API no está disponible, copiar y compartir enlaces públicos seguirá funcionando.

## 3. Roles y privacidad

- `author`, `editor` y `admin` podrán usar guardados e historial como lectores autenticados.
- Un visitante podrá leer y compartir noticias, pero no guardar ni registrar historial.
- Un usuario solo podrá consultar, modificar o eliminar sus propios datos de engagement.
- El backend será la autoridad final para autorización y estado publicado.
- No se expondrán emails, tokens, hashes ni datos de actividad de otros usuarios.

## 4. Modelo de datos

### 4.1 `saved_news`

La tabla contendrá:

- `userId` con referencia a `users`;
- `newsId` con referencia a `news`;
- `createdAt`;
- clave primaria o restricción única sobre `(userId, newsId)`;
- índices por usuario y fecha.

### 4.2 `reading_history`

La tabla contendrá:

- `userId` con referencia a `users`;
- `newsId` con referencia a `news`;
- `lastReadAt`;
- `createdAt`;
- clave primaria o restricción única sobre `(userId, newsId)`;
- índices por usuario y fecha de lectura.

Las relaciones se eliminarán automáticamente cuando se elimine una noticia o un usuario. No se almacenará el cuerpo de la noticia ni información sensible del lector.

## 5. Contratos HTTP

```text
GET    /me/saved-news?page=&size=
PUT    /news/:id/save
DELETE /news/:id/save

GET    /me/reading-history?page=&size=
POST   /news/:id/read
DELETE /me/reading-history/:newsId
DELETE /me/reading-history
```

Reglas:

- Todos los endpoints anteriores requieren autenticación.
- `PUT /news/:id/save` será idempotente y devolverá el estado guardado.
- `POST /news/:id/read` será idempotente y actualizará `lastReadAt`.
- Los listados devolverán metadatos de paginación.
- Los recursos inexistentes devolverán `404`.
- Noticias no publicadas devolverán `404` en operaciones de engagement.
- Peticiones sin sesión devolverán `401`.
- DTOs y parámetros inválidos devolverán `400`.
- Conflictos de integridad devolverán `409` cuando corresponda.

Las respuestas de noticia reutilizarán el DTO público existente y no modificarán los contratos de `GET /public/news` ni `GET /public/news/:slug`.

## 6. Frontend

- Añadir una acción accesible “Guardar noticia” en el detalle público.
- Mostrar el estado guardado y permitir retirarlo.
- Mostrar una sección autenticada `/mis-noticias-guardadas`.
- Mostrar una sección autenticada `/mi-historial`.
- Mantener las páginas como Server Components y extraer únicamente las acciones interactivas a Client Components.
- Usar Axios autenticado con refresh automático y TanStack Query.
- Invalidar o actualizar las queries después de guardar, retirar, registrar lectura o limpiar historial.
- Mostrar estados de carga, vacío, error, sesión requerida y noticia no disponible.
- No persistir el access token en `localStorage`, `sessionStorage` ni en el navegador.
- Añadir controles de compartir con labels accesibles y fallback de copia cuando `navigator.share` no exista.

## 7. Branching e integración

- La documentación y la spec se mantendrán en la rama de trabajo acordada antes de integrar.
- Las tareas backend se desarrollarán en `backend`.
- Las tareas frontend se desarrollarán en `frontend`.
- Cada rama deberá validar sus cambios antes de integrarse.
- La integración final se realizará en `dev` mediante merge o cherry-pick, preservando los cambios locales no relacionados.
- No se hará push directo a `main` desde esta spec.

## 8. Criterios de aceptación

1. Un usuario autenticado puede guardar y retirar noticias publicadas.
2. El listado de guardados está paginado y solo muestra datos propios.
3. Abrir una noticia registra o actualiza una única entrada de historial.
4. El usuario puede consultar, eliminar una entrada y limpiar todo el historial.
5. Visitantes pueden compartir enlaces sin autenticarse.
6. Las noticias no publicadas no pueden guardarse ni registrarse en historial.
7. Se cubren `400`, `401`, `404` y `409` cuando corresponda.
8. Los contratos públicos actuales permanecen compatibles.
9. Las acciones funcionan con rotación automática del refresh token.
10. Se cubren accesibilidad, responsive y estados de error en móvil, tablet y desktop.

