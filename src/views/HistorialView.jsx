import React, { useState, useMemo } from 'react';
import { formatCOP, getWarrantyStatus } from '../utils/formatters.js';
import { COLORS, LIQUID_GLASS, UI_CLASSES } from '../theme/designSystem.js';

/**
 * HistorialView.jsx — Historial de Ventas y Garantías Independientes por Ítem (ADR-003)
 * - Bloque superior unificado sticky top-0 z-40 (Large Title + TopMenu '•••' + Buscador).
 * - Bordes dinámicos según el tema activo (border-black/10 en Claro, border-white/10 en OLED).
 * - Detalle independiente por producto con temporizador y botón de garantía aislado.
 */
export default function HistorialView({
  sales = [],
  onToggleItemWarranty,
  onBack = null,
  topMenuSlot = null,
  themeBadgeText = 'OLED Oscuro',
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSaleId, setExpandedSaleId] = useState(null);

  const filteredSales = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter((sale) => {
      const matchNumber = `venta #${sale.saleNumber}`.includes(q) || String(sale.saleNumber).includes(q);
      const matchCustomer = sale.customerName.toLowerCase().includes(q);
      const matchItems = sale.items.some(
        (i) =>
          i.productName.toLowerCase().includes(q) ||
          i.supplierName.toLowerCase().includes(q)
      );
      return matchNumber || matchCustomer || matchItems;
    });
  }, [sales, searchQuery]);

  return (
    <div className="pb-28">
      {/* BLOQUE SUPERIOR UNIFICADO STICKY HEADER (Large Title + TopMenu + Buscador) */}
      <header
        className={UI_CLASSES.stickyHeader}
        style={LIQUID_GLASS.style}
      >
        <div className="max-w-3xl mx-auto space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  aria-label="Regresar a Resumen"
                  title="Regresar a Resumen"
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-[0.97] cursor-pointer hig-border shrink-0"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: COLORS.electricBlue,
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              )}
              <h1 className={`${UI_CLASSES.largeTitle} truncate`}>Historial y Garantías</h1>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {topMenuSlot}
            </div>
          </div>

          <div className="relative">
            <input
              type="search"
              placeholder="Buscar por # de venta (ej. 93), cliente o accesorio para garantía..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="hig-input w-full pl-10"
            />
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-secondary)' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>
      </header>

      {/* Listado de Transacciones Agrupadas con Bordes Dinámicos (.hig-border) */}
      <div className="view-body-container pt-32 space-y-4">
        {filteredSales.map((sale) => {
          const isExpanded = expandedSaleId === sale.id;
          const totalUnits = sale.items.reduce((acc, i) => acc + (Number(i.qty) || 1), 0);
          const hasClaimedItem = sale.items.some((i) => i.warrantyClaimed);
          const mainProductsPreview = sale.items.map((i) => `${i.qty}x ${i.productName}`).join(' + ');

          return (
            <div
              key={sale.id}
              className="hig-card hig-border p-0 overflow-hidden transition-all"
              style={{
                padding: 0,
                borderColor: isExpanded ? COLORS.electricBlue : 'var(--border-card)',
              }}
            >
              {/* Cabecera Compacta y Balanceada de la Transacción (Sin espacio vacío bajo el monto) */}
              <button
                type="button"
                onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                className="w-full px-4 py-3.5 text-left flex flex-col gap-2 cursor-pointer"
                style={{ border: 'none', background: 'transparent' }}
              >
                {/* Fila 1: Identificador de Venta + Cliente a la izquierda | Valor Total + Chevron a la derecha */}
                <div className="w-full flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span
                      className="cop-mono text-xs font-extrabold px-2.5 py-0.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: COLORS.electricBlueSoft,
                        color: COLORS.electricBlue,
                      }}
                    >
                      Venta #{sale.saleNumber}
                    </span>
                    <span className="text-xs font-bold truncate">{sale.customerName}</span>
                    {hasClaimedItem && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0"
                        style={{
                          backgroundColor: COLORS.warningAmberSoft,
                          color: COLORS.warningAmber,
                        }}
                      >
                        Garantía Aplicada
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      {sale.subtotalAmount !== sale.totalAmount && (
                        <span
                          className="cop-mono text-[11px] line-through"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {formatCOP(sale.subtotalAmount)}
                        </span>
                      )}
                      <span className="cop-mono text-base sm:text-lg font-extrabold leading-none">
                        {formatCOP(sale.totalAmount)}
                      </span>
                    </div>

                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-transform"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Fila 2: Productos a la izquierda | Método de pago, unidades y fecha justo debajo del valor */}
                <div className="w-full flex items-center justify-between gap-3">
                  <div
                    className="text-xs font-medium truncate min-w-0 flex-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {mainProductsPreview}
                  </div>

                  <div
                    className="text-[11px] shrink-0 flex items-center gap-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {sale.paymentMethod}
                    </span>
                    <span className="cop-mono font-semibold">
                      {totalUnits} {totalUnits === 1 ? 'ud.' : 'uds.'}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(sale.createdAt).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>
              </button>

              {/* Desglose Independiente Ítem por Ítem (ADR-003) */}
              {isExpanded && (
                <div
                  className="px-4 pb-4 pt-3 hig-divider space-y-2.5 animate-ios-expand"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                  }}
                >
                  {sale.note && (
                    <div
                      className="text-xs px-3 py-2 rounded-xl hig-border"
                      style={{
                        backgroundColor: 'var(--bg-elevated-solid)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <strong>Nota de venta:</strong> {sale.note}
                    </div>
                  )}

                  {sale.items.map((item) => {
                    const warranty = getWarrantyStatus(
                      sale.createdAt,
                      item.warrantyDays,
                      item.warrantyClaimed
                    );

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl space-y-2.5 hig-border"
                        style={{
                          backgroundColor: 'var(--bg-elevated-solid)',
                          borderColor: item.warrantyClaimed
                            ? COLORS.warningAmber
                            : 'var(--border-card)',
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold">
                              {item.qty}x {item.productName}
                            </div>
                            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                              Origen de lote: <strong>{item.supplierName}</strong>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="cop-mono text-xs font-extrabold">
                              {formatCOP(item.unitPriceCharged * item.qty)}
                            </div>
                            <div className="cop-mono text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                              {formatCOP(item.unitPriceCharged)} c/u
                            </div>
                          </div>
                        </div>

                        {/* Barra de Progreso y Temporizador de Garantía Independiente */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span
                              className="px-2 py-0.5 rounded-full font-bold text-[10px]"
                              style={{
                                backgroundColor: warranty.badgeBg,
                                color: warranty.badgeColor,
                              }}
                            >
                              {warranty.label}
                            </span>

                            <span className="cop-mono text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                              Plazo otorgado: {item.warrantyDays} días
                            </span>
                          </div>

                          <div
                            className="w-full h-1.5 rounded-full overflow-hidden"
                            style={{ backgroundColor: 'var(--bg-secondary)' }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${warranty.progressPct}%`,
                                backgroundColor: warranty.badgeColor,
                              }}
                            />
                          </div>
                        </div>

                        {item.warrantyClaimNote && (
                          <div
                            className="text-[11px] px-2.5 py-1.5 rounded-xl"
                            style={{
                              backgroundColor: COLORS.warningAmberSoft,
                              color: COLORS.warningAmber,
                            }}
                          >
                            {item.warrantyClaimNote}
                          </div>
                        )}

                        {/* Acción aislada de Garantía para este artículo específico */}
                        <div className="flex items-center justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => onToggleItemWarranty(sale.id, item.id)}
                            className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                            style={{
                              backgroundColor: item.warrantyClaimed
                                ? 'var(--bg-secondary)'
                                : COLORS.electricBlueSoft,
                              color: item.warrantyClaimed
                                ? 'var(--text-secondary)'
                                : COLORS.electricBlue,
                            }}
                          >
                            {item.warrantyClaimed
                              ? 'Restaurar Garantía Activa'
                              : 'Aplicar Garantía a este Ítem'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
