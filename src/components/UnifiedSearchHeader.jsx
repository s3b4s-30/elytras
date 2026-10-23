import React, { useState, useRef, useEffect } from 'react';
import { COLORS, LIQUID_GLASS, UI_CLASSES } from '../theme/designSystem.js';

/**
 * src/components/UnifiedSearchHeader.jsx
 * Componente DRY que unifica el Sticky Header de POSView e InventarioView:
 * - Fila 1: Large Title + Acciones Superiores Derechas (ej. botón '+' y TopMenu '•••').
 * - Fila 2: Barra de búsqueda con lupa a la izquierda y flecha desplegable de categorías a la derecha.
 * - Fila 3: Carrusel horizontal fluido de categorías sin desbordamientos ni recortes.
 */
export default function UnifiedSearchHeader({
  title,
  onBack = null,
  rightActions = null,
  searchPlaceholder = 'Buscar...',
  searchQuery,
  onSearchChange,
  categories = [],
  selectedCategory,
  onSelectCategory,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      window.addEventListener('pointerdown', handleOutsideClick);
    }
    return () => window.removeEventListener('pointerdown', handleOutsideClick);
  }, [dropdownOpen]);

  return (
    <header className={UI_CLASSES.stickyHeader} style={LIQUID_GLASS.style}>
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Fila 1: Large Title + Botón de retroceso opcional + Acciones derechas */}
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
            <h1 className={`${UI_CLASSES.largeTitle} truncate`}>{title}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">{rightActions}</div>
        </div>

        {/* Fila 2: Barra de Búsqueda (Lupa a la izquierda + Menú desplegable Chevron-Down al extremo derecho) */}
        <div ref={searchContainerRef} className="relative">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
              pointerEvents: 'none',
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            type="search"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="hig-input w-full"
            style={{ paddingLeft: '40px', paddingRight: '42px' }}
          />

          <button
            type="button"
            aria-label="Desplegar filtro rápido de categorías"
            title="Seleccionar categoría"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer hig-border"
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: dropdownOpen
                ? COLORS.electricBlueSoft
                : 'var(--bg-elevated-solid)',
              color: COLORS.electricBlue,
              borderColor: dropdownOpen ? COLORS.electricBlue : 'var(--border-card)',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              style={{
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {dropdownOpen && (
            <div
              className="ios-supplier-dropdown animate-ios-pop absolute right-0 top-full mt-1.5 w-64 z-50 space-y-1"
              style={LIQUID_GLASS.style}
            >
              <div
                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span>Categoría</span>
                <span>{categories.length}</span>
              </div>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat);
                      setDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                    style={{
                      backgroundColor: isSelected
                        ? COLORS.electricBlueSoft
                        : 'transparent',
                      color: isSelected ? COLORS.electricBlue : 'var(--text-primary)',
                    }}
                  >
                    <span>{cat}</span>
                    {isSelected && <span>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Fila 3: Carrusel Horizontal de Categorías fluido y sin cortes */}
        <div
          className="filter-carousel no-scrollbar scrollbar-none"
          style={{
            paddingTop: '6px',
            paddingBottom: '4px',
            paddingLeft: '2px',
            paddingRight: '12px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            const isOutFilter = cat === 'Agotados';
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className="tactile-chip px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 cursor-pointer hig-border"
                style={{
                  whiteSpace: 'nowrap',
                  backgroundColor: active
                    ? isOutFilter
                      ? COLORS.dangerRed
                      : COLORS.electricBlue
                    : 'var(--bg-secondary)',
                  color: active ? '#FFFFFF' : 'var(--text-secondary)',
                  borderColor: active ? 'transparent' : 'var(--border-card)',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
