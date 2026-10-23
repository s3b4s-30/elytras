import React, { useState, useMemo } from 'react';
import { formatCOP, getSupplierColor } from '../utils/formatters.js';
import { COLORS, UI_CLASSES } from '../theme/designSystem.js';
import IOSBottomSheet from '../components/IOSBottomSheet.jsx';
import UnifiedSearchHeader from '../components/UnifiedSearchHeader.jsx';
import POSFloatingCartBar from './pos/POSFloatingCartBar.jsx';
import POSSaleSummaryForm from './pos/POSSaleSummaryForm.jsx';

/**
 * src/views/POSView.jsx
 * Vista Principal de Punto de Venta (POS) desacoplada y modular (SRP):
 * - Delego el encabezado sticky y filtros a <UnifiedSearchHeader />.
 * - Delego el formulario de resumen y doble edición de precios a <POSSaleSummaryForm />.
 * - Delego la barra flotante inferior acoplada a la TabBar a <POSFloatingCartBar />.
 */
export default function POSView({
  products = [],
  suppliers = [],
  nextSaleNumber = 94,
  cart = [],
  onAddToCart,
  onUpdateCartQty,
  onUpdateCartItemPrice,
  onUpdateCartItemSupplier,
  onClearCart,
  onCompleteSale,
  onBack = null,
  topMenuSlot = null,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const [customerName, setCustomerName] = useState('');
  const [showNoteField, setShowNoteField] = useState(false);
  const [saleNote, setSaleNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [customTotalOverride, setCustomTotalOverride] = useState(null);
  const [lastCompletedToast, setLastCompletedToast] = useState(null);
  const [checkoutSheetOpen, setCheckoutSheetOpen] = useState(false);

  const categories = useMemo(() => {
    const normalizedSet = new Set(['Cargadores y Cables']);
    products.forEach((p) => {
      if (p.category) normalizedSet.add(p.category);
    });
    return ['Todos', ...Array.from(normalizedSet), 'Agotados'];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = products.filter((p) => {
      if (selectedFilter === 'Agotados') return p.stock === 0;
      if (selectedFilter !== 'Todos' && p.category !== selectedFilter)
        return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.specs.some((s) => s.toLowerCase().includes(q))
      );
    });

    return [...filtered].sort((a, b) => {
      if (a.stock === 0 && b.stock > 0) return 1;
      if (a.stock > 0 && b.stock === 0) return -1;
      return 0;
    });
  }, [products, searchQuery, selectedFilter]);

  const cartMap = useMemo(() => {
    const map = {};
    cart.forEach((item) => {
      map[item.productId] = item;
    });
    return map;
  }, [cart]);

  const totalUnitsInCart = useMemo(() => {
    return cart.reduce((acc, item) => acc + (Number(item.qty) || 0), 0);
  }, [cart]);

  const subtotalAmount = useMemo(() => {
    return cart.reduce(
      (acc, item) => acc + (Number(item.unitPriceCharged) || 0) * item.qty,
      0
    );
  }, [cart]);

  const finalTotalAmount =
    customTotalOverride !== null
      ? Number(customTotalOverride) || 0
      : subtotalAmount;

  const firstCartItem = cart[0] || null;
  const extraCartItemsCount = Math.max(0, cart.length - 1);

  const handleCheckout = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (cart.length === 0) return;

    const finalCustomer = customerName.trim() || 'Cliente General';
    const saleItems = cart.map((c, index) => {
      const prod = products.find((p) => p.id === c.productId);
      const supplier = suppliers.find(
        (s) => s.id === (c.selectedSupplierId || prod?.supplierId)
      );
      return {
        id: `item-${nextSaleNumber}-${index + 1}`,
        productId: c.productId,
        productName: c.productName,
        specsSummary: prod ? prod.specs.slice(0, 2).join(' • ') : '',
        qty: c.qty,
        unitPriceCharged: Number(c.unitPriceCharged) || 0,
        unitCostSnapshot:
          Number(c.unitCostSnapshot) || Number(prod?.unitCost) || 0,
        selectedBatchId: c.selectedBatchId || null,
        selectedSupplierId: c.selectedSupplierId || prod?.supplierId || null,
        supplierName: c.supplierName || supplier?.name || 'Inventario General',
        warrantyDays: Number(prod?.defaultWarrantyDays) || 30,
        warrantyClaimed: false,
        warrantyClaimNote: '',
      };
    });

    onCompleteSale({
      id: `sale-${nextSaleNumber}`,
      saleNumber: nextSaleNumber,
      customerName: finalCustomer,
      note: saleNote.trim(),
      paymentMethod,
      createdAt: new Date().toISOString(),
      subtotalAmount,
      totalAmount: finalTotalAmount,
      items: saleItems,
    });

    setLastCompletedToast({
      saleNumber: nextSaleNumber,
      customer: finalCustomer,
      total: finalTotalAmount,
    });
    setCustomerName('');
    setSaleNote('');
    setShowNoteField(false);
    setCustomTotalOverride(null);
    setCheckoutSheetOpen(false);
    setTimeout(() => setLastCompletedToast(null), 3500);
  };

  const sharedSummaryFormProps = {
    nextSaleNumber,
    cart,
    products,
    suppliers,
    customerName,
    onCustomerNameChange: setCustomerName,
    paymentMethod,
    onPaymentMethodChange: setPaymentMethod,
    showNoteField,
    onToggleNoteField: setShowNoteField,
    saleNote,
    onSaleNoteChange: setSaleNote,
    subtotalAmount,
    finalTotalAmount,
    customTotalOverride,
    onCustomTotalOverrideChange: setCustomTotalOverride,
    onUpdateCartQty,
    onUpdateCartItemPrice,
    onUpdateCartItemSupplier,
    onSubmitCheckout: handleCheckout,
  };

  return (
    <div className={cart.length > 0 ? 'pb-56' : 'pb-28'}>
      <UnifiedSearchHeader
        title="Punto de Venta"
        onBack={onBack}
        rightActions={topMenuSlot}
        searchPlaceholder="Buscar accesorio, Watts, modelo de iPhone..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categories}
        selectedCategory={selectedFilter}
        onSelectCategory={setSelectedFilter}
      />

      <div className="view-body-container pt-36 space-y-6">
        {lastCompletedToast && (
          <div
            className="hig-card hig-border p-4 flex items-center justify-between animate-ios-sheet"
            style={{
              backgroundColor: COLORS.successGreenSoft,
              borderColor: COLORS.successGreen,
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: COLORS.successGreen }}
              >
                ✓
              </span>
              <div>
                <div className="text-xs font-bold">
                  Venta #{lastCompletedToast.saleNumber} registrada con éxito
                </div>
                <div
                  className="text-[11px] mt-0.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {lastCompletedToast.customer} • Total cobrado:{' '}
                  {formatCOP(lastCompletedToast.total)}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLastCompletedToast(null)}
              className="text-xs font-semibold cursor-pointer"
              style={{ color: COLORS.successGreen }}
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Grid de Catálogo de Productos */}
        <div className={UI_CLASSES.catalogGrid}>
          {filteredProducts.map((product) => {
            const inCart = cartMap[product.id];
            const isOutOfStock = product.stock <= 0;
            const isLowStock = product.stock > 0 && product.stock <= 5;
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
              <div
                key={product.id}
                className={`${UI_CLASSES.card} flex flex-col justify-between gap-3.5 transition-all`}
                style={{
                  opacity: isOutOfStock ? 0.64 : 1,
                  borderColor: inCart
                    ? COLORS.electricBlue
                    : 'var(--border-card)',
                }}
              >
                <div>
                  <div className="card-meta-bar">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="badge-pill uppercase tracking-wider truncate"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {product.category}
                      </span>
                      {supplier && (
                        <span
                          title={`Proveedor: ${supplier.name}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold truncate max-w-[120px] hig-border"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: supplierColor }}
                          />
                          <span className="truncate">{supplier.name}</span>
                        </span>
                      )}
                    </div>

                    <div
                      className="cop-mono px-3 py-1 rounded-xl flex items-center gap-1.5"
                      style={{
                        backgroundColor: isOutOfStock
                          ? COLORS.dangerRedSoft
                          : isLowStock
                          ? COLORS.warningAmberSoft
                          : COLORS.successGreenSoft,
                        color: isOutOfStock
                          ? COLORS.dangerRed
                          : isLowStock
                          ? COLORS.warningAmber
                          : COLORS.successGreen,
                      }}
                    >
                      {isOutOfStock ? (
                        <span className="text-xs font-extrabold">Agotado (0)</span>
                      ) : (
                        <>
                          <span className="text-base font-extrabold leading-none">
                            {product.stock}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-tight">
                            disp.
                          </span>
                        </>
                      )}
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

                <div className="card-action-bar">
                  <div className="min-w-0">
                    <div
                      className="cop-mono text-lg font-extrabold"
                      style={{ color: COLORS.electricBlue }}
                    >
                      {formatCOP(product.salePrice)}
                    </div>
                    <div
                      className="text-[11px] mt-0.5"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      Garantía: {product.defaultWarrantyDays} días
                    </div>
                  </div>

                  {!inCart ? (
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => onAddToCart(product)}
                      aria-label={`Agregar ${product.name}`}
                      className="btn-electric w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 cursor-pointer"
                    >
                      +
                    </button>
                  ) : (
                    <div
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl shrink-0"
                      style={{
                        backgroundColor: COLORS.electricBlueSoft,
                        border: `1.5px solid ${COLORS.electricBlue}`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateCartQty(product.id, inCart.qty - 1)
                        }
                        className="tactile-chip w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer hig-border"
                        style={{
                          backgroundColor: 'var(--bg-elevated-solid)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        −
                      </button>
                      <span
                        className="cop-mono text-base font-extrabold min-w-[28px] text-center"
                        style={{ color: COLORS.electricBlue }}
                      >
                        {inCart.qty}
                      </span>
                      <button
                        type="button"
                        disabled={inCart.qty >= product.stock}
                        onClick={() =>
                          onUpdateCartQty(product.id, inCart.qty + 1)
                        }
                        className="tactile-chip w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-white cursor-pointer"
                        style={{ backgroundColor: COLORS.electricBlue }}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Panel de Facturación en final de lista */}
        <section className={`${UI_CLASSES.card} space-y-3`}>
          <div className="flex items-center justify-between">
            <div>
              <span
                className="cop-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: COLORS.electricBlueSoft,
                  color: COLORS.electricBlue,
                }}
              >
                VENTA #{nextSaleNumber}
              </span>
              <h3 className="text-base font-bold mt-1">Resumen de la Venta</h3>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClearCart();
                  setCustomTotalOverride(null);
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer"
                style={{
                  backgroundColor: COLORS.dangerRedSoft,
                  color: COLORS.dangerRed,
                }}
              >
                Vaciar
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div
              className="p-6 rounded-2xl text-center text-xs hig-border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
              }}
            >
              Toca el botón <strong>+</strong> en cualquier accesorio para iniciar la Venta #{nextSaleNumber}.
            </div>
          ) : (
            <POSSaleSummaryForm {...sharedSummaryFormProps} />
          )}
        </section>
      </div>

      <POSFloatingCartBar
        nextSaleNumber={nextSaleNumber}
        totalUnitsInCart={totalUnitsInCart}
        finalTotalAmount={finalTotalAmount}
        firstCartItem={firstCartItem}
        extraCartItemsCount={extraCartItemsCount}
        onOpenCheckout={() => setCheckoutSheetOpen(true)}
      />

      <IOSBottomSheet
        open={checkoutSheetOpen && cart.length > 0}
        onClose={() => setCheckoutSheetOpen(false)}
        maxWidthClass="max-w-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <span
              className="cop-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: COLORS.electricBlueSoft,
                color: COLORS.electricBlue,
              }}
            >
              VENTA #{nextSaleNumber} • {totalUnitsInCart}{' '}
              {totalUnitsInCart === 1 ? 'UNIDAD' : 'UNIDADES'}
            </span>
            <h3 className="text-base font-bold mt-0.5">Resumen de la Venta</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              onClearCart();
              setCustomTotalOverride(null);
              setCheckoutSheetOpen(false);
            }}
            className="text-xs font-semibold px-3 py-1 rounded-full cursor-pointer"
            style={{
              backgroundColor: COLORS.dangerRedSoft,
              color: COLORS.dangerRed,
            }}
          >
            Vaciar
          </button>
        </div>

        <POSSaleSummaryForm {...sharedSummaryFormProps} />
      </IOSBottomSheet>
    </div>
  );
}
