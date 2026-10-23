/**
 * src/services/posRepository.js
 * Capa de Abstracción de Acceso a Datos (Repository & Adapter Pattern).
 * Desacopla los componentes de React del motor de persistencia (localStorage vs Supabase).
 */

import { STORAGE_KEYS } from '../theme/designSystem.js';
import {
  INITIAL_SUPPLIERS,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_CLOSURES,
  getSupplierColor,
} from '../utils/formatters.js';

const INTENTIONALLY_EMPTY_KEY = 'sebas_pos_intentionally_empty_v1';

const LEGACY_CHARGER_CATEGORIES = [
  'Carga Rápida',
  'Cables',
  'Carga y Cables',
  'Cargadores',
];

/**
 * Normaliza la categoría principal de carga a "Cargadores y Cables" (Regla de Dominio).
 */
export function normalizeProductCategory(product) {
  if (!product) return product;
  if (LEGACY_CHARGER_CATEGORIES.includes(product.category)) {
    return { ...product, category: 'Cargadores y Cables' };
  }
  return product;
}

/**
 * Normaliza un proveedor garantizando que cuente siempre con un color identificador.
 */
export function normalizeSupplier(supplier, index = 0) {
  if (!supplier) return supplier;
  return {
    ...supplier,
    color: getSupplierColor(supplier, index),
  };
}

function safeReadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Fallback silencioso si el almacenamiento local está lleno o restringido
  }
}

/**
 * Adaptador LocalOffline-First (Implementación por defecto en localStorage).
 * Cumple el mismo contrato que implementará el cliente de Supabase.
 */
export class LocalStoragePOSRepository {
  getTheme() {
    try {
      return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    } catch {
      return 'dark';
    }
  }

  saveTheme(themeMode) {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, themeMode);
    } catch {
      // Ignore storage error
    }
  }

  getSuppliers() {
    const loaded = safeReadJSON(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    if (!Array.isArray(loaded) || loaded.length === 0) {
      return INITIAL_SUPPLIERS.map(normalizeSupplier);
    }
    return loaded.map(normalizeSupplier);
  }

  saveSuppliers(suppliers) {
    safeWriteJSON(
      STORAGE_KEYS.SUPPLIERS,
      suppliers.map(normalizeSupplier)
    );
  }

  getLastSupplierId(fallbackId = INITIAL_SUPPLIERS[0]?.id || 'sup-1') {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_SUPPLIER) || fallbackId;
    } catch {
      return fallbackId;
    }
  }

  saveLastSupplierId(supplierId) {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SUPPLIER, supplierId);
    } catch {
      // Ignore storage error
    }
  }

  getProducts() {
    const loaded = safeReadJSON(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    if (!Array.isArray(loaded)) {
      return INITIAL_PRODUCTS.map(normalizeProductCategory);
    }
    // Si el catálogo quedó vacío sin que el usuario activara el vaciado explícito actual, restaura los productos semilla
    if (loaded.length === 0) {
      try {
        const isIntentional = localStorage.getItem(INTENTIONALLY_EMPTY_KEY) === 'true';
        if (!isIntentional) {
          return INITIAL_PRODUCTS.map(normalizeProductCategory);
        }
      } catch {
        return INITIAL_PRODUCTS.map(normalizeProductCategory);
      }
    }
    return loaded.map(normalizeProductCategory);
  }

  saveProducts(products) {
    safeWriteJSON(
      STORAGE_KEYS.PRODUCTS,
      products.map(normalizeProductCategory)
    );
  }

  setIntentionallyEmpty(isEmpty) {
    try {
      if (isEmpty) {
        localStorage.setItem(INTENTIONALLY_EMPTY_KEY, 'true');
      } else {
        localStorage.removeItem(INTENTIONALLY_EMPTY_KEY);
      }
    } catch {
      // Ignore storage error
    }
  }

  getCart() {
    return safeReadJSON(STORAGE_KEYS.CART, []);
  }

  saveCart(cart) {
    safeWriteJSON(STORAGE_KEYS.CART, cart);
  }

  getSales() {
    return safeReadJSON(STORAGE_KEYS.SALES, INITIAL_SALES);
  }

  saveSales(sales) {
    safeWriteJSON(STORAGE_KEYS.SALES, sales);
  }

  getClosures() {
    return safeReadJSON(STORAGE_KEYS.CLOSURES, INITIAL_CLOSURES);
  }

  saveClosures(closures) {
    safeWriteJSON(STORAGE_KEYS.CLOSURES, closures);
  }
}

/**
 * Esqueleto de Adaptador para Supabase (Preparado para inyección futura sin tocar la UI).
 * Permite sincronizar con tablas: suppliers, products, stock_entries, sales, sale_items, cash_closures.
 */
export class SupabasePOSRepository extends LocalStoragePOSRepository {
  constructor(supabaseClient) {
    super();
    this.client = supabaseClient;
  }

  async syncRemoteCatalog() {
    if (!this.client) return this.getProducts();
    const { data, error } = await this.client.from('products').select('*');
    if (error || !data) return this.getProducts();
    const normalized = data.map(normalizeProductCategory);
    this.saveProducts(normalized);
    return normalized;
  }
}

export const defaultPOSRepository = new LocalStoragePOSRepository();
