import React from 'react';
import {
  formatCOP,
  formatPriceInput,
  parsePriceInput,
  getSupplierColor,
} from '../../utils/formatters.js';
import { COLORS } from '../../theme/designSystem.js';

/**
 * src/views/pos/POSSaleSummaryForm.jsx
 * Formulario reutilizable de Resumen de Venta y Facturación (ADR-005):
 * - Nombre del cliente arriba de todo.
 * - Lista de ítems con controles de restar (−), sumar (+), eliminar (✕), precio unitario editable
 *   y selector/asignador automático de Lote/Proveedor según mayor stock disponible.
 * - Método de pago, nota de la venta y monto final editable alineado a la derecha.
 */
export default function POSSaleSummaryForm({
  nextSaleNumber,
  cart = [],
  products = [],
  suppliers = [],
  customerName,
  onCustomerNameChange,
  paymentMethod,
  onPaymentMethodChange,
  showNoteField,
  onToggleNoteField,
  saleNote,
  onSaleNoteChange,
  subtotalAmount,
  finalTotalAmount,
  customTotalOverride,
  onCustomTotalOverrideChange,
  onUpdateCartQty,
  onUpdateCartItemPrice,
  onUpdateCartItemSupplier,
  onSubmitCheckout,
}) {
  return (
    <form onSubmit={onSubmitCheckout} className="space-y-3">
      {/* 1. Nombre del Cliente arriba de todo */}
      <div>
        <label
          className="block text-[11px] font-semibold mb-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          Nombre del Cliente (Opcional)
        </label>
        <input
          type="text"
          placeholder={`Omitir = "Cliente General" (Venta #${nextSaleNumber})`}
          value={customerName}
          onChange={(e) => onCustomerNameChange(e.target.value)}
          className="hig-input w-full text-xs py-2"
        />
      </div>

      {/* 2. Lista de Productos con botón de Restar (−), Sumar (+), Eliminar y Precio unitario editable */}
      <div className="space-y-2">
        {cart.map((item) => {
          const prod = products.find((p) => p.id === item.productId);
          const maxStock = prod ? prod.stock : item.qty;

          return (
            <div
              key={item.productId}
              className="p-3 rounded-2xl space-y-2 hig-border animate-ios-expand"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-bold truncate min-w-0 flex-1">
                  {item.productName}
                </div>
                <button
                  type="button"
                  title="Eliminar producto de la venta"
                  aria-label={`Eliminar ${item.productName}`}
                  onClick={() => {
                    onUpdateCartQty(item.productId, 0);
                    onCustomTotalOverrideChange(null);
                  }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer"
                  style={{
                    backgroundColor: COLORS.dangerRedSoft,
                    color: COLORS.dangerRed,
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="Restar unidad"
                    onClick={() => {
                      onUpdateCartQty(item.productId, item.qty - 1);
                      onCustomTotalOverrideChange(null);
                    }}
                    className="tactile-chip w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-sm cursor-pointer hig-border"
                    style={{
                      backgroundColor: 'var(--bg-elevated-solid)',
                      color:
                        item.qty === 1 ? COLORS.dangerRed : 'var(--text-primary)',
                    }}
                  >
                    −
                  </button>

                  <span
                    className="cop-mono text-sm font-extrabold px-2 py-0.5 rounded-lg min-w-[28px] text-center"
                    style={{
                      backgroundColor: COLORS.electricBlueSoft,
                      color: COLORS.electricBlue,
                    }}
                  >
                    {item.qty}
                  </span>

                  <button
                    type="button"
                    aria-label="Sumar unidad"
                    disabled={item.qty >= maxStock}
                    onClick={() => {
                      onUpdateCartQty(item.productId, item.qty + 1);
                      onCustomTotalOverrideChange(null);
                    }}
                    className="tactile-chip w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-sm text-white cursor-pointer disabled:opacity-40"
                    style={{ backgroundColor: COLORS.electricBlue }}
                  >
                    +
                  </button>

                  <span
                    className="text-[10px] ml-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Base: {formatCOP(item.basePrice)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    c/u:
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="$0"
                    value={formatPriceInput(item.unitPriceCharged)}
                    onChange={(e) => {
                      onUpdateCartItemPrice(
                        item.productId,
                        parsePriceInput(e.target.value)
                      );
                      onCustomTotalOverrideChange(null);
                    }}
                    className="hig-input cop-mono w-28 py-1 px-2 text-xs font-bold text-right"
                    style={{ backgroundColor: 'var(--bg-elevated-solid)' }}
                  />
                </div>
              </div>

              {/* Selector / Asignación de Lote y Proveedor */}
              {(() => {
                const availableBatches = Array.isArray(prod?.batches)
                  ? prod.batches.filter((b) => Number(b.qty) > 0)
                  : [];
                const currentSup = suppliers.find(
                  (s) => s.id === item.selectedSupplierId
                );
                const currentSupColor = getSupplierColor(currentSup, 0);

                return (
                  <div
                    className="flex items-center justify-between gap-2 pt-2 border-t text-[11px]"
                    style={{ borderColor: 'var(--border-hairline)' }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span
                        className="text-[10px] shrink-0 font-medium"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Lote / Proveedor:
                      </span>

                      {availableBatches.length > 1 ? (
                        <div className="relative min-w-0 max-w-[210px]">
                          <select
                            value={item.selectedSupplierId || ''}
                            onChange={(e) =>
                              onUpdateCartItemSupplier &&
                              onUpdateCartItemSupplier(
                                item.productId,
                                e.target.value
                              )
                            }
                            className="hig-input py-1 px-2 text-[11px] font-semibold rounded-xl w-full truncate cursor-pointer"
                            style={{
                              backgroundColor: 'var(--bg-elevated-solid)',
                            }}
                          >
                            {availableBatches.map((b) => {
                              const s = suppliers.find(
                                (sup) => sup.id === b.supplierId
                              );
                              return (
                                <option
                                  key={b.id || b.supplierId}
                                  value={b.supplierId}
                                >
                                  {b.supplierName || s?.name || 'Mayorista'} (
                                  {b.qty} uds disp.)
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: currentSupColor }}
                          />
                          <span className="truncate font-semibold text-[11px]">
                            {item.supplierName ||
                              currentSup?.name ||
                              'Mayorista Principal'}
                          </span>
                        </div>
                      )}
                    </div>

                    {item.unitCostSnapshot > 0 && (
                      <span
                        className="cop-mono text-[10px] shrink-0"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        Costo: {formatCOP(item.unitCostSnapshot)}
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* 3. Método de Pago y Nota de la Venta */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-1.5">
          {['Efectivo', 'Nequi', 'Bancolombia'].map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => onPaymentMethodChange(method)}
              className="tactile-chip py-2 px-2 rounded-xl text-xs font-semibold cursor-pointer hig-border"
              style={{
                backgroundColor:
                  paymentMethod === method
                    ? COLORS.electricBlue
                    : 'var(--bg-secondary)',
                color:
                  paymentMethod === method ? '#FFFFFF' : 'var(--text-secondary)',
                borderColor:
                  paymentMethod === method ? 'transparent' : 'var(--border-card)',
              }}
            >
              {method}
            </button>
          ))}
        </div>

        <div>
          {!showNoteField ? (
            <button
              type="button"
              onClick={() => onToggleNoteField(true)}
              className="text-xs font-semibold flex items-center gap-1 cursor-pointer"
              style={{ color: COLORS.electricBlue }}
            >
              <span>+ Agregar nota a la venta</span>
            </button>
          ) : (
            <div className="space-y-1 animate-ios-expand">
              <div className="flex items-center justify-between">
                <label
                  className="text-[11px] font-semibold"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Nota de la venta (Opcional)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onSaleNoteChange('');
                    onToggleNoteField(false);
                  }}
                  className="text-[11px] cursor-pointer"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Ocultar
                </button>
              </div>
              <input
                type="text"
                placeholder="Ej. Combo con descuento acordado en mostrador..."
                value={saleNote}
                onChange={(e) => onSaleNoteChange(e.target.value)}
                className="hig-input w-full text-xs py-2"
              />
            </div>
          )}
        </div>
      </div>

      {/* 4. Monto Final Editable AL LADO DERECHO del texto */}
      <div
        className="p-3 rounded-2xl flex items-center justify-between gap-3 hig-border"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="min-w-0">
          <div className="text-xs font-bold leading-tight">
            Monto Final Total (COP)
          </div>
          <div
            className="text-[11px] mt-0.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Suma:{' '}
            <span className="cop-mono font-semibold">
              {formatCOP(subtotalAmount)}
            </span>
            {customTotalOverride !== null &&
              customTotalOverride !== subtotalAmount && (
                <button
                  type="button"
                  onClick={() => onCustomTotalOverrideChange(null)}
                  className="ml-1.5 underline cursor-pointer"
                  style={{ color: COLORS.electricBlue }}
                >
                  Restaurar
                </button>
              )}
          </div>
        </div>

        <input
          type="text"
          inputMode="numeric"
          placeholder="$0"
          value={formatPriceInput(finalTotalAmount)}
          onChange={(e) =>
            onCustomTotalOverrideChange(parsePriceInput(e.target.value))
          }
          className="hig-input cop-mono w-32 sm:w-36 py-1.5 px-2.5 text-right text-base sm:text-lg font-extrabold shrink-0"
          style={{
            backgroundColor: 'var(--bg-elevated-solid)',
            color: COLORS.electricBlue,
          }}
        />
      </div>

      {/* 5. Botón Facturar Venta */}
      <button
        type="submit"
        className="btn-electric w-full py-3 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>Facturar Venta #{nextSaleNumber}</span>
        <span className="cop-mono">• {formatCOP(finalTotalAmount)}</span>
      </button>
    </form>
  );
}

