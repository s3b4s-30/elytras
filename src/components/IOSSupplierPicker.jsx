import React, { useState, useRef, useEffect } from 'react';
import { COLORS, LIQUID_GLASS } from '../theme/designSystem.js';
import { getSupplierColor } from '../utils/formatters.js';

/**
 * src/components/IOSSupplierPicker.jsx
 * Selector de Proveedores con Estética Nativa iOS, Punto Identificador de Color
 * y Auto-Deslizamiento a Media Pantalla.
 */
export default function IOSSupplierPicker({
  suppliers = [],
  selectedSupplierId,
  lastSupplierId,
  onSelect,
  label = 'Tienda / Proveedor de Origen',
}) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);
  const dropdownRef = useRef(null);

  const currentSupplierIndex = Math.max(
    0,
    suppliers.findIndex((s) => s.id === selectedSupplierId)
  );
  const currentSupplier =
    suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];
  const currentDotColor = getSupplierColor(currentSupplier, currentSupplierIndex);

  useEffect(() => {
    if (open && dropdownRef.current) {
      const timer = setTimeout(() => {
        dropdownRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 60);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open]);

  return (
    <div ref={pickerRef} className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          className="block text-[11px] font-semibold"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
        {currentSupplier?.id === lastSupplierId && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: COLORS.electricBlueSoft,
              color: COLORS.electricBlue,
            }}
          >
            Última tienda
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="ios-supplier-selector tactile-chip"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 relative"
            style={{
              backgroundColor: `${currentDotColor}1F`,
              color: currentDotColor,
            }}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: currentDotColor,
                boxShadow: `0 0 8px ${currentDotColor}80`,
              }}
            />
          </span>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate flex items-center gap-1.5">
              <span>
                {currentSupplier ? currentSupplier.name : 'Seleccionar proveedor'}
              </span>
            </div>
            <div className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
              {currentSupplier
                ? `${currentSupplier.location || 'Sin ubicación'}${
                    currentSupplier.contact ? ` • ${currentSupplier.contact}` : ''
                  }`
                : 'Elegir mayorista'}
            </div>
          </div>
        </div>

        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform hig-border"
          style={{
            backgroundColor: 'var(--bg-elevated-solid)',
            color: COLORS.electricBlue,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="ios-supplier-dropdown animate-ios-expand space-y-1.5"
          style={{
            ...LIQUID_GLASS.style,
            maxHeight: '46vh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div
            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span>Local / Mayorista</span>
            <span>{suppliers.length} disponibles</span>
          </div>

          {suppliers.map((sup, idx) => {
            const isSelected = sup.id === currentSupplier?.id;
            const isRemembered = sup.id === lastSupplierId;
            const supColor = getSupplierColor(sup, idx);
            return (
              <button
                key={sup.id}
                type="button"
                onClick={() => {
                  onSelect(sup.id);
                  setOpen(false);
                }}
                className="tactile-chip w-full p-3 rounded-2xl text-left flex items-center justify-between gap-2.5 cursor-pointer hig-border"
                style={{
                  backgroundColor: isSelected
                    ? COLORS.electricBlueSoft
                    : 'var(--bg-secondary)',
                  borderColor: isSelected ? COLORS.electricBlue : 'var(--border-card)',
                }}
              >
                <div className="min-w-0 flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: supColor,
                      boxShadow: `0 0 6px ${supColor}66`,
                    }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-xs font-bold truncate"
                        style={{
                          color: isSelected ? COLORS.electricBlue : 'var(--text-primary)',
                        }}
                      >
                        {sup.name}
                      </span>
                      {isRemembered && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            backgroundColor: 'var(--bg-elevated-solid)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          Frecuente
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                      {sup.location} {sup.contact ? `• ${sup.contact}` : ''}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: COLORS.electricBlue }}
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
