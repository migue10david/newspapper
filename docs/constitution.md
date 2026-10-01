# Constitución del Proyecto

1. **Stack fijo**: Next.js (App Router, Server Components por defecto) + NestJS + TypeScript estricto. No cambiar sin aprobación explícita.
2. **Spec-Driven**: ninguna funcionalidad se implementa sin spec en `docs/specs/`; la spec es la única fuente de verdad.
3. **Tipado**: prohibido `any`; usar `unknown` si el tipo no es conocido. Código y artefactos en inglés; contenido de usuario en español.
4. **Calidad obligatoria**: todo cambio debe pasar `pnpm lint`, `pnpm typecheck` y `pnpm test` antes de darse por terminado.
5. **Tests**: toda regla de negocio de backend requiere test (caso exitoso, datos inválidos, recurso inexistente, permisos). No eliminar tests para hacer pasar la suite.
6. **Seguridad**: validación y permisos siempre en backend; secretos solo en variables de entorno; nunca en el repo.
7. **Contratos API**: DTOs para entrada, códigos HTTP correctos, no romper contratos públicos sin revisar impacto.
8. **Dependencias**: no añadir nuevas si lo existente resuelve el caso; verificar compatibilidad de versiones antes de usar una API.
9. **Minimalismo**: cambios enfocados a la tarea; sin abstracciones especulativas, sin duplicación, sin logs ni código muerto.
10. **Responsive + SEO**: páginas públicas mobile-first (móvil/tablet/desktop), HTML semántico y SEO nativo de Next.js.

## Límites explícitos

No cambiar ORM, base de datos, autenticación, librería UI ni gestor de estado sin autorización. No modificar archivos ajenos a la tarea.
