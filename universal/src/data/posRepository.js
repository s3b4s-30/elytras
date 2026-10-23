/**
 * Repositorio de datos (Repository/Adapter). Contrato asíncrono:
 * AsyncStorage (iOS/Android/Web) hoy; Supabase mañana sin tocar la UI.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  INITIAL_SUPPLIERS,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_CLOSURES,
  getSupplierColor,
} from '../domain/formatters';

export const STORAGE_KEYS = {
  THEME: 'sebas_pos_u_theme',
  SUPPLIERS: 'sebas_pos_u_suppliers',
  LAST_SUPPLIER: 'sebas_pos_u_last_supplier',
  PRODUCTS: 'sebas_pos_u_products',
  CART: 'sebas_pos_u_cart',
  SALES: 'sebas_pos_u_sales',
  CLOSURES: 'sebas_pos_u_closures',
  EMPTY: 'sebas_pos_u_intentionally_empty',
};

const LEGACY = ['Carga Rápida', 'Cables', 'Carga y Cables', 'Cargadores'];

export const normalizeProductCategory = (p) =>
  p && LEGACY.includes(p.category) ? { ...p, category: 'Cargadores y Cables' } : p;

export const normalizeSupplier = (s, i = 0) => (s ? { ...s, color: getSupplierColor(s, i) } : s);

async function read(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
const write = (key, value) => AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});

export class AsyncStoragePOSRepository {
  /** Carga todo el estado inicial en una sola pasada (hidratación). */
  async loadAll() {
    const [theme, suppliers, lastSupplier, products, cart, sales, closures, empty] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.THEME).catch(() => null),
      read(STORAGE_KEYS.SUPPLIERS, null),
      AsyncStorage.getItem(STORAGE_KEYS.LAST_SUPPLIER).catch(() => null),
      read(STORAGE_KEYS.PRODUCTS, null),
      read(STORAGE_KEYS.CART, []),
      read(STORAGE_KEYS.SALES, null),
      read(STORAGE_KEYS.CLOSURES, null),
      AsyncStorage.getItem(STORAGE_KEYS.EMPTY).catch(() => null),
    ]);
    const sup = Array.isArray(suppliers) && suppliers.length ? suppliers : INITIAL_SUPPLIERS;
    let prods = Array.isArray(products) ? products : INITIAL_PRODUCTS;
    if (prods.length === 0 && empty !== 'true') prods = INITIAL_PRODUCTS; // seed si no fue vaciado a propósito
    return {
      theme: theme || 'dark',
      suppliers: sup.map(normalizeSupplier),
      lastSupplierId: lastSupplier || sup[0]?.id || '',
      products: prods.map(normalizeProductCategory),
      cart: Array.isArray(cart) ? cart : [],
      sales: Array.isArray(sales) ? sales : INITIAL_SALES,
      closures: Array.isArray(closures) ? closures : INITIAL_CLOSURES,
    };
  }
  saveTheme = (v) => AsyncStorage.setItem(STORAGE_KEYS.THEME, v).catch(() => {});
  saveSuppliers = (v) => write(STORAGE_KEYS.SUPPLIERS, v);
  saveLastSupplierId = (v) => AsyncStorage.setItem(STORAGE_KEYS.LAST_SUPPLIER, v || '').catch(() => {});
  saveProducts = (v) => write(STORAGE_KEYS.PRODUCTS, v);
  saveCart = (v) => write(STORAGE_KEYS.CART, v);
  saveSales = (v) => write(STORAGE_KEYS.SALES, v);
  saveClosures = (v) => write(STORAGE_KEYS.CLOSURES, v);
  setIntentionallyEmpty = (b) =>
    (b
      ? AsyncStorage.setItem(STORAGE_KEYS.EMPTY, 'true')
      : AsyncStorage.removeItem(STORAGE_KEYS.EMPTY)
    ).catch(() => {});

  /** Limpia la caché del dispositivo (se usa al cerrar sesión para no mezclar tiendas). */
  clearLocal = () =>
    AsyncStorage.multiRemove(
      Object.values(STORAGE_KEYS).filter((k) => k !== STORAGE_KEYS.THEME)
    ).catch(() => {});
}

export const defaultPOSRepository = new AsyncStoragePOSRepository();

