import React, { useState, useEffect } from 'react';
import {
  formatCOP,
  formatPriceInput,
  parsePriceInput,
  getSupplierColor,
} from '../../utils/formatters.js';
import { COLORS } from '../../theme/designSystem.js';
import IOSBottomSheet from '../../components/IOSBottomSheet.jsx';
import IOSSupplierPicker from '../../components/IOSSupplierPicker.jsx';

/**
 * src/views/inventario/ProductAdminSheet.jsx
 * Bottom Sheet Confidencial de Administrador para un producto seleccionado:
 * - KPIs de stock, costo unitario, utilidad/margen y mayorista.
 * - Ajuste rápido de stock por daños/conteo sin afectar caja (ADR-004).
 * - Ingreso de nuevo lote de compra con memoria de última tienda (ADR-003).
 * - Edición segura de la ficha técnica y precios futuros.
 */
export default function ProductAdminSheet({
  product,
  suppliers = [],
  lastSupplierId,
  onClose,
  onUpdateProduct,
  onAddStockBatch,
  onAdjustStockManual,
  onDeleteProduct,
}) {
  const [adjustReason, setAdjustReason] = useState('Mercancía defectuosa / daño');
  const [customAdjustDelta, setCustomAdjustDelta] = useState(-1);
  const [adjustFeedback, setAdjustFeedback] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    salePrice: 0,
    unitCost: 0,
    defaultWarrantyDays: 90,
    specsText: '',
  });

  const [batchForm, setBatchForm] = useState({
    qty: 5,
    unitCost: 0,
    supplierId: lastSupplierId || suppliers[0]?.id || '',
  });

  useEffect(() => {
    if (!product) return;
    setAdjustFeedback('');
    setShowDeleteConfirm(false);
    setEditForm({
      name: product.name,
      salePrice: product.salePrice,
      unitCost: product.unitCost,
      defaultWarrantyDays: product.defaultWarrantyDays,
      specsText: (product.specs || []).join(', '),
    });
    setBatchForm({
      qty: 5,
      unitCost: product.unitCost,
      supplierId: lastSupplierId || product.supplierId || suppliers[0]?.id || '',
    });
  }, [product, lastSupplierId, suppliers]);

  const handleQuickStockAdjust = (delta) => {
    if (!product || !onAdjustStockManual || delta === 0) return;
    onAdjustStockManual(product.id, delta, adjustReason);
    setAdjustFeedback(
      `Stock ajustado (${delta > 0 ? `+${delta}` : delta} uds) por "${adjustReason}". Sin afectar caja.`
    );
  };

  const handleSaveSafeEdit = (e) => {
    e.preventDefault();
    if (!product) return;
    const updatedSpecs = editForm.specsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onUpdateProduct({
      ...product,
      name: editForm.name.trim() || product.name,
      salePrice: Number(editForm.salePrice) || 0,
      unitCost: Number(editForm.unitCost) || 0,
      defaultWarrantyDays: Number(editForm.defaultWarrantyDays) || 30,
      specs: updatedSpecs.length > 0 ? updatedSpecs : product.specs,
    });
    setAdjustFeedback('Ficha actualizada de forma segura.');
  };

  const handleAddBatchSubmit = (e) => {
    e.preventDefault();
    if (!product) return;
    const qty = Number(batchForm.qty) || 0;
    if (qty <= 0) return;

    const supplier =
      suppliers.find((s) => s.id === batchForm.supplierId) || suppliers[0];
    onAddStockBatch(product.id, {
      id: `lot-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      qty,
      unitCost: Number(batchForm.unitCost) || product.unitCost,
      supplierId: supplier?.id,
      supplierName: supplier?.name || 'Mayorista General',
    });

    onClose();
  };

  const unitProfit = product ? product.salePrice - product.unitCost : 0;
  const marginPct =
    product && product.salePrice > 0
      ? Math.round((unitProfit / product.salePrice) * 100)
      : 0;
  const supplier = product
    ? suppliers.find((s) => s.id === product.supplierId)
    : null;

  return (
    <IOSBottomSheet
      open={Boolean(product)}
      onClose={onClose}
      maxWidthClass="max-w-xl"
    >
      {product && (
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={onClose}
                aria-label="Regresar"
                title="Regresar"
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
              <h3 className="text-lg font-bold truncate">{product.name}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer shrink-0"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: COLORS.electricBlue,
              }}
            >
              Cerrar
            </button>
          </div>

          {adjustFeedback && (
            <div
              className="p-3 rounded-2xl text-xs font-semibold flex items-center justify-between animate-ios-expand"
              style={{
                backgroundColor: COLORS.successGreenSoft,
                color: COLORS.successGreen,
              }}
            >
              <span>✓ {adjustFeedback}</span>
            </div>
          )}

          {/* Tarjetas de Costo, Margen Real, Stock Actual y Mayorista */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div
              className="p-3 rounded-2xl hig-border"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                Stock Físico Actual
              </div>
              <div
                className="cop-mono text-base font-extrabold mt-0.5"
                style={{ color: COLORS.electricBlue }}
              >
                {product.stock} uds
              </div>
            </div>
            <div
              className="p-3 rounded-2xl hig-border"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                Costo Unitario
              </div>
              <div className="cop-mono text-sm font-bold mt-0.5">
                {formatCOP(product.unitCost)}
              </div>
            </div>
            <div
              className="p-3 rounded-2xl hig-border"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                Utilidad / Margen
              </div>
              <div
                className="cop-mono text-sm font-bold mt-0.5"
                style={{ color: COLORS.successGreen }}
              >
                +{formatCOP(unitProfit)} ({marginPct}%)
              </div>
            </div>
            <div
              className="p-3 rounded-2xl hig-border"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                Mayorista Origen
              </div>
              <div className="text-xs font-bold mt-0.5 truncate flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: getSupplierColor(supplier, 0),
                  }}
                />
                <span className="truncate">{supplier?.name || 'Local Principal'}</span>
              </div>
            </div>
          </div>

          {/* Ajuste Rápido de Stock */}
          <div
            className="p-4 rounded-2xl space-y-3 hig-border"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <div className="flex items-center justify-between">
              <h4
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: COLORS.warningAmber }}
              >
                Ajuste Rápido de Stock
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() => handleQuickStockAdjust(-1)}
                className="tactile-chip py-2.5 px-3 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40"
                style={{
                  backgroundColor: COLORS.dangerRedSoft,
                  color: COLORS.dangerRed,
                }}
              >
                −1 Unidad
              </button>

              <button
                type="button"
                disabled={product.stock < 2}
                onClick={() => handleQuickStockAdjust(-2)}
                className="tactile-chip py-2.5 px-3 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40"
                style={{
                  backgroundColor: COLORS.warningAmberSoft,
                  color: COLORS.warningAmber,
                }}
              >
                −2 Unidades
              </button>

              <button
                type="button"
                onClick={() => handleQuickStockAdjust(1)}
                className="tactile-chip py-2.5 px-3 rounded-xl text-xs font-bold cursor-pointer"
                style={{
                  backgroundColor: COLORS.successGreenSoft,
                  color: COLORS.successGreen,
                }}
              >
                +1 Unidad
              </button>

              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={customAdjustDelta}
                  onChange={(e) => setCustomAdjustDelta(Number(e.target.value) || 0)}
                  className="hig-input cop-mono w-full py-2 px-2 text-xs font-bold text-center"
                />
                <button
                  type="button"
                  onClick={() => handleQuickStockAdjust(Number(customAdjustDelta) || 0)}
                  className="btn-electric px-3 py-2 text-xs font-bold shrink-0 cursor-pointer"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>

          {/* Formulario 1: Ingresar Nuevo Lote de Mercancía con IOSSupplierPicker */}
          <form
            onSubmit={handleAddBatchSubmit}
            className="p-4 rounded-2xl space-y-3 hig-border"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <div className="flex items-center justify-between">
              <h4
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: COLORS.electricBlue }}
              >
                + Ingresar Lote de Compra (Suma Stock)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium mb-1">
                  Cantidad a Sumar (+)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={batchForm.qty}
                  onChange={(e) => setBatchForm({ ...batchForm, qty: e.target.value })}
                  className="hig-input cop-mono w-full text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">
                  Costo Unitario Lote (COP)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="$0"
                  value={formatPriceInput(batchForm.unitCost)}
                  onChange={(e) =>
                    setBatchForm({
                      ...batchForm,
                      unitCost: parsePriceInput(e.target.value),
                    })
                  }
                  className="hig-input cop-mono w-full text-xs font-bold"
                />
              </div>
            </div>

            <IOSSupplierPicker
              suppliers={suppliers}
              selectedSupplierId={batchForm.supplierId}
              lastSupplierId={lastSupplierId}
              onSelect={(supId) => setBatchForm({ ...batchForm, supplierId: supId })}
              label="Proveedor / Tienda del Lote"
            />

            <button
              type="submit"
              className="btn-electric w-full py-2.5 text-xs font-bold cursor-pointer"
            >
              Registrar Entrada de Lote (+{batchForm.qty} uds)
            </button>
          </form>

          {/* Listado de Lotes Activos y Proveedores */}
          {Array.isArray(product.batches) && product.batches.length > 0 && (
            <div
              className="p-4 rounded-2xl space-y-2.5 hig-border"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Lotes Activos y Proveedores ({product.batches.length})
                </h4>
                <span
                  className="cop-mono text-[10px] font-bold"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Stock Total: {product.stock} uds
                </span>
              </div>

              <div className="space-y-1.5">
                {product.batches.map((batch, bIdx) => {
                  const bSup = suppliers.find((s) => s.id === batch.supplierId);
                  const bColor = getSupplierColor(bSup, bIdx);
                  return (
                    <div
                      key={batch.id || `batch-${bIdx}`}
                      className="p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs hig-border"
                      style={{ backgroundColor: 'var(--bg-elevated-solid)' }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: bColor }}
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate">
                            {batch.supplierName || bSup?.name || 'Mayorista'}
                          </div>
                          <div
                            className="text-[10px]"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            {batch.date || 'Lote registrado'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 cop-mono">
                        <span
                          className="font-extrabold text-xs"
                          style={{ color: COLORS.electricBlue }}
                        >
                          {batch.qty} uds
                        </span>
                        <span
                          className="text-[10px] block"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          c/u: {formatCOP(batch.unitCost)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Formulario 2: Edición Segura de Catálogo */}
          <form
            onSubmit={handleSaveSafeEdit}
            className="p-4 rounded-2xl space-y-3 hig-border"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Edición Segura del Producto
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium mb-1">
                  Precio Venta (COP)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="$0"
                  value={formatPriceInput(editForm.salePrice)}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      salePrice: parsePriceInput(e.target.value),
                    })
                  }
                  className="hig-input cop-mono w-full text-xs font-bold"
                  style={{ backgroundColor: 'var(--bg-elevated-solid)' }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">
                  Costo Base (COP)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="$0"
                  value={formatPriceInput(editForm.unitCost)}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      unitCost: parsePriceInput(e.target.value),
                    })
                  }
                  className="hig-input cop-mono w-full text-xs font-bold"
                  style={{ backgroundColor: 'var(--bg-elevated-solid)' }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">
                  Garantía (Días)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.defaultWarrantyDays}
                  onChange={(e) =>
                    setEditForm({ ...editForm, defaultWarrantyDays: e.target.value })
                  }
                  className="hig-input cop-mono w-full text-xs font-bold"
                  style={{ backgroundColor: 'var(--bg-elevated-solid)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium mb-1">
                Especificaciones Técnicas (separadas por coma)
              </label>
              <input
                type="text"
                value={editForm.specsText}
                onChange={(e) =>
                  setEditForm({ ...editForm, specsText: e.target.value })
                }
                className="hig-input w-full text-xs"
                style={{ backgroundColor: 'var(--bg-elevated-solid)' }}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-elevated-solid)',
                  color: COLORS.electricBlue,
                  border: `1px solid ${COLORS.electricBlue}`,
                }}
              >
                Guardar Cambios de Ficha
              </button>
            </div>
          </form>

          {/* Zona de Eliminación Directa */}
          <div
            className="p-3.5 rounded-2xl hig-border"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: showDeleteConfirm ? COLORS.dangerRed : 'var(--border-hairline)',
            }}
          >
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all hig-border"
                style={{
                  backgroundColor: COLORS.dangerRedSoft,
                  color: COLORS.dangerRed,
                  borderColor: 'rgba(255, 59, 48, 0.25)',
                }}
              >
                <svg
                  width="15"
                  height="15"
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
                <span>Eliminar producto</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 animate-ios-expand">
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteProduct) {
                      onDeleteProduct(product.id);
                    }
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-white cursor-pointer shadow-sm"
                  style={{ backgroundColor: COLORS.dangerRed }}
                >
                  Eliminar producto
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer hig-border"
                  style={{
                    backgroundColor: 'var(--bg-elevated-solid)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </IOSBottomSheet>
  );
}

