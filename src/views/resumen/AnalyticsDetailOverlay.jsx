import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatCOP } from '../../utils/formatters.js';
import { COLORS, LIQUID_GLASS, UI_CLASSES } from '../../theme/designSystem.js';

/**
 * AnalyticsDetailOverlay.jsx — Pantalla Completa por Encima de Todo (SRP):
 * Renderiza el desglose exhaustivo de "Más Vendidos y Rentabilidad" o "Incidencia y Detalle de Garantías".
 * - Cabecera fija aislada en contenedor flex-col overflow-hidden para evitar que el contenido pase por debajo al hacer scroll.
 * - Transacciones individuales colapsadas por defecto con botón desplegable limpio.
 * - Vista detallada de Garantías unificada con tarjetas LiquidGlass (.hig-card).
 */
export default function AnalyticsDetailOverlay({
  detailOverlay,
  closingDetailOverlay,
  onClose,
  metrics,
  rankings,
}) {
  const [expandedTxMap, setExpandedTxMap] = useState({});

  // Bloquear scroll trasero cuando la pantalla completa de detalle está abierta
  useEffect(() => {
    if (!detailOverlay || typeof document === 'undefined') return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [detailOverlay]);

  if (!detailOverlay || typeof document === 'undefined') return null;

  const toggleProductTransactions = (productId) => {
    setExpandedTxMap((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex flex-col overflow-hidden ${
        closingDetailOverlay ? 'animate-ios-view-exit' : 'animate-ios-sheet'
      }`}
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Cabecera fija superior aislada del área de scroll */}
      <header
        className="shrink-0 z-50 px-5 py-3.5 flex items-center justify-between gap-3 border-b"
        style={{
          backgroundColor: 'var(--bg-glass-heavy)',
          borderColor: 'var(--border-hairline)',
          ...LIQUID_GLASS.style,
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onClose}
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
          <div className="min-w-0">
            <span
              className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block"
              style={{
                backgroundColor:
                  detailOverlay === 'profit'
                    ? COLORS.successGreenSoft
                    : COLORS.warningAmberSoft,
                color:
                  detailOverlay === 'profit'
                    ? COLORS.successGreen
                    : COLORS.warningAmber,
              }}
            >
              {detailOverlay === 'profit'
                ? 'RENTABILIDAD POR PRODUCTO'
                : 'POSTVENTA Y GARANTÍAS'}
            </span>
            <h2 className="text-lg font-extrabold tracking-tight mt-0.5 truncate">
              {detailOverlay === 'profit'
                ? 'Más Vendidos y Rentabilidad'
                : 'Incidencia y Detalle de Garantías'}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="btn-electric px-4 py-2 rounded-full text-xs font-bold shrink-0 cursor-pointer"
        >
          Cerrar
        </button>
      </header>

      {/* Contenedor desplazable independiente debajo del header fijo */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 36px)',
        }}
      >
        <div className="max-w-3xl w-full mx-auto px-5 pt-5 pb-10 space-y-5">
          {detailOverlay === 'profit' ? (
            <>
              {/* KPIs Globales de Rentabilidad */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div
                  className="p-3.5 rounded-2xl hig-border"
                  style={{ backgroundColor: 'var(--bg-elevated-solid)' }}
                >
                  <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    Unidades Vendidas
                  </div>
                  <div
                    className="cop-mono text-lg font-extrabold mt-0.5"
                    style={{ color: COLORS.electricBlue }}
                  >
                    {metrics.totalUnitsSold} uds
                  </div>
                </div>
                <div
                  className="p-3.5 rounded-2xl hig-border"
                  style={{ backgroundColor: 'var(--bg-elevated-solid)' }}
                >
                  <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    Ingresos Brutos
                  </div>
                  <div className="cop-mono text-base font-extrabold mt-0.5">
                    {formatCOP(metrics.totalSold)}
                  </div>
                </div>
                <div
                  className="p-3.5 rounded-2xl hig-border"
                  style={{ backgroundColor: 'var(--bg-elevated-solid)' }}
                >
                  <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    Costo de Lotes
                  </div>
                  <div className="cop-mono text-base font-bold mt-0.5">
                    {formatCOP(metrics.recoveredInvestment)}
                  </div>
                </div>
                <div
                  className="p-3.5 rounded-2xl hig-border"
                  style={{ backgroundColor: 'var(--bg-elevated-solid)' }}
                >
                  <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    Ganancia Neta Total
                  </div>
                  <div
                    className="cop-mono text-base font-extrabold mt-0.5"
                    style={{ color: COLORS.successGreen }}
                  >
                    +{formatCOP(metrics.netProfit)}
                  </div>
                </div>
              </div>

              {/* Desglose producto por producto */}
              <div className="space-y-4">
                {rankings.byProfit.map((item, idx) => {
                  const avgSalePrice =
                    item.unitsSold > 0
                      ? Math.round(item.revenue / item.unitsSold)
                      : 0;
                  const marginPct =
                    item.revenue > 0
                      ? Math.round((item.profit / item.revenue) * 100)
                      : 0;
                  const isTxExpanded = Boolean(expandedTxMap[item.productId]);

                  return (
                    <div
                      key={item.productId}
                      className={`${UI_CLASSES.card} space-y-3`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="cop-mono w-8 h-8 rounded-2xl text-sm font-extrabold flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor:
                                idx === 0
                                  ? COLORS.electricBlue
                                  : 'var(--bg-secondary)',
                              color:
                                idx === 0 ? '#FFFFFF' : 'var(--text-primary)',
                            }}
                          >
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-bold truncate">
                              {item.productName}
                            </div>
                            <div
                              className="text-[11px] flex items-center gap-2 mt-0.5 flex-wrap"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              <span>{item.category}</span>
                              <span>•</span>
                              <span
                                className="cop-mono font-bold"
                                style={{ color: COLORS.electricBlue }}
                              >
                                Stock: {item.currentStock} uds
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className="cop-mono text-base font-extrabold"
                            style={{ color: COLORS.successGreen }}
                          >
                            +{formatCOP(item.profit)}
                          </div>
                          <div
                            className="text-[10px] font-semibold"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Margen: {marginPct}%
                          </div>
                        </div>
                      </div>

                      {/* Métricas unitarias y acumuladas del producto */}
                      <div
                        className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-2xl hig-border text-xs"
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                      >
                        <div>
                          <span
                            className="text-[10px] block"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Unidades Vendidas
                          </span>
                          <span className="cop-mono font-extrabold text-sm">
                            {item.unitsSold} uds
                          </span>
                        </div>
                        <div>
                          <span
                            className="text-[10px] block"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Venta Total
                          </span>
                          <span className="cop-mono font-bold">
                            {formatCOP(item.revenue)}
                          </span>
                        </div>
                        <div>
                          <span
                            className="text-[10px] block"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Costo Total
                          </span>
                          <span className="cop-mono font-bold">
                            {formatCOP(item.totalCost)}
                          </span>
                        </div>
                        <div>
                          <span
                            className="text-[10px] block"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Promedio vs Costo
                          </span>
                          <span className="cop-mono font-semibold">
                            {formatCOP(avgSalePrice)} /{' '}
                            {formatCOP(item.unitCostBase)}
                          </span>
                        </div>
                      </div>

                      {/* Botón desplegable limpio para ver transacciones individuales (colapsadas por defecto) */}
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            toggleProductTransactions(item.productId)
                          }
                          className="w-full px-3.5 py-2 rounded-xl flex items-center justify-between text-xs font-semibold cursor-pointer hig-border transition-colors"
                          style={{
                            backgroundColor: isTxExpanded
                              ? COLORS.electricBlueSoft
                              : 'var(--bg-secondary)',
                            color: isTxExpanded
                              ? COLORS.electricBlue
                              : 'var(--text-secondary)',
                          }}
                        >
                          <span>
                            {isTxExpanded
                              ? 'Ocultar transacciones'
                              : `Ver transacciones (${item.salesHistory.length})`}
                          </span>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            className="transition-transform duration-200"
                            style={{
                              transform: isTxExpanded
                                ? 'rotate(180deg)'
                                : 'rotate(0deg)',
                            }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>

                        {isTxExpanded && (
                          <div className="space-y-1.5 mt-2 animate-ios-expand">
                            {item.salesHistory.map((sh, sIdx) => (
                              <div
                                key={`${sh.saleId}-${sIdx}`}
                                className="px-3 py-2 rounded-xl flex items-center justify-between gap-2 text-xs hig-border"
                                style={{ backgroundColor: 'var(--bg-primary)' }}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="cop-mono text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                                    style={{
                                      backgroundColor: COLORS.electricBlueSoft,
                                      color: COLORS.electricBlue,
                                    }}
                                  >
                                    Venta #{sh.saleNumber}
                                  </span>
                                  <span className="font-semibold truncate">
                                    {sh.customerName}
                                  </span>
                                  <span
                                    className="text-[10px] shrink-0"
                                    style={{ color: 'var(--text-secondary)' }}
                                  >
                                    • {sh.paymentMethod} •{' '}
                                    {new Date(sh.createdAt).toLocaleDateString(
                                      'es-CO',
                                      {
                                        day: '2-digit',
                                        month: 'short',
                                      }
                                    )}
                                  </span>
                                </div>

                                <div className="text-right shrink-0 cop-mono">
                                  <span className="font-bold">
                                    {sh.qty}x {formatCOP(sh.unitPriceCharged)}
                                  </span>
                                  <span
                                    className="ml-2 text-[11px] font-bold"
                                    style={{ color: COLORS.successGreen }}
                                  >
                                    (+{formatCOP(sh.profit)})
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {/* KPIs Globales de Garantías consistentes con el sistema LiquidGlass */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div
                  className="p-3.5 rounded-2xl hig-border"
                  style={{ backgroundColor: 'var(--bg-elevated-solid)' }}
                >
                  <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    Garantías Reclamadas
                  </div>
                  <div
                    className="cop-mono text-lg font-extrabold mt-0.5"
                    style={{ color: COLORS.warningAmber }}
                  >
                    {rankings.allClaimedRecords.length}{' '}
                    {rankings.allClaimedRecords.length === 1
                      ? 'reclamo'
                      : 'reclamos'}
                  </div>
                </div>
                <div
                  className="p-3.5 rounded-2xl hig-border"
                  style={{ backgroundColor: 'var(--bg-elevated-solid)' }}
                >
                  <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    Tasa de Incidencia
                  </div>
                  <div className="cop-mono text-base font-extrabold mt-0.5">
                    {metrics.totalUnitsSold > 0
                      ? `${Math.round(
                          (rankings.allClaimedRecords.length /
                            metrics.totalUnitsSold) *
                            100
                        )}%`
                      : '0%'}{' '}
                    <span
                      className="text-xs font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      ({rankings.allClaimedRecords.length} de{' '}
                      {metrics.totalUnitsSold} uds)
                    </span>
                  </div>
                </div>
                <div
                  className="p-3.5 rounded-2xl hig-border"
                  style={{ backgroundColor: 'var(--bg-elevated-solid)' }}
                >
                  <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    Costo Lote en Reclamo
                  </div>
                  <div
                    className="cop-mono text-base font-bold mt-0.5"
                    style={{ color: COLORS.dangerRed }}
                  >
                    {formatCOP(
                      rankings.allClaimedRecords.reduce(
                        (acc, r) => acc + r.unitCostSnapshot * r.qty,
                        0
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Sección 1: Reclamos de Garantía Aplicados con estética LiquidGlass unificada */}
              <section className={`${UI_CLASSES.card} space-y-3`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold tracking-tight">
                    Reclamos Aplicados
                  </h3>
                  <span
                    className="cop-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: COLORS.warningAmberSoft,
                      color: COLORS.warningAmber,
                    }}
                  >
                    {rankings.allClaimedRecords.length}
                  </span>
                </div>

                {rankings.allClaimedRecords.length === 0 ? (
                  <div
                    className="p-5 rounded-2xl text-center text-xs hig-border"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Sin reclamos de garantía en el ciclo actual.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {rankings.allClaimedRecords.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-3.5 rounded-2xl space-y-2.5 hig-border"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderColor: COLORS.warningAmber,
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="cop-mono text-xs font-extrabold px-2.5 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: COLORS.electricBlueSoft,
                                  color: COLORS.electricBlue,
                                }}
                              >
                                Venta #{rec.saleNumber}
                              </span>
                              <span className="text-xs font-bold">
                                {rec.customerName}
                              </span>
                              <span
                                className="text-[11px]"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                •{' '}
                                {new Date(rec.createdAt).toLocaleDateString(
                                  'es-CO',
                                  {
                                    day: '2-digit',
                                    month: 'short',
                                  }
                                )}
                              </span>
                            </div>
                            <div className="text-sm font-bold mt-1.5">
                              {rec.qty}x {rec.productName}
                            </div>
                          </div>

                          <span
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
                            style={{
                              backgroundColor: COLORS.warningAmberSoft,
                              color: COLORS.warningAmber,
                            }}
                          >
                            Garantía Aplicada
                          </span>
                        </div>

                        <div
                          className="p-3 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs hig-border"
                          style={{
                            backgroundColor: 'var(--bg-elevated-solid)',
                          }}
                        >
                          <div>
                            <span
                              className="text-[10px] block"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              Mayorista Origen
                            </span>
                            <span
                              className="font-bold"
                              style={{ color: COLORS.electricBlue }}
                            >
                              {rec.supplierName}
                            </span>
                          </div>
                          <div>
                            <span
                              className="text-[10px] block"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              Costo de Reposición
                            </span>
                            <span className="cop-mono font-bold">
                              {formatCOP(rec.unitCostSnapshot)}
                            </span>
                          </div>
                          <div>
                            <span
                              className="text-[10px] block"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              Valor en Venta
                            </span>
                            <span className="cop-mono font-bold">
                              {formatCOP(rec.unitPriceCharged)}
                            </span>
                          </div>
                        </div>

                        {rec.warrantyClaimNote && (
                          <div
                            className="px-3 py-2 rounded-xl text-xs font-medium"
                            style={{
                              backgroundColor: COLORS.warningAmberSoft,
                              color: COLORS.warningAmber,
                            }}
                          >
                            {rec.warrantyClaimNote}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Sección 2: Coberturas por Ítem con estética de tarjeta unificada */}
              <section className={`${UI_CLASSES.card} space-y-3`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold tracking-tight">
                    Coberturas por Producto Vendido
                  </h3>
                  <span
                    className="cop-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {rankings.allWarrantyItems.length} ítems
                  </span>
                </div>

                <div className="space-y-2">
                  {rankings.allWarrantyItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl flex items-center justify-between gap-3 hig-border"
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="cop-mono text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: COLORS.electricBlueSoft,
                              color: COLORS.electricBlue,
                            }}
                          >
                            #{item.saleNumber}
                          </span>
                          <span className="text-xs font-bold truncate">
                            {item.productName}
                          </span>
                        </div>
                        <div
                          className="text-[11px] mt-1 truncate"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {item.customerName} • {item.supplierName}
                        </div>
                      </div>

                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
                        style={{
                          backgroundColor: item.warrantyInfo.badgeBg,
                          color: item.warrantyInfo.badgeColor,
                        }}
                      >
                        {item.warrantyInfo.label}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
