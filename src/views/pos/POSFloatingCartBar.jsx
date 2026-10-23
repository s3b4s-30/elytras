import React from 'react';
import { formatCOP } from '../../utils/formatters.js';
import { COLORS, LIQUID_GLASS } from '../../theme/designSystem.js';

/**
 * src/views/pos/POSFloatingCartBar.jsx
 * Barra flotante inferior de Resumen de Venta acoplada detrás de la TabBar (ADR-009).
 * Mantiene el contenido elevado mostrando el total de unidades, el primer producto y el monto total.
 */
export default function POSFloatingCartBar({
  nextSaleNumber,
  totalUnitsInCart,
  finalTotalAmount,
  firstCartItem,
  extraCartItemsCount,
  onOpenCheckout,
}) {
  if (totalUnitsInCart <= 0) return null;

  return (
    <div className="pos-summary-sticky-dock">
      <div
        className="pos-summary-bar-inner hig-border max-w-xl mx-auto flex flex-col gap-1.5 animate-ios-slide-up"
        style={LIQUID_GLASS.style}
      >
        {/* Fila 1 elevada: Unidades + Título Resumen Venta # + Botón Cobrar */}
        <div className="flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onOpenCheckout}
            className="flex items-center gap-2 text-left min-w-0 flex-1 cursor-pointer"
          >
            <div
              className="cop-mono px-2.5 py-1 rounded-xl flex items-center gap-1 shrink-0 text-white"
              style={{ backgroundColor: COLORS.electricBlue }}
            >
              <span className="text-xs font-extrabold leading-none">
                {totalUnitsInCart}
              </span>
              <span className="text-[10px] font-bold uppercase leading-none">
                {totalUnitsInCart === 1 ? 'ud' : 'uds'}
              </span>
            </div>

            <span className="text-xs font-bold leading-tight truncate">
              Resumen Venta #{nextSaleNumber}
            </span>

            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full leading-none shrink-0"
              style={{
                backgroundColor: COLORS.electricBlueSoft,
                color: COLORS.electricBlue,
              }}
            >
              Editar
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenCheckout}
            className="btn-electric px-3.5 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span className="cop-mono text-xs sm:text-sm font-extrabold">
              {formatCOP(finalTotalAmount)}
            </span>
            <span>• Cobrar</span>
          </button>
        </div>

        {/* Fila 2: Primer producto visible claramente por encima de la TabBar */}
        {firstCartItem && (
          <button
            type="button"
            onClick={onOpenCheckout}
            className="w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between gap-2 text-left cursor-pointer hig-border"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span
                className="cop-mono text-[11px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0"
                style={{
                  backgroundColor: COLORS.electricBlueSoft,
                  color: COLORS.electricBlue,
                }}
              >
                {firstCartItem.qty}x
              </span>
              <span className="text-xs font-semibold truncate">
                {firstCartItem.productName}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {extraCartItemsCount > 0 && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'var(--bg-elevated-solid)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  +{extraCartItemsCount} más
                </span>
              )}
              <span
                className="cop-mono text-xs font-bold"
                style={{ color: COLORS.electricBlue }}
              >
                {formatCOP(firstCartItem.unitPriceCharged * firstCartItem.qty)}
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

