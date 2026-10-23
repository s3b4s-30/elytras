import React, { useMemo, useState } from 'react';
import { FlatList, View, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../ThemeContext';
import { SearchHeader, ProductCard } from '../ui/ProductList';
import { Glass, Tap, Txt, money } from '../ui/kit';
import { Ionicons } from '@expo/vector-icons';
import { CheckoutForm } from '../sheets/CheckoutSheet';

export function POSScreen({ store, onCheckout, headerRight, isDesktop }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');

  const categories = useMemo(
    () => ['Todos', ...new Set(store.products.map((p) => p.category))],
    [store.products]
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.products.filter(
      (p) =>
        (category === 'Todos' || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || (p.specs || []).join(' ').toLowerCase().includes(q))
    );
  }, [store.products, query, category]);

  const total = store.cart.reduce((a, i) => a + i.qty * i.unitPriceCharged, 0);

  // Cantidad dinámica de columnas en catálogo para aprovechar espacio horizontal
  const columns = isDesktop ? (width >= 1200 ? 3 : 2) : 1;
  const rightPanelWidth = isDesktop ? (width >= 1200 ? 420 : 380) : 0;

  const catalogView = (
    <View style={{ flex: 1 }}>
      <SearchHeader
        title={isDesktop ? 'Catálogo de Venta' : 'Vender'}
        safeTop={isDesktop ? 12 : insets.top}
        query={query}
        onQuery={setQuery}
        categories={categories}
        category={category}
        onCategory={setCategory}
        right={!isDesktop ? headerRight : null}
      />
      <FlatList
        key={`pos-grid-${columns}`}
        data={list}
        numColumns={columns}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{
          paddingTop: 12,
          paddingHorizontal: isDesktop ? 12 : 0,
          paddingBottom: isDesktop ? 40 : store.totalCartUnits > 0 ? 145 : 85,
        }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const inCart = store.cart.find((i) => i.productId === item.id)?.qty || 0;
          return (
            <ProductCard
              product={item}
              suppliers={store.suppliers}
              onPress={() => store.addToCart(item)}
              cardStyle={isDesktop ? { marginHorizontal: 6, marginBottom: 12 } : null}
              right={
                inCart ? (
                  <View
                    style={{
                      marginTop: 6,
                      backgroundColor: t.blue,
                      borderRadius: 11,
                      minWidth: 24,
                      height: 24,
                      paddingHorizontal: 7,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Txt style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{inCart}</Txt>
                  </View>
                ) : (
                  <View
                    style={{
                      marginTop: 6,
                      backgroundColor: t.card2,
                      borderRadius: 10,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                    }}
                  >
                    <Txt style={{ color: t.blue, fontSize: 11, fontWeight: '700' }}>+ Agregar</Txt>
                  </View>
                )
              }
            />
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 50 }}>
            <Ionicons name="search-outline" size={42} color={t.text3} />
            <Txt style={{ color: t.text2, marginTop: 12 }}>No se encontraron productos en el catálogo</Txt>
          </View>
        }
      />

      {/* Botón flotante móvil para abrir el CheckoutSheet */}
      {!isDesktop && store.totalCartUnits > 0 && (
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 76 }}>
          <Tap onPress={onCheckout} hapticKind="medium">
            <Glass radius={24} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: t.border }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: t.blue,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="bag" size={19} color="#fff" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Txt style={{ fontWeight: '700', fontSize: 15 }}>
                  {store.totalCartUnits} {store.totalCartUnits === 1 ? 'producto' : 'productos'}
                </Txt>
                <Txt style={{ color: t.text2, fontSize: 12 }}>Toca para cobrar o ajustar precios</Txt>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Txt style={{ fontWeight: '800', fontSize: 19, color: t.green }}>{money(total)}</Txt>
                <Txt style={{ color: t.blue, fontSize: 12, fontWeight: '700' }}>Cobrar →</Txt>
              </View>
            </Glass>
          </Tap>
        </View>
      )}
    </View>
  );

  // En escritorio dividimos en 2 columnas: Catálogo + Panel de Cobro
  if (isDesktop) {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {catalogView}
        <View
          style={{
            width: rightPanelWidth,
            borderLeftWidth: 1,
            borderColor: t.border,
            backgroundColor: t.card,
          }}
        >
          {/* Cabecera del panel de venta en escritorio */}
          <View
            style={{
              paddingTop: 16,
              paddingBottom: 14,
              paddingHorizontal: 18,
              borderBottomWidth: 1,
              borderColor: t.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="receipt-outline" size={20} color={t.blue} style={{ marginRight: 8 }} />
              <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>Venta Actual</Text>
            </View>
            {store.totalCartUnits > 0 && (
              <View
                style={{
                  backgroundColor: t.blue,
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Txt style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>
                  {store.totalCartUnits} {store.totalCartUnits === 1 ? 'ítem' : 'ítems'}
                </Txt>
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <CheckoutForm store={store} isDesktop={true} />
          </View>
        </View>
      </View>
    );
  }

  // Vista móvil de 1 columna
  return catalogView;
}
