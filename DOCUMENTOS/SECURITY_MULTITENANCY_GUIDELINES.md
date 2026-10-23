# Guía y Directrices: Seguridad y Aislamiento Multi-Tenant (sebas-pos)

**Versión:** 1.0.1  
**Fecha:** 22 de Octubre, 2026  
**Ámbito:** Arquitectura Multi-Tenant, Supabase Auth, Row Level Security (RLS) y React Native / Expo Web (PWA)

---

## 1. Resumen Ejecutivo y Filosofía de Seguridad

`sebas-pos` opera como un sistema de punto de venta (POS) multi-tenant donde múltiples tiendas y comerciantes comparten la misma infraestructura de base de datos en la nube (Supabase / PostgreSQL). 

Bajo el principio de **Defensa en Profundidad (Zero-Trust Multi-Tenancy)**:
1. No se confía en que el cliente no sea manipulado: **PostgreSQL y RLS hacen cumplir el aislamiento a nivel de motor de datos**.
2. No se confía en que una consulta frontend olvide condiciones: **El cliente siempre adjunta `store_id` como parámetro explícito en todas sus operaciones**.
3. Ambos anillos de seguridad operan coordinados para garantizar que es matemáticamente imposible que un usuario de la Tienda A acceda a productos, ventas, proveedores o métricas de la Tienda B.

---

## 2. Los Cuatro Pilares de Seguridad

### Pilar 1: Aislamiento Multi-Tenant (`store_id` y RLS)

#### En la Base de Datos (PostgreSQL):
- Todas las tablas de negocio (`stores`, `store_members`, `products`, `batches`, `sales`, `sale_items`, `suppliers`, `inventory_adjustments`) tienen RLS habilitado:
  ```sql
  ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
  ```
- Las políticas de seguridad evalúan la relación del usuario con la tienda mediante `store_members`:
  ```sql
  CREATE POLICY "Acceso a productos por tienda" ON public.products
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.store_members sm
        WHERE sm.store_id = products.store_id
          AND sm.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.store_members sm
        WHERE sm.store_id = products.store_id
          AND sm.user_id = auth.uid()
      )
    );
  ```

#### En el Cliente Frontend (React Native / Expo Web):
- Todo servicio o llamada a Supabase debe solicitar y vincular el `store_id`:
  ```javascript
  // Ejemplo correcto
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', currentStoreId);
  ```
- Las mutaciones (`insert`, `update`, `delete`) deben incluir `store_id`:
  ```javascript
  const { error } = await supabase
    .from('sales')
    .insert([{ ...saleData, store_id: currentStoreId }]);
  ```

---

### Pilar 2: Gestión de Credenciales y Variables de Entorno

1. **Llaves Públicas vs Privadas:**
   - En el frontend solo se utiliza:
     - `EXPO_PUBLIC_SUPABASE_URL`
     - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - La llave `service_role` o cualquier `sb_secret_...` **jamás debe incluirse en el frontend**, ni en bundles JS, ni en variables expuestas al navegador/app móvil.
2. **Protección de Rutas y Sesión:**
   - La aplicación evalúa la sesión activa mediante `supabase.auth.getSession()` y `supabase.auth.onAuthStateChange()`.
   - Si no existe sesión (`!session`), se renderiza obligatoriamente `AuthScreen`. Ningún componente operativo se monta en memoria sin un usuario autenticado.

---

### Pilar 3: Almacenamiento Local y Prevención de Fugas de Datos

1. **Almacenamiento Local (`localStorage` / `AsyncStorage`):**
   - El almacenamiento solo almacena tokens de sesión cifrados/gestionados internamente por el cliente oficial de Supabase.
   - **Prohibido:** Guardar contraseñas en texto plano, claves de acceso o datos confidenciales de clientes en el almacenamiento local.
2. **Limpieza de Sesión en Cierre (`Sign Out`):**
   - Al invocar `supabase.auth.signOut()`, la memoria reactiva del frontend (inventario cargado, totales de ventas, lista de productos) debe resetearse inmediatamente a su estado inicial para prevenir que una persona en la misma máquina o teléfono vea datos residuales.

---

### Pilar 4: Sanitización de Entradas y Validación de Formularios

1. **Normalización:**
   - Los correos y nombres de tienda se tratan con `.trim().toLowerCase()` para evitar duplicados o fallos de casing.
2. **Validación de Formularios:**
   - Coincidencia obligatoria de contraseña y confirmación en registro.
   - Validación de tipos numéricos (`price`, `stock`, `cost`) para prevenir `NaN`, `Infinity` o inyecciones.
   - Parámetros siempre enviados a través de los métodos nativos de Supabase (`.eq()`, `.rpc()`), nunca mediante concatenación directa de cadenas SQL.

---

## 3. Checklist de Auditoría en Revisiones de Código

Antes de aprobar o desplegar cualquier cambio en `sebas-pos`, el desarrollador o auditor debe validar:

- [ ] ¿Toda consulta a la base de datos incluye explícitamente el filtro `store_id`?
- [ ] ¿Las políticas RLS del servidor impiden lectura/escritura si el usuario no pertenece a la tienda?
- [ ] ¿Se garantiza que no se importaron llaves privadas (`service_role`) en el código cliente?
- [ ] ¿El acceso a la vista está condicionado a la existencia de una sesión autenticada?
- [ ] ¿No se están registrando credenciales o datos sensibles en `console.log`?
- [ ] ¿Las funciones RPC con `SECURITY DEFINER` validan la identidad del usuario o están estrictamente restringidas a datos no sensibles (ej. comprobación de existencia de nombre de tienda)?

