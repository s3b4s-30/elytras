import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { Sheet, Tap, Txt, Field, PriceInput, PrimaryButton, Dot, Chip, money, haptic } from '../ui/kit';

export const PAYMENTS = [
  { id: 'Efectivo', label: 'Efectivo', icon: 'cash-outline' },
  { id: 'Nequi', label: 'Nequi', icon: 'phone-portrait-outline' },
  { id: 'Bancolombia', label: 'Bancolombia', icon: 'business-outline' },
  { id: 'Tarjeta', label: 'Tarjeta', icon: 'card-outline' },
];

export function CheckoutForm({ store, onComplete, isDesktop = false }) {
  const t = useTheme();
  const { cart, products, suppliers } = store;
  const [customer, setCustomer] = useState('');
  const [payment, setPayment] = useState('Efectivo');
  const [finalTotal, setFinalTotal] = useState('');

  const subtotal = cart.reduce((a, i) => a + i.qty * i.unitPriceCharged, 0);
  useEffect(() => {
    setFinalTotal('');
  }, [subtotal]);
  const total = finalTotal === '' ? subtotal : Number(finalTotal);
  const discount = Math.max(0, subtotal - total);

  const confirm = () => {
    if (!cart.length) return;
    const now = new Date().toISOString();
    const num = store.nextSaleNumber;
    const items = cart.map((c, idx) => {
      const p = products.find((x) => x.id === c.productId);
      return {
        id: `item-${num}-${idx + 1}`,
        productId: c.productId,
        productName: c.productName,
        specsSummary: (p?.specs || []).slice(0, 2).join(' • '),
        qty: c.qty,
        unitPriceCharged: c.unitPriceCharged,
        unitCostSnapshot: c.unitCostSnapshot,
        supplierName: c.supplierName,
        selectedBatchId: c.selectedBatchId,
        selectedSupplierId: c.selectedSupplierId,
        warrantyDays: p?.defaultWarrantyDays ?? 15,
        warrantyClaimed: false,
        warrantyClaimNote: '',
      };
    });
    store.completeSale({
      id: `sale-${num}`,
      saleNumber: num,
      customerName: customer.trim() || 'Cliente General',
      note: '',
      paymentMethod: payment,
      createdAt: now,
      subtotalAmount: subtotal,
      totalAmount: total,
      items,
    });
    haptic('success');
    setCustomer('');
    setFinalTotal('');
    onComplete?.();
  };

  if (!cart.length && isDesktop) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: t.card2,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Ionicons name="cart-outline" size={34} color={t.text3} />
        </View>
        <Txt style={{ color: t.text, fontWeight: '700', fontSize: 17, marginBottom: 6 }}>
          Carrito Vacío
        </Txt>
        <Txt style={{ color: t.text2, textAlign: 'center', fontSize: 13, lineHeight: 19 }}>
          Haz clic en cualquier producto del catálogo a la izquierda para agregarlo a la venta actual.
        </Txt>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isDesktop ? 30 : 40 }} keyboardShouldPersistTaps="handled">
      <Field label="Nombre del Cliente" value={customer} onChangeText={setCustomer} placeholder="Cliente General" />

      {/* Lista detallada de productos en el carrito */}
      <Text style={{ color: t.text2, fontSize: 12, fontWeight: '700', marginBottom: 8, marginLeft: 4 }}>
        PRODUCTOS SELECCIONADOS ({cart.length})
      </Text>
      {cart.map((c) => {
        const p = products.find((x) => x.id === c.productId);
        const options = (p?.batches || []).filter((b) => Number(b.qty) > 0);
        return (
          <View
            key={c.productId}
            style={{
              backgroundColor: t.card2,
              borderRadius: 16,
              padding: 12,
              marginBottom: 10,
              borderWidth: 0.5,
              borderColor: t.hairline,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={{ color: t.text, fontWeight: '600', fontSize: 15 }}>
                  {c.productName}
                </Text>
                {c.supplierName ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                    <Dot color={suppliers.find((x) => x.id === c.selectedSupplierId)?.color || t.blue} size={8} />
                    <Txt style={{ color: t.text2, fontSize: 12, marginLeft: 6 }}>{c.supplierName}</Txt>
                  </View>
                ) : null}
              </View>

              {/* Stepper de cantidad */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: t.card,
                  borderRadius: 12,
                  paddingHorizontal: 2,
                  paddingVertical: 2,
                  marginLeft: 8,
                }}
              >
                <Tap onPress={() => store.updateCartQty(c.productId, c.qty - 1)} hapticKind="medium">
                  <Txt style={{ fontSize: 22, color: t.blue, paddingHorizontal: 10 }}>−</Txt>
                </Tap>
                <Txt style={{ fontWeight: '800', minWidth: 22, textAlign: 'center', fontSize: 15 }}>
                  {c.qty}
                </Txt>
                <Tap onPress={() => store.updateCartQty(c.productId, c.qty + 1)} hapticKind="medium">
                  <Txt style={{ fontSize: 22, color: t.blue, paddingHorizontal: 10 }}>+</Txt>
                </Tap>
              </View>
            </View>

            <View style={{ marginTop: 8 }}>
              <PriceInput
                label="Precio unitario a cobrar"
                value={c.unitPriceCharged}
                onChange={(v) => store.updateCartItemPrice(c.productId, v === '' ? 0 : v)}
              />
            </View>

            {options.length > 1 && (
              <View style={{ marginTop: 6 }}>
                <Text style={{ color: t.text3, fontSize: 11, marginBottom: 4 }}>Cambiar lote / proveedor:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {options.map((b) => {
                    const s = suppliers.find((x) => x.id === b.supplierId);
                    return (
                      <Chip
                        key={b.id}
                        active={c.selectedBatchId === b.id}
                        label={`${s?.name?.split(' ')[0] || b.supplierName} (${b.qty})`}
                        color={s?.color}
                        onPress={() => store.updateCartItemSupplier(c.productId, b.supplierId)}
                      />
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        );
      })}

      {/* Método de Pago */}
      <Text style={{ color: t.text2, fontSize: 12, fontWeight: '700', marginBottom: 6, marginLeft: 4 }}>
        MÉTODO DE PAGO
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {PAYMENTS.map((m) => (
          <Chip
            key={m.id}
            label={m.label}
            active={payment === m.id}
            onPress={() => setPayment(m.id)}
          />
        ))}
      </ScrollView>

      {/* Resumen de Descuentos y Total */}
      <View style={{ backgroundColor: t.card2, borderRadius: 16, padding: 14, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Txt style={{ color: t.text2, fontSize: 14 }}>Subtotal catálogo</Txt>
          <Txt style={{ fontSize: 14 }}>{money(subtotal)}</Txt>
        </View>
        {discount > 0 && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Txt style={{ color: t.green, fontSize: 14 }}>Descuento aplicado</Txt>
            <Txt style={{ color: t.green, fontWeight: '700', fontSize: 14 }}>−{money(discount)}</Txt>
          </View>
        )}
        <View style={{ borderTopWidth: 0.5, borderTopColor: t.hairline, paddingTop: 8, marginTop: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: t.text, fontWeight: '800', fontSize: 16 }}>Total a Cobrar</Text>
          <Text style={{ color: t.green, fontWeight: '800', fontSize: 20 }}>{money(total)}</Text>
        </View>
      </View>

      <PriceInput
        label="Ajustar total a cobrar (Descuento global opcional)"
        value={finalTotal === '' ? subtotal : finalTotal}
        onChange={setFinalTotal}
      />

      <PrimaryButton title={`Completar Venta · ${money(total)}`} color={t.green} onPress={confirm} disabled={!cart.length} />

      {cart.length > 0 && (
        <Tap
          onPress={() => {
            store.clearCart();
            onComplete?.();
          }}
          style={{ alignItems: 'center', padding: 14 }}
        >
          <Text style={{ color: t.red, fontSize: 15, fontWeight: '600' }}>Vaciar carrito</Text>
        </Tap>
      )}
    </ScrollView>
  );
}

export function CheckoutSheet({ visible, onClose, store }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Cobro y Venta" height={0.92}>
      <CheckoutForm store={store} onComplete={onClose} isDesktop={false} />
    </Sheet>
  );
}
