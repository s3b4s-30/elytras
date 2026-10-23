import React, { useState } from 'react';
import { FlatList, View, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { Card, Tap, Txt, money } from '../ui/kit';
import { getWarrantyStatus } from '../domain/formatters';

export function HistorialScreen({ store, headerRight, isDesktop, onGoToPOS }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [open, setOpen] = useState(null);

  const columns = isDesktop ? (width >= 1100 ? 2 : 1) : 1;

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
        <Text style={{ flex: 1, color: t.text, fontSize: 28, fontWeight: '800' }}>Historial</Text>
        {!isDesktop ? headerRight : null}
      </View>
      <FlatList
        key={`hist-grid-${columns}`}
        data={store.sales}
        numColumns={columns}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{
          paddingHorizontal: isDesktop ? 10 : 0,
          paddingBottom: isDesktop ? 40 : 85,
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Ionicons name="time-outline" size={44} color={t.text3} />
            <Txt style={{ color: t.text2, marginTop: 12 }}>Sin ventas registradas en el historial</Txt>
          </View>
        }
        renderItem={({ item: s }) => {
          const isOpen = open === s.id;
          return (
            <Tap onPress={() => setOpen(isOpen ? null : s.id)} hapticKind="select" style={isDesktop ? { flex: 1 } : null}>
              <Card
                style={{
                  padding: 14,
                  marginHorizontal: isDesktop ? 6 : 16,
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>
                      #{s.saleNumber} · {s.customerName}
                    </Text>
                    <Txt style={{ color: t.text2, fontSize: 13, marginTop: 3 }}>
                      {new Date(s.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} · {s.paymentMethod}
                    </Txt>
                  </View>
                  <Txt style={{ fontWeight: '800', fontSize: 18 }}>{money(s.totalAmount)}</Txt>
                </View>
                {isOpen &&
                  s.items.map((it) => {
                    const w = getWarrantyStatus(s.createdAt, it.warrantyDays, it.warrantyClaimed);
                    return (
                      <View key={it.id} style={{ marginTop: 12, borderTopWidth: 0.5, borderTopColor: t.hairline, paddingTop: 10 }}>
                        <Text style={{ color: t.text, fontWeight: '600' }}>
                          {it.qty}× {it.productName}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                          <View style={{ backgroundColor: w.badgeBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                            <Text style={{ color: w.badgeColor, fontSize: 12, fontWeight: '700' }}>{w.label}</Text>
                          </View>
                          <View style={{ flex: 1 }} />
                          <Tap onPress={() => store.toggleItemWarranty(s.id, it.id)} hapticKind="medium">
                            <Text style={{ color: t.orange, fontWeight: '600' }}>
                              {it.warrantyClaimed ? 'Revertir garantía' : 'Reclamar garantía'}
                            </Text>
                          </Tap>
                        </View>
                        {it.warrantyClaimNote ? (
                          <Text style={{ color: t.text2, fontSize: 12, marginTop: 4 }}>
                            Nota: {it.warrantyClaimNote}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })}
              </Card>
            </Tap>
          );
        }}
      />

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
    </View>
  );
}
