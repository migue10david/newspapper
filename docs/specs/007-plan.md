# Plan — Spec 007: Engagement de lectores

## Objetivo

Implementar guardados, historial de lectura y compartir noticias usando la autenticación, los clientes Axios y TanStack Query existentes.

## Fases

### 1. Datos y backend

- Crear tablas, índices, restricciones únicas y migración Drizzle.
- Crear DTOs de paginación y respuestas públicas.
- Implementar guardado idempotente y retirada.
- Implementar historial idempotente, eliminación individual y limpieza total.
- Validar autenticación, ownership y estado `published`.

### 2. Tests backend

- Probar creación, repetición, retirada y paginación de guardados.
- Probar registro idempotente, actualización de fecha y limpieza de historial.
- Probar usuarios no autenticados, noticias inexistentes y noticias no publicadas.
- Probar aislamiento entre usuarios y cascadas al eliminar noticias.

### 3. Cliente y frontend

- Añadir tipos y clientes API autenticados.
- Crear queries y mutations con claves estables.
- Añadir acción de guardado al detalle público.
- Crear páginas de guardados e historial.
- Añadir acciones de compartir sin dependencia del backend.
- Mantener páginas servidor y componentes cliente mínimos.

### 4. Accesibilidad y experiencia

- Añadir labels, estados `aria-pressed`, mensajes `aria-live` y foco visible.
- Mostrar estados de carga, vacío, sesión requerida, error y conflicto.
- Verificar objetivos táctiles y responsive.
- Mantener funcionamiento cuando `navigator.share` o la API estén disponibles o no.

### 5. Integración por ramas

- Implementar backend en la rama `backend`.
- Implementar frontend en la rama `frontend`.
- Validar cada rama de forma independiente.
- Integrar ambas ramas en `dev`.
- Ejecutar la suite completa desde `dev` antes del push.

## Validación final

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter newspapper test:e2e
```

La integración no se considerará completa hasta comprobar manualmente guardados, historial y compartir en móvil, tablet y desktop.

