import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * IOSBottomSheet.jsx — Bottom Sheet estilo Apple HIG con Animaciones de Apertura y Cierre
 * - Anima suavemente al abrir (slide-up + scale) y al cerrar (slide-down + fade-out).
 * - Se puede cerrar tocando afuera (en la zona superior/oscura del fondo)
 *   o deslizando/tocando la pildorita superior (grabber pill).
 * - Bloquea por completo el scroll del fondo detrás del Bottom Sheet mientras está abierto.
 */
export default function IOSBottomSheet({
  open,
  onClose,
  maxWidthClass = 'max-w-xl',
  minHeight = undefined,
  children,
}) {
  const [shouldRender, setShouldRender] = useState(open);
  const [isClosing, setIsClosing] = useState(false);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const dragStartRef = useRef({ startY: 0, active: false });

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      setIsClosing(false);
      setDragOffsetY(0);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
        setDragOffsetY(0);
      }, 220);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open, shouldRender]);

  // Bloquear scroll del documento detrás del Bottom Sheet cuando está visible
  useEffect(() => {
    if (!shouldRender || typeof document === 'undefined') return undefined;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [shouldRender]);

  if (!shouldRender || typeof document === 'undefined') return null;

  const triggerAnimatedClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setDragOffsetY(0);
      onClose();
    }, 200);
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    dragStartRef.current = {
      startY: e.clientY,
      active: true,
    };
    setIsDraggingHandle(true);
    if (e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture is unsupported
      }
    }
  };

  const handlePointerMove = (e) => {
    if (!dragStartRef.current.active) return;
    const deltaY = Math.max(0, e.clientY - dragStartRef.current.startY);
    setDragOffsetY(deltaY);
  };

  const handlePointerUp = (e) => {
    if (!dragStartRef.current.active) return;
    const deltaY = e.clientY - dragStartRef.current.startY;
    dragStartRef.current.active = false;
    setIsDraggingHandle(false);

    // Si arrastró la pildorita hacia abajo (> 45px) o la tocó directamente (< 6px)
    if (deltaY > 45 || Math.abs(deltaY) < 6) {
      triggerAnimatedClose();
    } else {
      setDragOffsetY(0);
    }
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 ${
        isClosing ? 'animate-ios-backdrop-out' : 'animate-ios-backdrop'
      }`}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.62)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        overscrollBehavior: 'none',
      }}
      onClick={triggerAnimatedClose}
    >
      <div
        className={`hig-card hig-border ${
          isClosing ? 'animate-ios-slide-down' : 'animate-ios-slide-up'
        } w-full ${maxWidthClass} max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl p-0 overflow-hidden`}
        style={{
          padding: 0,
          minHeight,
          backgroundColor: 'var(--bg-elevated-solid)',
          transform:
            !isClosing && dragOffsetY > 0
              ? `translateY(${dragOffsetY}px) scale(${Math.max(0.96, 1 - dragOffsetY / 1500)})`
              : undefined,
          opacity:
            !isClosing && dragOffsetY > 0
              ? Math.max(0.5, 1 - dragOffsetY / 400)
              : undefined,
          transition: isDraggingHandle
            ? 'none'
            : 'transform 0.26s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease',
          overscrollBehavior: 'contain',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pildorita Superior Exclusiva para Bajar el Bottom Sheet (Sin texto adicional) */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Cerrar panel"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            dragStartRef.current.active = false;
            setIsDraggingHandle(false);
            setDragOffsetY(0);
          }}
          className="w-full py-3 flex items-center justify-center cursor-pointer select-none shrink-0"
          style={{
            touchAction: 'none',
            backgroundColor: 'var(--bg-elevated-solid)',
          }}
        >
          <div
            className="w-11 h-1.5 rounded-full transition-colors"
            style={{
              backgroundColor: isDraggingHandle
                ? 'var(--accent-blue)'
                : 'var(--bg-tertiary)',
            }}
          />
        </div>

        {/* Contenido interno con inercia de scroll iOS y espacio inferior generoso bajo el botón de acción */}
        <div
          className="px-5 pt-0.5 overflow-y-auto ios-scroll-inertia space-y-4 flex-1"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 34px)',
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
