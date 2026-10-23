import React, { useState, useMemo } from 'react';
import { formatCOP, getSupplierColor } from '../utils/formatters.js';
import { COLORS, LIQUID_GLASS, UI_CLASSES } from '../theme/designSystem.js';
import IOSBottomSheet from '../components/IOSBottomSheet.jsx';
import UnifiedSearchHeader from '../components/UnifiedSearchHeader.jsx';
import ProductAdminSheet from './inventario/ProductAdminSheet.jsx';
import CreateAccessorySheet from './inventario/CreateAccessorySheet.jsx';

/**
 * src/views/InventarioView.jsx
 * Vista Principal de Inventario desacoplada y modular (SRP):
 * - Delego el encabezado sticky y filtros a <UnifiedSearchHeader />.
 * - Delego la ficha confidencial de administración y lotes a <ProductAdminSheet />.
 * - Delego el creador dinámico de accesorios a <CreateAccessorySheet />.
 * - Soporte para eliminar productos individuales, limpiar inventario y restaurar catálogo base.
 */
export default function InventarioView({
  products = [],
  suppliers = [],
  lastSupplierId,
  onUpdateProduct,
  onAddStockBatch,
  onAdjustStockManual,
  onCreateProduct,
  onDeleteProduct,
  onClearInventory,
  onRestoreSeedProducts,
  onBack = null,
  topMenuSlot = null,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [cleanModalOpen, setCleanModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  const outOfStockCount = useMemo(
    () => products.filter((p) => p.stock === 0).length,
    [products]
  );

  const categories = useMemo(() => {
    const normalizedSet = new Set(['Cargadores y Cables']);
    products.forEach((p) => {
      if (p.category) normalizedSet.add(p.category);
    });
    return ['Todos', ...Array.from(normalizedSet), 'Agotados'];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (selectedCategory === 'Agotados' && p.stock !== 0) return false;
      if (
        selectedCategory !== 'Todos' &&
        selectedCategory !== 'Agotados' &&
        p.category !== selectedCategory
      ) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.specs.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [products, searchQuery, selectedCategory]);

  const headerRightActions = (
    <>
      {/* Botón para Limpiar / Gestionar Inventario */}
      <button
        type="button"
        aria-label="Limpiar inventario"
        title="Limpiar inventario"
        onClick={() => {
          setConfirmClearAll(false);
          setCleanModalOpen(true);
        }}
        className={UI_CLASSES.headerIconBtn}
        style={{
          color: COLORS.dangerRed,
          ...LIQUID_GLASS.style,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>

      {/* Botón para Agregar Nuevo Producto */}
      <button
        type="button"
        aria-label="Agregar nuevo producto al inventario"
        title="Nuevo producto"
        onClick={() => setCreateModalOpen(true)}
        className={UI_CLASSES.headerIconBtn}
        style={{
          color: COLORS.electricBlue,
          ...LIQUID_GLASS.style,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      {topMenuSlot}
    </>
  );

  return (
    <div className="pb-28">
      <UnifiedSearchHeader
        title="Inventario"
        onBack={onBack}
        rightActions={headerRightActions}
        searchPlaceholder="Filtrar inventario por accesorio, Watts, cable o compatibilidad..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <div className="view-body-container pt-36 space-y-6">
        {products.length === 0 ? (
          <div
            className="p-9 rounded-[28px] text-center space-y-4 hig-border max-w-md mx-auto my-4"
            style={{
              backgroundColor: 'var(--bg-elevated-solid)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div
              className="w-14 h-14 rounded-[20px] mx-auto flex items-center justify-center hig-border"
              style={{
                backgroundColor: COLORS.electricBlueSoft,
                color: COLORS.electricBlue,
                borderColor: 'rgba(0, 122, 255, 0.22)',
              }}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold tracking-tight">
                Catálogo sin Accesorios
              </h3>
              <p
                className="text-xs max-w-xs mx-auto leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Registra un nuevo accesorio o restaura el catálogo base de demostración.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="btn-electric w-full sm:w-auto px-5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <span>+ Registrar Accesorio</span>
              </button>
              {onRestoreSeedProducts && (
                <button
                  type="button"
                  onClick={onRestoreSeedProducts}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-2xl text-xs font-semibold cursor-pointer hig-border transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Restaurar Catálogo Base
                </button>
              )}
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            className="p-8 rounded-[26px] text-center space-y-2.5 hig-border max-w-md mx-auto"
            style={{ backgroundColor: 'var(--bg-elevated-solid)' }}
          >
            <div className="text-sm font-bold">Sin coincidencias</div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              No se encontraron accesorios para "{searchQuery || selectedCategory}".
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Todos');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              style={{
                backgroundColor: COLORS.electricBlueSoft,
                color: COLORS.electricBlue,
              }}
            >
              Ver todos los productos
            </button>
          </div>
        ) : (
          <div className={UI_CLASSES.catalogGrid}>
            {filteredProducts.map((product) => {
              const isLowStock = product.stock > 0 && product.stock <= 5;
              const isOut = product.stock === 0;
              const supplierIndex = suppliers.findIndex(
                (s) => s.id === product.supplierId
              );
              const supplier =
                supplierIndex >= 0 ? suppliers[supplierIndex] : null;
              const supplierColor = getSupplierColor(
                supplier,
                supplierIndex >= 0 ? supplierIndex : 0
              );

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setSelectedProductId(product.id)}
                  className={`${UI_CLASSES.cardInteractive} text-left flex flex-col justify-between gap-3.5 group`}
                  style={{ borderColor: 'var(--border-card)' }}
                >
                  <div className="w-full">
                    <div className="card-meta-bar">
                      <span
                        className="badge-pill uppercase tracking-wider truncate"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {product.category}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <div
                          className="cop-mono px-3 py-1 rounded-xl flex items-center gap-1.5"
                          style={{
                            backgroundColor: isOut
                              ? COLORS.dangerRedSoft
                              : isLowStock
                              ? COLORS.warningAmberSoft
                              : COLORS.successGreenSoft,
                            color: isOut
                              ? COLORS.dangerRed
                              : isLowStock
                              ? COLORS.warningAmber
                              : COLORS.successGreen,
                          }}
                        >
                          {isOut ? (
                            <span className="text-xs font-extrabold">Sin Stock (0)</span>
                          ) : (
                            <>
                              <span className="text-base font-extrabold leading-none">
                                {product.stock}
                              </span>
                              <span className="text-[11px] font-bold uppercase tracking-tight">
                                {product.stock === 1 ? 'unidad' : 'unidades'}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Botón de Eliminación Rápida Directa */}
                        <button
                          type="button"
                          aria-label={`Eliminar ${product.name}`}
                          title="Eliminar producto"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductToDelete(product);
                          }}
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer hig-border opacity-70 group-hover:opacity-100"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold mt-3 leading-snug">
                      {product.name}
                    </h3>

                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {product.specs.map((spec) => (
                        <span
                          key={spec}
                          className="text-[11px] font-medium px-2.5 py-1 rounded-xl"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="card-action-bar w-full">
                    <div>
                      <div
                        className="text-[10px]"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        Precio Público (COP)
                      </div>
                      <div
                        className="cop-mono text-lg font-extrabold"
                        style={{ color: COLORS.electricBlue }}
                      >
                        {formatCOP(product.salePrice)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className="text-[10px]"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        Garantía Cliente
                      </div>
                      <div className="text-xs font-semibold">
                        {product.defaultWarrantyDays} días
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sheet de Limpieza General de Inventario */}
      <IOSBottomSheet
        open={cleanModalOpen}
        onClose={() => setCleanModalOpen(false)}
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <span
              className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: COLORS.dangerRedSoft,
                color: COLORS.dangerRed,
              }}
            >
              GESTIÓN Y LIMPIEZA DE INVENTARIO
            </span>
            <h3 className="text-lg font-bold mt-1">Limpiar Catálogo</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Selecciona una acción para eliminar productos del inventario actual.
            </p>
          </div>

          <div className="space-y-2.5">
            {/* Opción 1: Eliminar productos Agotados */}
            <div
              className="p-3.5 rounded-2xl flex items-center justify-between gap-3 hig-border"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="min-w-0">
                <div className="text-xs font-bold flex items-center gap-2">
                  <span>Eliminar Productos Agotados</span>
                  <span
                    className="cop-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: COLORS.warningAmberSoft,
                      color: COLORS.warningAmber,
                    }}
                  >
                    {outOfStockCount} {outOfStockCount === 1 ? 'agotado' : 'agotados'}
                  </span>
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Borra solo los artículos con stock en 0. Conserva intactos los que tienen unidades.
                </div>
              </div>

              <button
                type="button"
                disabled={outOfStockCount === 0}
                onClick={() => {
                  if (onClearInventory) {
                    onClearInventory('out_of_stock');
                  }
                  setCleanModalOpen(false);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-opacity"
                style={{
                  backgroundColor: outOfStockCount > 0 ? COLORS.warningAmberSoft : 'var(--bg-elevated-solid)',
                  color: outOfStockCount > 0 ? COLORS.warningAmber : 'var(--text-tertiary)',
                  opacity: outOfStockCount > 0 ? 1 : 0.5,
                }}
              >
                Limpiar Agotados
              </button>
            </div>

            {/* Opción 2: Vaciar Todo el Inventario */}
            <div
              className="p-3.5 rounded-2xl space-y-2.5 hig-border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: confirmClearAll ? COLORS.dangerRed : 'var(--border-card)',
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold" style={{ color: COLORS.dangerRed }}>
                    Vaciar Todo el Inventario
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Borra los {products.length} productos del catálogo para comenzar desde cero.
                  </div>
                </div>

                {!confirmClearAll && (
                  <button
                    type="button"
                    disabled={products.length === 0}
                    onClick={() => setConfirmClearAll(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-opacity"
                    style={{
                      backgroundColor: products.length > 0 ? COLORS.dangerRedSoft : 'var(--bg-elevated-solid)',
                      color: products.length > 0 ? COLORS.dangerRed : 'var(--text-tertiary)',
                      opacity: products.length > 0 ? 1 : 0.5,
                    }}
                  >
                    Vaciar Todo...
                  </button>
                )}
              </div>

              {confirmClearAll && (
                <div
                  className="p-3 rounded-xl space-y-2 animate-ios-expand"
                  style={{
                    backgroundColor: 'var(--bg-elevated-solid)',
                    border: `1px solid ${COLORS.dangerRed}`,
                  }}
                >
                  <p className="text-xs font-bold" style={{ color: COLORS.dangerRed }}>
                    ¿Estás seguro de eliminar los {products.length} productos?
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    Esta acción es irreversible y limpiará todo el catálogo activo.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (onClearInventory) {
                          onClearInventory('all');
                        }
                        setConfirmClearAll(false);
                        setCleanModalOpen(false);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white cursor-pointer"
                      style={{ backgroundColor: COLORS.dangerRed }}
                    >
                      Sí, Vaciar Inventario
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearAll(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer hig-border"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </IOSBottomSheet>

      {/* Sheet de Confirmación Rápida para eliminar 1 producto desde la tarjeta */}
      <IOSBottomSheet
        open={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        maxWidthClass="max-w-sm"
      >
        {productToDelete && (
          <div className="space-y-3.5">
            <div>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: COLORS.dangerRedSoft,
                  color: COLORS.dangerRed,
                }}
              >
                ELIMINAR PRODUCTO
              </span>
              <h3 className="text-base font-bold mt-1">¿Eliminar del inventario?</h3>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                ¿Deseas remover definitivamente <strong>"{productToDelete.name}"</strong>?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (onDeleteProduct) {
                    onDeleteProduct(productToDelete.id);
                  }
                  setProductToDelete(null);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-white cursor-pointer shadow-sm"
                style={{ backgroundColor: COLORS.dangerRed }}
              >
                Sí, Eliminar Producto
              </button>
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer hig-border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </IOSBottomSheet>

      <ProductAdminSheet
        product={selectedProduct}
        suppliers={suppliers}
        lastSupplierId={lastSupplierId}
        onClose={() => setSelectedProductId(null)}
        onUpdateProduct={onUpdateProduct}
        onAddStockBatch={onAddStockBatch}
        onAdjustStockManual={onAdjustStockManual}
        onDeleteProduct={onDeleteProduct}
      />

      <CreateAccessorySheet
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        products={products}
        suppliers={suppliers}
        lastSupplierId={lastSupplierId}
        onCreateProduct={onCreateProduct}
      />
    </div>
  );
}
