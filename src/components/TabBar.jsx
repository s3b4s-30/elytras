import React from 'react';
import { COLORS, LIQUID_GLASS, SAFE_AREAS, SQUIRCLES } from '../theme/designSystem.js';

/**
 * TabBar.jsx — Barra de Navegación Inferior de 4 Pestañas (Apple HIG)
 * 1. Resumen & Ciclos
 * 2. Vender (POS)
 * 3. Inventario
 * 4. Historial de Ventas
 */
export default function TabBar({ activeTab, onChangeTab, cartCount = 0 }) {
  const tabs = [
    {
      id: 'resumen',
      label: 'Resumen',
      subtitle: 'Ciclos & KPIs',
      icon: (isActive) => (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill={isActive ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={isActive ? '2.2' : '1.8'}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="9" rx="2" />
          <rect x="14" y="3" width="7" height="5" rx="2" />
          <rect x="14" y="12" width="7" height="9" rx="2" />
          <rect x="3" y="16" width="7" height="5" rx="2" />
        </svg>
      ),
    },
    {
      id: 'pos',
      label: 'Vender',
      subtitle: 'POS Ágil',
      badge: cartCount > 0 ? cartCount : null,
      icon: (isActive) => (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={isActive ? '2.3' : '1.8'}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      id: 'inventario',
      label: 'Inventario',
      subtitle: 'Mostrador',
      icon: (isActive) => (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={isActive ? '2.2' : '1.8'}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      id: 'historial',
      label: 'Historial',
      subtitle: 'Garantías',
      icon: (isActive) => (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={isActive ? '2.2' : '1.8'}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className="tabbar-floating-safe"
      style={SAFE_AREAS.tabbarFloatingStyle}
    >
      <div className="max-w-xl mx-auto pointer-events-auto">
        <div
          className={`liquid-glass-heavy hig-border ${SQUIRCLES.classes.tabbar} p-2 grid grid-cols-4 gap-1.5`}
          style={{
            backdropFilter: LIQUID_GLASS.backdropFilter,
            WebkitBackdropFilter: LIQUID_GLASS.WebkitBackdropFilter,
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                className="relative flex flex-col items-center justify-center py-1.5 px-2 rounded-[22px] transition-all duration-200 active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: isActive ? COLORS.electricBlueSoft : 'transparent',
                  color: isActive ? COLORS.electricBlue : 'var(--text-secondary)',
                }}
              >
                <div className="relative">
                  {tab.icon(isActive)}
                  {tab.badge && (
                    <span
                      className="cop-mono absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                      style={{ backgroundColor: COLORS.electricBlue }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span
                  className="text-[11px] mt-0.5 tracking-tight"
                  style={{
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? COLORS.electricBlue : 'var(--text-secondary)',
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

