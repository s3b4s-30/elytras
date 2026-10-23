import React, { useState } from 'react';
import TopMenu from './components/TopMenu.jsx';
import TabBar from './components/TabBar.jsx';
import ResumenView from './views/ResumenView.jsx';
import POSView from './views/POSView.jsx';
import InventarioView from './views/InventarioView.jsx';
import HistorialView from './views/HistorialView.jsx';
import {
  COLORS,
  LIQUID_GLASS,
  SAFE_AREAS,
} from './theme/designSystem.js';
import { usePOSStore } from './hooks/usePOSStore.js';

/**
 * App.jsx — Orquestador de Navegación y Composición de Vistas (SRP).
 * Toda la lógica de dominio y persistencia está desacoplada en `usePOSStore` y `posRepository`
 * mediante Inyección de Dependencias (preparado para migración directa a Supabase).
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('pos');

  const {
    themeMode,
    setThemeMode,
    themeBadgeText,
    suppliers,
    lastSupplierId,
    products,
    cart,
    sales,
    closures,
    nextSaleNumber,
    totalCartUnits,
    handleSelectLastSupplier,
    handleSaveSupplier,
    handleDeleteSupplier,
    handleAddToCart,
    handleUpdateCartQty,
    handleUpdateCartItemPrice,
    handleUpdateCartItemSupplier,
    handleClearCart,
    handleCompleteSale,
    handleUpdateProduct,
    handleAddStockBatch,
    handleAdjustStockManual,
    handleCreateProduct,
    handleDeleteProduct,
    handleClearInventory,
    handleRestoreSeedProducts,
    handleToggleItemWarranty,
    handleCreateClosure,
  } = usePOSStore();

  const sharedTopMenu = (
    <TopMenu
      themeMode={themeMode}
      onSelectTheme={setThemeMode}
      suppliers={suppliers}
      lastSupplierId={lastSupplierId}
      onSelectLastSupplier={handleSelectLastSupplier}
      onSaveSupplier={handleSaveSupplier}
      onDeleteSupplier={handleDeleteSupplier}
    />
  );

  return (
    <div
      className="app-root-safe min-h-dvh flex flex-col"
      style={SAFE_AREAS.rootStyle}
    >
      {/* Contenedor Principal de Vistas con transición fluida al navegar entre pestañas */}
      <main key={activeTab} className="main-content-safe animate-ios-view-enter">
        {activeTab === 'resumen' && (
          <ResumenView
            products={products}
            sales={sales}
            closures={closures}
            onCreateClosure={handleCreateClosure}
            topMenuSlot={sharedTopMenu}
            themeBadgeText={themeBadgeText}
          />
        )}

        {activeTab === 'pos' && (
          <POSView
            products={products}
            suppliers={suppliers}
            nextSaleNumber={nextSaleNumber}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQty={handleUpdateCartQty}
            onUpdateCartItemPrice={handleUpdateCartItemPrice}
            onUpdateCartItemSupplier={handleUpdateCartItemSupplier}
            onClearCart={handleClearCart}
            onCompleteSale={handleCompleteSale}
            onBack={() => setActiveTab('resumen')}
            topMenuSlot={sharedTopMenu}
            themeBadgeText={themeBadgeText}
          />
        )}

        {activeTab === 'inventario' && (
          <InventarioView
            products={products}
            suppliers={suppliers}
            lastSupplierId={lastSupplierId}
            onUpdateProduct={handleUpdateProduct}
            onAddStockBatch={handleAddStockBatch}
            onAdjustStockManual={handleAdjustStockManual}
            onCreateProduct={handleCreateProduct}
            onDeleteProduct={handleDeleteProduct}
            onClearInventory={handleClearInventory}
            onRestoreSeedProducts={handleRestoreSeedProducts}
            onBack={() => setActiveTab('resumen')}
            topMenuSlot={sharedTopMenu}
            themeBadgeText={themeBadgeText}
          />
        )}

        {activeTab === 'historial' && (
          <HistorialView
            sales={sales}
            onToggleItemWarranty={handleToggleItemWarranty}
            onBack={() => setActiveTab('resumen')}
            topMenuSlot={sharedTopMenu}
            themeBadgeText={themeBadgeText}
          />
        )}
      </main>

      {/* Botón Flotante Circular Minimalista Icon-Only (FAB Vender) sobre la TabBar */}
      {activeTab !== 'pos' && (
        <div className="fab-dock-safe">
          <button
            type="button"
            aria-label="Acceso rápido a Punto de Venta"
            title="Punto de Venta"
            onClick={() => setActiveTab('pos')}
            className="fab-icon-only"
            style={LIQUID_GLASS.style}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>

            {totalCartUnits > 0 && (
              <span
                className="cop-mono absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full text-[10px] font-extrabold flex items-center justify-center text-white"
                style={{
                  backgroundColor: COLORS.successGreen,
                  border: '2px solid var(--bg-primary)',
                }}
              >
                {totalCartUnits}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Tab Bar Inferior de 4 Pestañas con Efecto LiquidGlass */}
      <TabBar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        cartCount={totalCartUnits}
      />
    </div>
  );
}
