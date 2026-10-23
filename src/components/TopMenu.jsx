import React, { useState, useRef, useEffect } from 'react';
import { COLORS, LIQUID_GLASS, SQUIRCLES } from '../theme/designSystem.js';
import { SUPPLIER_COLORS, getSupplierColor } from '../utils/formatters.js';
import IOSBottomSheet from './IOSBottomSheet.jsx';

/**
 * TopMenu.jsx — Panel de Configuración Contextual iOS
 * - Botón flotante superior derecho (•••) con efecto LiquidGlass.
 * - Selector limpio de "Tema" con opciones desplegables (Oscuro, Claro, Automático) sin códigos HEX ni subtítulos técnicos.
 * - Gestión de Proveedores y Mayoristas con selector de color identificador y confirmación de seguridad al eliminar.
 */
export default function TopMenu({
  themeMode,
  onSelectTheme,
  suppliers = [],
  lastSupplierId,
  onSelectLastSupplier,
  onSaveSupplier,
  onDeleteSupplier,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [hoveredAction, setHoveredAction] = useState(null);
  const [suppliersModalOpen, setSuppliersModalOpen] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [confirmDeleteSupplierId, setConfirmDeleteSupplierId] = useState(null);

  const [formState, setFormState] = useState({
    name: '',
    contact: '',
    location: '',
    notes: '',
    color: SUPPLIER_COLORS[0].hex,
  });

  const dragStateRef = useRef({
    isPressing: false,
    pressStartTime: 0,
    hasMovedOutOfButton: false,
  });
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsidePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setMenuOpen(false);
        setThemeDropdownOpen(false);
        setHoveredAction(null);
      }
    };
    if (menuOpen) {
      window.addEventListener('pointerdown', handleOutsidePointerDown);
    }
    return () => window.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, [menuOpen]);

  const executeMenuAction = (actionKey) => {
    if (!actionKey) return;
    if (actionKey === 'toggle:theme') {
      setThemeDropdownOpen((prev) => !prev);
      return;
    }
    if (actionKey === 'theme:dark') {
      onSelectTheme('dark');
      setThemeDropdownOpen(false);
      setMenuOpen(false);
    } else if (actionKey === 'theme:light') {
      onSelectTheme('light');
      setThemeDropdownOpen(false);
      setMenuOpen(false);
    } else if (actionKey === 'theme:system') {
      onSelectTheme('system');
      setThemeDropdownOpen(false);
      setMenuOpen(false);
    } else if (actionKey === 'open:suppliers') {
      setMenuOpen(false);
      setThemeDropdownOpen(false);
      setConfirmDeleteSupplierId(null);
      setSuppliersModalOpen(true);
    }
    setHoveredAction(null);
  };

  const handleTriggerPointerDown = (e) => {
    e.stopPropagation();
    dragStateRef.current = {
      isPressing: true,
      pressStartTime: Date.now(),
      hasMovedOutOfButton: false,
    };
    setMenuOpen((prev) => !prev || true);
    if (e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture is unsupported
      }
    }
  };

  const handleTriggerPointerMove = (e) => {
    if (!dragStateRef.current.isPressing) return;
    const targetEl = document.elementFromPoint(e.clientX, e.clientY);
    if (!targetEl) return;

    const actionItem = targetEl.closest('[data-menu-action]');
    if (actionItem) {
      dragStateRef.current.hasMovedOutOfButton = true;
      const actionKey = actionItem.getAttribute('data-menu-action');
      setHoveredAction(actionKey);
    } else {
      setHoveredAction(null);
    }
  };

  const handleTriggerPointerUp = (e) => {
    if (!dragStateRef.current.isPressing) return;
    const elapsed = Date.now() - dragStateRef.current.pressStartTime;
    const moved = dragStateRef.current.hasMovedOutOfButton;
    dragStateRef.current.isPressing = false;

    const targetEl = document.elementFromPoint(e.clientX, e.clientY);
    const actionItem = targetEl?.closest('[data-menu-action]');
    const releasedAction = actionItem?.getAttribute('data-menu-action') || hoveredAction;

    if ((moved || elapsed > 240) && releasedAction) {
      executeMenuAction(releasedAction);
    }
  };

  const openNewSupplierForm = () => {
    setEditingSupplier(null);
    setConfirmDeleteSupplierId(null);
    const nextColor =
      SUPPLIER_COLORS[suppliers.length % SUPPLIER_COLORS.length].hex;
    setFormState({
      name: '',
      contact: '',
      location: '',
      notes: '',
      color: nextColor,
    });
    setShowSupplierForm(true);
  };

  const openEditSupplierForm = (sup, idx = 0) => {
    setEditingSupplier(sup);
    setConfirmDeleteSupplierId(null);
    setFormState({
      name: sup.name,
      contact: sup.contact || '',
      location: sup.location || '',
      notes: sup.notes || '',
      color: getSupplierColor(sup, idx),
    });
    setShowSupplierForm(true);
  };

  const handleSupplierSubmit = (e) => {
    e.preventDefault();
    if (!formState.name.trim()) return;
    onSaveSupplier({
      id: editingSupplier ? editingSupplier.id : `sup-${Date.now()}`,
      name: formState.name.trim(),
      contact: formState.contact.trim(),
      location: formState.location.trim(),
      notes: formState.notes.trim(),
      color: formState.color || SUPPLIER_COLORS[0].hex,
    });
    setEditingSupplier(null);
    setFormState({
      name: '',
      contact: '',
      location: '',
      notes: '',
      color: SUPPLIER_COLORS[0].hex,
    });
    setShowSupplierForm(false);
  };

  const currentThemeLabel =
    themeMode === 'dark'
      ? 'Oscuro'
      : themeMode === 'light'
      ? 'Claro'
      : 'Automático';

  return (
    <>
      <div
        ref={containerRef}
        className="relative z-50 select-none"
        style={{ touchAction: 'none' }}
      >
        {/* Botón flotante Tres Puntos (•••) con efecto LiquidGlass */}
        <button
          type="button"
          aria-label="Menú de configuración y proveedores"
          onPointerDown={handleTriggerPointerDown}
          onPointerMove={handleTriggerPointerMove}
          onPointerUp={handleTriggerPointerUp}
          className="liquid-glass hig-border flex items-center justify-center w-11 h-11 rounded-full transition-transform active:scale-[0.97] cursor-pointer"
          style={{
            color: menuOpen ? COLORS.electricBlue : 'var(--text-primary)',
            backgroundColor: 'var(--bg-glass)',
            backdropFilter: 'blur(28px) saturate(195%)',
            WebkitBackdropFilter: 'blur(28px) saturate(195%)',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="5" cy="12" r="2.2" />
            <circle cx="12" cy="12" r="2.2" />
            <circle cx="19" cy="12" r="2.2" />
          </svg>
        </button>

        {/* Menú Contextual iOS Desplegable (LiquidGlass) — Limpio sin instrucciones redundantes ni códigos HEX */}
        {menuOpen && (
          <div
            className={`liquid-glass-heavy hig-border animate-ios-pop absolute right-0 mt-2.5 w-64 ${SQUIRCLES.classes.card} p-2 overflow-hidden shadow-2xl space-y-1`}
            style={{
              backgroundColor: 'var(--bg-glass-heavy)',
              backdropFilter: 'blur(28px) saturate(195%)',
              WebkitBackdropFilter: 'blur(28px) saturate(195%)',
            }}
          >
            {/* Opción 1: Gestión de Proveedores / Tiendas */}
            <button
              type="button"
              data-menu-action="open:suppliers"
              onClick={() => executeMenuAction('open:suppliers')}
              onPointerEnter={() => setHoveredAction('open:suppliers')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-left text-xs font-semibold transition-colors cursor-pointer"
              style={{
                backgroundColor:
                  hoveredAction === 'open:suppliers'
                    ? 'var(--accent-blue)'
                    : 'transparent',
                color:
                  hoveredAction === 'open:suppliers'
                    ? '#FFFFFF'
                    : 'var(--text-primary)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor:
                      hoveredAction === 'open:suppliers'
                        ? 'rgba(255,255,255,0.2)'
                        : 'var(--accent-blue-soft)',
                    color:
                      hoveredAction === 'open:suppliers'
                        ? '#FFFFFF'
                        : 'var(--accent-blue)',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </span>
                <div>
                  <div className="font-bold leading-tight">Proveedores</div>
                  <div
                    className="text-[11px]"
                    style={{
                      color:
                        hoveredAction === 'open:suppliers'
                          ? 'rgba(255,255,255,0.85)'
                          : 'var(--text-secondary)',
                    }}
                  >
                    {suppliers.length} registrados
                  </div>
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <div
              className="h-px mx-2"
              style={{ backgroundColor: 'var(--border-hairline)' }}
            />

            {/* Opción 2: Menú desplegable limpio de "Tema" */}
            <div>
              <button
                type="button"
                data-menu-action="toggle:theme"
                onClick={() => setThemeDropdownOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-left text-xs font-semibold transition-colors cursor-pointer"
                style={{
                  backgroundColor: themeDropdownOpen
                    ? 'var(--bg-secondary)'
                    : 'transparent',
                  color: 'var(--text-primary)',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-7 h-7 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--accent-blue)',
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="5" />
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2" />
                    </svg>
                  </span>
                  <span className="font-bold">Tema</span>
                </div>

                <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <span className="text-[11px] font-semibold">{currentThemeLabel}</span>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    style={{
                      transform: themeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>

              {themeDropdownOpen && (
                <div
                  className="mt-1 p-1 rounded-2xl space-y-0.5 animate-ios-expand hig-border"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  {[
                    { key: 'theme:dark', mode: 'dark', label: 'Oscuro' },
                    { key: 'theme:light', mode: 'light', label: 'Claro' },
                    { key: 'theme:system', mode: 'system', label: 'Automático' },
                  ].map((item) => {
                    const isSelected = themeMode === item.mode;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        data-menu-action={item.key}
                        onClick={() => executeMenuAction(item.key)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer"
                        style={{
                          backgroundColor: isSelected
                            ? 'var(--accent-blue-soft)'
                            : 'transparent',
                          color: isSelected
                            ? 'var(--accent-blue)'
                            : 'var(--text-primary)',
                        }}
                      >
                        <span>{item.label}</span>
                        {isSelected && (
                          <span className="text-xs font-bold">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sheet tipo iOS para Gestión de Proveedores / Tiendas */}
      <IOSBottomSheet
        open={suppliersModalOpen}
        onClose={() => {
          setSuppliersModalOpen(false);
          setShowSupplierForm(false);
          setEditingSupplier(null);
          setConfirmDeleteSupplierId(null);
        }}
        maxWidthClass="max-w-lg"
        minHeight="50dvh"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                setSuppliersModalOpen(false);
                setShowSupplierForm(false);
                setEditingSupplier(null);
                setConfirmDeleteSupplierId(null);
              }}
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
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight truncate">Proveedores y Mayoristas</h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {suppliers.length} {suppliers.length === 1 ? 'local registrado' : 'locales registrados'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (showSupplierForm && !editingSupplier) {
                setShowSupplierForm(false);
              } else {
                openNewSupplierForm();
              }
            }}
            className="btn-electric px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>{showSupplierForm && !editingSupplier ? 'Cerrar' : '+ Agregar'}</span>
          </button>
        </div>

        {/* Formulario Rápido ARRIBA DE TODO con Selector de Color Identificador */}
        {showSupplierForm && (
          <form
            onSubmit={handleSupplierSubmit}
            className="p-3.5 rounded-2xl space-y-3 hig-border animate-ios-sheet"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: formState.color || COLORS.electricBlue,
            }}
          >
            <div className="flex items-center justify-between">
              <h3
                className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                style={{ color: formState.color || COLORS.electricBlue }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: formState.color || COLORS.electricBlue }}
                />
                <span>
                  {editingSupplier ? `Editando: ${editingSupplier.name}` : 'Nuevo Proveedor / Mayorista'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowSupplierForm(false);
                  setEditingSupplier(null);
                }}
                className="text-xs font-semibold cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
              >
                Ocultar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                autoFocus
                placeholder="Nombre del local o mayorista *"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                className="hig-input w-full text-xs py-2"
              />
              <input
                type="text"
                placeholder="WhatsApp / Teléfono (Opcional)"
                value={formState.contact}
                onChange={(e) => setFormState({ ...formState, contact: e.target.value })}
                className="hig-input w-full text-xs py-2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Ubicación (Ej. C.C. Monterrey Local 214)"
                value={formState.location}
                onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                className="hig-input w-full text-xs py-2"
              />
              <input
                type="text"
                placeholder="Notas o especialidad (Opcional)"
                value={formState.notes}
                onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                className="hig-input w-full text-xs py-2"
              />
            </div>

            {/* Selector Táctil de Color Identificador del Proveedor */}
            <div>
              <label
                className="block text-[11px] font-semibold mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Color Identificador
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {SUPPLIER_COLORS.map((c) => {
                  const selected = formState.color === c.hex;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      title={c.label}
                      onClick={() => setFormState({ ...formState, color: c.hex })}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer"
                      style={{
                        backgroundColor: c.hex,
                        transform: selected ? 'scale(1.15)' : 'scale(1)',
                        boxShadow: selected
                          ? `0 0 0 2px var(--bg-primary), 0 0 0 4px ${c.hex}`
                          : 'none',
                      }}
                    >
                      {selected && (
                        <span className="text-[11px] font-extrabold text-white">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="submit"
                className="btn-electric px-4 py-2 text-xs font-bold cursor-pointer"
              >
                {editingSupplier ? 'Guardar Cambios' : 'Guardar Proveedor'}
              </button>
            </div>
          </form>
        )}

        {/* Listado de Proveedores Registrados con Punto de Color y Eliminación con Confirmación */}
        <div className="space-y-2.5">
          {suppliers.map((sup, idx) => {
            const isRemembered = lastSupplierId === sup.id;
            const supColor = getSupplierColor(sup, idx);
            const isConfirmingDelete = confirmDeleteSupplierId === sup.id;

            return (
              <div
                key={sup.id}
                className="p-3.5 rounded-2xl flex flex-col gap-2.5 hig-border transition-all"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: isConfirmingDelete
                    ? COLORS.dangerRed
                    : isRemembered
                    ? 'var(--accent-blue)'
                    : 'var(--border-card)',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm flex items-center gap-2 flex-wrap">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{
                          backgroundColor: supColor,
                          boxShadow: `0 0 8px ${supColor}80`,
                        }}
                      />
                      <span className="truncate">{sup.name}</span>
                      {isRemembered && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            backgroundColor: 'var(--accent-blue-soft)',
                            color: 'var(--accent-blue)',
                          }}
                        >
                          Activa
                        </span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {sup.location || 'Sin ubicación'} {sup.contact ? `• ${sup.contact}` : ''}
                    </div>
                    {sup.notes && (
                      <div className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        {sup.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectLastSupplier(sup.id)}
                      className="text-[11px] px-2.5 py-1 rounded-xl font-medium cursor-pointer hig-border"
                      style={{
                        backgroundColor: isRemembered
                          ? 'var(--accent-blue)'
                          : 'var(--bg-elevated-solid)',
                        color: isRemembered ? '#FFFFFF' : 'var(--text-primary)',
                        borderColor: isRemembered ? 'transparent' : 'var(--border-card)',
                      }}
                    >
                      {isRemembered ? 'Fijada' : 'Fijar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditSupplierForm(sup, idx)}
                      className="text-[11px] px-2.5 py-1 rounded-xl font-medium cursor-pointer hig-border"
                      style={{
                        backgroundColor: 'var(--bg-elevated-solid)',
                        color: 'var(--accent-blue)',
                      }}
                    >
                      Editar
                    </button>
                    {onDeleteSupplier && suppliers.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Eliminar ${sup.name}`}
                        title="Eliminar proveedor"
                        onClick={() =>
                          setConfirmDeleteSupplierId(
                            isConfirmingDelete ? null : sup.id
                          )
                        }
                        className="w-7 h-7 rounded-xl flex items-center justify-center cursor-pointer hig-border"
                        style={{
                          backgroundColor: isConfirmingDelete
                            ? COLORS.dangerRed
                            : COLORS.dangerRedSoft,
                          color: isConfirmingDelete ? '#FFFFFF' : COLORS.dangerRed,
                          borderColor: 'transparent',
                        }}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Paso de Confirmación de Seguridad para Eliminar Proveedor */}
                {isConfirmingDelete && (
                  <div
                    className="p-2.5 rounded-xl flex items-center justify-between gap-2 animate-ios-expand"
                    style={{
                      backgroundColor: 'var(--bg-elevated-solid)',
                      border: `1px solid ${COLORS.dangerRed}`,
                    }}
                  >
                    <span className="text-xs font-bold" style={{ color: COLORS.dangerRed }}>
                      ¿Estás seguro de eliminar este proveedor?
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteSupplier(sup.id);
                          setConfirmDeleteSupplierId(null);
                          if (editingSupplier?.id === sup.id) {
                            setEditingSupplier(null);
                            setShowSupplierForm(false);
                          }
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-bold text-white cursor-pointer"
                        style={{ backgroundColor: COLORS.dangerRed }}
                      >
                        Sí, eliminar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteSupplierId(null)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer hig-border"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </IOSBottomSheet>
    </>
  );
}
