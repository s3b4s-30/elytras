# Elytras — Sistema de Punto de Venta & Control de Inventario (Sebas POS)

Sistema de Punto de Venta (POS) e Inventario multi-tenant diseñado con arquitectura universal **React Native (Expo SDK 57)**, **Supabase (PostgreSQL + RLS)** y estética **Apple Human Interface Guidelines (OLED Dark & Liquid Glass)**, optimizado para ejecutarse como PWA (escritorio y móviles como iPhone) y exportable a iOS/Android nativo. Nombre comercial en aplicación: **Sebas POS**.

---

## Características Principales

- **Punto de Venta (POS):**
  - Catálogo responsivo (vista dividida en escritorio, panel ergonómico en móvil).
  - Búsqueda en tiempo real y filtrado por categorías.
  - Carrito de compras con selector de proveedor por ítem y edición rápida de precios cobrados.
- **Inventario & Multi-Lote:**
  - Control de lotes con costos y fechas independientes por proveedor.
  - Ajuste rápido de existencias (`+` / `−`) y modo de visualización de costos bajo demanda.
  - Gestión integral de proveedores: creación, edición en vivo (nombre, contacto, color) y eliminación protegida.
- **Historial & Garantías:**
  - Registro de ventas con número consecutivo y método de pago.
  - Cobertura de garantía por ítem con cálculo automático de vigencia e incidencias.
- **Inteligencia Financiera & Arqueos:**
  - Panel de métricas con Ingresos, Utilidad Neta e Inversión en Inventario.
  - Análisis de productos más vendidos y devueltos con filtros por ciclo.
  - Cierres de caja periódicos con congelación histórica de métricas.
- **Seguridad Multi-Tenancy:**
  - Aislamiento estricto por `store_id` y políticas de Row Level Security (RLS) en Supabase.
  - Autenticación con correo/contraseña o nombre de tienda, recuperación de contraseña y guardas de sesión.

---

## Estructura del Proyecto

```text
elytras/
├── DOCUMENTOS/                  # Documentación técnica centralizada
│   ├── MASTER_DOCUMENT.md       # Arquitectura, stack y decisiones técnicas (ADRs)
│   ├── SECURITY_MULTITENANCY_GUIDELINES.md # Directrices de RLS y multi-tenancy
│   ├── CHANGELOG_REQUESTS.md    # Historial consolidado de versiones
│   └── AGENT_STARTUP_CONTEXT.md # Contexto maestro para IA / Desarrolladores
├── universal/                   # Código de la aplicación Expo / React Native Web
│   ├── App.js                   # Entrada principal, shell responsivo y guardas
│   ├── src/
│   │   ├── components/          # DesktopSidebar, etc.
│   │   ├── data/                # SupabasePOSRepository, usePOSStore, authService
│   │   ├── domain/              # Tipos, taxonomía y formateadores
│   │   ├── screens/             # POSScreen, InventarioScreen, HistorialScreen, ResumenScreen, AuthScreen
│   │   ├── sheets/              # CheckoutSheet, ProductSheet, CreateSheet, TopMenu
│   │   └── ui/                  # kit.js (Liquid Glass, botones táctiles, sheets)
│   ├── public/                  # Manifiesto PWA, iconos y Service Worker
│   └── app.json                 # Configuración de Expo y PWA
├── .gitignore                   # Exclusión de credenciales y dependencias
└── README.md                    # Este archivo
```

---

## Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada).
- Cuenta en [Supabase](https://supabase.com/) con el esquema de base de datos aplicado (`universal/supabase/schema.sql` y parches).

---

## Instalación y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/TU_USUARIO/elytras.git
   cd elytras/universal
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Copia el archivo `.env.example` a `.env` dentro de la carpeta `universal/`:
   ```bash
   cp .env.example .env
   ```
   Configura tus credenciales públicas de Supabase:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-publica
   ```

4. **Iniciar la aplicación:**
   ```bash
   npx expo start
   ```
   - Presiona `w` para abrir en el navegador web (PWA).
   - O escanea el código QR desde la app **Expo Go** en tu iPhone / Android.

---

## Licencia

Propiedad privada de Sebas POS. Todos los derechos reservados.

