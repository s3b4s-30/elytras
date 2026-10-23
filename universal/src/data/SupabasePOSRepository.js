/**
 * Adaptador Supabase (multi-tenant). Extiende el repositorio local:
 *  - Tema, carrito y "última tienda" se quedan en el dispositivo.
 *  - Proveedores, productos, ventas y cierres viven en Supabase, filtrados
 *    por store_id (y protegidos por RLS en el servidor).
 *  - Escritura con debounce y reconciliación (upsert + borrado de faltantes).
 *  - Caché local como respaldo offline de lectura.
 */
import { AsyncStoragePOSRepository, normalizeProductCategory, normalizeSupplier } from './posRepository';

const TABLES = {
  suppliers: 'suppliers',
  products: 'products',
  sales: 'sales',
  closures: 'closures',
};

export class SupabasePOSRepository extends AsyncStoragePOSRepository {
  constructor(client, storeId) {
    super();
    this.client = client;
    this.storeId = storeId;
    this.timers = {};
    this._wrapWrites();
  }

  async _fetch(table) {
    const { data, error } = await this.client.from(table).select('id,data').eq('store_id', this.storeId);
    if (error) throw error;
    return (data || []).map((r) => r.data);
  }

  async loadAll() {
    const local = await super.loadAll().catch(() => null);
    try {
      const [suppliers, products, sales, closures, settings] = await Promise.all([
        this._fetch(TABLES.suppliers),
        this._fetch(TABLES.products),
        this._fetch(TABLES.sales),
        this._fetch(TABLES.closures),
        this.client.from('store_settings').select('*').eq('store_id', this.storeId).maybeSingle(),
      ]);
      const byDateDesc = (k) => (a, b) => String(b[k] || '').localeCompare(String(a[k] || ''));
      return {
        theme: local?.theme || 'dark',
        cart: local?.cart || [],
        suppliers: suppliers.map(normalizeSupplier),
        lastSupplierId: settings.data?.last_supplier_id || suppliers[0]?.id || '',
        products: products.map(normalizeProductCategory).sort(byDateDesc('lastAddedAt')),
        sales: sales.sort(byDateDesc('createdAt')),
        closures: closures.sort(byDateDesc('closedAt')),
      };
    } catch {
      // Sin red: se muestra la caché local en modo SOLO LECTURA (no se sincroniza hacia el servidor
      // para no borrar datos remotos con una copia desactualizada).
      this.readOnly = true;
      return (
        local || {
          theme: 'dark',
          cart: [],
          suppliers: [],
          lastSupplierId: '',
          products: [],
          sales: [],
          closures: [],
        }
      );
    }
  }

  _sync(table, list, key = 'id') {
    if (this.readOnly) return;
    // Caché local inmediata + sincronización remota con debounce.
    clearTimeout(this.timers[table]);
    this.timers[table] = setTimeout(async () => {
      try {
        const rows = list.map((d) => ({
          store_id: this.storeId,
          id: String(d[key]),
          data: d,
          updated_at: new Date().toISOString(),
        }));
        if (rows.length) {
          const { error } = await this.client.from(table).upsert(rows, { onConflict: 'store_id,id' });
          if (error) throw error;
        }
        const ids = rows.map((r) => r.id);
        let del = this.client.from(table).delete().eq('store_id', this.storeId);
        if (ids.length) del = del.not('id', 'in', `(${ids.map((i) => `"${i}"`).join(',')})`);
        const { error: delErr } = await del;
        if (delErr) throw delErr;
      } catch {
        // Se reintentará con el siguiente cambio de estado.
      }
    }, 600);
  }

  /** Envuelve las escrituras locales heredadas (campos de instancia) con sincronización remota. */
  _wrapWrites() {
    const base = {
      suppliers: this.saveSuppliers,
      products: this.saveProducts,
      sales: this.saveSales,
      closures: this.saveClosures,
      last: this.saveLastSupplierId,
    };
    this.saveSuppliers = (v) => (base.suppliers(v), this._sync(TABLES.suppliers, v));
    this.saveProducts = (v) => (base.products(v), this._sync(TABLES.products, v));
    this.saveSales = (v) => (base.sales(v), this._sync(TABLES.sales, v));
    this.saveClosures = (v) => (base.closures(v), this._sync(TABLES.closures, v));
    this.saveLastSupplierId = (v) => {
      base.last(v);
      this.client
        .from('store_settings')
        .upsert({ store_id: this.storeId, last_supplier_id: v }, { onConflict: 'store_id' })
        .then(() => {});
    };
  }
}
