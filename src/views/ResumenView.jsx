import React, { useState, useMemo } from 'react';
import {
  formatCOP,
  formatPriceInput,
  parsePriceInput,
  getWarrantyStatus,
} from '../utils/formatters.js';
import { COLORS, LIQUID_GLASS, UI_CLASSES } from '../theme/designSystem.js';
import IOSBottomSheet from '../components/IOSBottomSheet.jsx';
import IOSDateRangePicker, { MONTHS_ES } from './resumen/IOSDateRangePicker.jsx';
import AnalyticsDetailOverlay from './resumen/AnalyticsDetailOverlay.jsx';

/**
 * ResumenView.jsx — Resumen Financiero, Rankings Detallados y Cierres de Ciclo (ADR-005, ADR-008)
 * Refactorizado bajo Principio de Responsabilidad Única (SRP):
 * - IOSDateRangePicker: Ruedas deslizantes 3D iOS + Calendario mensual de rango.
 * - AnalyticsDetailOverlay: Pantalla completa por encima de todo para rentabilidad y garantías.
 */
export default function ResumenView({
  products = [],
  sales = [],
  closures = [],
  onCreateClosure,
  topMenuSlot = null,
}) {
  const [closureModalOpen, setClosureModalOpen] = useState(false);
  const [startDate, setStartDate] = useState({ day: 11, month: 9, year: 2026 }); // 11 Oct 2026
  const [endDate, setEndDate] = useState({ day: 20, month: 9, year: 2026 }); // 20 Oct 2026
  const [includeTime, setIncludeTime] = useState(false);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('20:00');
  const [realCashInput, setRealCashInput] = useState('');
  const [differenceNote, setDifferenceNote] = useState('');

  // Estado para pantallas de detalle por encima de todo: 'profit' | 'warranties' | null
  const [detailOverlay, setDetailOverlay] = useState(null);
  const [closingDetailOverlay, setClosingDetailOverlay] = useState(false);

  const handleCloseDetailOverlay = () => {
    setClosingDetailOverlay(true);
    setTimeout(() => {
      setDetailOverlay(null);
      setClosingDetailOverlay(false);
    }, 220);
  };

  const formattedPeriodLabel = useMemo(() => {
    const startStr = `${String(startDate.day).padStart(2, '0')} ${MONTHS_ES[startDate.month]}${
      startDate.year !== endDate.year ? ` ${startDate.year}` : ''
    }`;
    const endStr = `${String(endDate.day).padStart(2, '0')} ${MONTHS_ES[endDate.month]} ${endDate.year}`;
    if (includeTime) {
      return `Ciclo ${startStr} (${startTime}) – ${endStr} (${endTime})`;
    }
    return `Ciclo ${startStr} – ${endStr}`;
  }, [startDate, endDate, includeTime, startTime, endTime]);

  // Métricas financieras del ciclo actual
  const metrics = useMemo(() => {
    let totalSold = 0;
    let recoveredInvestment = 0;
    let totalUnitsSold = 0;

    sales.forEach((sale) => {
      totalSold += Number(sale.totalAmount) || 0;
      sale.items.forEach((item) => {
        const qty = Number(item.qty) || 1;
        totalUnitsSold += qty;
        recoveredInvestment += (Number(item.unitCostSnapshot) || 0) * qty;
      });
    });

    const netProfit = totalSold - recoveredInvestment;

    const remainingStockInvestment = products.reduce(
      (acc, prod) => acc + (Number(prod.unitCost) || 0) * (Number(prod.stock) || 0),
      0
    );

    return {
      totalSold,
      recoveredInvestment,
      netProfit,
      remainingStockInvestment,
      salesCount: sales.length,
      totalUnitsSold,
    };
  }, [products, sales]);

  // Rankings detallados con trazabilidad de cada venta y cada garantía
  const rankings = useMemo(() => {
    const map = {};
    const allClaimedRecords = [];
    const allWarrantyItems = [];

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (!map[item.productId]) {
          map[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            category: prod?.category || 'Accesorios',
            currentStock: prod ? prod.stock : 0,
            unitCostBase: prod?.unitCost || item.unitCostSnapshot || 0,
            unitsSold: 0,
            revenue: 0,
            totalCost: 0,
            profit: 0,
            warrantiesClaimed: 0,
            salesHistory: [],
          };
        }
        const entry = map[item.productId];
        const qty = Number(item.qty) || 1;
        const rev = (Number(item.unitPriceCharged) || 0) * qty;
        const cost = (Number(item.unitCostSnapshot) || 0) * qty;
        entry.unitsSold += qty;
        entry.revenue += rev;
        entry.totalCost += cost;
        entry.profit += rev - cost;

        entry.salesHistory.push({
          saleId: sale.id,
          saleNumber: sale.saleNumber,
          customerName: sale.customerName,
          paymentMethod: sale.paymentMethod,
          createdAt: sale.createdAt,
          qty,
          unitPriceCharged: item.unitPriceCharged,
          subtotal: rev,
          profit: rev - cost,
        });

        const warrantyInfo = getWarrantyStatus(
          sale.createdAt,
          item.warrantyDays,
          item.warrantyClaimed
        );

        const detailedRecord = {
          id: item.id,
          saleNumber: sale.saleNumber,
          customerName: sale.customerName,
          paymentMethod: sale.paymentMethod,
          createdAt: sale.createdAt,
          productName: item.productName,
          qty,
          unitPriceCharged: item.unitPriceCharged,
          unitCostSnapshot: item.unitCostSnapshot || 0,
          supplierName: item.supplierName || 'Mayorista Principal',
          warrantyDays: item.warrantyDays,
          warrantyClaimed: item.warrantyClaimed,
          warrantyClaimNote: item.warrantyClaimNote,
          warrantyInfo,
        };

        allWarrantyItems.push(detailedRecord);

        if (item.warrantyClaimed) {
          entry.warrantiesClaimed += 1;
          allClaimedRecords.push(detailedRecord);
        }
      });
    });

    const list = Object.values(map);
    const byProfit = [...list].sort((a, b) => b.profit - a.profit);
    const byWarranties = [...list]
      .filter((i) => i.warrantiesClaimed > 0)
      .sort((a, b) => b.warrantiesClaimed - a.warrantiesClaimed);

    return {
      byProfit,
      byWarranties,
      allClaimedRecords,
      allWarrantyItems,
    };
  }, [sales, products]);

  const handleOpenClosureModal = () => {
    setRealCashInput(String(metrics.totalSold));
    setDifferenceNote('');
    setClosureModalOpen(true);
  };

  const handleConfirmClosure = (e) => {
    e.preventDefault();
    const realCash = Number(realCashInput) || 0;
    onCreateClosure({
      id: `cycle-${Date.now()}`,
      periodLabel: formattedPeriodLabel,
      closedAt: new Date().toISOString(),
      totalSold: metrics.totalSold,
      netProfit: metrics.netProfit,
      recoveredInvestment: metrics.recoveredInvestment,
      remainingStockInvestment: metrics.remainingStockInvestment,
      expectedCash: metrics.totalSold,
      realCashReported: realCash,
      differenceNote:
        differenceNote.trim() ||
        (realCash === metrics.totalSold
          ? 'Arqueo exacto sin desvíos.'
          : `Diferencia registrada de ${formatCOP(realCash - metrics.totalSold)}`),
    });
    setClosureModalOpen(false);
  };

  const parsedRealCash = Number(realCashInput) || 0;
  const cashDeviation = parsedRealCash - metrics.totalSold;

  return (
    <div className="pb-28">
      {/* BLOQUE SUPERIOR UNIFICADO STICKY HEADER */}
      <header
        className={UI_CLASSES.stickyHeader}
        style={LIQUID_GLASS.style}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <h1 className={UI_CLASSES.largeTitle}>Resumen & Ciclos</h1>

          <div className="flex items-center gap-2 shrink-0">
            {topMenuSlot}
          </div>
        </div>
      </header>

      <div className="view-body-container pt-24 space-y-6">
        {/* Tarjeta Principal Hero: Balance del Ciclo Activo */}
        <section className={`${UI_CLASSES.card} relative overflow-hidden`}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <span
                className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full inline-block mb-1.5"
                style={{
                  backgroundColor: COLORS.electricBlueSoft,
                  color: COLORS.electricBlue,
                }}
              >
                Ciclo Activo • {metrics.salesCount} Ventas
              </span>
              <h2 className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Ingresos Brutos del Período (COP)
              </h2>
              <div className="cop-mono text-3xl sm:text-4xl font-extrabold tracking-tight mt-0.5">
                {formatCOP(metrics.totalSold)}
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenClosureModal}
              className="btn-electric px-3.5 py-2.5 text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span>Cerrar Ciclo</span>
            </button>
          </div>

          {/* Desglose Financiero en 3 Pilares */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 hig-divider">
            <div className="p-3 rounded-2xl hig-border" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                Ganancia Neta Estimada
              </div>
              <div
                className="cop-mono text-lg font-bold mt-0.5"
                style={{ color: COLORS.successGreen }}
              >
                +{formatCOP(metrics.netProfit)}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                Margen libre tras recuperar costo
              </div>
            </div>

            <div className="p-3 rounded-2xl hig-border" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                Inversión Recuperada
              </div>
              <div className="cop-mono text-lg font-bold mt-0.5">
                {formatCOP(metrics.recoveredInvestment)}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                Capital de lotes retornados en caja
              </div>
            </div>

            <div className="p-3 rounded-2xl hig-border" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                Inversión Activa en Stock
              </div>
              <div
                className="cop-mono text-lg font-bold mt-0.5"
                style={{ color: COLORS.electricBlue }}
              >
                {formatCOP(metrics.remainingStockInvestment)}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                Capital inmovilizado (intacto al cerrar)
              </div>
            </div>
          </div>
        </section>

        {/* Tabla de Posiciones Interactiva (Al tocar abre Pantalla Completa por encima de todo) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ranking 1: Más Rentables / Vendidos */}
          <div
            onClick={() => setDetailOverlay('profit')}
            role="button"
            tabIndex={0}
            className={`${UI_CLASSES.cardInteractive} flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold tracking-tight">
                  Más Vendidos y Rentabilidad
                </h3>
                <span
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                  style={{ backgroundColor: COLORS.successGreenSoft, color: COLORS.successGreen }}
                >
                  <span>Detalle</span>
                  <span>→</span>
                </span>
              </div>

              <div className="space-y-2">
                {rankings.byProfit.map((item, idx) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-2.5 rounded-2xl hig-border"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="cop-mono w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: idx === 0 ? COLORS.electricBlue : 'var(--bg-elevated-solid)',
                          color: idx === 0 ? '#FFFFFF' : 'var(--text-secondary)',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate">{item.productName}</div>
                        <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                          {item.unitsSold} {item.unitsSold === 1 ? 'unidad vendida' : 'unidades vendidas'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div
                        className="cop-mono text-xs font-bold"
                        style={{ color: COLORS.successGreen }}
                      >
                        +{formatCOP(item.profit)}
                      </div>
                      <div className="cop-mono text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                        Venta: {formatCOP(item.revenue)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ranking 2: Monitor de Incidencia de Garantías */}
          <div
            onClick={() => setDetailOverlay('warranties')}
            role="button"
            tabIndex={0}
            className={`${UI_CLASSES.cardInteractive} flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold tracking-tight">
                  Incidencia de Garantías
                </h3>
                <span
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                  style={{ backgroundColor: COLORS.warningAmberSoft, color: COLORS.warningAmber }}
                >
                  <span>Detalle</span>
                  <span>→</span>
                </span>
              </div>

              {rankings.byWarranties.length === 0 ? (
                <div
                  className="p-6 rounded-2xl text-center text-xs hig-border"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                >
                  0 reclamaciones de garantía registradas en el ciclo actual.
                </div>
              ) : (
                <div className="space-y-2">
                  {rankings.byWarranties.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between p-3 rounded-2xl hig-border"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: COLORS.warningAmberSoft,
                      }}
                    >
                      <div>
                        <div className="text-xs font-semibold">{item.productName}</div>
                        <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                          {item.warrantiesClaimed} de {item.unitsSold}{' '}
                          {item.unitsSold === 1 ? 'unidad presentó' : 'unidades presentaron'} reclamo
                        </div>
                      </div>
                      <span
                        className="cop-mono text-xs font-bold px-2.5 py-1 rounded-xl"
                        style={{
                          backgroundColor: COLORS.warningAmberSoft,
                          color: COLORS.warningAmber,
                        }}
                      >
                        {item.warrantiesClaimed} {item.warrantiesClaimed === 1 ? 'Garantía' : 'Garantías'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Apartado de Cierres de Ciclo e Historial de Arqueos (ADR-005) */}
        <section className={UI_CLASSES.card}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: COLORS.electricBlueSoft,
                  color: COLORS.electricBlue,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold tracking-tight">
                  Historial de Cierres de Ciclo
                </h3>
                <span
                  className="text-[11px]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cortes de caja liquidados
                </span>
              </div>
            </div>
            <span
              className="cop-mono text-[11px] font-extrabold px-3 py-1 rounded-full hig-border shrink-0"
              style={{
                backgroundColor: COLORS.electricBlueSoft,
                color: COLORS.electricBlue,
                borderColor: 'rgba(0, 122, 255, 0.2)',
              }}
            >
              {closures.length} {closures.length === 1 ? 'corte' : 'cortes'}
            </span>
          </div>

          <div className="space-y-3">
            {closures.map((cycle) => {
              const diff = cycle.realCashReported - cycle.expectedCash;
              const hasDiff = diff !== 0;
              return (
                <div
                  key={cycle.id}
                  className="p-4 rounded-2xl space-y-2.5 hig-border"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                  }}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="text-sm font-bold">{cycle.periodLabel}</div>
                      <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        Cerrado el{' '}
                        {new Date(cycle.closedAt).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Efectivo Real en Caja
                      </div>
                      <div className="cop-mono text-base font-extrabold" style={{ color: COLORS.electricBlue }}>
                        {formatCOP(cycle.realCashReported)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 hig-divider text-xs">
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--text-secondary)' }}>Total Vendido</span>
                      <span className="cop-mono font-semibold">{formatCOP(cycle.totalSold)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--text-secondary)' }}>Ganancia Neta</span>
                      <span className="cop-mono font-semibold" style={{ color: COLORS.successGreen }}>
                        +{formatCOP(cycle.netProfit)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--text-secondary)' }}>Inversión Recuperada</span>
                      <span className="cop-mono font-semibold">{formatCOP(cycle.recoveredInvestment)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--text-secondary)' }}>Stock Remanente</span>
                      <span className="cop-mono font-semibold">{formatCOP(cycle.remainingStockInvestment)}</span>
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-xl"
                    style={{
                      backgroundColor: hasDiff ? COLORS.warningAmberSoft : COLORS.successGreenSoft,
                      color: hasDiff ? COLORS.warningAmber : COLORS.successGreen,
                    }}
                  >
                    <span>{cycle.differenceNote}</span>
                    <span className="cop-mono font-bold ml-2">
                      {hasDiff ? `Ajuste: ${formatCOP(diff)}` : 'Caja Exacta'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Bottom Sheet iOS: Arqueo y Cierre de Ciclo */}
      <IOSBottomSheet
        open={closureModalOpen}
        onClose={() => setClosureModalOpen(false)}
        maxWidthClass="max-w-md"
      >
        <form
          onSubmit={handleConfirmClosure}
          className="space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: COLORS.electricBlueSoft,
                  color: COLORS.electricBlue,
                }}
              >
                CORTE DE CAJA
              </span>
              <h3 className="text-base font-bold mt-0.5">Liquidar y Cerrar Ciclo</h3>
            </div>
            <span
              className="cop-mono text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
              }}
            >
              {formattedPeriodLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl hig-border" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Ventas Esperadas</div>
              <div className="cop-mono text-sm font-bold">{formatCOP(metrics.totalSold)}</div>
            </div>
            <div>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Ganancia Neta</div>
              <div className="cop-mono text-sm font-bold" style={{ color: COLORS.successGreen }}>
                +{formatCOP(metrics.netProfit)}
              </div>
            </div>
          </div>

          {/* Selector de Período Nativo estilo iOS (Calendario + Rueda + Hora opcional) */}
          <IOSDateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChangeStart={setStartDate}
            onChangeEnd={setEndDate}
            includeTime={includeTime}
            onToggleIncludeTime={setIncludeTime}
            startTime={startTime}
            endTime={endTime}
            onChangeStartTime={setStartTime}
            onChangeEndTime={setEndTime}
          />

          <div className="space-y-2">
            <div className="p-2.5 rounded-2xl flex items-center justify-between gap-2.5 hig-border" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="min-w-0">
                <label className="block text-xs font-bold leading-tight">
                  Efectivo Real en Caja
                </label>
                {cashDeviation !== 0 ? (
                  <span className="text-[10px] font-semibold" style={{ color: COLORS.warningAmber }}>
                    Desvío: {formatCOP(cashDeviation)}
                  </span>
                ) : (
                  <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    Arqueo en COP
                  </span>
                )}
              </div>
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="$0"
                value={formatPriceInput(realCashInput)}
                onChange={(e) =>
                  setRealCashInput(String(parsePriceInput(e.target.value)))
                }
                className="hig-input cop-mono w-36 py-1.5 px-2.5 text-right text-base font-extrabold shrink-0"
                style={{
                  backgroundColor: 'var(--bg-elevated-solid)',
                  color: COLORS.electricBlue,
                }}
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Nota de arqueo (Opcional)..."
                value={differenceNote}
                onChange={(e) => setDifferenceNote(e.target.value)}
                className="hig-input w-full text-xs py-2"
              />
            </div>
          </div>

          <div className="pt-1 pb-2">
            <button
              type="submit"
              className="btn-electric w-full py-3 text-sm font-bold cursor-pointer"
            >
              Guardar Cierre Contable ({formatCOP(parsedRealCash)})
            </button>
          </div>
        </form>
      </IOSBottomSheet>

      {/* PANTALLA POR ENCIMA DE TODO (FULL-SCREEN OVERLAY): MÁS VENDIDOS Y RENTABILIDAD / INCIDENCIA DE GARANTÍAS */}
      <AnalyticsDetailOverlay
        detailOverlay={detailOverlay}
        closingDetailOverlay={closingDetailOverlay}
        onClose={handleCloseDetailOverlay}
        metrics={metrics}
        rankings={rankings}
      />
    </div>
  );
}
