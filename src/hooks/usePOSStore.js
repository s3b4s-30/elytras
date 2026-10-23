/**
 * src/hooks/usePOSStore.js
 * Hook de Dominio y Gestión de Estado (Inyección de Dependencias con posRepository).
 * Separa la lógica de negocio de los componentes visuales de React.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  defaultPOSRepository,
  normalizeProductCategory,
  normalizeSupplier,
} from '../services/posRepository.js';
import { INITIAL_PRODUCTS } from '../utils/formatters.js';

export function usePOSStore(repository = defaultPOSRepository) {
  const [themeMode, setThemeMode] = useState(() => repository.getTheme());
  const [suppliers, setSuppliers] = useState(() => repository.getSuppliers());
  const [lastSupplierId, setLastSupplierId] = useState(() =>
    repository.getLastSupplierId()
  );
  const [products, setProducts] = useState(() => repository.getProducts());
  const [cart, setCart] = useState(() => repository.getCart());
  const [sales, setSales] = useState(() => repository.getSales());
  const [closures, setClosures] = useState(() => repository.getClosures());

  // Sincronización del tema con el DOM (OLED #000000 vs Claro #F2F2F7)
  useEffect(() => {
    repository.saveTheme(themeMode);
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effectiveTheme =
      themeMode === 'system' ? (prefersDark ? 'dark' : 'light') : themeMode;

    root.setAttribute('data-theme', effectiveTheme);
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [themeMode, repository]);

  // Persistencia reactiva delegada al Repositorio
  useEffect(() => {
    repository.saveSuppliers(suppliers);
  }, [suppliers, repository]);

  useEffect(() => {
    repository.saveProducts(products);
  }, [products, repository]);

  useEffect(() => {
    repository.saveCart(cart);
  }, [cart, repository]);

  useEffect(() => {
    repository.saveSales(sales);
  }, [sales, repository]);

  useEffect(() => {
    repository.saveClosures(closures);
  }, [closures, repository]);

  // Acciones de Proveedores
  const selectLastSupplier = useCallback(
    (supplierId) => {
      setLastSupplierId(supplierId);
      repository.saveLastSupplierId(supplierId);
    },
    [repository]
  );

  const saveSupplier = useCallback(
    (supplierData) => {
      setSuppliers((prev) => {
        const exists = prev.some((s) => s.id === supplierData.id);
        if (exists) {
          return prev.map((s, idx) =>
            s.id === supplierData.id ? normalizeSupplier(supplierData, idx) : s
          );
        }
        return [normalizeSupplier(supplierData, prev.length), ...prev];
      });
      selectLastSupplier(supplierData.id);
    },
    [selectLastSupplier]
  );

  const deleteSupplier = useCallback(
    (supplierId) => {
      setSuppliers((prev) => {
        const next = prev.filter((s) => s.id !== supplierId);
        if (lastSupplierId === supplierId && next.length > 0) {
          selectLastSupplier(next[0].id);
        }
        return next;
      });
    },
    [lastSupplierId, selectLastSupplier]
  );

  // Acciones del Carrito POS
  const addToCart = useCallback(
    (product, preferredSupplierId = null) => {
      if (!product || product.stock <= 0) return;
      setCart((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          return prev.map((i) =>
            i.productId === product.id
              ? { ...i, qty: Math.min(product.stock, i.qty + 1) }
              : i
          );
        }

        // Selección automática del lote/proveedor con mayor cantidad disponible
        const productBatches = Array.isArray(product.batches)
          ? product.batches.filter((b) => Number(b.qty) > 0)
          : [];

        let bestBatch = null;
        if (preferredSupplierId) {
          bestBatch = productBatches.find(
            (b) => b.supplierId === preferredSupplierId
          );
        }
        if (!bestBatch && productBatches.length > 0) {
          bestBatch = [...productBatches].sort(
            (a, b) => Number(b.qty) - Number(a.qty)
          )[0];
        }

        const selectedSupplier =
          suppliers.find(
            (s) => s.id === (bestBatch?.supplierId || product.supplierId)
          ) || suppliers[0];

        return [
          ...prev,
          {
            productId: product.id,
            productName: product.name,
            basePrice: product.salePrice,
            unitPriceCharged: product.salePrice,
            qty: 1,
            selectedSupplierId:
              bestBatch?.supplierId || product.supplierId || selectedSupplier?.id,
            selectedBatchId: bestBatch?.id || null,
            supplierName:
              bestBatch?.supplierName ||
              selectedSupplier?.name ||
              'Mayorista Principal',
            unitCostSnapshot:
              bestBatch && bestBatch.unitCost !== undefined
                ? Number(bestBatch.unitCost)
                : Number(product.unitCost) || 0,
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
          const productBatches = Array.isArray(prod?.batches)
            ? prod.batches.filter((b) => Number(b.qty) > 0)
            : [];
          const matchingBatch = productBatches.find(
            (b) => b.supplierId === supplierId
          );
          const sup = suppliers.find((s) => s.id === supplierId);

          return {
            ...i,
            selectedSupplierId: supplierId,
            selectedBatchId: matchingBatch?.id || null,
            supplierName: matchingBatch?.supplierName || sup?.name || 'Mayorista',
            unitCostSnapshot:
              matchingBatch && matchingBatch.unitCost !== undefined
                ? Number(matchingBatch.unitCost)
                : Number(prod?.unitCost) || 0,
          };
        })
      );
    },
    [products, suppliers]
  );

  const updateCartQty = useCallback(
    (productId, nextQty) => {
      if (nextQty <= 0) {
        setCart((prev) => prev.filter((i) => i.productId !== productId));
        return;
      }
      const prod = products.find((p) => p.id === productId);
      const maxStock = prod ? prod.stock : nextQty;
      setCart((prev) =>
        prev.map((i) =>
          i.productId === productId
            ? { ...i, qty: Math.min(maxStock, nextQty) }
            : i
        )
      );
    },
    [products]
  );

  const updateCartItemPrice = useCallback((productId, newPrice) => {
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, unitPriceCharged: newPrice } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const completeSale = useCallback((newSale) => {
    setSales((prev) => [newSale, ...prev]);
    setProducts((prev) =>
      prev.map((prod) => {
        const soldItems = newSale.items.filter((i) => i.productId === prod.id);
        if (!soldItems || soldItems.length === 0) return prod;

        const totalSoldQty = soldItems.reduce(
          (acc, i) => acc + (Number(i.qty) || 0),
          0
        );

        let updatedBatches = Array.isArray(prod.batches)
          ? prod.batches.map((b) => ({ ...b }))
          : [];

        // Deducción específica de lotes según la selección
        for (const item of soldItems) {
          let needed = Number(item.qty) || 0;
          if (needed <= 0) continue;

          // 1. Intentar descontar del lote específico seleccionado
          if (item.selectedBatchId && updatedBatches.length > 0) {
            const target = updatedBatches.find(
              (b) => b.id === item.selectedBatchId
            );
            if (target && target.qty > 0) {
              const deduct = Math.min(target.qty, needed);
              target.qty -= deduct;
              needed -= deduct;
            }
          }

          // 2. Si aún falta o se seleccionó por proveedor
          if (needed > 0 && item.selectedSupplierId && updatedBatches.length > 0) {
            for (const b of updatedBatches) {
              if (b.supplierId === item.selectedSupplierId && b.qty > 0) {
                const deduct = Math.min(b.qty, needed);
                b.qty -= deduct;
                needed -= deduct;
                if (needed <= 0) break;
              }
            }
          }

          // 3. Si aún queda remanente, descontar del lote con mayor cantidad disponible
          if (needed > 0 && updatedBatches.length > 0) {
            const sorted = [...updatedBatches].sort((a, b) => b.qty - a.qty);
            for (const s of sorted) {
              if (s.qty > 0) {
                const deduct = Math.min(s.qty, needed);
                s.qty -= deduct;
                needed -= deduct;
                if (needed <= 0) break;
              }
            }
          }
        }

        return {
          ...prod,
          stock: Math.max(0, prod.stock - totalSoldQty),
          batches: updatedBatches,
          lastSoldAt: newSale.createdAt,
        };
      })
    );
    setCart([]);
  }, []);

  // Acciones de Inventario y Lotes
  const updateProduct = useCallback((updatedProduct) => {
    const normalized = normalizeProductCategory(updatedProduct);
    setProducts((prev) =>
      prev.map((p) => (p.id === normalized.id ? normalized : p))
    );
  }, []);

  const addStockBatch = useCallback(
    (productId, batchEntry) => {
      if (batchEntry.supplierId) {
        selectLastSupplier(batchEntry.supplierId);
      }
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          return {
            ...p,
            stock: p.stock + batchEntry.qty,
            unitCost: batchEntry.unitCost,
            supplierId: batchEntry.supplierId || p.supplierId,
            lastAddedAt: new Date().toISOString(),
            batches: [batchEntry, ...(p.batches || [])],
          };
        })
      );
    },
    [selectLastSupplier]
  );

  const adjustStockManual = useCallback(
    (productId, deltaQty, reason = 'Ajuste manual') => {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          const nextStock = Math.max(0, p.stock + deltaQty);
          const adjustmentRecord = {
            id: `adj-${Date.now()}`,
            date: new Date().toISOString(),
            delta: deltaQty,
            newStock: nextStock,
            reason,
          };
          return {
            ...p,
            stock: nextStock,
            adjustments: [adjustmentRecord, ...(p.adjustments || [])],
          };
        })
      );
    },
    []
  );

  const createProduct = useCallback(
    (newProduct) => {
      if (repository.setIntentionallyEmpty) {
        repository.setIntentionallyEmpty(false);
      }
      if (newProduct.supplierId) {
        selectLastSupplier(newProduct.supplierId);
      }
      const normalized = normalizeProductCategory(newProduct);
      setProducts((prev) => [normalized, ...prev]);
    },
    [repository, selectLastSupplier]
  );

  const deleteProduct = useCallback((productId) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const clearInventory = useCallback(
    (mode = 'out_of_stock') => {
      if (mode === 'out_of_stock') {
        setProducts((prev) => prev.filter((p) => p.stock > 0));
      } else if (mode === 'all') {
        if (repository.setIntentionallyEmpty) {
          repository.setIntentionallyEmpty(true);
        }
        setProducts([]);
        setCart([]);
      }
    },
    [repository]
  );

  const restoreSeedProducts = useCallback(() => {
    if (repository.setIntentionallyEmpty) {
      repository.setIntentionallyEmpty(false);
    }
    setProducts(INITIAL_PRODUCTS.map(normalizeProductCategory));
  }, [repository]);

  // Acciones de Garantías e Historial
  const toggleItemWarranty = useCallback((saleId, itemId) => {
    setSales((prev) =>
      prev.map((sale) => {
        if (sale.id !== saleId) return sale;
        return {
          ...sale,
          items: sale.items.map((item) => {
            if (item.id !== itemId) return item;
            const nextClaimed = !item.warrantyClaimed;
            return {
              ...item,
              warrantyClaimed: nextClaimed,
              warrantyClaimNote: nextClaimed
                ? `Garantía reclamada por cliente (${new Date().toLocaleDateString('es-CO', {
                    day: '2-digit',
                    month: 'short',
                  })}).`
                : '',
            };
          }),
        };
      })
    );
  }, []);

  // Acciones de Cierre Contable
  const createClosure = useCallback((newClosure) => {
    setClosures((prev) => [newClosure, ...prev]);
  }, []);

  const nextSaleNumber = useMemo(() => {
    if (sales.length === 0) return 1;
    return Math.max(...sales.map((s) => s.saleNumber)) + 1;
  }, [sales]);

  const totalCartUnits = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.qty, 0);
  }, [cart]);

  const themeBadgeText =
    themeMode === 'dark'
      ? 'Oscuro'
      : themeMode === 'light'
      ? 'Claro'
      : 'Auto';

  return {
    themeMode,
    setThemeMode,
    themeBadgeText,
    suppliers,
    lastSupplierId,
    selectLastSupplier,
    handleSelectLastSupplier: selectLastSupplier,
    saveSupplier,
    handleSaveSupplier: saveSupplier,
    deleteSupplier,
    handleDeleteSupplier: deleteSupplier,
    products,
    updateProduct,
    handleUpdateProduct: updateProduct,
    addStockBatch,
    handleAddStockBatch: addStockBatch,
    adjustStockManual,
    handleAdjustStockManual: adjustStockManual,
    createProduct,
    handleCreateProduct: createProduct,
    deleteProduct,
    handleDeleteProduct: deleteProduct,
    clearInventory,
    handleClearInventory: clearInventory,
    restoreSeedProducts,
    handleRestoreSeedProducts: restoreSeedProducts,
    cart,
    totalCartUnits,
    addToCart,
    handleAddToCart: addToCart,
    updateCartQty,
    handleUpdateCartQty: updateCartQty,
    updateCartItemPrice,
    handleUpdateCartItemPrice: updateCartItemPrice,
    updateCartItemSupplier,
    handleUpdateCartItemSupplier: updateCartItemSupplier,
    clearCart,
    handleClearCart: clearCart,
    sales,
    nextSaleNumber,
    completeSale,
    handleCompleteSale: completeSale,
    toggleItemWarranty,
    handleToggleItemWarranty: toggleItemWarranty,
    closures,
    createClosure,
    handleCreateClosure: createClosure,
  };
}
