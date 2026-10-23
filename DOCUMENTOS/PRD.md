# PRODUCT REQUIREMENTS DOCUMENT (PRD) — SEBAS-POS

> **Versión Actual:** **v1.0.1**  
> **Próxima Versión Mayor/Menor:** v1.1.0 (programada tras optimizaciones PWA móvil y refinamiento de escritorio)

## 1. Visión del Producto
**sebas-pos** es un sistema de Punto de Venta (POS), Control de Inventario por Lotes, Trazabilidad de Garantías y Arqueo Financiero para tiendas de accesorios y tecnología móvil, con estética **Apple HIG / iOS 26 Liquid Glass**.

> **ESTADO Y ARQUITECTURA DEL MVP (v1.0.1): WEB / PWA PRIMERO.**
> La distribución del MVP es una **Progressive Web App**: un enlace web que se instala en la pantalla de inicio de iPhone/Android ("Añadir a pantalla de inicio") y se abre también en navegadores de escritorio. **No se depende de App Store / Google Play en esta fase** (sin cuenta de \$99/año, sin revisión, actualizaciones instantáneas). El código Expo / React Native sigue siendo universal para compilar nativo en el futuro (EAS Build) sin reescribir.
>
> **Multi-tenant**: cada colega o cliente se registra con correo y contraseña (Supabase Auth) y obtiene **su propia tienda aislada**: inventario, ventas, proveedores y cierres no se mezclan entre tiendas.

> **REGLA CRÍTICA DE NEGOCIO (PRECIOS 100% MOMENTÁNEOS):**
> El sistema **NUNCA** impone ni quema precios de venta ni costos fijos en sus plantillas o selectores de creación. Todos los precios de venta y costos unitarios son **100% dinámicos y momentáneos**, decididos y digitados manualmente por el usuario al momento de registrar un lote, crear un producto o facturar en el punto de venta.

---

## 2. Taxonomía Oficial de Productos (Sin Precios Estáticos)

El sistema estructura la creación y clasificación de accesorios en **3 Líneas Oficiales** (se excluyen teléfonos del creador rápido por ahora). Al elegir cualquier combinación en el modal **"Registrar Nuevo Accesorio"** o al autocompletar desde un **"Producto Existente"**, el sistema autogenera el nombre comercial (`name`) y las especificaciones técnicas (`specs`), mientras que el usuario ingresa manualmente el **Precio de Venta** y el **Costo Unitario** del momento:

### A. Línea Carga y Cables (`Cargadores y Cables`)
1. **Cubitos Cargador**:
   - Potencias: `20W`, `25W`.
   - Especificaciones generadas: potencia seleccionada + puerto de carga rápida.
2. **Cables de Carga y Datos**:
   - Tipos: `Tipo C a Lightning`, `Tipo C a Tipo C Trenzado`.
   - Especificaciones generadas: conector + diseño reforzado/trenzado.
3. **Cargadores Completos [Cubo + Cable]**:
   - Potencias: `20W`, `25W`.
   - Especificaciones generadas: Kit Completo (Cubo + Cable) + potencia seleccionada.
4. **Línea Anker**:
   - Potencias: `20W`, `30W`.
   - Modalidades soportadas: `Completo [Cubo + Cable]`, `Solo Cubo`, `Solo Cable`.
   - Especificaciones generadas: Marca `Anker` + potencia + modalidad elegida.

### B. Línea Forros / Fundas (`Forros y Fundas`)
1. **Materiales / Acabados**:
   - `Silicona Líquida`
   - `Transparente Anti-amarilleo`
   - `Lujo / MagSafe`
   - `Uso Rudo`
2. **Compatibilidad Agrupada por Moldes Equivalentes de iPhone**:
   - `iPhone 11`
   - `iPhone 12 / 12 Pro` *(molde compartido 6.1")*
   - `iPhone 12 Pro Max`
   - `iPhone 13 / 14` *(molde compartido 6.1")*
   - `iPhone 13 Pro Max`
   - `iPhone 14 Pro Max`
   - `iPhone 15`
   - `iPhone 15 Pro`
   - `iPhone 15 Pro Max`
   - `iPhone 16`
   - `iPhone 16 Pro`
   - `iPhone 16 Pro Max`

### C. Línea Audio (`Audio / AirPods`)
1. **Modelos / Generaciones**:
   - `AirPods Serie 4`
   - `AirPods Pro 2da Generación`
   - `AirPods Pro 3ra Generación`
2. **Tipo de Conexión / Estuche**:
   - `USB-C`
   - `Lightning`
   - `MagSafe`

---

## 3. Requerimientos Funcionales por Módulo

### 3.1 Módulo de Punto de Venta (`POSView.jsx`)
- ** Encabezado Sticky Unificado**: Título, menú superior, barra de búsqueda instantánea y carrusel horizontal de categorías fijados en la parte superior (`sticky top-0 z-40`) con efecto `LiquidGlass` sin recortes de borde.
- **Tarjetas de Catálogo con Cantidad Destacada**: Visualización clara del stock disponible, especificaciones en píldoras y badge numérico prominente para unidades agregadas al carrito.
- **Resumen de Venta Flotante Persistente**:
  - Visible en todo momento al hacer scroll hacia arriba o abajo cuando existen productos en el carrito.
  - Acoplado visualmente sobre el `TabBar` inferior, permitiendo leer con claridad el total de unidades, la vista previa del primer producto agregado y el subtotal acumulado.
- **Bottom Sheet de Checkout (`Resumen de Venta`)**:
  - **Orden Jerárquico**: Justo debajo del título `Resumen de Venta` se ubica el campo de **Nombre del Cliente** y el botón para añadir **Nota a la venta** (sin la palabra "discreta"), seguidos por la lista de productos.
  - **Controles por Producto**: Cada línea del carrito permite editar su precio unitario al instante, restar unidades (`-`), sumar unidades (`+`) o eliminar el producto por completo (`✕`).
  - **Monto Final Editable a la Derecha**: El bloque de **Monto Final a Cobrar** presenta la etiqueta descriptiva a la izquierda y el input numérico editable alineado a la derecha, calculando descuentos automáticamente.
  - **Botón `Facturar Venta`**: Ubicado con espaciado inferior ergonómico para evitar toques accidentales cerca del borde de la pantalla.

### 3.2 Módulo de Inventario (`InventarioView.jsx`)
- **Vista Dual (`Mostrador` vs `Costos y Lotes`)**:
  - **Modo Mostrador**: Muestra únicamente precios de venta, especificaciones, garantía base y stock disponible (sin avisos intrusivos de "modo protegido").
  - **Modo Costos**: Revela costo unitario actual, utilidad estimada, porcentaje de margen, historial de lotes recibidos y botones rápidos `-1` / `+1` para ajuste de stock por daños o mermas.
- **Cabecera con Acción Integrada y Retroceso**: El botón `+` para registrar un nuevo accesorio vive junto al `TopMenu`, y un botón de retroceso `←` a la izquierda permite volver siempre a la vista de `Resumen`, actualizando dinámicamente el título principal.
- **Ocultamiento de Proveedor en Mostrador**: En la lista de inventario principal no se muestra el proveedor; solo es visible en la ficha detallada (`ProductAdminSheet.jsx`).
- **Carrusel de Categorías sin Cortes**: El contenedor horizontal `.filter-carousel` mantiene `nowrap` estricto y desplazamiento suave sin romper etiquetas como "Cargadores y Cables".
- **Gestión Multi-Lote y Control de Stock Limpio**:
  - Un producto puede poseer múltiples lotes activos con diferentes proveedores, costos y cantidades.
  - La sección de ajuste rápido de stock prescinde de categorías confusas y opera mediante controles numéricos directos.
  - La sección de eliminación cuenta con un botón directo con el texto exacto `"Eliminar producto"`.
- **Modal `Registrar Nuevo Accesorio` (Formulario Dinámico + Autocompletado)**:
  - **Buscador/Selector `"¿Basado en un producto existente?"`**: Ubicado al inicio del modal; al elegir o buscar un producto del catálogo actual, autocompleta su nombre técnico, categoría, especificaciones y días de garantía sugeridos, dejando listos los campos de **Precio de Venta** y **Costo Unitario** para que el usuario ingrese o ajuste los valores del momento.
  - **Selector de 3 Categorías Dinámicas**: Pastillas estilo iOS para alternar entre `Cargadores y Cables`, `Forros / Fundas` y `Audio / AirPods` (incluyendo `AirPods 3ra Generación`, `AirPods Serie 4`, `AirPods Pro 2da Generación` y `AirPods Pro 3ra Generación`), autogenerando `name` y `specs` en tiempo real sin necesidad de teclear descripciones largas.
  - **Precios Decididos al Momento con Formato Automático**: Los inputs de precio de venta y costo unitario nunca traen valores fijos quemados; formatean automáticamente en tiempo real con símbolo `$` y comas de miles (`$50,000`) guardando internamente el número limpio.
  - **Integración con `IOSSupplierPicker` y Color de Proveedor**: Selección rápida del proveedor mayorista con identificador de color visual y memoria de última tienda utilizada.
  - **Estado de Inventario Vacío Apple HIG**: Diseño limpio con acción primaria para registrar accesorio y botón secundario para restaurar los productos de ejemplo (`Restaurar Catálogo Base`).

### 3.3 Módulo de Punto de Venta y Asignación Automática de Lote (`POSView.jsx`)
- **Asignación Automática por Mayor Stock**: Al agregar un producto al carrito, el sistema preselecciona automáticamente el lote del proveedor con más unidades disponibles.
- **Selector Manual de Proveedor**: En el resumen de venta, el vendedor dispone de un selector opcional para alternar manualmente el lote/proveedor de cualquier ítem antes de facturar.

### 3.4 Módulo de Historial y Garantías (`HistorialView.jsx`)
- **Botón de Retroceso "←"**: Permite regresar instantáneamente a `Resumen` desde la cabecera.
- **Tarjetas Colapsadas por Defecto**: Al abrir la vista de Historial, todas las ventas aparecen contraídas (`expandedSaleId = null`) para ofrecer un panorama limpio y sin textos explicativos redundantes.
- **Formato de Moneda Limpio**: Los valores en pesos colombianos se muestran sin espacios entre el símbolo `$` y el número (ej. `$160.000`) y sin huecos verticales innecesarios debajo del monto.
- **Gestión de Garantías por Ítem**: Despliegue de estado vigente/vencido, contador de días restantes y acción aislada de garantía por producto.

### 3.5 Módulo de Resumen y Cierres Contables (`ResumenView.jsx`)
- **KPIs Financieros**: Utilidad Neta del Ciclo, Ingresos Brutos, Costo de Mercancía, Margen Neto y Valor Total del Inventario.
- **Pantallas Superpuestas de Detalle (`AnalyticsDetailOverlay.jsx`)**:
  - **Cabecera Fija Aislada con Botón "←"**: Área de scroll separada de la cabecera fija (`flex-1 overflow-y-auto`) con botón para regresar a Resumen.
  - **Detalle de Productos Más Vendidos**: Vista completa por encima de todo con unidades vendidas, ingresos brutos, costos, utilidad neta, margen y lista de transacciones individuales **colapsada por defecto** mediante un botón desplegable limpio (`Ver transacciones (N)`).
  - **Detalle de Incidencias de Garantía**: Vista completa unificada con la estética de tarjetas `LiquidGlass` (`.hig-card`), mostrando reclamos aplicados, proveedor de origen y monitor de coberturas por ítem.
- **Modal `Liquidar y Cerrar Ciclo`**:
  - Selector de periodo nativo estilo iOS (`IOSDateRangePicker.jsx`) con **Calendario Mensual Inline**, **Rueda Deslizante 3D** e interruptor opcional/desactivable **`Incluir hora`**.
  - Campo de arqueo con formato automático `$50,000` en tiempo real para ingresar el efectivo real y calcular diferencias, acompañado de etiquetas concisas y limpias.

### 3.6 Directorio de Proveedores y Tema (`TopMenu.jsx` + `IOSSupplierPicker.jsx`)
- **Menú Colapsable de Tema**: Selector limpio bajo el título `"Tema"` con las opciones `Oscuro`, `Claro` y `Automático`, libre de explicaciones técnicas o códigos HEX.
- **Color Identificador y Eliminación Segura de Proveedores**: Permite asignar un color distintivo a cada proveedor e incluye botón de **Eliminar Proveedor** con confirmación de seguridad en dos pasos (`"¿Estás seguro? Sí, eliminar / Cancelar"`).


---

## 4. Plataformas (v2.2 — Web/PWA primero, Universal después)
- **Web / PWA (MVP, prioridad)**: `react-native-web` exportado con `npx expo export --platform web`; instalable en iPhone, Android y escritorio.
- **iOS nativo (fase posterior)**: Expo Go / EAS Build desde Windows, mismo código (blur nativo y háptica real).
- **Android nativo (fase posterior)**: misma base de código.
- La PWA Vite original (`src/`) se mantiene solo como referencia histórica; el producto vive en `universal/`.


---

## 5. Requerimientos del MVP Web/PWA y Multi-tenant (v2.2)

### 5.1 Distribución
| Requisito | Detalle |
| :--- | :--- |
| Instalación | Enlace HTTPS → "Añadir a pantalla de inicio" (iOS Safari, Android Chrome) o "Instalar" en escritorio (Chrome/Edge). |
| Pantalla completa | `display: standalone`, `viewport-fit=cover`, barra de estado translúcida, `apple-touch-icon`. |
| Offline | Service worker (`public/sw.js`) cachea el shell; datos en Supabase con caché local de lectura. |
| Dispositivos objetivo | iPhone 12 en adelante (Safari), Android Chrome, escritorio (columna centrada de hasta 760 px). |
| Háptica | Solo en builds nativos iOS; en PWA se omite sin error. |

### 5.2 Cuentas y aislamiento (Supabase Auth)
- **Registro / Inicio de sesión** (`AuthScreen`): crear cuenta pide tienda, correo, contraseña y **confirmación de contraseña**; entrar acepta **correo o nombre de tienda**; "¿Olvidaste tu contraseña?" envía un enlace de recuperación y luego se define la nueva contraseña en la app. Los nombres de tienda son únicos.
- Al registrarse se crea **automáticamente una tienda** y se asigna al usuario como `owner` (trigger `handle_new_user`).
- Cada tienda solo ve **sus** proveedores, productos, lotes, ventas, garantías y cierres (RLS por `store_id`).
- "Salir" en el menú superior cierra la sesión y limpia la caché local del dispositivo (no se mezclan tiendas en un mismo navegador).
- Una tienda nueva inicia **sin datos de otra tienda**; el catálogo de demostración solo se restaura con el botón "Restaurar catálogo base".
- Sin variables de entorno de Supabase la app funciona en **modo local** (sin login, AsyncStorage) para desarrollo y demos.

### 5.3 Fuera de alcance del MVP
Pagos en línea, roles de personal con permisos finos (el esquema ya admite `staff`), facturación electrónica y publicación en tiendas de apps.
