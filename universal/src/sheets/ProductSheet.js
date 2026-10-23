import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { Sheet, Tap, Txt, Field, PriceInput, PrimaryButton, Dot, Chip, money, haptic } from '../ui/kit';
import { confirmAsync } from '../screens/InventarioScreen';

export function SupplierChips({ suppliers, value, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
      {suppliers.map((s) => (
        <Chip
          key={s.id}
          label={s.name.split(' ').slice(0, 2).join(' ')}
          color={s.color}
          active={value === s.id}
          onPress={() => onChange(s.id)}
        />
      ))}
    </ScrollView>
  );
}

export function ProductSheet({ productId, onClose, store }) {
  const t = useTheme();
  const product = store.products.find((p) => p.id === productId);
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [showCosts, setShowCosts] = useState(false);

  useEffect(() => {
    if (product) {
      setPrice(product.salePrice);
      setSupplierId(store.lastSupplierId || store.suppliers[0]?.id || '');
      setQty('');
      setCost('');
      setShowCosts(false);
    }
  }, [productId]);

  if (!product) return <Sheet visible={false} onClose={onClose} />;
  const batches = (product.batches || []).filter((b) => b.qty > 0);

  // Edición directa y rápida de cantidades por lote sin pasar por el formulario completo
  const updateBatchQty = (batchId, nextQty) => {
    const clamped = Math.max(0, nextQty);
    const nextBatches = (product.batches || []).map((b) =>
      b.id === batchId ? { ...b, qty: clamped } : b
    );
    const nextStock = nextBatches.reduce((a, b) => a + (Number(b.qty) || 0), 0);
    store.updateProduct({ ...product, batches: nextBatches, stock: nextStock });
    haptic('light');
  };

  const addBatch = () => {
    const n = parseInt(qty, 10);
    if (!n || n <= 0 || cost === '') return;
    const s = store.suppliers.find((x) => x.id === supplierId);
    store.addStockBatch(product.id, {
      id: `lot-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      qty: n,
      unitCost: Number(cost),
      supplierId,
      supplierName: s?.name || '',
    });
    haptic('success');
    setQty('');
    setCost('');
    setShowCosts(false);
  };

  return (
    <Sheet visible={!!productId} onClose={onClose} title="Detalle de producto" height={0.92}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: t.text, fontSize: 21, fontWeight: '800', marginBottom: 4 }}>
          {product.name}
        </Text>
        <Txt style={{ color: t.blue, fontSize: 13, fontWeight: '600', marginBottom: 14 }}>
          {product.category}
        </Txt>

        {/* Ajuste rápido global de stock */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: t.card2,
            borderRadius: 18,
            padding: 14,
            marginBottom: 14,
          }}
        >
          <Tap onPress={() => store.adjustStock(product.id, -1)} hapticKind="medium">
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: t.card,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Txt style={{ fontSize: 28, color: t.red }}>−</Txt>
            </View>
          </Tap>
          <View style={{ alignItems: 'center' }}>
            <Txt style={{ fontSize: 34, fontWeight: '800' }}>{product.stock}</Txt>
            <Txt style={{ color: t.text2, fontSize: 12 }}>unidades en total</Txt>
          </View>
          <Tap onPress={() => store.adjustStock(product.id, 1)} hapticKind="medium">
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: t.card,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Txt style={{ fontSize: 28, color: t.green }}>+</Txt>
            </View>
          </Tap>
        </View>

        <PriceInput label="Precio de venta sugerido" value={price} onChange={setPrice} />
        <PrimaryButton
          title="Guardar nuevo precio"
          disabled={price === '' || price === product.salePrice}
          onPress={() => {
            store.updateProduct({ ...product, salePrice: Number(price) });
            haptic('success');
          }}
          style={{ marginBottom: 18 }}
        />

        {/* Sección de Lotes / Proveedores con edición rápida */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Txt style={{ fontWeight: '700', fontSize: 16 }}>Lotes por Proveedor</Txt>
          <Tap onPress={() => setShowCosts((v) => !v)} hapticKind="select">
            <Text style={{ color: t.blue, fontSize: 13, fontWeight: '600' }}>
              {showCosts ? 'Ocultar' : '+ Nuevo lote'}
            </Text>
          </Tap>
        </View>

        {batches.length === 0 ? (
          <View style={{ padding: 14, backgroundColor: t.card2, borderRadius: 14, alignItems: 'center', marginBottom: 10 }}>
            <Txt style={{ color: t.text2, fontSize: 13 }}>No hay lotes con existencias activas.</Txt>
          </View>
        ) : (
          batches.map((b) => {
            const s = store.suppliers.find((x) => x.id === b.supplierId);
            return (
              <View
                key={b.id}
                style={{
                  backgroundColor: t.card2,
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Dot color={s?.color || t.blue} size={10} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ color: t.text, fontWeight: '600', fontSize: 14 }}>
                      {b.supplierName || s?.name || 'Mayorista general'}
                    </Text>
                    <Txt style={{ color: t.text2, fontSize: 12 }}>Costo unitario: {money(b.unitCost)}</Txt>
                  </View>
                  {/* Stepper rápido directo para editar lote */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: t.card,
                      borderRadius: 12,
                      paddingHorizontal: 2,
                      paddingVertical: 2,
                    }}
                  >
                    <Tap onPress={() => updateBatchQty(b.id, b.qty - 1)} hapticKind="medium">
                      <Txt style={{ fontSize: 22, color: t.blue, paddingHorizontal: 10 }}>−</Txt>
                    </Tap>
                    <Txt style={{ fontWeight: '800', minWidth: 26, textAlign: 'center', fontSize: 15 }}>
                      {b.qty}
                    </Txt>
                    <Tap onPress={() => updateBatchQty(b.id, b.qty + 1)} hapticKind="medium">
                      <Txt style={{ fontSize: 22, color: t.blue, paddingHorizontal: 10 }}>+</Txt>
                    </Tap>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {/* Formulario colapsable para ingresar lote con nuevo costo */}
        {showCosts && (
          <View style={{ backgroundColor: t.card2, borderRadius: 16, padding: 14, marginTop: 6, marginBottom: 12 }}>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 14, marginBottom: 8 }}>
              Registrar nuevo lote
            </Text>
            <SupplierChips suppliers={store.suppliers} value={supplierId} onChange={setSupplierId} />
            <Field label="Cantidad a ingresar" keyboardType="number-pad" value={qty} onChangeText={setQty} placeholder="0" />
            <PriceInput label="Costo unitario del lote" value={cost} onChange={setCost} />
            <PrimaryButton title="Agregar lote al producto" color={t.green} onPress={addBatch} />
          </View>
        )}

        <View style={{ height: 20 }} />
        <PrimaryButton
          title="Eliminar producto del catálogo"
          color={t.red}
          onPress={() =>
            confirmAsync(`¿Eliminar ${product.name}?`, [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Eliminar',
                style: 'destructive',
                onPress: () => {
                  haptic('warn');
                  store.deleteProduct(product.id);
                  onClose();
                },
              },
            ])
          }
        />
      </ScrollView>
    </Sheet>
  );
}
