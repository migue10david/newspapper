# Plan 004 — Sistema visual y estructura UI/UX

## 1. Fundamentos visuales

1. Definir tokens de color, tipografía, espaciado, bordes, radios, sombras y breakpoints.
2. Definir escala tipográfica editorial responsive.
3. Establecer reglas de estados, contraste, foco y movimiento reducido.
4. Mantener el tema claro como referencia única.

## 2. Componentes base

1. Configurar shadcn/ui sobre la instalación existente de Next.js, Tailwind y TypeScript.
2. Generar `Button`, `Input`, `Select`, `Badge` y `Alert` desde shadcn/ui.
3. Crear `Card`, `EmptyState`, `LoadingState`, `Pagination` y `PageHeader` reutilizando y adaptando esos componentes.
4. Incorporar `Dialog`, `Table`, `Tabs`, `DropdownMenu` o `Sheet` solo cuando una pantalla los necesite.
5. Documentar variantes, estados, tamaños y comportamiento responsive.
6. Garantizar que los componentes sean accesibles por teclado y lectores de pantalla.

## 3. Layout público

1. Separar navbar, contenido y footer en una estructura consistente.
2. Normalizar el contenedor de lectura y la retícula editorial.
3. Rediseñar portada, categoría, búsqueda y detalle de noticia.
4. Revisar jerarquía semántica, metadata visible y estados vacíos.
5. Mantener las páginas públicas como Server Components.

## 4. Layout administrativo

1. Crear un shell visual diferenciado para el backoffice.
2. Normalizar navegación, encabezados y sección activa.
3. Rediseñar dashboard, noticias, editor, catálogo, usuarios y configuración.
4. Hacer visibles las capacidades por rol y las acciones de transición.
5. Normalizar feedback de carga, éxito, error, permisos y conflictos.

## 5. Calidad visual y accesibilidad

- Revisar contraste WCAG 2.2 AA.
- Verificar foco visible y navegación por teclado.
- Verificar objetivos táctiles de 44px.
- Probar móvil, tablet y desktop.
- Respetar `prefers-reduced-motion`.
- Ejecutar lint, typecheck, tests y build.
