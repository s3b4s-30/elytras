# HISTORIAL CONSOLIDADO DE VERSIONES — SEBAS-POS

Este documento registra la evolución arquitectónica y funcional de **sebas-pos** en un historial limpio y consolidado, libre de iteraciones intermedias descartadas.

---

## [v2.7] - 2026-10-22 (Edición Completa de Proveedores y Corrección de Viewport/Espacio Inferior)
- **Edición Completa de Proveedores (`SuppliersSheet` en `TopMenu.js`)**:
  - Botón de edición con icono de lápiz (`pencil-outline`) y acción rápida en cada ítem de proveedor.
  - Modo interactivo "EDITAR PROVEEDOR" que precarga nombre, contacto/teléfono y color seleccionado en los campos.
  - Píldora de estado "Editando" y borde azul resaltado en la tarjeta del proveedor bajo edición.
  - Botones "Guardar Cambios" y "Cancelar edición" integrados. Actualización delegada a `store.saveSupplier` manteniendo el `id` y respetando la sincronización multi-tenant en Supabase por `store_id`.
- **Corrección de Viewport Completo y Eliminación de Espacio Vacío Inferior (`App.js`, `POSScreen.js`, `InventarioScreen.js`, etc.)**:
  - Inyección de regla CSS Reset para Web (`html, body, #root` al 100% de altura, `min-height: 100%`, `overflow: hidden`, fondo `#000000`), evitando colapso hacia arriba en computadores o navegadores móviles.
  - Altura completa explícita (`height: '100%'`, `width: '100%'`) en `SafeAreaProvider`, `Root`, contenedor móvil y vistas de escritorio.
  - Ajuste ergonómico de `paddingBottom` en listas de `POSScreen`, `InventarioScreen`, `HistorialScreen` y `ResumenScreen` (reemplazo de los 190px excesivos por 85px/145px dinámicos según presencia de la barra flotante de cobro).

---

## v1.0 — Base Operativa POS, Inventario Dual, Garantías y Cierres
- **Punto de Venta (`POSView`)**:
  - Catálogo interactivo con búsqueda instantánea y filtros por categoría.
  - Carrito de compras con soporte para **doble edición de precios**: ajuste de precio unitario por ítem y edición del monto total final a cobrar (cálculo automático de descuentos por regateo o combo).
- **Inventario por Lotes y Vista Dual (`InventarioView`)**:
  - Separación entre **Modo Mostrador** (oculta costos y márgenes frente al cliente) y **Modo Costos y Lotes** (auditoría de costos unitarios, márgenes e historial de entradas).
  - Ajuste rápido de stock (`-1` / `+1`) para registrar mermas o daños físicos sin afectar el flujo de caja de ventas.
  - Selector nativo de proveedores (`IOSSupplierPicker`) con memoria persistente de la última tienda seleccionada (`lastSelectedSupplier`) y acceso rápido a creación de mayoristas en cabecera.
- **Historial y Garantías por Ítem (`HistorialView`)**:
  - Tarjetas de venta colapsadas por defecto al abrir la vista y formato numérico limpio sin espacios tras el signo `$`.
  - Cobertura de garantía independiente por cada producto vendido con registro de incidencias y descuento opcional (`-1`) de stock por reemplazo físico.
- **Inteligencia Financiera y Arqueos (`ResumenView`)**:
  - Cálculo de Utilidad Neta Real (`Ingresos - Costos de Mercancía Vendida`), Valor del Inventario y vistas detalladas en pantalla completa para **Productos Más Vendidos** e **Incidencias de Garantía**.
  - Liquidación de cierres de ciclo con selector de fechas dual (**Calendario Mensual + Rueda 3D estilo iOS**) y arqueo de efectivo real en caja.

---

## v1.1 — Correcciones Apple HIG, Bordes Modo Claro, Sticky Header sin Cortes y FABs Icon-Only
- **Consistencia de Bordes en Modo Oscuro OLED y Modo Claro Titanio**:
  - Eliminación total de bordes oscuros fijos (`border-black`) en tarjetas `.hig-card`, modales y controles.
  - Adopción universal de `var(--border-card)` y `var(--border-hairline)` para transiciones limpias entre `#000000` (OLED) y `#F2F2F7` (Titanio).
- **Arquitectura Sticky Header Unificada (`POSView` e `InventarioView`)**:
  - Agrupación de cabecera, barra de búsqueda y filtros horizontales dentro de un contenedor único `sticky top-0 z-40` con fondo `LiquidGlass` (`backdrop-blur-[28px] saturate-[195%] bg-[var(--bg-glass-heavy)]`).
  - Adición de padding vertical (`py-2`) en el carrusel `.filter-carousel` y supresión de la barra de scroll gris (`scrollbar-none`) para que el borde superior de las pastillas de categoría nunca se recorte.
- **Acciones Flotantes Minimalistas**:
  - Integración exclusiva del botón `+` de nuevo accesorio en la cabecera superior derecha de `InventarioView`.
  - Rediseño del botón flotante (`FAB`) para ir a `Vender` como un botón estrictamente circular **Icon-Only** (`w-14 h-14 rounded-full`) con badge de unidades activas sobre el `TabBar`.
- **Ergonomía de Bottom Sheets (`IOSBottomSheet`)**:
  - Cierre por deslizamiento restringido al área de la píldora superior (sin textos auxiliares), cierre al tocar el backdrop exterior y bloqueo de scroll del fondo.

---

## v1.2 — Taxonomía Oficial de Accesorios, Autocompletado de Productos Existentes y Formulario Dinámico de 3 Categorías (Precios Decididos al Momento)
- **Regla Estricta de Precios Momentáneos (Cero Precios Quemados)**:
  - Ninguna plantilla, categoría ni selector del sistema impone precios de venta ni costos fijos. El usuario decide y digita manualmente el precio de venta y el costo unitario en el momento exacto de registrar o vender cada accesorio.
- **Buscador/Selector `"¿Basado en un producto existente?"` en Creación**:
  - Incorporación de un selector predictivo al inicio del modal `Registrar Nuevo Accesorio` con icono de lupa junto al título superior y flecha desplegable (`chevron-down`) a la derecha del campo de búsqueda.
- **Formulario Dinámico Inteligente de 3 Categorías y `FICHA TÉCNICA`**:
  - **1. Cargadores y Cables**: Soporte completo para `Cubito Cargador` (`iPhone`, `1Hora`, `Anker`, `Belkin`, `Tipo C` con potencias de `20W` a `60W`), `Cable` (`Tipo C a Lightning`, `Tipo C a Tipo C`, `USB-A a Lightning` en acabado `Trenzado` o `Liso`), `Completo [Cubo + Cable]` y `Anker / Belkin` (`20W`, `25W`, `30W`, `35W`, `45W`, `60W` con cable `Tipo C` o `Lightning`).
  - **2. Forros / Fundas**: Selección de material (`Silicona Líquida`, `Transparente Anti-amarilleo`, `Lujo / MagSafe`, `Uso Rudo`) y moldes compartidos de iPhone.
  - **3. Audio / AirPods**: Selección de modelo (`AirPods Serie 4`, `AirPods Pro 2da Generación`, `AirPods Pro 3ra Generación`) y conexión/estuche (`USB-C`, `Lightning`, `MagSafe`).
  - Tarjeta de vista previa titulada **`FICHA TÉCNICA`** con categoría unificada **`Cargadores y Cables`** y auto-scroll en `IOSSupplierPicker` para visualizar la lista de proveedores hasta la mitad de la pantalla.

---

## v1.3 — Refactorización Arquitectónica Modular (SRP / DRY), Animaciones iOS y Capa de Abstracción para Supabase
- **Desacoplamiento de Archivos Monolíticos (Single Responsibility Principle)**:
  - Extracción de constantes y generador puro de ficha técnica en `src/constants/productTaxonomy.js`.
  - Creación de componentes transversales reutilizables (DRY): `src/components/UnifiedSearchHeader.jsx` y `src/components/IOSSupplierPicker.jsx`.
  - Partición modular de vistas complejas en subcomponentes especializados:
    - `src/views/inventario/CreateAccessorySheet.jsx` y `src/views/inventario/ProductAdminSheet.jsx`.
    - `src/views/pos/POSFloatingCartBar.jsx` y `src/views/pos/POSSaleSummaryForm.jsx`.
    - `src/views/resumen/IOSDateRangePicker.jsx` y `src/views/resumen/AnalyticsDetailOverlay.jsx`.
- **Abstracción de Acceso a Datos e Inyección de Dependencias (Supabase-Ready)**:
  - Implementación del patrón Repositorio/Adaptador en `src/services/posRepository.js` (`LocalStoragePOSRepository` y `SupabasePOSRepository`).
  - Creación del hook de dominio `src/hooks/usePOSStore.js` con inyección de dependencias para desacoplar `src/App.jsx` del almacenamiento subyacente.
- **Sistema de Animaciones Fluido Estilo iOS**:
  - Animaciones de entrada y salida en modales (`IOSBottomSheet`), transiciones entre pestañas (`animate-ios-view-enter`), salida suave en pantallas de detalle (`animate-ios-view-exit`) y despliegue animado de paneles (`animate-ios-expand`).

---

## v1.4 — Herramientas de Limpieza y Eliminación de Inventario + Corrección de Blur y Anclaje Fijo del TopMenu
- **Limpieza y Eliminación de Inventario**:
  - **Eliminación individual**: Botón directo de papelera en cada tarjeta de producto y zona de peligro en [`ProductAdminSheet.jsx`](file:///c:/Users/Sebas/Desktop/sebas-pos/src/views/inventario/ProductAdminSheet.jsx) con confirmación en 2 pasos para proteger la operación.
  - **Limpieza por lotes**: Botón en cabecera de [`InventarioView.jsx`](file:///c:/Users/Sebas/Desktop/sebas-pos/src/views/InventarioView.jsx) con modal para *Eliminar solo agotados (Stock 0)* o *Vaciar todo el inventario*.
  - **Dominio**: Métodos `deleteProduct` y `clearInventory` incorporados en `usePOSStore.js` con persistencia automática en el repositorio y remoción simultánea del carrito.
- **Corrección de Despegue y Blur del TopMenu / Header**:
  - Eliminación del CSS `transform` persistente en `animate-ios-view-enter` sobre `<main>`, restaurando el comportamiento estándar de `position: fixed` contra el viewport y permitiendo que `backdrop-filter: blur(28px) saturate(195%)` funcione al 100% sin capas aisladas ni despegues al deslizar.
  - Ajuste de translucidez en `--bg-sticky-header`, `--bg-glass` y `--bg-glass-heavy` para un efecto LiquidGlass Apple HIG de alto impacto visual.

## [v1.5] - 2026-10-21 (Formato de Precios en Tiempo Real, Color/Eliminación de Proveedores, AirPods 3ra Gen y Pulido Apple HIG)
- **Formato Automático de Precios en Inputs (`src/utils/formatters.js`)**:
  - Implementadas las funciones `formatPriceInput` y `parsePriceInput` en todos los inputs de Precio de Venta, Costo de Compra y Efectivo Real (`CreateAccessorySheet.jsx`, `ProductAdminSheet.jsx`, `POSSaleSummaryForm.jsx` y `ResumenView.jsx`), mostrando automáticamente `$` y comas separadoras de miles (ej. `$50,000`) mientras se guarda el valor numérico limpio.
- **Pantalla de Inventario Vacío, Catálogo Semilla y Carrusel de Filtros (`InventarioView.jsx`, `UnifiedSearchHeader.jsx`, `posRepository.js`)**:
  - Rediseñada la tarjeta de inventario vacío bajo estándares Apple HIG e integrado el botón `"Restaurar Catálogo Base"`, restaurando automáticamente los productos de ejemplo (`INITIAL_PRODUCTS`) salvo vaciado intencional.
  - Corregido el carrusel horizontal de filtros en `UnifiedSearchHeader.jsx` (`px-1 py-1.5` con contenedor `overflow-x-auto no-scrollbar`) para evitar cualquier recorte o desbordamiento.
- **Corrección en Categoría "Audio / AirPods" (`productTaxonomy.js`, `CreateAccessorySheet.jsx`)**:
  - Añadidos `'AirPods 3ra Generación'` y `'AirPods Pro 3ra Generación'` en una cuadrícula táctil de 2 columnas (`grid-cols-2`) dentro del formulario de creación de accesorios.
- **Color Identificador y Eliminación Segura de Proveedores (`TopMenu.jsx`, `IOSSupplierPicker.jsx`, `POSView.jsx`, `InventarioView.jsx`)**:
  - Añadido selector de color identificador (`SUPPLIER_COLORS`) por proveedor y visualización del punto de color junto al nombre del proveedor en las tarjetas de productos de las vistas principales.
  - Implementada la eliminación de proveedores con confirmación de seguridad en dos pasos (`"¿Estás seguro? Sí, eliminar / Cancelar"`).
- **Vista de "Más Vendidos", Garantías y Cierre de Ciclo (`AnalyticsDetailOverlay.jsx`, `IOSDateRangePicker.jsx`, `ResumenView.jsx`, `HistorialView.jsx`)**:
  - Colapsada por defecto la lista de transacciones individuales en `AnalyticsDetailOverlay.jsx` mediante un botón desplegable limpio (`Ver transacciones (N)`), aislada la cabecera fija del contenedor de scroll para evitar solapamientos, y unificada la vista detallada de Garantías con tarjetas `.hig-card`.
  - Rediseñado `IOSDateRangePicker.jsx` al estilo nativo iOS (Calendario Inline + Rueda) con interruptor opcional `"Incluir hora"` y eliminados todos los textos de ayuda redundantes en `ResumenView.jsx`, `TopMenu.jsx` e `HistorialView.jsx`.

## [v1.6] - 2026-10-21 (Botón de Retroceso Universal, Múltiples Lotes por Producto y Reducción Radical de Ruido Textual)
- **Navegación y Botón de Retroceso Universal ("←")**:
  - Incorporado botón funcional "←" arriba a la izquierda en `UnifiedSearchHeader.jsx`, `HistorialView.jsx`, `ProductAdminSheet.jsx`, `CreateAccessorySheet.jsx`, `AnalyticsDetailOverlay.jsx` y `TopMenu.jsx`.
  - Al pulsar el botón "←" desde cualquier vista secundaria o modal, la aplicación regresa automáticamente a `Resumen` actualizando el título de la cabecera en tiempo real.
- **Privacidad en Mostrador y Carrusel de Categorías**:
  - Ocultado el nombre del proveedor en las tarjetas de la lista general de `InventarioView.jsx` (mostrándolo únicamente al abrir la ficha confidencial del producto).
  - Normalizado el contenedor `.filter-carousel` con reglas CSS de flexbox estricto (`flex-wrap: nowrap`, `overflow-x: auto`), evitando que categorías como "Cargadores y Cables" sufran cortes de texto o saltos de línea irregulares.
- **Limpieza Radical de Textos Sobreexplicativos**:
  - Eliminados los badges y subtítulos "Ficha confidencial de administrador", "No altera caja" y "Memoria activa".
  - En la zona de eliminación de productos, removidas explicaciones largas dejando un botón directo con el texto exacto `"Eliminar producto"` y confirmación limpia.
  - Simplificada la sección de ajuste rápido de stock a controles numéricos directos (`-1`, `-2`, `+1`, input), eliminando categorías confusas de daños/garantías.
- **Modelo de Múltiples Lotes y Proveedores (`usePOSStore.js`, `POSSaleSummaryForm.jsx`, `ProductAdminSheet.jsx`)**:
  - Cada producto soporta múltiples lotes activos asociados a diferentes proveedores, con sus respectivas cantidades y costos unitarios.
  - Al realizar una venta en POS, el sistema selecciona automáticamente por defecto el lote/proveedor que tenga la **mayor cantidad de stock disponible**.
  - En `POSSaleSummaryForm.jsx`, se despliega un selector manual opcional si el vendedor desea elegir un lote/proveedor específico, descontando las unidades del lote respectivo al completar la venta.
  - En `ProductAdminSheet.jsx`, se incorporó la sección visual "Lotes Activos y Proveedores" detallando stock y costo por lote.

## [v1.7] - 2026-10-21 (Estándar Liquid Glass, Ergonomía iPhone y Spring Dynamics)
- **Separación de capas**: el cristal (`blur(24px) saturate(190%)`, borde especular `1px rgba(255,255,255,0.14)` y brillo interno superior `--glass-highlight`) se aplica solo a controles flotantes (sticky header, TabBar, FAB, barra de carrito, menús). Las tarjetas `.hig-card` pasan a superficies sólidas sin blur para rendimiento.
- **Paleta OLED**: base `#000000`, tarjetas `#1C1C1E`, contenedores internos `#2C2C2E`, bordes `rgba(255,255,255,0.07)`. Colores semánticos Apple: Blue `#0A84FF`, Green `#30D158`, Red `#FF453A`, Orange `#FF9F0A` (`designSystem.js` + `index.css`).
- **Tipografía**: `font-variant-numeric: tabular-nums` global en inputs y `.cop-mono`; tracking `-0.02em` en títulos.
- **Ergonomía**: botón de retroceso con chevron `<` de 44×44px en cabeceras, modales y `TopMenu`; área táctil mínima 44px mediante pseudo-elemento en botones pequeños; compresión `active:scale-[0.97]`; esquinas superiores de Bottom Sheets de 34px.
- **Animación**: curvas `cubic-bezier(0.22, 1, 0.36, 1)`, solo `transform`/`opacity`, y soporte `prefers-reduced-motion`.
- Verificado que los textos redundantes (ficha confidencial, "No altera caja", "Memoria activa", ayudas de tema/garantía/"toca para abrir") ya no existen.


## [v2.6] - 2026-10-22 (UX/UI: Gestos Edge-Swipe, Lotes Dinámicos, Selector de Proveedores y Cierre Avanzado)
- **Formulario de Nuevo Producto**: Título actualizado a "Nuevo producto", eliminación de subtipos acoplados a marcas (Anker/Belkin), garantía predeterminada a 15 días, y selector obligatorio de proveedor en lista desplegable con acceso directo a `+ Gestionar proveedores`.
- **Navegación Táctil e Inmunidad de Gestos**: Botón de regreso nativo con `chevron-back` en todas las vistas secundarias y gesto horizontal de deslizamiento natural (edge swipe) con filtro estricto de ángulo (`dx > dy * 2.2`) para evitar cierres involuntarios durante el scroll vertical.
- **Detalle de Producto**: Título dinámico "Detalle de producto" y steppers rápidos (`+`/`−`) en cada lote de proveedor para modificar existencias sin pasar por el formulario de nuevo lote.
- **Paleta de Colores Extendida**: Ampliada a 14 colores Apple HIG visualmente diferenciables en `formatters.js` y `SuppliersSheet`.
- **Menú Flotante de Tres Puntos (⋯)**: Transformado en popover/modal flotante con estado de conexión, selector de tema visual (Auto, Claro, Oscuro), acceso a proveedores y botón de cierre de sesión (`supabase.auth.signOut()`) con diálogo de confirmación.
- **Navegación Global a Vender**: Botón flotante FAB con contador de carrito en Resumen, Inventario e Historial para saltar inmediatamente al POS.
- **Cierre de Ciclo y Métricas**: Guardado persistente de `topSellers` y `topReturned` en los cierres de ciclo; modal de "Más vendidos" con selector de ciclo (Ciclo Actual vs Cierres anteriores) y pestañas de "Más Vendidos" y "Más Devueltos".
- **Corrección Tipográfica**: Eliminados errores de encoding en caracteres especiales (mojibake) y normalizadas todas las tildes del sistema.

## [v2.5] - 2026-10-22 (Interfaz Responsiva Inteligente: Escritorio Split vs Móvil)
- **Detección Automática**: Punto de corte responsivo en `768px` vía `useWindowDimensions()` sin dependencias adicionales.
- **Modo Escritorio (`width >= 768px`)**:
  - `DesktopSidebar`: Barra lateral de navegación (250px) con identidad de marca, acceso a pestañas, contador reactivo de carrito, gestión de proveedores, selector de tema y botón de cierre de sesión.
  - `POSScreen` de 2 columnas: Catálogo en cuadrícula (2 o 3 columnas) + Panel de Cobro fijo a la derecha con actualización en tiempo real y liquidación directa.
  - `InventarioScreen` en cuadrícula multi-columna con botones de acción visibles con texto.
  - `ResumenScreen` con fila de 3 tarjetas KPI y `HistorialScreen` adaptado.
- **Modo Móvil (`width < 768px`)**:
  - Mantiene el flujo vertical con columna central, `TabBar` flotante inferior con safe area insets y `CheckoutSheet` emergente.
- Verificado el bundle web con `npx expo export --platform web` (0 errores).

## [v2.4] - 2026-10-22 (Auditor de Seguridad y Multi-Tenancy Activo)
- Registrada la skill `.agents/skills/security-multitenancy-auditor/SKILL.md` y regla permanente de workspace `GEMINI.md`.
- Activado el rol permanente de **Auditor de Seguridad y Multi-Tenancy Senior** para todas las tareas subsiguientes en el proyecto.
- Creado documento oficial [`DOCUMENTOS/SECURITY_MULTITENANCY_GUIDELINES.md`](file:///c:/Users/Sebas/Desktop/sebas-pos/DOCUMENTOS/SECURITY_MULTITENANCY_GUIDELINES.md) con directrices de RLS, validación estricta de `store_id`, prevención de fugas de llaves (`service_role`), protección de rutas y sanitización.
- Documentado ADR-023 en `MASTER_DOCUMENT.md`.

## [v2.3] - 2026-10-22 (Acceso: confirmación de contraseña, recuperación y login por tienda)
- `AuthScreen.js` reescrito con tres modos (entrar / crear cuenta / recuperar): confirmación de contraseña validada antes de `signUp`, avisos inline de error y éxito, y campo "Correo o tienda" en el login.
- Recuperación de contraseña con `resetPasswordForEmail` y pantalla `ResetPasswordScreen` (evento `PASSWORD_RECOVERY` en `App.js`).
- `authService.js`: `resolveLoginEmail`, `isStoreNameAvailable`, `requestPasswordReset`, `updatePassword`.
- Parche SQL `supabase/patch_v2_3_login_por_tienda.sql`: nombres de tienda únicos, RPC `email_for_store` y `store_name_available`, trigger `handle_new_user` actualizado. **Debe ejecutarse una vez en el SQL Editor.** Ver ADR-022 (incluye el riesgo de privacidad aceptado).

## [v2.2] - 2026-10-22 (Pivote a MVP Web/PWA y Multi-tenant con Supabase Auth)
- **Estrategia**: el MVP se distribuye como **PWA** (enlace instalable en iPhone/Android/escritorio) sin depender de App Store ni Play Store; el código universal Expo se conserva para compilar nativo después. Ver ADR-020.
- **PWA**: `public/index.html`, `public/manifest.json`, `public/sw.js`, iconos 192/512 y `app.json > web` (`metro`, `single`); `universal/vercel.json` para despliegue.
- **Autenticación**: Supabase Auth correo + contraseña (`supabaseClient.js`, `authService.js`, `AuthScreen.js`), botón "Salir" en el menú superior que limpia la caché local.
- **Multi-tenant**: `universal/supabase/schema.sql` con `stores`, `store_members`, `suppliers`, `products`, `sales`, `closures`, `store_settings`, RLS por `store_id`, función `is_store_member` y trigger `handle_new_user` (tienda automática por usuario). Ver ADR-021.
- **Repositorio**: `SupabasePOSRepository` (debounce, upsert + reconciliación, caché local y modo solo lectura sin red) inyectado en `usePOSStore` desde `App.js`; sin variables de entorno la app sigue en modo local.
- **Responsive**: columna central de 760 px en escritorio, `Sheet` de hasta 640 px centrado, `useWindowDimensions`, `viewport-fit=cover`, inputs de 16 px; lógica multi-lote y formato de precios sin cambios.
- Corregido bug del adaptador remoto (los `save*` del repositorio base son campos de instancia) y eliminada la plantilla duplicada de `SupabasePOSRepository` en `posRepository.js`.

## [v2.1] - 2026-10-22 (Migración a Expo SDK 57 para Expo Go Actualizado)
- Actualizado el entorno de `universal/` de Expo SDK 52 a **Expo SDK 57 (`~57.0.31`)** para compatibilidad con la versión más reciente de Expo Go en iPhone 14 Pro Max.
- Alineadas las dependencias nativas: React `19.2.3`, React Native `0.86.3`, `expo-blur@~57.0.3`, `expo-haptics@~57.0.3`, `expo-asset@~57.0.20`, `expo-font@~57.0.4`, `expo-status-bar@~57.0.1`, `@expo/vector-icons@^15.0.2`, `@react-native-async-storage/async-storage@2.2.0`, `react-native-safe-area-context@~5.7.0` y `@react-native-community/datetimepicker@9.1.0`.
- Verificado el build bundle sin errores y preservada toda la lógica multi-lote, precios en vivo y estética Liquid Glass iOS.

## [v2.0] - 2026-10-21 (Migración a Arquitectura Universal Expo)
- Creado `universal/` (Expo managed, Expo Go, `react-native-web`) con iOS como prioridad (iPhone 14 Pro Max), Android y Web de escritorio.
- Integrados `expo-blur` (Liquid Glass), `expo-haptics` (solo iOS), `AsyncStorage`, `react-native-safe-area-context` y `@react-native-community/datetimepicker`.
- Repositorio asíncrono + store con hidratación; dominio (formatters, taxonomía, seeds) reutilizado.
- Multi-lote con selección automática del proveedor de mayor stock y selector manual en el POS; ajuste de stock solo `+`/`−`.
- Puntos de color por proveedor; eliminación de proveedor y de producto con confirmación nativa; limpieza de inventario (agotados / todo).
- Inventario sin nombre de proveedor en la lista; carrusel de categorías sin cortes; AirPods Pro 3ra Generación en Audio.
- Microcopy limpio y menú "Tema"; "Más vendidos" con transacciones colapsadas; cierre con selector de fecha nativo y hora opcional; seeds restaurados.
- Bottom Sheets con Grabber y resortes; micro-interacciones `scale 0.97`.
- Ejecución: `cd universal && npx expo start` (QR / `w` Web).
