import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { Card, Tap, Txt, money, Sheet, PriceInput, Field, PrimaryButton, Chip, haptic } from '../ui/kit';
import { DateField } from '../ui/DateField';

const costOf = (s) => (s.items || []).reduce((a, i) => a + i.qty * (i.unitCostSnapshot || 0), 0);

function Stat({ label, value, color }) {
  const t = useTheme();
  return (
    <Card style={{ flex: 1, padding: 14 }}>
      <Txt style={{ color: t.text2, fontSize: 12 }}>{label}</Txt>
      <Txt style={{ color: color || t.text, fontSize: 22, fontWeight: '800', marginTop: 4 }}>
        {money(value)}
      </Txt>
    </Card>
  );
}

/**
 * Vista de análisis de Más Vendidos y Más Devueltos con filtro por ciclo actual o ciclos anteriores.
 */
function TopSellersSheet({ visible, onClose, store }) {
  const t = useTheme();
  const [selectedCycleId, setSelectedCycleId] = useState('actual');
  const [metricTab, setMetricTab] = useState('sellers'); // 'sellers' | 'returned'
  const [openTx, setOpenTx] = useState(null);

  // Fecha del último cierre para acotar el ciclo actual
  const latestClosure = store.closures[0];
  const currentSales = useMemo(() => {
    if (!latestClosure) return store.sales;
    const closureDate = new Date(latestClosure.closedAt);
    return store.sales.filter((s) => new Date(s.createdAt) > closureDate);
  }, [store.sales, latestClosure]);

  // Selección de datos según el ciclo
  const activeCycle = useMemo(() => {
    if (selectedCycleId === 'actual') return null;
    return store.closures.find((c) => c.id === selectedCycleId) || null;
  }, [selectedCycleId, store.closures]);

  // Cálculo de Más Vendidos
  const sellersList = useMemo(() => {
    if (activeCycle) {
      if (activeCycle.topSellers && activeCycle.topSellers.length > 0) {
        return activeCycle.topSellers;
      }
      // Reconciliación con histórico si no tenía pre-guardado
      const map = {};
      const cycleSales = store.sales.filter((s) => {
        const d = new Date(s.createdAt);
        return d <= new Date(activeCycle.closedAt);
      });
      cycleSales.forEach((s) =>
        (s.items || []).forEach((i) => {
          const r = (map[i.productId] ||= { id: i.productId, name: i.productName, qty: 0, revenue: 0, profit: 0, tx: [] });
          r.qty += i.qty;
          r.revenue += i.qty * i.unitPriceCharged;
          r.profit += i.qty * (i.unitPriceCharged - (i.unitCostSnapshot || 0));
        })
      );
      return Object.values(map).sort((a, b) => b.qty - a.qty);
    }

    // Ciclo actual dinámico
    const map = {};
    currentSales.forEach((s) =>
      (s.items || []).forEach((i) => {
        const r = (map[i.productId] ||= { id: i.productId, name: i.productName, qty: 0, revenue: 0, profit: 0, tx: [] });
        r.qty += i.qty;
        r.revenue += i.qty * i.unitPriceCharged;
        r.profit += i.qty * (i.unitPriceCharged - (i.unitCostSnapshot || 0));
        r.tx.push({ id: `${s.id}-${i.id}`, date: s.createdAt, customer: s.customerName, qty: i.qty, price: i.unitPriceCharged });
      })
    );
    return Object.values(map).sort((a, b) => b.qty - a.qty);
  }, [activeCycle, currentSales, store.sales]);

  // Cálculo de Más Devueltos (Garantías / Devoluciones)
  const returnedList = useMemo(() => {
    if (activeCycle) {
      if (activeCycle.topReturned && activeCycle.topReturned.length > 0) {
        return activeCycle.topReturned;
      }
      return [];
    }

    // Ciclo actual
    const map = {};
    currentSales.forEach((s) =>
      (s.items || [])
        .filter((i) => i.warrantyClaimed)
        .forEach((i) => {
          const r = (map[i.productId] ||= { id: i.productId, name: i.productName, qty: 0, notes: [] });
          r.qty += i.qty;
          if (i.warrantyClaimNote) r.notes.push(i.warrantyClaimNote);
        })
    );
    return Object.values(map).sort((a, b) => b.qty - a.qty);
  }, [activeCycle, currentSales]);

  return (
    <Sheet visible={visible} onClose={onClose} title="Rendimiento de Ventas" height={0.92}>
      <View style={{ flex: 1 }}>
        {/* Selector de Ciclo (Ciclo Actual vs Ciclos Anteriores) */}
        <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
          <Text style={{ color: t.text2, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
            PERÍODO CONSULTADO
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <Chip
              label="Ciclo Actual"
              active={selectedCycleId === 'actual'}
              onPress={() => setSelectedCycleId('actual')}
            />
            {store.closures.map((c) => (
              <Chip
                key={c.id}
                label={c.periodLabel}
                active={selectedCycleId === c.id}
                onPress={() => setSelectedCycleId(c.id)}
              />
            ))}
          </ScrollView>

          {/* Selector de Métrica (Más Vendidos vs Más Devueltos) */}
          <View style={{ flexDirection: 'row', gap: 8, backgroundColor: t.card2, padding: 4, borderRadius: 14, marginBottom: 12 }}>
            <Tap onPress={() => setMetricTab('sellers')} hapticKind="select" style={{ flex: 1 }}>
              <View
                style={{
                  minHeight: 36,
                  borderRadius: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: metricTab === 'sellers' ? t.blue : 'transparent',
                }}
              >
                <Ionicons name="flame" size={16} color={metricTab === 'sellers' ? '#fff' : t.text2} style={{ marginRight: 6 }} />
                <Text style={{ color: metricTab === 'sellers' ? '#fff' : t.text, fontWeight: '700', fontSize: 13 }}>
                  Más Vendidos
                </Text>
              </View>
            </Tap>
            <Tap onPress={() => setMetricTab('returned')} hapticKind="select" style={{ flex: 1 }}>
              <View
                style={{
                  minHeight: 36,
                  borderRadius: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: metricTab === 'returned' ? t.orange : 'transparent',
                }}
              >
                <Ionicons name="repeat" size={16} color={metricTab === 'returned' ? '#fff' : t.text2} style={{ marginRight: 6 }} />
                <Text style={{ color: metricTab === 'returned' ? '#fff' : t.text, fontWeight: '700', fontSize: 13 }}>
                  Más Devueltos
                </Text>
              </View>
            </Tap>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          {metricTab === 'sellers' ? (
            sellersList.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <Ionicons name="bag-outline" size={40} color={t.text3} />
                <Txt style={{ color: t.text2, marginTop: 10 }}>No hay ventas registradas en este período</Txt>
              </View>
            ) : (
              sellersList.map((r, idx) => (
                <Card key={r.id || idx} style={{ padding: 14, marginBottom: 10, backgroundColor: t.card2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Txt style={{ color: t.text2, width: 26, fontWeight: '800' }}>{idx + 1}</Txt>
                    <Text numberOfLines={2} style={{ flex: 1, color: t.text, fontWeight: '600', fontSize: 15 }}>
                      {r.name}
                    </Text>
                    <View style={{ backgroundColor: t.card, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Txt style={{ fontWeight: '800', color: t.blue }}>{r.qty} uds</Txt>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                    <Txt style={{ color: t.text2, fontSize: 13 }}>Ingresos: {money(r.revenue)}</Txt>
                    <Txt style={{ color: t.green, fontWeight: '700', fontSize: 13 }}>+{money(r.profit)}</Txt>
                  </View>
                  {r.tx && r.tx.length > 0 && (
                    <>
                      <Tap onPress={() => setOpenTx(openTx === r.id ? null : r.id)} hapticKind="select" style={{ paddingTop: 10 }}>
                        <Txt style={{ color: t.blue, fontSize: 13, fontWeight: '600' }}>
                          {openTx === r.id ? 'Ocultar transacciones' : 'Ver transacciones'}
                        </Txt>
                      </Tap>
                      {openTx === r.id &&
                        r.tx.map((x) => (
                          <View key={x.id} style={{ flexDirection: 'row', paddingTop: 8, borderTopWidth: 0.5, borderTopColor: t.hairline, marginTop: 6 }}>
                            <Txt style={{ flex: 1, color: t.text2, fontSize: 12 }}>
                              {new Date(x.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} · {x.customer}
                            </Txt>
                            <Txt style={{ fontSize: 12, fontWeight: '600' }}>{x.qty}× {money(x.price)}</Txt>
                          </View>
                        ))}
                    </>
                  )}
                </Card>
              ))
            )
          ) : (
            returnedList.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <Ionicons name="checkmark-circle-outline" size={40} color={t.green} />
                <Txt style={{ color: t.text2, marginTop: 10 }}>Sin incidencias de garantía en este período</Txt>
              </View>
            ) : (
              returnedList.map((r, idx) => (
                <Card key={r.id || idx} style={{ padding: 14, marginBottom: 10, backgroundColor: t.card2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Txt style={{ color: t.text2, width: 26, fontWeight: '800' }}>{idx + 1}</Txt>
                    <Text numberOfLines={2} style={{ flex: 1, color: t.text, fontWeight: '600', fontSize: 15 }}>
                      {r.name}
                    </Text>
                    <View style={{ backgroundColor: 'rgba(255,149,0,0.18)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Txt style={{ fontWeight: '800', color: t.orange }}>{r.qty} reclamos</Txt>
                    </View>
                  </View>
                  {r.notes && r.notes.length > 0 && (
                    <View style={{ marginTop: 8, borderTopWidth: 0.5, borderTopColor: t.hairline, paddingTop: 6 }}>
                      {r.notes.map((n, i) => (
                        <Txt key={i} style={{ color: t.text2, fontSize: 12, marginTop: 2 }}>• {n}</Txt>
                      ))}
                    </View>
                  )}
                </Card>
              ))
            )
          )}
        </ScrollView>
      </View>
    </Sheet>
  );
}

function ClosureSheet({ visible, onClose, store }) {
  const t = useTheme();
  const [start, setStart] = useState(new Date(Date.now() - 14 * 864e5));
  const [end, setEnd] = useState(new Date());
  const [withTime, setWithTime] = useState(false);
  const [cash, setCash] = useState('');
  const [note, setNote] = useState('');

  const range = useMemo(() => {
    const a = new Date(start);
    const b = new Date(end);
    if (!withTime) {
      a.setHours(0, 0, 0, 0);
      b.setHours(23, 59, 59, 999);
    }
    const inRange = store.sales.filter((s) => {
      const d = new Date(s.createdAt);
      return d >= a && d <= b;
    });
    const sold = inRange.reduce((x, s) => x + s.totalAmount, 0);
    const cost = inRange.reduce((x, s) => x + costOf(s), 0);

    // Más vendidos en el período
    const sellerMap = {};
    inRange.forEach((s) => {
      (s.items || []).forEach((i) => {
        const r = (sellerMap[i.productId] ||= { id: i.productId, name: i.productName, qty: 0, revenue: 0, profit: 0 });
        r.qty += Number(i.qty) || 0;
        r.revenue += (Number(i.qty) || 0) * (Number(i.unitPriceCharged) || 0);
        r.profit += (Number(i.qty) || 0) * ((Number(i.unitPriceCharged) || 0) - (Number(i.unitCostSnapshot) || 0));
      });
    });
    const topSellers = Object.values(sellerMap).sort((a, b) => b.qty - a.qty);

    // Más devueltos / garantías en el período
    const returnMap = {};
    inRange.forEach((s) => {
      (s.items || [])
        .filter((i) => i.warrantyClaimed)
        .forEach((i) => {
          const r = (returnMap[i.productId] ||= { id: i.productId, name: i.productName, qty: 0, notes: [] });
          r.qty += Number(i.qty) || 0;
          if (i.warrantyClaimNote) r.notes.push(i.warrantyClaimNote);
        });
    });
    const topReturned = Object.values(returnMap).sort((a, b) => b.qty - a.qty);

    return { sold, profit: sold - cost, cost, inRange, topSellers, topReturned };
  }, [start, end, withTime, store.sales]);

  const save = () => {
    const short = (d) => d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    store.createClosure({
      id: `cycle-${Date.now()}`,
      periodLabel: `Ciclo ${short(start)} – ${short(end)} ${end.getFullYear()}`,
      closedAt: new Date().toISOString(),
      totalSold: range.sold,
      netProfit: range.profit,
      recoveredInvestment: range.cost,
      remainingStockInvestment: store.products.reduce((a, p) => a + p.stock * (p.unitCost || 0), 0),
      expectedCash: range.sold,
      realCashReported: cash === '' ? range.sold : Number(cash),
      differenceNote: note,
      topSellers: range.topSellers,
      topReturned: range.topReturned,
    });
    haptic('success');
    setCash('');
    setNote('');
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Cierre de Ciclo" height={0.88}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <DateField label="Desde" value={start} onChange={setStart} withTime={withTime} />
          <DateField label="Hasta" value={end} onChange={setEnd} withTime={withTime} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <Txt style={{ flex: 1 }}>Incluir hora exacta</Txt>
          <Switch value={withTime} onValueChange={setWithTime} trackColor={{ true: t.green }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <Stat label="Total Vendido" value={range.sold} />
          <Stat label="Utilidad Neta" value={range.profit} color={t.green} />
        </View>
        <PriceInput label="Efectivo real en caja" value={cash} onChange={setCash} />
        <Field label="Nota de cierre / descuadre" value={note} onChangeText={setNote} placeholder="Opcional..." />
        <PrimaryButton title="Confirmar Cierre de Ciclo" onPress={save} />
      </ScrollView>
    </Sheet>
  );
}

export function ResumenScreen({ store, headerRight, isDesktop, onGoToPOS }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [top, setTop] = useState(false);
  const [closing, setClosing] = useState(false);

  const totals = useMemo(() => {
    const revenue = store.sales.reduce((a, s) => a + s.totalAmount, 0);
    const cost = store.sales.reduce((a, s) => a + costOf(s), 0);
    const stockValue = store.products.reduce((a, p) => a + p.stock * (p.unitCost || 0), 0);
    return { revenue, profit: revenue - cost, stockValue };
  }, [store.sales, store.products]);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          paddingTop: isDesktop ? 16 : insets.top + 4,
          paddingHorizontal: 20,
          paddingBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text style={{ flex: 1, color: t.text, fontSize: 28, fontWeight: '800' }}>Resumen</Text>
        {!isDesktop ? headerRight : null}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isDesktop ? 40 : 85 }}>
        {isDesktop ? (
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
            <Stat label="Ingresos" value={totals.revenue} />
            <Stat label="Utilidad" value={totals.profit} color={t.green} />
            <Stat label="Inventario" value={totals.stockValue} color={t.orange} />
          </View>
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <Stat label="Ingresos" value={totals.revenue} />
              <Stat label="Utilidad" value={totals.profit} color={t.green} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <Stat label="Inventario" value={totals.stockValue} color={t.orange} />
            </View>
          </>
        )}

        <View style={isDesktop ? { flexDirection: 'row', gap: 12, marginBottom: 16 } : null}>
          <Tap onPress={() => setTop(true)} style={isDesktop ? { flex: 1 } : null}>
            <Card style={{ padding: 16, marginBottom: isDesktop ? 0 : 10, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.card2, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="bar-chart" size={18} color={t.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt style={{ fontWeight: '700', fontSize: 16 }}>Más Vendidos y Devueltos</Txt>
                <Txt style={{ color: t.text2, fontSize: 12 }}>Filtrar por ciclo actual o históricos</Txt>
              </View>
              <Ionicons name="chevron-forward" size={18} color={t.text3} />
            </Card>
          </Tap>
          <Tap onPress={() => setClosing(true)} style={isDesktop ? { flex: 1 } : null}>
            <Card style={{ padding: 16, marginBottom: isDesktop ? 0 : 20, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.card2, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="lock-closed" size={18} color={t.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt style={{ fontWeight: '700', fontSize: 16 }}>Cerrar Ciclo</Txt>
                <Txt style={{ color: t.text2, fontSize: 12 }}>Arqueo de caja y congelación de métricas</Txt>
              </View>
              <Ionicons name="chevron-forward" size={18} color={t.text3} />
            </Card>
          </Tap>
        </View>

        <Text style={{ color: t.text2, fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: isDesktop ? 8 : 0 }}>
          HISTORIAL DE CIERRES ({store.closures.length})
        </Text>
        {store.closures.map((c) => (
          <Card key={c.id} style={{ padding: 14, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Txt style={{ fontWeight: '700', fontSize: 15 }}>{c.periodLabel}</Txt>
              <Txt style={{ color: t.text2, fontSize: 12 }}>
                {new Date(c.closedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Txt>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Txt style={{ color: t.text2 }}>Vendido: {money(c.totalSold)}</Txt>
              <Txt style={{ color: t.green, fontWeight: '700' }}>Utilidad: +{money(c.netProfit)}</Txt>
            </View>
            {c.differenceNote ? (
              <Txt style={{ color: t.text2, fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>
                Nota: {c.differenceNote}
              </Txt>
            ) : null}
          </Card>
        ))}
      </ScrollView>

      {/* Botón flotante para acceso directo a Vender (Mobile) */}
      {!isDesktop && onGoToPOS && (
        <View style={{ position: 'absolute', right: 20, bottom: insets.bottom + 84 }}>
          <Tap onPress={onGoToPOS} hapticKind="medium">
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: t.blue,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
              }}
            >
              <Ionicons name="cart" size={24} color="#fff" />
              {store.totalCartUnits > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    backgroundColor: t.red,
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Txt style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{store.totalCartUnits}</Txt>
                </View>
              )}
            </View>
          </Tap>
        </View>
      )}

      <TopSellersSheet visible={top} onClose={() => setTop(false)} store={store} />
      <ClosureSheet visible={closing} onClose={() => setClosing(false)} store={store} />
    </View>
  );
}
