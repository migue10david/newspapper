# Spec 004 — Sistema visual y estructura UI/UX

- **Estado**: Propuesta aprobada
- **Versión**: 1.0
- **Ubicación**: `docs/specs/004-visual-design.md`

## 1. Propósito

Definir la dirección visual, la estructura de navegación y las reglas de experiencia de usuario del periódico digital.

La interfaz seguirá una dirección de editorial contemporánea: jerarquía tipográfica fuerte, retícula inspirada en publicaciones periodísticas, color rojo como acento de marca, espacio negativo generoso y prioridad a la lectura y a las tareas editoriales.

Esta spec documenta el rediseño. No modifica todavía componentes ni estilos existentes.

## 2. Principios de diseño

- La lectura será la acción principal del sitio público.
- El contenido tendrá prioridad sobre la decoración.
- Cada pantalla tendrá una jerarquía visual clara y una acción principal identificable.
- La interfaz será mobile-first y se adaptará a móvil, tablet y desktop.
- Los patrones repetidos se resolverán mediante componentes reutilizables.
- Los estados de carga, vacío, error, éxito y permisos serán explícitos.
- La accesibilidad será parte del diseño, no una revisión posterior.
- El sistema usará tema claro en esta versión.

## 3. Dirección visual

### 3.1 Paleta

La paleta base estará formada por:

- blanco y zinc para superficies, texto y bordes;
- rojo editorial para acciones principales, enlaces activos y acentos;
- verde, amarillo y rojo oscuro únicamente para comunicar estados semánticos;
- fondos suaves para agrupar formularios, alertas y estados secundarios.

Los colores deberán exponerse mediante tokens centralizados y no mediante valores repetidos arbitrariamente en cada componente.

El contraste entre texto y fondo deberá cumplir WCAG 2.2 AA.

### 3.2 Tipografía

- Los titulares utilizarán una familia display o serif con carácter editorial.
- La navegación, los controles, los metadatos y el texto auxiliar utilizarán una familia sans legible.
- Se definirá una escala tipográfica responsive para:
  - display;
  - h1;
  - h2;
  - h3;
  - cuerpo;
  - resumen;
  - metadata;
  - texto auxiliar.
- Los titulares deberán mantener una longitud de línea y un interlineado adecuados para lectura rápida.
- El cuerpo de las noticias priorizará una medida cómoda y un interlineado amplio.

### 3.3 Tokens

El sistema visual deberá centralizar tokens para:

- colores;
- tipografías;
- tamaños de texto;
- interlineado;
- espaciado;
- radios;
- bordes;
- sombras;
- elevación;
- estados interactivos;
- breakpoints.

Los tokens se definirán de forma que un futuro tema oscuro pueda reutilizarlos sin rediseñar la estructura de componentes.

## 4. Retícula y responsive

- **Móvil**: una columna, navegación compacta y controles apilados.
- **Tablet**: una o dos columnas según el contenido, con mayor separación entre módulos.
- **Desktop**: retícula editorial con contenido principal y columnas auxiliares cuando aporten contexto.

La estructura deberá contemplar como mínimo:

- contenedor de lectura;
- contenedor ancho para listados;
- columna principal de noticia;
- columna auxiliar para metadata, navegación relacionada o acciones;
- separación consistente entre secciones.

Los objetivos táctiles deberán tener al menos 44px de alto y ancho cuando sean interactivos.

## 5. Componentes base

La implementación posterior utilizará shadcn/ui como base para los componentes reutilizables. Los componentes se generarán dentro del repositorio y se personalizarán con Tailwind para respetar la dirección editorial.

No se utilizarán los estilos por defecto de shadcn/ui sin adaptación visual. La tipografía, los tokens, los estados y la composición deberán pertenecer al sistema visual del periódico.

La implementación deberá cubrir como mínimo:

- `Button`;
- `Input`;
- `Select`;
- `Badge`;
- `Alert`;
- `Card`;
- `EmptyState`;
- `LoadingState`;
- `Pagination`;
- `PageHeader`.

Se podrán incorporar componentes adicionales de shadcn/ui cuando resuelvan una necesidad real de interacción, por ejemplo `Dialog`, `Table`, `Tabs`, `DropdownMenu`, `Sheet` o `Tooltip`.

La instalación deberá mantener la configuración actual de Next.js, Tailwind y TypeScript, sin introducir otra librería UI paralela.

Cada componente deberá documentar variantes, estados, contenido accesible y comportamiento responsive.

### Estados obligatorios

- `default`;
- `hover`;
- `focus-visible`;
- `active`;
- `disabled`;
- `loading`;
- `error`;
- `success` cuando aplique.

Los estados no dependerán únicamente del color: utilizarán texto, iconografía, borde, forma o posición además del color.

## 6. Estructura pública

### 6.1 Navbar

El navbar público deberá incluir:

- identidad del sitio mediante logo o nombre textual;
- enlace a portada;
- acceso visible a búsqueda;
- acceso de autenticación o datos de sesión;
- comportamiento compacto en móvil;
- foco visible y navegación por teclado.

### 6.2 Portada

La portada deberá priorizar:

1. una noticia principal;
2. contenido secundario organizado por jerarquía;
3. lectura rápida mediante categoría, fecha y resumen;
4. paginación clara;
5. estado vacío comprensible.

La noticia principal tendrá mayor peso tipográfico y espacial sin ocultar el resto del contenido.

### 6.3 Búsqueda

La página de búsqueda deberá incluir:

- campo de texto libre;
- filtros editoriales disponibles;
- acción principal claramente identificada;
- contador de resultados;
- resultados legibles en lista;
- estado sin resultados con orientación para continuar;
- paginación que conserve los filtros activos;
- mensaje de error recuperable.

### 6.4 Categoría

La página de categoría deberá mostrar:

- nombre y contexto de la categoría;
- cantidad de resultados y paginación;
- listado consistente con la portada;
- navegación de retorno a portada;
- estado vacío específico.

### 6.5 Detalle de noticia

El detalle deberá priorizar, en este orden:

1. titular;
2. resumen;
3. autor, categoría y fecha;
4. imagen destacada;
5. cuerpo de la noticia;
6. tags;
7. navegación relacionada.

El cuerpo deberá mantener una medida cómoda de lectura, separación clara entre bloques y estilos consistentes para párrafos, encabezados, listas e imágenes.

### 6.6 Footer y SEO visible

El footer deberá mostrar identidad, descripción y navegación secundaria sin competir con el contenido principal.

La estructura visual deberá acompañar los metadatos SEO nativos de Next.js mediante jerarquía semántica, un único `h1` principal y textos descriptivos.

## 7. Estructura del backoffice

El backoffice utilizará un shell visual separado del sitio público, aunque conserve la identidad cromática del periódico.

### 7.1 Navegación

- Desktop: navegación lateral o barra superior con sección activa claramente marcada.
- Móvil: navegación compacta, desplegable o apilada sin bloquear el contenido.
- La navegación deberá mostrar opciones según el rol del usuario.
- El estado activo deberá comunicarse con texto, peso, borde o iconografía, no solo color.

### 7.2 Dashboard

El dashboard deberá ofrecer:

- resumen del trabajo editorial;
- acceso rápido a noticias;
- indicación de estados relevantes;
- acciones principales según rol;
- logout claramente accesible.

### 7.3 Noticias

El área de noticias deberá incluir:

- encabezado de página;
- filtros y búsqueda;
- listado responsive;
- estado editorial visible mediante badge y texto;
- acciones contextuales según rol y estado;
- paginación;
- feedback tras mutaciones.

### 7.4 Editor

El editor de noticias deberá organizar el formulario por grupos comprensibles:

- información principal;
- resumen y cuerpo;
- categoría, tags y autor cuando corresponda;
- imagen y fecha;
- guardado y acciones editoriales.

Las acciones de guardar, enviar a revisión, publicar, devolver a borrador, editar y eliminar deberán diferenciarse visualmente y comunicar sus consecuencias.

### 7.5 Catálogo, usuarios y configuración

Estas áreas deberán compartir:

- `PageHeader`;
- tablas o listas legibles en móvil;
- formularios con labels y errores asociados;
- confirmación para acciones destructivas;
- estados de carga y vacío;
- feedback de permisos y conflictos.

La gestión de usuarios deberá mostrar claramente rol, identidad, perfil vinculado y restricciones de la cuenta actual.

## 8. Accesibilidad y UX

- Cumplir WCAG 2.2 AA como objetivo visual y de interacción.
- Mantener foco visible con `focus-visible`.
- Permitir completar formularios con teclado.
- Asociar cada error al campo correspondiente.
- Proporcionar labels visibles o accesibles para todos los controles.
- Usar `aria-live` para resultados de operaciones y errores no bloqueantes.
- Respetar `prefers-reduced-motion`.
- Evitar animaciones necesarias para entender una acción.
- No usar placeholders como sustitutos de labels.
- Mantener mensajes de error concretos y accionables.

## 9. Validación

La implementación posterior deberá pasar:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

También deberá verificarse visualmente en móvil, tablet y desktop:

- portada;
- búsqueda;
- categoría;
- detalle de noticia;
- login;
- listado editorial;
- editor de noticias;
- catálogo;
- usuarios;
- configuración.

## 10. Fuera de alcance

- Implementación inmediata del rediseño.
- Tema oscuro en esta versión.
- Cambio de framework CSS.
- Incorporación de otra librería UI distinta de shadcn/ui.
- Cambio de Next.js, Zustand, Axios o TanStack Query.
