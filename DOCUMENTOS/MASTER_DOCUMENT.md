# MASTER DOCUMENT — ELYTRAS (SEBAS POS)

> **Versión Actual Estable:** **v1.0.1**  
> **Próxima Versión:** v1.1.0 (programada tras optimizaciones PWA en iPhone/Android y posterior pulido de escritorio)

## 1. Propósito del documento
Este documento centraliza la arquitectura funcional, técnica, modular y visual de **elytras** (nombre comercial en app: **Sebas POS**), un sistema POS móvil orientado a tiendas de telefonía y accesorios con estética **iOS 19 / Apple HIG LiquidGlass**.

Sirve como fuente única de verdad para:
- Decisiones de arquitectura (ADRs), incluyendo la **Arquitectura Modular Desacoplada (SRP / DRY)** y el **Patrón Repositorio para Supabase**.
- Flujo operativo entre vistas (`Vender`, `Inventario`, `Historial`, `Resumen`).
- Reglas de negocio de precios dinámicos momentáneos (sin precios quemados), costos por lote, garantías individuales, arqueo contable y directorio de proveedores.
- Contratos de acceso a datos e inyección de dependencias (`posRepository.js` + `usePOSStore.js`).

---

## 2. Stack Tecnológico y Arquitectura Activa (Universal Expo SDK 57 + PWA + Supabase)
> **Código Base Activo**: Toda la aplicación productiva vive en `universal/` (Expo SDK 57, React Native Web, soporte PWA offline/instalable y arquitectura multi-tenant con Supabase Auth + RLS). El directorio `src/` corresponde a la prueba de concepto web original con Vite, conservada únicamente como referencia histórica.

- **Framework Universal**: Expo SDK 57 (`~57.0.31`), React 19.2 (`react@19.2.3`), React Native 0.86 (`react-native@0.86.3`) y `react-native-web`.
- **Backend & Autenticación Multi-tenant**: Supabase Auth (correo/contraseña y resolución de nombre de tienda) + PostgreSQL con Row Level Security (RLS) mandatorio por `store_id`.
- **Diseño & UI**: Apple HIG / OLED Dark (`#000000`) + Liquid Glass translúcido con desenfoque (`expo-blur`), efectos de resorte elásticos y respuesta táctil háptica (`expo-haptics` en iOS).
- **Diseño Responsivo Inteligente**: Adaptación fluida mediante `useWindowDimensions()` con punto de corte en `768px` (Escritorio Split 2 columnas vs Móvil táctil con TabBar inferior).
- **Almacenamiento Seguro**: `@react-native-async-storage/async-storage` como storage persistente adaptado para tokens de sesión y caché local de solo lectura en contingencias sin red.

### Árbol de Directorios del Proyecto Activo (`universal/`)
```text
universal/
├── App.js                                    # Orquestador responsivo (useWindowDimensions), guardas de sesión y Shell
├── app.json                                  # Manifiesto universal Expo (SDK 57, web Metro single-page, PWA icons)
├── package.json                              # Dependencias alineadas a Expo SDK 57
├── public/                                   # Assets PWA (manifest.json, sw.js, iconos 192/512)
├── src/
│   ├── ThemeContext.js                       # Proveedor de tema visual (Auto, Claro, Oscuro) y tokens OLED
│   ├── components/
│   │   └── DesktopSidebar.js                 # Barra lateral fija de navegación para modo escritorio (>=768px)
│   ├── constants/
│   │   └── productTaxonomy.js                # Taxonomía comercial de telefonía y accesorios
│   ├── data/
│   │   ├── authService.js                    # Capa de autenticación, resolución tienda/correo, reset de contraseña
│   │   ├── posRepository.js                  # Repositorio base en memoria/AsyncStorage
│   │   ├── SupabasePOSRepository.js          # Adaptador Supabase multi-tenant (store_id obligatorio, debounce y reconciliación)
│   │   ├── supabaseClient.js                 # Cliente oficial Supabase (persistencia AsyncStorage y detección URL)
│   │   └── usePOSStore.js                    # Store reactivo con inyección de dependencias (lotes, ventas, carrito)
│   ├── domain/
│   │   └── formatters.js                     # Formateo de moneda COP, sembrado inicial de datos y cálculo de garantías
│   ├── screens/
│   │   ├── AuthScreen.js                     # Login (correo/tienda), Registro (confirmación de clave) y ResetPasswordScreen
│   │   ├── POSScreen.js                      # Punto de venta (Catálogo 2-3 cols + CheckoutPanel en PC; TabBar en móvil)
│   │   ├── InventarioScreen.js               # Inventario y lotes (cuadrícula multi-columna en PC; costos y márgenes)
│   │   ├── HistorialScreen.js                # Historial de ventas y gestión de reclamos de garantía por ítem
│   │   └── ResumenScreen.js                  # KPIs financieros (Ingresos, Utilidad, Inventario) y arqueos de cierre
│   ├── sheets/
│   │   ├── CheckoutSheet.js                  # CheckoutForm compartido (panel en escritorio, modal en móvil)
│   │   ├── CreateSheet.js                    # Modal creación de nuevos accesorios
│   │   ├── ProductSheet.js                   # Modal de detalle técnico e ingreso de nuevos lotes por mayorista
│   │   └── TopMenu.js                        # Menú flotante móvil y SuppliersSheet (gestión de proveedores)
│   └── ui/
│       ├── kit.js                            # Primitivas universales Liquid Glass (Glass, Sheet, PriceInput, Card, Tap, Txt)
│       ├── DateField.js                      # Selector de fechas universal
│       └── ProductList.js                    # Tarjetas de producto adaptativas y cabecera de búsqueda fija
└── supabase/
    ├── schema.sql                            # Esquema PostgreSQL completo, tablas multi-tenant, RLS y triggers
    └── patch_v2_3_login_por_tienda.sql       # Parche para unicidad de tiendas y RPCs públicas de lookup pre-login
```

---

## 3. Registro de Decisiones de Arquitectura (ADRs)

### ADR-001: Persistencia Reactiva Offline-First en `localStorage`
- **Contexto**: La operación en mostrador requiere velocidad instantánea (0ms de latencia de red) y tolerancia total a caídas de conexión.
- **Decisión**: Persistir el estado crítico en `localStorage` bajo el prefijo `sebas_pos_*_v2` (`theme`, `products`, `sales`, `closures`, `suppliers`, `last_supplier`) y normalizar automáticamente cualquier categoría histórica de carga/cables a **`Cargadores y Cables`**.
- **Consecuencia**: Toda transacción, ajuste de stock o cambio de proveedor se guarda síncronamente y sobrevive recargas del navegador o cierres de la PWA.

### ADR-002: Vista Dual de Inventario con Costos Ocultos en Mostrador
- **Contexto**: El vendedor suele mostrar la pantalla al cliente para confirmar disponibilidad o precios sin revelar márgenes ni costos mayoristas.
- **Decisión**: `InventarioView` opera por defecto en modo **Mostrador**, ocultando costos unitarios, márgenes e historial de lotes. El modo **Costos y Lotes** (`showCosts = true`) solo se activa mediante el conmutador superior.
- **Consecuencia**: Privacidad comercial garantizada frente al cliente con cambio instantáneo a auditoría financiera cuando el administrador lo requiere.

### ADR-003: Memoria de Último Proveedor y Auto-Scroll en `IOSSupplierPicker`
- **Contexto**: Al registrar mercancía consecutiva de un mismo mayorista, seleccionar repetidamente el proveedor genera fricción; además, cuando el selector se ubica en la parte inferior de un modal, desplegar una lista larga de proveedores podía quedar oculto fuera del área visible.
- **Decisión**: Implementar el componente compartido `src/components/IOSSupplierPicker.jsx` vinculado a `lastSupplierId` y dotado de desplazamiento automático suave (`scrollIntoView({ behavior: 'smooth', block: 'center' })`) al abrirse, deslizando la ventana para mostrar la lista hasta la mitad de la pantalla.
- **Consecuencia**: Reducción drástica de toques al ingresar facturas mayoristas y visibilidad inmediata de toda la lista de proveedores.

### ADR-004: Ajuste Rápido de Stock por Daños o Mermas sin Alterar Caja
- **Contexto**: Los accesorios pueden presentar defectos de fábrica, muestras o ajustes de conteo físico que requieren descontar o sumar unidades rápidamente sin simular una venta ni alterar el flujo de caja.
- **Decisión**: En modo **Costos y Lotes**, cada tarjeta de producto incluye controles directos `-1` y `+1` (`onAdjustStockManual`) que actualizan `stock` e insertan una entrada de auditoría en `adjustments`.
- **Consecuencia**: El inventario físico se mantiene exacto sin contaminar las métricas de ingresos ni utilidad bruta en `ResumenView`.

### ADR-005: Doble Nivel de Edición de Precios en POS (Descuentos y Regateo)
- **Contexto**: En la venta de telefonía y accesorios es habitual negociar tanto el precio de un accesorio individual como redondear el total del combo completo. Además, los precios son 100% momentáneos y nunca deben imponerse como valores fijos inamovibles.
- **Decisión**: Permitir en `POSSaleSummaryForm.jsx`:
  1. Editar el precio unitario de cada ítem individualmente o restar/eliminar unidades con el botón `−`.
  2. Editar el **Monto Final a Cobrar** alineado a la derecha de su etiqueta, registrando el nombre del comprador arriba del listado de productos.
- **Consecuencia**: Flexibilidad comercial total en mostrador manteniendo el cálculo exacto de la utilidad neta real.

### ADR-006: Garantías Independientes por Ítem en Historial
- **Contexto**: Una factura puede incluir múltiples productos con distintos periodos de cobertura (ej. Cable con garantía distinta a un Cubo cargador).
- **Decisión**: Almacenar la garantía a nivel de ítem (`warrantyDays`, `warrantyClaimed`, `warrantyClaimNote`) dentro de cada venta.
- **Consecuencia**: Trazabilidad individual por producto vendido y proveedor mayorista reflejada en `AnalyticsDetailOverlay.jsx`.

### ADR-007: Arqueos de Cierre de Ciclo con Efectivo Real y Selector Dual (`IOSDateRangePicker`)
- **Contexto**: El negocio necesita consolidar cortes periódicos comparando las ventas registradas contra el dinero físico real.
- **Decisión**: Extraer el selector de período en `src/views/resumen/IOSDateRangePicker.jsx`, combinando **Rueda 3D estilo iOS** y **Calendario Mensual de Rango** con atajos rápidos (`Hoy`, `7 días`, `Quincena`, `Mes Completo`) y arqueo de efectivo real en caja.
- **Consecuencia**: Auditoría contable transparente sin duplicar lógica de calendario en la vista principal.

### ADR-008: Animaciones Nativas iOS de Entrada, Salida y Navegación
- **Contexto**: Una aplicación móvil con estándar Apple HIG requiere respuesta cinética fluida al abrir o cerrar modales, cambiar entre pestañas, desplegar paneles o salir de vistas superpuestas.
- **Decisión**: Estandarizar en `src/index.css` y `IOSBottomSheet.jsx` las animaciones `animate-ios-sheet` / `animate-ios-sheet-exit` (con retardo de desmontaje de `220ms`), `animate-ios-view-enter` / `animate-ios-view-exit` para transiciones entre pestañas y pantallas de detalle, y `animate-ios-expand` para menús desplegables.
- **Consecuencia**: Experiencia táctil continua sin cortes bruscos al abrir, cerrar o regresar entre vistas.

### ADR-009: Carrito Flotante Acoplado a la Barra de Navegación (`POSFloatingCartBar`)
- **Contexto**: En `POSView`, el resumen de la venta en curso debe ser visible permanentemente al subir o bajar el catálogo, integrándose con el `TabBar` inferior sin ocultar el primer producto de la lista.
- **Decisión**: Encapsular la barra flotante en `src/views/pos/POSFloatingCartBar.jsx` posicionada sobre el `TabBar` con vista previa de la primera línea agregada y apertura fluida del Bottom Sheet de facturación.
- **Consecuencia**: Continuidad visual estilo iOS 19 y código de vista principal desacoplado.

### ADR-010: Modales de Detalle en Pantalla Completa (`AnalyticsDetailOverlay`)
- **Contexto**: Los resúmenes de "Más Vendidos y Rentabilidad" e "Incidencia de Garantías" requieren espacio suficiente para inspeccionar costos, márgenes, clientes y proveedores sin saturar `ResumenView`.
- **Decisión**: Extraer la pantalla superpuesta en `src/views/resumen/AnalyticsDetailOverlay.jsx` con animación de entrada y salida (`animate-ios-view-exit`).
- **Consecuencia**: `ResumenView.jsx` se mantiene ligero y enfocado en métricas ejecutivas.

### ADR-011: Formulario Dinámico de Inventario + Autocompletado y `FICHA TÉCNICA` sin Precios Fijos
- **Contexto**: El ingreso de accesorios requiere velocidad extrema, estandarización de nombres técnicos y libertad absoluta para fijar precios y costos en el momento.
- **Decisión**:
  1. **Cero Precios Quemados (Regla Crítica de Negocio)**: Ningún preset ni plantilla del sistema impone precios de venta ni costos fijos (`salePrice: ''`, `unitCost: ''`).
  2. **Buscador `"¿Basado en un producto existente?"`**: Ubicado en `CreateAccessorySheet.jsx` con el icono de lupa junto al título superior y la flecha desplegable (`chevron-down`) en el extremo derecho del campo de búsqueda, sin textos de ayuda redundantes.
  3. **3 Categorías Dinámicas en `productTaxonomy.js`**:
     - **A. Cargadores y Cables**:
       - `Cubito Cargador`: Marcas/tipos (`iPhone`, `1Hora`, `Anker`, `Belkin`, `Tipo C`) y potencias hasta `60W` (`20W`, `25W`, `30W`, `35W`, `45W`, `60W`).
       - `Cable`: Conector (`Tipo C a Lightning`, `Tipo C a Tipo C`, `USB-A a Lightning`) y acabado (`Trenzado`, `Liso`).
       - `Completo [Cubo + Cable]`: Combinación completa de marca/tipo, potencia en Watts, conector de cable y acabado (`Trenzado` / `Liso`).
       - `Anker / Belkin`: Selección de marca (`Anker` o `Belkin`), presentación (`Completo (Cubo + Cable)`, `Solo Cubito`, `Solo Cable`), potencia (`20W`, `25W`, `30W`, `35W`, `45W`, `60W`), conector (`Tipo C a Tipo C`, `Tipo C a Lightning`, `USB-A a Lightning`) y acabado (`Trenzado`, `Liso`).
     - **B. Forros / Fundas**: Material (`Silicona Líquida`, `Transparente Anti-amarilleo`, `Lujo / MagSafe`, `Uso Rudo`) y moldes compartidos de iPhone.
     - **C. Audio / AirPods**: Modelo (`AirPods Serie 4`, `AirPods Pro 2da Generación`, `AirPods Pro 3ra Generación`) y conexión (`USB-C`, `Lightning`, `MagSafe`).
  4. **Tarjeta `FICHA TÉCNICA`**: Muestra en tiempo real el título y especificación generados bajo el encabezado limpio **`FICHA TÉCNICA`** y la categoría unificada **`Cargadores y Cables`**.
- **Consecuencia**: Estandarización total del catálogo con cero duplicidad de reglas de negocio.

### ADR-012: Sticky Header Unificado (`UnifiedSearchHeader`) y Acciones Minimalistas
- **Contexto**: `POSView` e `InventarioView` duplicaban la estructura de cabecera, barra de búsqueda con lupa izquierda y selector derecho, y carrusel horizontal de categorías.
- **Decisión**: Extraer el componente reutilizable `src/components/UnifiedSearchHeader.jsx` con `sticky top-0 z-40`, fondo `LiquidGlass`, icono de lupa a la izquierda (`left: 14px`), menú desplegable de categorías a la derecha (`right: 10px`) y carrusel horizontal con `py-2` y `no-scrollbar`.
- **Consecuencia**: Cumplimiento estricto del principio **DRY** y alineación idéntica en ambas vistas.

### ADR-013: Arquitectura Modular Desacoplada y Patrón Repositorio para Supabase
- **Contexto**: Los archivos monolíticos dificultaban la mantenibilidad, incrementaban el consumo de tokens de IA y acoplaban la interfaz directamente a `localStorage`.
- **Decisión**:
  1. **Principio de Responsabilidad Única (SRP)**: Dividir las vistas monolíticas en submódulos cohesivos (`src/views/pos/*`, `src/views/inventario/*`, `src/views/resumen/*`) y extraer la taxonomía pura a `src/constants/productTaxonomy.js`.
  2. **Abstracción de Acceso a Datos (`src/services/posRepository.js`)**: Definir un contrato único de persistencia (`getTheme`, `setTheme`, `getSuppliers`, `saveSuppliers`, `getProducts`, `saveProducts`, `getCart`, `saveCart`, `getSales`, `saveSales`, `getClosures`, `saveClosures`) con dos adaptadores intercambiables: `LocalStoragePOSRepository` (activo por defecto) y `SupabasePOSRepository` (plantilla lista para conectar `@supabase/supabase-js`).
  3. **Inyección de Dependencias (`src/hooks/usePOSStore.js`)**: `usePOSStore(repository = defaultPOSRepository)` recibe el repositorio por inyección de dependencias y expone todas las acciones de dominio a `src/App.jsx`.
- **Consecuencia**: Escalar nuevas ventanas o migrar de `localStorage` a **Supabase** requiere únicamente inyectar `new SupabasePOSRepository(supabaseClient)` sin tocar un solo componente visual.

### ADR-014: Eliminación Segura y Limpieza de Inventario
- **Contexto**: El usuario requiere eliminar productos creados individualmente o limpiar lotes obsoletos/agotados sin perder la integridad histórica de ventas.
- **Decisión**:
  1. **Eliminación Individual**: Disponible tanto mediante un acceso directo rápido con icono de papelera en cada tarjeta de catálogo, como desde la zona de peligro de `ProductAdminSheet.jsx`, con confirmación en dos pasos para evitar borrados accidentales. Al eliminar un producto, se desvincula del inventario y del carrito activo, conservando intactas las ventas del historial.
  2. **Limpieza por Lotes**: Un botón de gestión en la cabecera de `InventarioView.jsx` permite abrir un modal con dos modalidades: *Limpiar solo productos agotados (Stock 0)* o *Vaciar inventario completo (con confirmación explícita)*.
- **Consecuencia**: Control total sobre el ciclo de vida del catálogo y facilidad para purgar artículos descontinuados.

### ADR-015: Aislamiento de Fixed Headers y Estabilidad de Backdrop Blur sin Contenedores Transform
- **Contexto**: Al aplicar animaciones CSS con `transform` y `animation-fill-mode: forwards` a elementos contenedores como `<main>`, la especificación CSS determina que dicho contenedor se convierta en el nuevo *containing block* para elementos con `position: fixed`, provocando que el encabezado y el TopMenu se despeguen al hacer scroll, al tiempo que anula el efecto `backdrop-filter: blur()`.
- **Decisión**: La animación de entrada de vistas `animate-ios-view-enter` se restringe estrictamente a una transición de opacidad (`iosViewEnter: opacity 0 -> 1`) sin `transform`, y `iosPopIn` limpia explícitamente su transformación (`transform: none`) al finalizar.
- **Consecuencia**: El TopMenu y la cabecera fija permanecen inalterables en `top: 0` durante el scroll vertical y el desenfoque LiquidGlass (`backdrop-filter: blur(28px) saturate(195%)`) funciona a máxima fidelidad en todos los navegadores móviles y de escritorio.

### ADR-016: Formateo Monetario en Tiempo Real, Colores de Proveedor y Pulido UI/UX (v1.5)
- **Contexto**: Los campos de precio y costo requieren retroalimentación visual inmediata con separadores de miles sin perder precisión numérica; asimismo, los proveedores necesitan diferenciación visual rápida por color y eliminación segura con confirmación, y las vistas analíticas deben evitar ruido visual y solapamientos bajo la cabecera.
- **Decisión**:
  1. **Formateo en Tiempo Real (`formatPriceInput` y `parsePriceInput`)**: Todos los campos de Precio de Venta, Costo de Compra y Efectivo en Caja formatean el texto a medida que se escribe agregando `$` y comas separadoras de miles (ej. `$50,000`), almacenando internamente el valor numérico limpio.
  2. **Identificador de Color por Proveedor y Eliminación Segura**: Cada proveedor dispone de un punto de color (`SUPPLIER_COLORS`) visible en las tarjetas de producto (`POSView`, `InventarioView`, `ProductAdminSheet`) y en `IOSSupplierPicker`. En `TopMenu.jsx` se incorpora la eliminación de proveedores con confirmación de seguridad en dos pasos (`"¿Estás seguro? Sí, eliminar / Cancelar"`).
  3. **Taxonomía Completa de Audio (`AUDIO_MODELS`)**: Incluye táctilmente en cuadrícula de 2 columnas `'AirPods 3ra Generación'`, `'AirPods Serie 4'`, `'AirPods Pro 2da Generación'` y `'AirPods Pro 3ra Generación'`.
  4. **Aislamiento de Scroll y Colapso de Transacciones en `AnalyticsDetailOverlay`**: La cabecera de la pantalla de detalle se aísla en un contenedor `flex-col overflow-hidden` con área desplazable independiente (`flex-1 overflow-y-auto`) para que ninguna tarjeta pase por debajo del header fijo, y las transacciones individuales por producto permanecen colapsadas por defecto tras un botón desplegable limpio.
  5. **Selector de Fechas Nativo iOS con Hora Opcional (`IOSDateRangePicker`)**: Rediseño tipo calendario inline + rueda iOS con interruptor opcional `"Incluir hora"` y etiquetas concisas.
  6. **Restauración de Catálogo Base (`INITIAL_PRODUCTS`)**: Si el catálogo se encuentra vacío sin haber sido vaciado intencionalmente, se restauran los productos de demostración e incluye el botón `"Restaurar Catálogo Base"` en el estado vacío de `InventarioView.jsx`.
- **Consecuencia**: Mayor velocidad operativa en mostrador, trazabilidad visual inmediata por proveedor y limpieza estética fiel a Apple HIG.

### ADR-017: Botón de Retroceso Universal, Múltiples Lotes por Producto y Reducción Radical de Ruido Textual (v1.6)
- **Contexto**: Navegar entre vistas y modales requería un botón de retroceso consistente ("←") que retornara siempre a "Resumen", actualizando el encabezado de manera dinámica. Además, los productos se adquieren de múltiples proveedores en lotes sucesivos (con distintas cantidades y costos), requiriendo asignación automática y selector manual en POS, mientras la interfaz presentaba textos sobreexplicativos redundantes.
- **Decisión**:
  1. **Navegación Unificada con Botón "←"**: `UnifiedSearchHeader`, `HistorialView`, `ProductAdminSheet`, `CreateAccessorySheet`, `AnalyticsDetailOverlay` y los paneles de `TopMenu` integran un botón circular `←` arriba a la izquierda. Al pulsarlo desde las vistas secundarias, la aplicación regresa fluidamente a `Resumen` actualizando el título dinámico.
  2. **Múltiples Lotes Activos y Asignación Automática por Mayor Stock (`usePOSStore.js`, `POSSaleSummaryForm.jsx`)**:
     - Cada producto soporta múltiples lotes activos (`batches: [{ id, supplierId, supplierName, qty, unitCost, date }]`).
     - Al agregar un producto al carrito en POS, el sistema selecciona automáticamente por defecto el lote/proveedor con **mayor cantidad de unidades disponibles**.
     - En `POSSaleSummaryForm.jsx`, cada ítem muestra el lote/proveedor asignado y despliega un selector manual opcional si el vendedor desea cobrar desde otro proveedor. Al completar la venta, se descuenta la cantidad vendida del lote exacto y del stock general.
     - En `ProductAdminSheet.jsx`, se despliega la sección **"Lotes Activos y Proveedores"** detallando el stock y costo unitario de cada mayorista.
  3. **Privacidad de Proveedor en Inventario**: En las tarjetas de la vista general de inventario se oculta el nombre del proveedor, mostrándolo únicamente al abrir la ficha confidencial del producto.
  4. **Contenedor y Carrusel de Categorías sin Cortes (`.filter-carousel`)**: Reglas CSS con `flex-wrap: nowrap`, `overflow-x: auto` y `whitespace-nowrap` garantizan que categorías largas como "Cargadores y Cables" nunca sufran cortes o saltos de línea irregulares.
  5. **Eliminación Radical de Sobreexplicaciones**:
     - Eliminados badges y subtítulos redundantes ("Ficha confidencial de administrador", "No altera caja", "Memoria activa", explicaciones de descarte/daños).
     - El ajuste rápido de stock se simplifica a controles numéricos directos (`-1`, `-2`, `+1`, input).
     - La zona de eliminación de productos se reduce a un botón directo con el texto exacto `"Eliminar producto"` y confirmación limpia.
- **Consecuencia**: Experiencia de usuario ágil, navegación nativa Apple HIG y trazabilidad multi-lote exacta para auditoría de inventario y costo de ventas.

### ADR-018: Separación de Capas Liquid Glass vs. Contenido OLED (v1.7)
- **Contexto**: Aplicar blur a tarjetas de contenido degrada el rendimiento en Safari iOS y diluye la jerarquía espacial.
- **Decisión**: El cristal (`blur(24px) saturate(190%)`, borde especular `rgba(255,255,255,0.14)`, brillo `--glass-highlight`) se limita a controles flotantes (sticky header, TabBar, FAB, barra de carrito, menús). Las tarjetas usan superficies sólidas `#1C1C1E`/`#2C2C2E` sobre `#000000`. Colores semánticos: `#0A84FF`, `#30D158`, `#FF453A`, `#FF9F0A`. Botones con área táctil ≥44px, retroceso con chevron `<`, `tabular-nums` global y animaciones solo con `transform`/`opacity`.
- **Consecuencia**: Mayor fluidez (60/120 FPS) y coherencia visual con iOS 19/26.


### ADR-019: Arquitectura Universal Expo (iOS · Android · Web) en `universal/` (v2.0 / SDK 57)
- **Contexto**: Desarrollo en Windows sin Mac; único dispositivo iOS: iPhone 14 Pro Max con la versión más reciente de Expo Go (SDK 57). Se requiere experiencia nativa iOS real, compatibilidad Android y ejecución en Web de escritorio con un solo comando.
- **Decisión**:
  1. Proyecto **Expo (Managed Workflow, compatible con Expo Go SDK 57)** en `universal/` con `react-native-web`. La app web Vite original (`src/`) se conserva intacta como referencia/PWA.
  2. Dependencias consistentes con Expo SDK 57 (`~57.0.31`), React 19 (`19.2.3`), React Native (`0.86.3`), `expo-blur`, `expo-haptics`, `@react-native-async-storage/async-storage` (2.2.0), `react-native-safe-area-context` (~5.7.0) y `@react-native-community/datetimepicker` (9.1.0).
  3. **Capa de datos asíncrona** `src/data/posRepository.js` (`AsyncStoragePOSRepository.loadAll()` + `Supabase­POSRepository` plantilla) inyectada en `src/data/usePOSStore.js` con hidratación (`ready`).
  4. **Dominio reutilizado** sin cambios de reglas: `src/domain/formatters.js` (formato `$50,000`, colores de proveedor, garantías, semillas) y `src/domain/productTaxonomy.js`.
  5. Multi-lote: el POS selecciona por defecto el proveedor con **mayor stock**, con selector manual; ajuste de stock solo con `+` / `−`.
  6. Reglas de UI conservadas: proveedor oculto en lista de inventario (solo en detalle), eliminación con confirmación nativa (`Alert`) y botón único "Eliminar producto", eliminación de proveedor con confirmación, menú flotante "Tema", "Más vendidos" con transacciones colapsadas, cierre con selector de fecha nativo y hora opcional, seeds restaurados, AirPods Pro 3ra Generación disponible.
- **Árbol `universal/`**:
```text
universal/
├── App.js                      # Shell: tabs, TabBar glass, sheets
└── src/
    ├── theme.js / ThemeContext.js
    ├── data/   posRepository.js · usePOSStore.js
    ├── domain/ formatters.js · productTaxonomy.js
    ├── ui/     kit.js (Tap, Glass, Sheet, PriceInput…) · ProductList.js · DateField.js
    ├── screens/ POS · Inventario · Historial · Resumen
    └── sheets/  Checkout · Product · Create · TopMenu (Tema + Proveedores)
```
- **Consecuencia**: `npx expo start` → QR para Expo Go en iPhone, `a` Android, `w` Web. Builds de producción vía EAS Build sin Mac.


### ADR-020: Pivote a MVP Web/PWA como distribución principal (v2.2)
- **Contexto**: Sin Mac ni cuenta de desarrollador de Apple, y con la necesidad de que colegas/clientes prueben el sistema ya, publicar en tiendas de apps agrega costo (\$99/año), revisión y fricción. Dispositivo de prueba actual del usuario: iPhone 12.
- **Decisión**:
  1. **El MVP se distribuye como PWA**: `npx expo export --platform web` → `dist/` desplegado en hosting estático HTTPS (Vercel / Netlify / Cloudflare Pages; `universal/vercel.json` incluye el rewrite SPA). Instalable desde Safari/Chrome y escritorio.
  2. **PWA**: `public/index.html` (meta Apple, `viewport-fit=cover`, registro del SW), `public/manifest.json` (`standalone`, `theme_color #000000`), `public/sw.js` (shell offline; nunca cachea llamadas a Supabase) y `app.json > web` (`bundler: metro`, `output: single`).
  3. **Compatibilidad universal intacta**: solo primitivas React Native; `expo-haptics` y `BlurView` se degradan en Web (backdrop-filter / sin háptica). Compilar nativo más adelante no requiere reescritura (EAS Build).
  4. **Responsive**: columna central `MAX_COLUMN = 760` en `App.js` para escritorio/tablet, `Sheet` acotado a 640 px y centrado, `useWindowDimensions` en lugar de dimensiones fijas, inputs ≥16 px (evita zoom en iOS Safari), áreas táctiles ≥44 px.
- **Consecuencia**: Despliegue inmediato por enlace, actualizaciones sin revisión y cero dependencia de tiendas en la fase MVP. Limitaciones aceptadas: sin háptica ni notificaciones push nativas en iOS PWA (push web disponible desde iOS 16.4 con la app instalada).

### ADR-021: Multi-tenant con Supabase Auth + RLS por `store_id` (v2.2)
- **Contexto**: Cada colega/cliente debe manejar su inventario, ventas y proveedores sin ver los de otros.
- **Decisión**:
  1. **Autenticación**: Supabase Auth (correo + contraseña). Código: `src/data/supabaseClient.js` (cliente; sesión persistida en AsyncStorage), `src/data/authService.js` (`signIn`, `signUp`, `signOut`, `getMyStoreId`, `onAuthChange`), `src/screens/AuthScreen.js`.
  2. **Modelo de tenancy** (`universal/supabase/schema.sql`):
     - `stores(id, name, owner_id)` y `store_members(store_id, user_id, role)` — un usuario pertenece a una tienda; `role ∈ {owner, staff}`.
     - Entidades de negocio `suppliers`, `products`, `sales`, `closures` con `PRIMARY KEY (store_id, id)` y payload `data jsonb` (productos con lotes, ventas con ítems/garantías), más `store_settings(store_id, last_supplier_id, intentionally_empty)`.
     - **Trigger `handle_new_user`**: al crear un usuario en `auth.users` crea su tienda, su membresía `owner` y sus ajustes.
  3. **RLS**: habilitada en todas las tablas. Función `is_store_member(sid)` (`security definer`, `stable`); políticas `for all using/with check (is_store_member(store_id))`. Ningún cliente puede leer ni escribir filas de otra tienda aunque conozca los IDs.
  4. **Repositorio**: `src/data/SupabasePOSRepository.js` extiende `AsyncStoragePOSRepository` (mismo contrato `loadAll()` / `save*`). Lee filtrando por `store_id`, escribe con **debounce de 600 ms** (upsert + borrado de filas ausentes) y mantiene caché local. Si la carga remota falla, entra en **modo solo lectura** para no borrar datos remotos con una copia desactualizada. Tema y carrito permanecen por dispositivo.
  5. **Composición** (`App.js`): sin variables `EXPO_PUBLIC_SUPABASE_*` → modo local sin login; con ellas → `AuthScreen` → `getMyStoreId` → `new SupabasePOSRepository(supabase, storeId)` inyectado en `usePOSStore`. `POSApp` usa `key={storeId}` para reiniciar el estado al cambiar de tienda. Al salir se ejecuta `clearLocal()`.
  6. **Decisión de modelado (trade-off)**: JSONB por entidad prioriza velocidad de MVP y cero cambios de UI. Si se requieren reportes SQL complejos, se normalizará a columnas/tablas (`batches`, `sale_items`) manteniendo `store_id` + RLS.
- **Consecuencia**: Aislamiento fuerte por tienda impuesto en la base de datos (no solo en el cliente) y camino directo a roles de personal (`staff`).


### ADR-022: Registro con confirmación, recuperación de contraseña y login por correo o tienda (v2.3)
- **Contexto**: El acceso solo con correo/contraseña no cubría errores de tipeo al registrarse, olvido de contraseña ni el hábito de identificarse por el nombre de la tienda.
- **Decisión** (`AuthScreen.js`, `authService.js`, `supabase/patch_v2_3_login_por_tienda.sql`):
  1. **Registro**: tienda (obligatoria), correo válido, contraseña ≥ 6 y **"Confirmar contraseña"**; la coincidencia se valida en el cliente *antes* de llamar a `supabase.auth.signUp`. Los errores se muestran en un aviso inline (`Notice`) porque `Alert` no existe en web.
  2. **Recuperación**: enlace "¿Olvidaste tu contraseña?" → `supabase.auth.resetPasswordForEmail(email, { redirectTo })` y confirmación en pantalla. Al abrir el enlace, `App.js` detecta el evento `PASSWORD_RECOVERY` y muestra `ResetPasswordScreen` (`supabase.auth.updateUser`) antes de dar acceso. En web `detectSessionInUrl` está activo; la URL de la app debe estar en *Authentication → URL Configuration → Redirect URLs*.
  3. **Login flexible**: el campo "Correo o tienda" se resuelve en `resolveLoginEmail`: si parece correo se usa directo; si no, la RPC `email_for_store(store_name)` devuelve el correo del dueño y se llama a `signInWithPassword`. Un nombre inexistente produce el mismo mensaje genérico que una clave incorrecta.
  4. **Nombres de tienda únicos** (índice `stores_name_unique` sobre `lower(name)`), RPC `store_name_available` para validar al registrarse y trigger `handle_new_user` que evita colisiones.
- **Riesgo aceptado (privacidad)**: `email_for_store` es invocable sin sesión (`security definer`, `grant execute to anon`); quien conozca el nombre exacto de una tienda puede obtener el correo de su dueño. Es el costo directo del login por nombre de tienda. Mitigación: eliminar la función y volver a login solo por correo; futura alternativa: resolver el correo en una Edge Function con límite de intentos.
- **Consecuencia**: Registro sin errores de tipeo, recuperación autónoma y acceso por el nombre que el usuario ya recuerda.


### ADR-023: Marco de Auditoría Continua de Seguridad y Multi-Tenancy (v2.4)
- **Contexto**: Como aplicación multi-tenant basada en Supabase donde los comerciantes comparten base de datos, cualquier omisión de `store_id`, política RLS laxa o exposición de credenciales privadas en el bundle frontend representa un riesgo crítico de fuga entre tiendas (cross-tenant data leak).
- **Decisión**:
  1. **Directrices de Proyecto Persistentes**: Se establecen reglas obligatorias en `GEMINI.md` y `.agents/skills/security-multitenancy-auditor/SKILL.md` estructuradas en 4 ejes:
     - Aislamiento multi-tenant por `store_id` (cliente) respaldado por RLS en PostgreSQL (servidor).
     - Prohibición estricta de llaves privadas (`sb_secret_...` / `service_role`) en el frontend; solo llaves públicas (`EXPO_PUBLIC_`).
     - Protección de rutas y componentes por sesión activa (`getSession` / `onAuthStateChange`).
     - Almacenamiento local restringido y sanitización estricta de entradas.
  2. **Rol Activo de Auditor**: El asistente actúa automáticamente como Auditor de Seguridad y Multi-Tenancy en cada creación, modificación o revisión de código, verificando los 4 ejes y alertando de riesgos.
  3. **Documentación Oficial**: Creado [`DOCUMENTOS/SECURITY_MULTITENANCY_GUIDELINES.md`](file:///c:/Users/Sebas/Desktop/sebas-pos/DOCUMENTOS/SECURITY_MULTITENANCY_GUIDELINES.md) como referencia integral.
- **Consecuencia**: Estandarización de la defensa en profundidad en todas las fases de desarrollo sin depender de revisiones manuales aisladas.


### ADR-024: Arquitectura Responsiva Inteligente: Panel de Control Escritorio vs Flujo Táctil Móvil (v2.5)
- **Contexto**: En pantallas de PC y tablets grandes (ancho ≥ 768px), encajonar toda la aplicación en una sola columna vertical angosta de 760px desperdiciaba el espacio horizontal y forzaba a abrir y cerrar modales de cobro innecesariamente. En móviles (iPhone 12/14), la disposición táctil vertical con barra inferior sigue siendo óptima.
- **Decisión**:
  1. **Detección Dinámica (`useWindowDimensions`)**:
     - `isDesktop = width >= 768`.
  2. **Modo Escritorio (Panel Horizontal / Split)**:
     - **Barra Lateral (`DesktopSidebar`)**: Barra de navegación lateral fija (250px) con identidad de marca, acceso directo a Resumen, Vender (con contador de carrito reactivo), Inventario, Historial, selector de proveedores, alternador de tema (Auto, Claro, Oscuro) y botón de cierre de sesión.
     - **Vender (`POSScreen` Split 2 Columnas)**: A la izquierda, cuadrícula adaptativa de catálogo (2 o 3 columnas de tarjetas según el ancho de pantalla). A la derecha, **Panel de Cobro Integrado en Tiempo Real (`CheckoutForm`)**: permite modificar unidades, ajustar precio unitario, cambiar de lote de proveedor, registrar cliente, elegir método de pago y liquidar la venta en un solo clic sin abrir modales.
     - **Inventario (`InventarioScreen`)**: Cuadrícula multi-columna de productos con stock, costos y acciones rápidas ("Ver costos", "Limpiar", "Nuevo producto") visibles en cabecera.
     - **Resumen e Historial**: Distribución horizontal de tarjetas KPI (Ingresos, Utilidad, Inventario) en fila de 3 y cuadrícula de historial.
  3. **Modo Móvil (Flujo Vertical Preservado)**:
     - Mantiene la columna central táctil, `TabBar` flotante inferior con safe area insets, botón flotante de bolsa de compras y modales emergentes (`CheckoutSheet`).
  4. **Seguridad y Multi-Tenancy**:
     - Cero alteraciones en las mutaciones del store ni en los filtros `.eq('store_id', this.storeId)`. El adaptador remoto `SupabasePOSRepository` y las políticas RLS siguen gobernando todo el ciclo de vida de los datos.
- **Consecuencia**: Ergonomía de nivel comercial tanto en terminales de escritorio/caja como en dispositivos móviles y PWA.


### ADR-025: Experiencia Táctil Nativa, Lotes Ágiles y Métricas Históricas por Ciclo (v2.6)
- **Contexto**: El flujo de inventario requería crear lotes completos para modificar existencias; el formulario de nuevo producto tenía acoplamientos rígidos a ciertas marcas y 90 días de garantía; faltaba navegación por gestos natural edge-swipe inmune al scroll vertical; y las métricas de más vendidos no permitían auditar ciclos pasados ni productos devueltos.
- **Decisión**:
  1. **Navegación y Gestos (`kit.js`)**: Botón de regreso nativo con `chevron-back` por defecto en todos los `Sheet`. PanResponder con filtro angular estricto (`dx > dy * 2.2` y `dx > 14px`) para permitir retroceder deslizando de izquierda a derecha sin interferir con el scroll vertical de listas. Botón flotante FAB en Resumen, Inventario e Historial para saltar a Vender.
  2. **Catálogo y Lotes (`CreateSheet.js`, `ProductSheet.js`)**:
     - Formulario renombrado a "Nuevo producto", 15 días de garantía estándar y selector desplegable de proveedores con enlace a `SuppliersSheet`.
     - Título dinámico "Detalle de producto" y steppers rápidos (`+`/`−`) por lote en el detalle sin rellenar formularios.
     - Paleta ampliada a 14 colores Apple HIG en `formatters.js`.
  3. **Popover Superior (`TopMenu.js`)**: Menú de tres puntos con ventana emergente para cambiar tema, administrar proveedores y cerrar sesión con confirmación.
  4. **Auditoría de Ventas y Garantías (`ResumenScreen.js`)**: Guardado de `topSellers` y `topReturned` en cada cierre contable, con consulta interactiva entre el ciclo actual y períodos históricos.
- **Consecuencia**: Operación de mostrador significativamente más rápida, reducción de fricción táctil y trazabilidad completa de garantías.
