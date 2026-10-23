/**
 * Store de dominio (inyección de repositorio). Hidratación asíncrona + persistencia reactiva.
 * Lógica de negocio idéntica a la versión web (multi-lote, mayor stock por defecto).
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  defaultPOSRepository,
  normalizeProductCategory,
  normalizeSupplier,
} from '../data/posRepository';
import { INITIAL_PRODUCTS } from '../domain/formatters';

export function usePOSStore(repository = defaultPOSRepository) {
  const [ready, setReady] = useState(false);
  const [themeMode, setThemeMode] = useState('dark');
  const [suppliers, setSuppliers] = useState([]);
  const [lastSupplierId, setLastSupplierId] = useState('');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [sales, setSales] = useState([]);
  const [closures, setClosures] = useState([]);
  const hydrated = useRef(false);

  useEffect(() => {
    repository.loadAll().then((d) => {
      setThemeMode(d.theme);
      setSuppliers(d.suppliers);
      setLastSupplierId(d.lastSupplierId);
      setProducts(d.products);
      setCart(d.cart);
      setSales(d.sales);
      setClosures(d.closures);
      hydrated.current = true;
      setReady(true);
    });
  }, [repository]);

  const persist = (fn, value) => {
    if (hydrated.current) fn(value);
  };
  useEffect(() => persist(repository.saveTheme, themeMode), [themeMode]);
  useEffect(() => persist(repository.saveSuppliers, suppliers), [suppliers]);
  useEffect(() => persist(repository.saveProducts, products), [products]);
  useEffect(() => persist(repository.saveCart, cart), [cart]);
  useEffect(() => persist(repository.saveSales, sales), [sales]);
  useEffect(() => persist(repository.saveClosures, closures), [closures]);

  // Proveedores
  const selectLastSupplier = useCallback(
    (id) => {
      setLastSupplierId(id);
      repository.saveLastSupplierId(id);
    },
    [repository]
  );

  const saveSupplier = useCallback(
    (data) => {
      setSuppliers((prev) =>
        prev.some((s) => s.id === data.id)
          ? prev.map((s, i) => (s.id === data.id ? normalizeSupplier(data, i) : s))
          : [normalizeSupplier(data, prev.length), ...prev]
      );
      selectLastSupplier(data.id);
    },
    [selectLastSupplier]
  );

  const deleteSupplier = useCallback(
    (id) => {
      setSuppliers((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (lastSupplierId === id && next.length > 0) selectLastSupplier(next[0].id);
        return next;
      });
    },
    [lastSupplierId, selectLastSupplier]
  );

  // Carrito
  const pickBatch = (product, preferredSupplierId) => {
    const batches = (product.batches || []).filter((b) => Number(b.qty) > 0);
    let best = preferredSupplierId ? batches.find((b) => b.supplierId === preferredSupplierId) : null;
    if (!best && batches.length) best = [...batches].sort((a, b) => Number(b.qty) - Number(a.qty))[0];
    return best;
  };

  const addToCart = useCallback(
    (product, preferredSupplierId = null) => {
      if (!product || product.stock <= 0) return;
      setCart((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          return prev.map((i) =>
            i.productId === product.id ? { ...i, qty: Math.min(product.stock, i.qty + 1) } : i
          );
        }
        const best = pickBatch(product, preferredSupplierId);
        const sup =
          suppliers.find((s) => s.id === (best?.supplierId || product.supplierId)) || suppliers[0];
        return [
          ...prev,
          {
            productId: product.id,
            productName: product.name,
            basePrice: product.salePrice,
            unitPriceCharged: product.salePrice,
            qty: 1,
            selectedSupplierId: best?.supplierId || product.supplierId || sup?.id,
            selectedBatchId: best?.id || null,
            supplierName: best?.supplierName || sup?.name || 'Proveedor',
            unitCostSnapshot: best ? Number(best.unitCost) : Number(product.unitCost) || 0,
          },
        ];
      });
    },
    [suppliers]
  );

  const updateCartItemSupplier = useCallback(
    (productId, supplierId) => {
      setCart((prev) =>
        prev.map((i) => {
          if (i.productId !== productId) return i;
          const prod = products.find((p) => p.id === productId);
          const batch = (prod?.batches || []).find((b) => b.supplierId === supplierId && Number(b.qty) > 0);
          const sup = suppliers.find((s) => s.id === supplierId);
          return {
            ...i,
            selectedSupplierId: supplierId,
            selectedBatchId: batch?.id || null,
            supplierName: batch?.supplierName || sup?.name || 'Proveedor',
            unitCostSnapshot: batch ? Number(batch.unitCost) : Number(prod?.unitCost) || 0,
          };
        })
      );
    },
    [products, suppliers]
  );

  const updateCartQty = useCallback(
    (productId, nextQty) => {
      if (nextQty <= 0) return setCart((p) => p.filter((i) => i.productId !== productId));
      const prod = products.find((p) => p.id === productId);
      const max = prod ? prod.stock : nextQty;
      setCart((p) => p.map((i) => (i.productId === productId ? { ...i, qty: Math.min(max, nextQty) } : i)));
    },
    [products]
  );

  const updateCartItemPrice = useCallback((productId, price) => {
    setCart((p) => p.map((i) => (i.productId === productId ? { ...i, unitPriceCharged: price } : i)));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const completeSale = useCallback((sale) => {
    setSales((prev) => [sale, ...prev]);
    setProducts((prev) =>
      prev.map((prod) => {
        const sold = sale.items.filter((i) => i.productId === prod.id);
        if (!sold.length) return prod;
        const totalQty = sold.reduce((a, i) => a + (Number(i.qty) || 0), 0);
        const batches = (prod.batches || []).map((b) => ({ ...b }));
        for (const item of sold) {
          let need = Number(item.qty) || 0;
          const take = (b) => {
            const d = Math.min(b.qty, need);
            b.qty -= d;
            need -= d;
          };
          const target = item.selectedBatchId && batches.find((b) => b.id === item.selectedBatchId);
          if (target && target.qty > 0) take(target);
          if (need > 0)
            for (const b of batches) {
              if (need <= 0) break;
              if (b.supplierId === item.selectedSupplierId && b.qty > 0) take(b);
            }
          if (need > 0)
            for (const b of [...batches].sort((a, c) => c.qty - a.qty)) {
              if (need <= 0) break;
              if (b.qty > 0) take(b);
            }
        }
        return { ...prod, stock: Math.max(0, prod.stock - totalQty), batches, lastSoldAt: sale.createdAt };
      })
    );
    setCart([]);
  }, []);

  // Inventario
  const updateProduct = useCallback((p) => {
    const n = normalizeProductCategory(p);
    setProducts((prev) => prev.map((x) => (x.id === n.id ? n : x)));
  }, []);

  const addStockBatch = useCallback(
    (productId, batch) => {
      if (batch.supplierId) selectLastSupplier(batch.supplierId);
      setProducts((prev) =>
        prev.map((p) =>
          p.id !== productId
            ? p
            : {
                ...p,
                stock: p.stock + batch.qty,
                unitCost: batch.unitCost,
                supplierId: batch.supplierId || p.supplierId,
                lastAddedAt: new Date().toISOString(),
                batches: [batch, ...(p.batches || [])],
              }
        )
      );
    },
    [selectLastSupplier]
  );

  /** Ajuste directo +/-: toca el stock total y el lote con mayor existencia (al restar) o el más reciente (al sumar). */
  const adjustStock = useCallback((productId, delta) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const stock = Math.max(0, p.stock + delta);
        const batches = (p.batches || []).map((b) => ({ ...b }));
        if (batches.length) {
          if (delta < 0) {
            const t = [...batches].sort((a, b) => b.qty - a.qty)[0];
            t.qty = Math.max(0, t.qty + delta);
          } else batches[0].qty += delta;
        }
        return { ...p, stock, batches };
      })
    );
  }, []);

  const createProduct = useCallback(
    (np) => {
      repository.setIntentionallyEmpty(false);
      if (np.supplierId) selectLastSupplier(np.supplierId);
      setProducts((prev) => [normalizeProductCategory(np), ...prev]);
    },
    [repository, selectLastSupplier]
  );

  const deleteProduct = useCallback((id) => {
    setProducts((p) => p.filter((x) => x.id !== id));
    setCart((p) => p.filter((i) => i.productId !== id));
  }, []);

  const clearInventory = useCallback(
    (mode = 'out_of_stock') => {
      if (mode === 'out_of_stock') setProducts((p) => p.filter((x) => x.stock > 0));
      else {
        repository.setIntentionallyEmpty(true);
        setProducts([]);
        setCart([]);
      }
    },
    [repository]
  );

  const restoreSeedProducts = useCallback(() => {
    repository.setIntentionallyEmpty(false);
    setProducts(INITIAL_PRODUCTS.map(normalizeProductCategory));
  }, [repository]);

  const toggleItemWarranty = useCallback((saleId, itemId) => {
    setSales((prev) =>
      prev.map((s) =>
        s.id !== saleId
          ? s
          : {
              ...s,
              items: s.items.map((it) =>
                it.id !== itemId
                  ? it
                  : {
                      ...it,
                      warrantyClaimed: !it.warrantyClaimed,
                      warrantyClaimNote: !it.warrantyClaimed
                        ? `Garantía reclamada (${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}).`
                        : '',
                    }
              ),
            }
      )
    );
  }, []);

  const createClosure = useCallback((c) => setClosures((p) => [c, ...p]), []);

  const nextSaleNumber = useMemo(
    () => (sales.length ? Math.max(...sales.map((s) => s.saleNumber)) + 1 : 1),
    [sales]
  );
  const totalCartUnits = useMemo(() => cart.reduce((a, i) => a + i.qty, 0), [cart]);

  return {
    ready,
    themeMode,
    setThemeMode,
    suppliers,
    lastSupplierId,
    selectLastSupplier,
    saveSupplier,
    deleteSupplier,
    products,
    updateProduct,
    addStockBatch,
    adjustStock,
    createProduct,
    deleteProduct,
    clearInventory,
    restoreSeedProducts,
    cart,
    totalCartUnits,
    addToCart,
    updateCartQty,
    updateCartItemPrice,
    updateCartItemSupplier,
    clearCart,
    sales,
    nextSaleNumber,
    completeSale,
    toggleItemWarranty,
    closures,
    createClosure,
  };
}

