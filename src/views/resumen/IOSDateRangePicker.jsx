import React, { useState, useMemo, useRef, useEffect } from 'react';
import { COLORS } from '../../theme/designSystem.js';

export const MONTHS_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];
export const MONTHS_FULL_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
export const WEEKDAYS_SHORT_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const CALENDAR_HEADERS_ES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
export const YEARS_LIST = [2025, 2026, 2027, 2028];
const ITEM_HEIGHT = 38;

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function toTimestamp(d) {
  return new Date(d.year, d.month, d.day).getTime();
}

export function getWeekdayLabel(year, month, day) {
  const wd = new Date(year, month, day).getDay();
  return WEEKDAYS_SHORT_ES[wd] || '';
}

/**
 * Columna individual de rueda deslizante 3D estilo iOS (UIDatePicker Drum)
 */
function WheelColumn({ items, selectedValue, onSelect, formatLabel = (v) => v }) {
  const colRef = useRef(null);
  const timeoutRef = useRef(null);
  const isUserInteractingRef = useRef(false);
  const pointerDragRef = useRef({ active: false, startY: 0, startScrollTop: 0, moved: false });

  const selectedIndex = useMemo(() => {
    const idx = items.indexOf(selectedValue);
    return idx >= 0 ? idx : 0;
  }, [items, selectedValue]);

  useEffect(() => {
    if (isUserInteractingRef.current) return;
    if (colRef.current && selectedIndex >= 0) {
      const targetTop = selectedIndex * ITEM_HEIGHT;
      if (Math.abs(colRef.current.scrollTop - targetTop) > 2) {
        colRef.current.scrollTop = targetTop;
      }
    }
  }, [selectedIndex, items.length]);

  const handleScroll = (e) => {
    const scrollTop = e.currentTarget.scrollTop;
    isUserInteractingRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const immediateIndex = Math.min(
      items.length - 1,
      Math.max(0, Math.round(scrollTop / ITEM_HEIGHT))
    );
    if (items[immediateIndex] !== undefined && items[immediateIndex] !== selectedValue) {
      onSelect(items[immediateIndex]);
    }

    timeoutRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
      if (colRef.current) {
        const finalIndex = Math.min(
          items.length - 1,
          Math.max(0, Math.round(colRef.current.scrollTop / ITEM_HEIGHT))
        );
        colRef.current.scrollTo({ top: finalIndex * ITEM_HEIGHT, behavior: 'smooth' });
      }
    }, 140);
  };

  const handlePointerDown = (e) => {
    if (e.pointerType === 'touch') return;
    if (!colRef.current) return;
    pointerDragRef.current = {
      active: true,
      startY: e.clientY,
      startScrollTop: colRef.current.scrollTop,
      moved: false,
    };
    isUserInteractingRef.current = true;
    if (e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }
  };

  const handlePointerMove = (e) => {
    if (!pointerDragRef.current.active || !colRef.current) return;
    const deltaY = e.clientY - pointerDragRef.current.startY;
    if (Math.abs(deltaY) > 3) {
      pointerDragRef.current.moved = true;
    }
    colRef.current.scrollTop = pointerDragRef.current.startScrollTop - deltaY;
  };

  const handlePointerUp = () => {
    if (!pointerDragRef.current.active) return;
    pointerDragRef.current.active = false;
    if (colRef.current) {
      const idx = Math.min(
        items.length - 1,
        Math.max(0, Math.round(colRef.current.scrollTop / ITEM_HEIGHT))
      );
      if (items[idx] !== undefined) {
        onSelect(items[idx]);
      }
      colRef.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' });
    }
    setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 160);
  };

  return (
    <div
      ref={colRef}
      onScroll={handleScroll}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="ios-wheel-column ios-wheel-mask no-scrollbar"
    >
      {items.map((val, idx) => {
        const distance = Math.abs(idx - selectedIndex);
        const stateClass =
          distance === 0
            ? 'ios-wheel-item-active'
            : distance === 1
            ? 'ios-wheel-item-near'
            : '';

        return (
          <div
            key={val}
            onClick={() => {
              if (pointerDragRef.current.moved) return;
              isUserInteractingRef.current = true;
              onSelect(val);
              if (colRef.current) {
                colRef.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' });
              }
              setTimeout(() => {
                isUserInteractingRef.current = false;
              }, 200);
            }}
            className={`ios-wheel-item cop-mono ${stateClass}`}
          >
            {formatLabel(val)}
          </div>
        );
      })}
    </div>
  );
}

/**
 * IOSDateRangePicker.jsx — Selector Nativo de Fechas estilo iOS (UIDatePicker Inline & Wheel):
 * - Estética minimalista de Calendario Nativo iOS + Rueda 3D opcional.
 * - Selección de hora opcional y desactivable mediante interruptor iOS ("Incluir hora").
 */
export default function IOSDateRangePicker({
  startDate,
  endDate,
  onChangeStart,
  onChangeEnd,
  includeTime = false,
  onToggleIncludeTime,
  startTime = '08:00',
  endTime = '20:00',
  onChangeStartTime,
  onChangeEndTime,
}) {
  const [activeTab, setActiveTab] = useState('start'); // 'start' | 'end'
  const [pickerMode, setPickerMode] = useState('calendar'); // 'calendar' | 'wheel'

  const current = activeTab === 'start' ? startDate : endDate;

  const updateCurrentDate = (nextDate) => {
    const maxDay = getDaysInMonth(nextDate.year, nextDate.month);
    const clamped = {
      ...nextDate,
      day: Math.min(maxDay, Math.max(1, nextDate.day)),
    };

    if (activeTab === 'start') {
      onChangeStart(clamped);
      if (toTimestamp(clamped) > toTimestamp(endDate)) {
        onChangeEnd(clamped);
      }
    } else {
      onChangeEnd(clamped);
      if (toTimestamp(clamped) < toTimestamp(startDate)) {
        onChangeStart(clamped);
      }
    }
  };

  const daysInCurrentMonth = useMemo(
    () => getDaysInMonth(current.year, current.month),
    [current.year, current.month]
  );

  const daysList = useMemo(
    () => Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1),
    [daysInCurrentMonth]
  );

  const cycleDaysCount = useMemo(() => {
    const diffMs = Math.max(0, toTimestamp(endDate) - toTimestamp(startDate));
    return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const applyQuickPreset = (preset) => {
    const endRef = new Date(endDate.year, endDate.month, endDate.day);
    if (preset === 'today') {
      onChangeStart({ ...endDate });
    } else if (preset === '7d') {
      const startRef = new Date(endRef);
      startRef.setDate(startRef.getDate() - 6);
      onChangeStart({
        day: startRef.getDate(),
        month: startRef.getMonth(),
        year: startRef.getFullYear(),
      });
    } else if (preset === '15d') {
      const startRef = new Date(endRef);
      startRef.setDate(startRef.getDate() - 14);
      onChangeStart({
        day: startRef.getDate(),
        month: startRef.getMonth(),
        year: startRef.getFullYear(),
      });
    } else if (preset === 'month') {
      onChangeStart({
        day: 1,
        month: endDate.month,
        year: endDate.year,
      });
      onChangeEnd({
        day: getDaysInMonth(endDate.year, endDate.month),
        month: endDate.month,
        year: endDate.year,
      });
    }
  };

  const calendarCells = useMemo(() => {
    const firstDayJS = new Date(current.year, current.month, 1).getDay();
    const offsetMondayFirst = (firstDayJS + 6) % 7;
    const blanks = Array.from({ length: offsetMondayFirst }, (_, i) => ({
      blank: true,
      id: `b-${i}`,
    }));
    const days = Array.from({ length: daysInCurrentMonth }, (_, i) => ({
      blank: false,
      day: i + 1,
      id: `d-${i + 1}`,
    }));
    return [...blanks, ...days];
  }, [current.year, current.month, daysInCurrentMonth]);

  return (
    <div
      className="p-3 rounded-[22px] space-y-2.5 hig-border"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      {/* Cabecera compacta estilo iOS Settings: Atajos de rango + Conmutador Calendario/Rueda */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'today', label: 'Hoy' },
            { id: '7d', label: '7 días' },
            { id: '15d', label: 'Quincena' },
            { id: 'month', label: 'Mes' },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyQuickPreset(preset.id)}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 cursor-pointer hig-border transition-colors"
              style={{
                backgroundColor: 'var(--bg-elevated-solid)',
                color: 'var(--text-secondary)',
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Conmutador Segmented Control Nativo iOS */}
        <div
          className="flex items-center p-0.5 rounded-xl hig-border shrink-0"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <button
            type="button"
            onClick={() => setPickerMode('calendar')}
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
            style={{
              backgroundColor:
                pickerMode === 'calendar' ? COLORS.electricBlue : 'transparent',
              color:
                pickerMode === 'calendar' ? '#FFFFFF' : 'var(--text-secondary)',
            }}
          >
            Calendario
          </button>
          <button
            type="button"
            onClick={() => setPickerMode('wheel')}
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
            style={{
              backgroundColor:
                pickerMode === 'wheel' ? COLORS.electricBlue : 'transparent',
              color:
                pickerMode === 'wheel' ? '#FFFFFF' : 'var(--text-secondary)',
            }}
          >
            Rueda
          </button>
        </div>
      </div>

      {/* Píldoras gemelas de Inicio y Cierre (estilo iOS Date Compact Pill) */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { key: 'start', label: 'Inicio', date: startDate, time: startTime },
          { key: 'end', label: 'Cierre', date: endDate, time: endTime },
        ].map((card) => {
          const isSelected = activeTab === card.key;
          const weekday = getWeekdayLabel(
            card.date.year,
            card.date.month,
            card.date.day
          );
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setActiveTab(card.key)}
              className="px-3 py-2 rounded-2xl text-left transition-all cursor-pointer hig-border flex items-center justify-between gap-1.5"
              style={{
                backgroundColor: isSelected
                  ? COLORS.electricBlueSoft
                  : 'var(--bg-elevated-solid)',
                borderColor: isSelected
                  ? COLORS.electricBlue
                  : 'var(--border-card)',
              }}
            >
              <div className="min-w-0">
                <div
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    color: isSelected
                      ? COLORS.electricBlue
                      : 'var(--text-secondary)',
                  }}
                >
                  {card.label}
                </div>
                <div
                  className="cop-mono text-xs font-extrabold truncate mt-0.5"
                  style={{
                    color: isSelected
                      ? COLORS.electricBlue
                      : 'var(--text-primary)',
                  }}
                >
                  {weekday}, {String(card.date.day).padStart(2, '0')}{' '}
                  {MONTHS_ES[card.date.month]} {card.date.year}
                </div>
              </div>

              {includeTime && (
                <span
                  className="cop-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {card.time}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cuerpo del Selector: Calendario Inline Nativo iOS o Rueda 3D */}
      {pickerMode === 'calendar' ? (
        <div
          className="p-3 rounded-2xl space-y-2 hig-border"
          style={{ backgroundColor: 'var(--bg-elevated-solid)' }}
        >
          {/* Cabecera Mes/Año estilo iOS Inline Calendar */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold tracking-tight">
                {MONTHS_FULL_ES[current.month]} {current.year}
              </span>
              <span
                className="cop-mono text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: COLORS.electricBlueSoft,
                  color: COLORS.electricBlue,
                }}
              >
                {cycleDaysCount}d
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Mes anterior"
                onClick={() => {
                  const prevMonth = current.month === 0 ? 11 : current.month - 1;
                  const prevYear =
                    current.month === 0 ? current.year - 1 : current.year;
                  updateCurrentDate({
                    ...current,
                    month: prevMonth,
                    year: prevYear,
                  });
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: COLORS.electricBlue,
                }}
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Mes siguiente"
                onClick={() => {
                  const nextMonth = current.month === 11 ? 0 : current.month + 1;
                  const nextYear =
                    current.month === 11 ? current.year + 1 : current.year;
                  updateCurrentDate({
                    ...current,
                    month: nextMonth,
                    year: nextYear,
                  });
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: COLORS.electricBlue,
                }}
              >
                ›
              </button>
            </div>
          </div>

          {/* Días de la semana y cuadrícula mensual */}
          <div className="ios-calendar-grid text-center">
            {CALENDAR_HEADERS_ES.map((h, idx) => (
              <div
                key={`${h}-${idx}`}
                className="text-[10px] font-bold py-0.5"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {h}
              </div>
            ))}

            {calendarCells.map((cell) => {
              if (cell.blank) {
                return <div key={cell.id} className="h-7" />;
              }

              const cellDate = {
                day: cell.day,
                month: current.month,
                year: current.year,
              };
              const cellTs = toTimestamp(cellDate);
              const startTs = toTimestamp(startDate);
              const endTs = toTimestamp(endDate);
              const isStart = cellTs === startTs;
              const isEnd = cellTs === endTs;
              const isInRange = cellTs > startTs && cellTs < endTs;

              return (
                <button
                  key={cell.id}
                  type="button"
                  onClick={() => {
                    updateCurrentDate({ ...current, day: cell.day });
                    if (activeTab === 'start') {
                      setActiveTab('end');
                    }
                  }}
                  className="cop-mono h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all cursor-pointer"
                  style={{
                    backgroundColor:
                      isStart || isEnd
                        ? COLORS.electricBlue
                        : isInRange
                        ? COLORS.electricBlueSoft
                        : 'transparent',
                    color:
                      isStart || isEnd
                        ? '#FFFFFF'
                        : isInRange
                        ? COLORS.electricBlue
                        : 'var(--text-primary)',
                  }}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="ios-wheel-container">
          <div className="ios-wheel-highlight" />

          <WheelColumn
            items={daysList}
            selectedValue={Math.min(daysInCurrentMonth, current.day)}
            onSelect={(day) => updateCurrentDate({ ...current, day })}
            formatLabel={(d) =>
              `${getWeekdayLabel(current.year, current.month, d)} ${String(
                d
              ).padStart(2, '0')}`
            }
          />

          <WheelColumn
            items={MONTHS_FULL_ES.map((_, idx) => idx)}
            selectedValue={current.month}
            onSelect={(month) => updateCurrentDate({ ...current, month })}
            formatLabel={(mIdx) => MONTHS_FULL_ES[mIdx]}
          />

          <WheelColumn
            items={YEARS_LIST}
            selectedValue={current.year}
            onSelect={(year) => updateCurrentDate({ ...current, year })}
            formatLabel={(y) => String(y)}
          />
        </div>
      )}

      {/* Fila inferior estilo iOS: Hora opcional / desactivable */}
      {onToggleIncludeTime && (
        <div
          className="px-3 py-2 rounded-xl flex items-center justify-between gap-2 hig-border"
          style={{ backgroundColor: 'var(--bg-elevated-solid)' }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleIncludeTime(!includeTime)}
              className="text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span
                className="w-8 h-4.5 rounded-full p-0.5 transition-colors flex items-center"
                style={{
                  backgroundColor: includeTime
                    ? COLORS.electricBlue
                    : 'var(--bg-secondary)',
                }}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full bg-white shadow transition-transform"
                  style={{
                    transform: includeTime
                      ? 'translateX(14px)'
                      : 'translateX(0px)',
                  }}
                />
              </span>
              <span>Incluir hora</span>
            </button>
          </div>

          {includeTime && (
            <div className="flex items-center gap-1.5 animate-ios-expand">
              <input
                type="time"
                value={startTime}
                onChange={(e) =>
                  onChangeStartTime && onChangeStartTime(e.target.value)
                }
                className="hig-input cop-mono py-1 px-2 text-[11px] font-bold rounded-lg"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              />
              <span
                className="text-[10px]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                a
              </span>
              <input
                type="time"
                value={endTime}
                onChange={(e) =>
                  onChangeEndTime && onChangeEndTime(e.target.value)
                }
                className="hig-input cop-mono py-1 px-2 text-[11px] font-bold rounded-lg"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
