# DESIGN SYSTEM — SEBAS-POS (Apple HIG / iOS 19 LiquidGlass)

## 1. Filosofía Visual
El sistema de diseño de **sebas-pos** sigue estrictamente los principios de **Apple Human Interface Guidelines (iOS 19 LiquidGlass)**:
- **Claridad y Jerarquía**: Tipografía SF Pro Display / Inter con pesos contrastados (`font-black` para montos y cantidades clave, `tabular-nums` para alineación numérica perfecta).
- **Translucidez Contextual (`LiquidGlass`)**: Superficies esmeriladas con `backdrop-blur-[28px] saturate-[195%]` que mantienen el sentido de profundidad al hacer scroll.
- **Adaptabilidad Dual de Tema**: Transición instantánea entre **Modo Oscuro OLED (`#000000`)** y **Modo Claro Titanio (`#F2F2F7`)** utilizando exclusivamente variables semánticas CSS.

---

## 2. Tokens de Color y Consistencia de Bordes

> **REGLA DE CONSISTENCIA DE BORDES:**
> Queda **estrictamente prohibido** usar `border-black` o bordes oscuros fijos en tarjetas, modales o botones. Todos los contenedores (`.hig-card`, `.glass-sheet`, inputs y pastillas) deben utilizar exclusivamente `var(--border-card)` y `var(--border-hairline)`.

| Token CSS | Modo Oscuro OLED (`:root`) | Modo Claro Titanio (`[data-theme="light"]`) | Uso Principal |
| :--- | :--- | :--- | :--- |
| `--bg-primary` | `#000000` | `#F2F2F7` | Fondo base de la aplicación |
| `--bg-elevated` | `#1C1C1E` | `#FFFFFF` | Tarjetas `.hig-card` y modales base |
| `--bg-surface-2` | `#2C2C2E` | `#E5E5EA` | Controles secundarios, inputs y badges |
| `--bg-glass` | `rgba(28, 28, 30, 0.72)` | `rgba(255, 255, 255, 0.78)` | Superficies translúcidas estándar |
| `--bg-glass-heavy` | `rgba(22, 22, 24, 0.86)` | `rgba(249, 249, 251, 0.88)` | Sticky Headers, Bottom Sheets y TabBar |
| `--border-card` | `rgba(255, 255, 255, 0.10)` | `rgba(0, 0, 0, 0.08)` | Bordes perimetrales de tarjetas `.hig-card` |
| `--border-hairline` | `rgba(255, 255, 255, 0.08)` | `rgba(60, 60, 67, 0.12)` | Divisores finos de 1px y bordes de Sticky Header |
| `--accent-blue` | `#0A84FF` | `#007AFF` | Acción primaria POS, filtros activos |
| `--accent-green` | `#30D158` | `#34C759` | Confirmación de venta, utilidad positiva, stock sano |
| `--accent-amber` | `#FF9F0A` | `#FF9500` | Alertas de stock bajo, edición de costos/lotes |
| `--accent-red` | `#FF453A` | `#FF3B30` | Sin stock, garantías vencidas, eliminación |

---

## 3. Sticky Header Unificado y Filtros Horizontales sin Cortes

Para evitar que las tarjetas se encimen con el buscador o que el borde superior de las pastillas de categoría se recorte al hacer scroll:

1. **Contenedor Sticky Único (`sticky top-0 z-40`)**:
   - En `POSView.jsx` e `InventarioView.jsx`, el encabezado de la vista, la barra de búsqueda y el carrusel de categorías viven dentro de un mismo bloque superior con:
     - `sticky top-0 z-40`
     - `backdrop-blur-[28px] saturate-[195%] bg-[var(--bg-glass-heavy)]`
     - `border-b border-[var(--border-hairline)]`
2. **Carrusel de Categorías (`.filter-carousel`) sin Recorte Superior ni Barra Gris**:
   - Debe incluir **padding vertical (`py-2` / `padding-top: 8px; padding-bottom: 8px;`)** para garantizar que el borde superior (`1px solid`) y el resplandor de las pastillas `.filter-pill` nunca sean cortados por el contenedor padre (`overflow-x-auto`).
   - **Supresión total del scrollbar horizontal**: Se aplica `scrollbar-width: none`, `-ms-overflow-style: none` y `::-webkit-scrollbar { display: none }` (`.scrollbar-none` / `.no-scrollbar`) para que jamás aparezca una línea o barra gris debajo de las categorías.
3. **Espaciado del Listado Principal**:
   - El contenedor de tarjetas debajo del Sticky Header mantiene holgura superior (`pt-3`) y las vistas principales incluyen `pt-2` en `UI_CLASSES.viewStack` para evitar cualquier colisión de bordes.

---

## 4. Botones de Acción Flotantes (FABs) y Cabeceras

- **FAB Circular Icon-Only para Ir a Vender (`App.jsx`)**:
  - Cuando el usuario se encuentra fuera de `POSView`, el acceso rápido a `Vender` es un botón flotante **exclusivamente circular e Icon-Only** (`w-14 h-14 rounded-full`) ubicado en la esquina inferior derecha (`bottom-[calc(env(safe-area-inset-bottom,0px)+6.5rem)] right-5 z-40`), separado limpiamente de la `TabBar`.
  - Si existen unidades en el carrito (`totalCartUnits > 0`), muestra un badge numérico flotante en su esquina superior derecha.
- **Botón `+` de Inventario Integrado en el Header (`InventarioView.jsx`)**:
  - La creación de nuevos accesorios se invoca únicamente desde el botón circular `+` integrado en la cabecera superior derecha de `InventarioView`, al lado de `TopMenu`, evitando duplicar botones flotantes en la parte inferior.

---

## 5. Bottom Sheets (`IOSBottomSheet.jsx`) y Carrito POS

- **Píldora Superior Minimalista**:
  - Los Bottom Sheets muestran únicamente la píldora indicadora (`.sheet-handle`) sin textos como *"Bajar desde aquí"*.
  - El gesto táctil para arrastrar y cerrar hacia abajo está vinculado exclusivamente a la cabecera superior del modal, permitiendo hacer scroll libremente dentro del contenido sin que la página trasera se mueva (`document.body.style.overflow = 'hidden'`).
  - Tocar fuera del modal (en el fondo oscurecido superior) cierra el Bottom Sheet de inmediato.
- **Barra de Resumen de Venta Acoplada al `TabBar` (`POSView.jsx`)**:
  - La barra flotante de resumen en `POSView` se posiciona justo encima del `TabBar` con un faldón inferior que se funde detrás de la barra de navegación, mientras su contenido interno se eleva para mostrar siempre el total de unidades, el primer producto agregado y el monto total a cobrar.
- **Formateo Monetario en Tiempo Real e Identificadores de Color (v1.5)**:
  - Todos los inputs de precios y costos utilizan `formatPriceInput` (`$50,000`) en tiempo real con `font-variant-numeric: tabular-nums`.
  - Cada proveedor mayorista posee un punto de color identificador (`SUPPLIER_COLORS`) visible en las tarjetas del catálogo (`POSView`, `InventarioView`), en `ProductAdminSheet` y en `IOSSupplierPicker`.
  - Las pantallas superpuestas (`AnalyticsDetailOverlay`) aíslan su cabecera fija del contenedor desplazable (`flex-1 overflow-y-auto`) para impedir cualquier solapamiento de tarjetas durante el scroll.
- **Navegación Universal con Botón "←", Carrusel Fluido y Multi-Lote (v1.6)**:
  - Botón circular "←" arriba a la izquierda en todas las vistas secundarias y modales para volver de forma predecible a `Resumen`, con sincronización dinámica del título en cabecera.
  - Ocultamiento estricto del proveedor en las tarjetas generales de `InventarioView` para mantener privacidad en mostrador.
  - Carrusel horizontal de categorías `.filter-carousel` con `flex-wrap: nowrap` y `overflow-x: auto` sin recortes de texto.
  - Múltiples lotes activos por producto con asignación automática por mayor stock en POS y selector manual opcional.
  - Eliminación directa con botón único `"Eliminar producto"` sin textos sobreexplicativos.
- **Liquid Glass vs. Contenido (v1.7)**:
  - Cristal flotante: `blur(24px) saturate(190%)`, borde `1px rgba(255,255,255,0.14)` y brillo interno `--glass-highlight`, solo en header, TabBar, FAB, barra de carrito y menús.
  - Contenido OLED: `#000000` base, tarjetas `#1C1C1E`, internos `#2C2C2E`, bordes `rgba(255,255,255,0.07)`, sin blur.
  - Semánticos: Blue `#0A84FF`, Green `#30D158`, Red `#FF453A`, Orange `#FF9F0A`.
  - Táctil: mínimo 44×44px, retroceso con chevron `<`, `active:scale-[0.97]`, sheets con esquinas de 34px, animación solo `transform`/`opacity` con `cubic-bezier(0.22, 1, 0.36, 1)`.


---

## 6. Universal Expo (React Native) — iOS 26 Liquid Glass (v2.0)

- **Capas OLED**: fondo `#000000`, tarjetas `#1C1C1E`, secundarios `#2C2C2E`, borde especular `rgba(255,255,255,0.12)`. Tema claro `#F2F2F7` / `#FFFFFF` / `#E5E5EA`. Tokens en `universal/src/theme.js`.
- **Liquid Glass**: `Glass` (`ui/kit.js`) = `BlurView` (`tint` oscuro/claro) en iOS/Android y `backdrop-filter: blur(24px) saturate(190%)` en Web. Solo en cabeceras, TabBar flotante, barra de carrito y menú "Tema/Proveedores"; tarjetas sólidas sin blur.
- **Cabecera fija**: `SearchHeader` vive fuera del `FlatList`, por lo que nunca se corta ni se despega; carrusel de categorías con `paddingVertical: 8`, sin indicador de scroll.
- **Tipografía numérica**: `fontVariant: ['tabular-nums']` en precios, márgenes y contadores (`Txt`, `Field`).
- **Física**: `Tap` aplica resorte `scale 0.97` (`Animated.spring`, `useNativeDriver`) y háptica iOS. `Sheet` = Bottom Sheet nativo con Grabber, resorte de entrada, arrastre para cerrar y backdrop táctil. `FadeIn` anima el cambio de pestaña.
- **Inputs de precio**: `PriceInput` formatea en vivo `$50,000` y guarda el número limpio.
- **Seguridad de área**: `react-native-safe-area-context` (Dynamic Island, Home Indicator).
- **Microcopy**: sin textos explicativos; el único texto en eliminación es "Eliminar producto"; el menú de apariencia solo dice "Tema".


---

## 7. Liquid Glass para Web/PWA, táctil y escritorio (v2.2)

**Principio**: el cristal es una capa de *control flotante*, nunca de contenido. Se implementa una sola vez (`Glass` en `ui/kit.js`) y cada plataforma lo renderiza con su mejor primitiva.

| Plataforma | Implementación del cristal | Notas |
| :--- | :--- | :--- |
| Web / PWA (Safari iOS, Chrome) | `backdrop-filter: blur(24px) saturate(190%)` + `-webkit-backdrop-filter`, fondo `t.glass` semitransparente, borde hairline | Requiere fondo detrás; por eso la cabecera vive fuera del scroll y el contenido pasa por debajo del dock. |
| iOS / Android nativo | `expo-blur` `BlurView` (`tint` oscuro/claro, `intensity` 60–80) | Mismo componente, sin cambios en pantallas. |

**Reglas de adaptación táctil + escritorio**
- **Columna central** (`MAX_COLUMN = 760`) en pantallas anchas, con bordes hairline y fondo `#000` a los lados; en móvil ocupa todo el ancho.
- **Bottom Sheets**: `min(ancho, 640)` centrados; Grabber y arrastre para cerrar se conservan (con ratón o dedo).
- **Zonas seguras**: `viewport-fit=cover` + `react-native-safe-area-context` (notch/Dynamic Island, Home Indicator) también en PWA instalada (`black-translucent`).
- **Táctil**: objetivos ≥44 px, `scale 0.97` al presionar (`Tap`), inputs de 16 px para evitar el zoom automático de iOS Safari, `overscroll-behavior: none` y `body overflow hidden` para sensación de app.
- **Números tabulares** (`fontVariant: ['tabular-nums']`) en precios y contadores en todas las plataformas.
- **Pantalla de acceso** (`AuthScreen`): tarjeta `#1C1C1E` centrada de hasta 420 px, sin cristal; campos `#2C2C2E`; errores en `--red` y confirmaciones en `--green`, una sola línea.
- **Degradaciones**: háptica solo en iOS nativo; en PWA se omite sin errores.
