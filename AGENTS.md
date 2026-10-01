# AGENTS.md — Periódico de Noticias

## Proyecto

Plataforma web de un periódico digital de noticias desarrollada con **Next.js** para el frontend y **NestJS** para el backend.

El proyecto utiliza **TypeScript** y sigue un enfoque de **Spec-Driven Development (SDD)**, por lo que toda funcionalidad debe estar definida en una especificación antes de ser implementada.

La arquitectura es un monorepo pnpm workspaces con:

* `newspapper-frontend/`: aplicación Next.js.
* `newspapper/`: API REST con NestJS.
* `docs/`: documentación del proyecto.
* `docs/specs/`: especificaciones de funcionalidades (spec, plan y tareas).
* `docs/constitution.md`: principios y reglas globales del proyecto.

## Comandos

* Instalar dependencias: `pnpm install`
* Ejecutar proyecto: `pnpm dev`
* Tests: `pnpm test`
* Lint: `pnpm lint`
* Formato: `pnpm format`
* Type check: `pnpm typecheck`
* Build: `pnpm build`

Frontend:

* Ejecutar: `pnpm --filter newspapper-frontend dev`
* Tests: `pnpm --filter newspapper-frontend test`
* Lint: `pnpm --filter newspapper-frontend lint`
* Build: `pnpm --filter newspapper-frontend build`

Backend:

* Ejecutar: `pnpm --filter newspapper start:dev`
* Tests: `pnpm --filter newspapper test`
* Lint: `pnpm --filter newspapper lint`
* Build: `pnpm --filter newspapper build`

No inventes comandos si no existen en los `package.json`. Revisa primero los scripts disponibles en el proyecto.

## Estilo y convenciones

* Utiliza **TypeScript** tanto en frontend como en backend.
* Mantén TypeScript en modo estricto.
* Evita utilizar `any`.
* Utiliza `unknown` cuando un tipo todavía no pueda determinarse de forma segura.
* El código, nombres de variables, funciones, clases, componentes, archivos, DTOs y entidades deben escribirse en **inglés**.
* El contenido visible para los usuarios puede escribirse en **español**.
* Utiliza `camelCase` para variables y funciones.
* Utiliza `PascalCase` para clases, interfaces, tipos, DTOs y componentes React.
* Utiliza `UPPER_SNAKE_CASE` para constantes globales.
* Los booleanos deben utilizar nombres claros como `isPublished`, `isFeatured`, `hasImage` o `canEdit`.
* Mantén funciones y componentes pequeños y con una única responsabilidad.
* Evita duplicar código.
* Reutiliza componentes, servicios, utilidades y tipos existentes antes de crear nuevos.
* No añadas abstracciones innecesarias pensando en funcionalidades futuras.

### Next.js

* Utiliza **App Router**.
* Utiliza Server Components por defecto.
* Añade `"use client"` únicamente cuando sea necesario utilizar estado, eventos, hooks o APIs del navegador.
* Evita convertir páginas completas en Client Components si solo una pequeña parte necesita interactividad.
* Mantén separada la lógica de obtención de datos de los componentes visuales.
* Las páginas deben ser responsive para:

  * móvil;
  * tablet;
  * desktop.
* Sigue un enfoque mobile-first.
* Utiliza HTML semántico cuando corresponda:

  * `header`
  * `nav`
  * `main`
  * `article`
  * `section`
  * `aside`
  * `footer`
* Las páginas públicas de noticias deben contemplar SEO utilizando las herramientas nativas de Next.js.

### NestJS

* Organiza el backend por módulos de dominio.
* Mantén la separación:

```text
Controller
    ↓
Service
    ↓
Repository / acceso a datos
```

* Los controllers no deben contener lógica de negocio compleja.
* Utiliza DTOs para los datos recibidos por la API.
* Valida toda información proveniente del cliente.
* No utilices directamente entidades de base de datos como DTOs de entrada.
* Las reglas críticas de negocio deben validarse siempre en el backend.
* Utiliza correctamente los códigos HTTP.
* Mantén consistentes los contratos de la API.

### Dominio

Utiliza nombres consistentes para las entidades principales del periódico, por ejemplo:

* `News`
* `Category`
* `Author`
* `Tag`
* `Media`
* `User`

No utilices distintos nombres para representar el mismo concepto si la spec no lo requiere.

Por ejemplo, no mezcles arbitrariamente:

* `News`
* `Article`
* `Post`
* `Story`

si todos representan una noticia.

Utiliza siempre el término definido por la spec.

## Reglas

* Lee `docs/constitution.md` y la spec activa antes de tocar código.
* La spec activa es la fuente de verdad para los requisitos funcionales.
* Revisa el código existente relacionado con la tarea antes de implementar cambios.
* No implementes funcionalidades que no estén solicitadas por la spec.
* No inventes reglas de negocio.
* Si una regla importante no está definida en la spec, indícalo en lugar de asumir su comportamiento.
* No cambies la arquitectura general sin que la tarea o la spec lo requieran.
* No cambies el ORM, base de datos, sistema de autenticación, librería UI o gestor de estado sin autorización.
* No añadas nuevas dependencias si la funcionalidad puede resolverse razonablemente con las dependencias existentes.
* No modifiques archivos que no estén relacionados con la tarea salvo que sea estrictamente necesario.
* No cambies contratos públicos de la API sin revisar su impacto.
* No desactives TypeScript, ESLint o tests para evitar errores.
* No utilices `any` como solución rápida para errores de tipos.
* No elimines tests existentes únicamente para conseguir que la suite pase.
* No dejes `console.log`, código temporal o código comentado innecesariamente.
* No almacenes secretos, contraseñas, tokens ni API keys en el repositorio.
* Utiliza variables de entorno para información sensible.
* No confíes en validaciones realizadas únicamente en el frontend.
* Los permisos, roles y reglas de negocio deben comprobarse en el backend.
* Antes de utilizar una API de Next.js, NestJS, React, Node.js o cualquier dependencia, comprueba que sea compatible con la versión instalada en el proyecto.
* Mantén cada cambio enfocado exclusivamente en la tarea activa.

## Al terminar cualquier tarea

* Revisa todos los archivos modificados.
* Comprueba que la implementación cumple la spec activa.
* Ejecuta:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

* Si la tarea afecta la compilación o configuración del proyecto, ejecuta también:

```bash
pnpm build
```

* Corrige todos los errores provocados por los cambios realizados.
* Comprueba que no existan imports sin utilizar.
* Comprueba que no existan errores de TypeScript.
* Comprueba que no existan logs temporales.
* Comprueba que no se hayan añadido secretos al repositorio.
* Comprueba que no existan cambios no relacionados con la tarea.

Para tareas de frontend, verifica cuando corresponda:

* Mobile.
* Tablet.
* Desktop.

Para tareas de backend, verifica cuando corresponda:

* Caso exitoso.
* Datos inválidos.
* Recurso inexistente.
* Permisos.
* Errores esperados.

Al finalizar, informa brevemente:

* qué se implementó;
* qué archivos principales se modificaron;
* qué tests o validaciones se ejecutaron;
* resultado de `lint`, `typecheck`, `test` y `build`;
* cualquier limitación o punto pendiente de la spec.

No afirmes que un test, lint, typecheck o build fue exitoso si no fue ejecutado.

