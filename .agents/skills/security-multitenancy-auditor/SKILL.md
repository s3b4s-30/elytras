---
name: security-multitenancy-auditor
description: >-
  Auditor de Seguridad y Multi-Tenancy para aplicaciones con Supabase, React Native y Expo Web/PWA.
  Actúa como auditor técnico de seguridad para verificar aislamiento multi-tenant por store_id,
  políticas Row Level Security (RLS), prevención de exposición de llaves privadas (sb_secret_...),
  guardas de sesión en rutas y componentes críticos, y sanitización de almacenamiento local y formularios.
---

# Auditor de Seguridad y Multi-Tenancy (Supabase + React Native / Expo Web)

Esta skill proporciona las directrices y la lista de comprobación de seguridad obligatoria para el desarrollo, auditoría y revisión de código en el proyecto `sebas-pos`.

---

## 1. Principio Fundamental: Zero-Trust Multi-Tenant

En una arquitectura multi-tenant compartida sobre PostgreSQL/Supabase, la seguridad nunca debe depender únicamente del cliente frontend ni únicamente de convenciones manuales:
1. **Defensa en Profundidad**: El cliente frontend DEBE enviar y filtrar explícitamente por `store_id`.
2. **Defensa a Nivel de Base de Datos**: Las políticas RLS (Row Level Security) DEBEN ser infalibles y ejecutarse en el servidor evaluando `auth.uid()` contra `store_members` o `stores`.
3. **Validación de Brecha**: Si una consulta olvida el `store_id`, RLS previene la fuga; si una política RLS tiene una fisura, la consulta del cliente mitiga el riesgo. Ambos niveles deben operar coordinadamente.

---

## 2. Matriz de Auditoría Obligatoria

Cada vez que se añada o edite código que interactúe con datos o autenticación, evaluar los siguientes 4 ejes:

### Eje 1: Aislamiento Multi-Tenant (`store_id` y RLS)
- **Consultas SELECT**: ¿Incluyen `.eq('store_id', currentStoreId)`?
- **Mutaciones INSERT**: ¿Se asigna explícitamente `store_id: currentStoreId` en el payload?
- **Mutaciones UPDATE / DELETE**: ¿Incluyen filtro `.eq('store_id', currentStoreId)` y `.eq('id', recordId)`?
- **RPCs y Funciones PostgreSQL**: ¿Validan internamente que el usuario autenticado (`auth.uid()`) pertenece al `store_id` objetivo mediante `EXISTS(SELECT 1 FROM store_members WHERE user_id = auth.uid() AND store_id = target_store_id)`?
- **Excepción documentada**: Las funciones públicas de lookup previas a autenticación (ej. `email_for_store`, `store_name_available`) deben ser estrictamente `SECURITY DEFINER`, exponer únicamente los datos mínimos indispensables (ej. email ofuscable o disponibilidad booleana) y estar aisladas de tablas sensibles.

### Eje 2: Gestión Segura de Credenciales y Variables de Entorno
- **Secret Keys Prohibidas**: Las llaves de servicio (`service_role`, `sb_secret_...`) **NUNCA** deben importarse ni leerse en el frontend (web, PWA, iOS, Android).
- **Llaves Públicas Únicamente**: Solo se permite `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` en el bundle cliente.
- **Protección de Sesión**:
  - Toda vista que muestre transacciones, inventarios, métricas o configuración debe estar subordinada a un estado de sesión verificado (`supabase.auth.getSession()` / `onAuthStateChange`).
  - No debe renderizarse contenido POS ni datos en memoria si `!session` o si `session.user` no tiene una tienda activa resuelta.

### Eje 3: Almacenamiento Local y Fuga de Datos
- **Almacenamiento Local**: `localStorage` (web) y `AsyncStorage` (móvil) solo deben almacenar tokens gestionados por el SDK oficial de Supabase (`persistSession: true` / storage adaptado) y preferencias de interfaz no críticas (ej. tema visual).
- **Prohibición de Contraseñas**: **Jamás** persistir contraseñas en texto plano, pines no hasheados o datos financieros sin cifrar en storage local o logs de consola (`console.log`).
- **Limpieza en Logout**: Al cerrar sesión (`signOut`), limpiar la caché local en memoria para evitar que un segundo usuario en el mismo dispositivo o terminal vea datos de la tienda previa.

### Eje 4: Sanitización de Formularios e Inyecciones
- **Normalización de Texto**: Campos como correo electrónico y nombre de tienda deben normalizarse con `.trim().toLowerCase()` antes de comparaciones o consultas.
- **Validación de Tipos y Rangos**: Precios, stocks y cantidades numéricas deben ser validados y parseados (`Number(val)`, validación de enteros o floats positivos, prevención de `NaN`).
- **Escape de Caracteres**: Evitar construir cadenas SQL o URLs concatenando directamente entradas de usuario; utilizar siempre los métodos parametrizados del SDK (`.eq()`, `.ilike()`, `.rpc()`).

---

## 3. Protocolo de Respuesta del Auditor

Al revisar o generar código, el auditor debe incluir una sección de verificación o emitir una advertencia explícita en caso de riesgo:

```markdown
### 🛡️ Auditoría de Seguridad & Multi-Tenancy
- [x] **Aislamiento Multi-Tenant**: `store_id` parametrizado en todas las operaciones.
- [x] **RLS Server-Side**: Las políticas de Supabase cubren SELECT/INSERT/UPDATE/DELETE.
- [x] **Credenciales Frontend**: Sin exposición de service_role (`EXPO_PUBLIC_` únicamente).
- [x] **Control de Sesión**: Rutas y vistas protegidas por sesión activa.
- [x] **Sanitización & Storage**: Sin persistencia de secretos ni datos en texto plano.
```

