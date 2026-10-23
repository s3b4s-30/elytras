import React, { useMemo, useState } from 'react';
import { FlatList, View, Text, Alert, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { SearchHeader, ProductCard } from '../ui/ProductList';
import { Tap, PrimaryButton, Txt } from '../ui/kit';

const confirmAsync = (title, buttons) => {
  if (Platform.OS === 'web') {
    const ok = typeof window !== 'undefined' && window.confirm(title);
    if (ok) buttons.find((b) => b.style === 'destructive')?.onPress?.();
    return;
  }
  Alert.alert(title, undefined, buttons);
};
export { confirmAsync };

const ActionBtn = ({ icon, label, onPress, color, isDesktop }) => {
  const t = useTheme();
  return (
    <Tap onPress={onPress} style={{ marginLeft: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 38,
          paddingHorizontal: isDesktop ? 12 : 10,
          borderRadius: 19,
          backgroundColor: t.card2,
        }}
      >
        <Ionicons name={icon} size={18} color={color || t.blue} />
        {isDesktop && label ? (
          <Text style={{ color: color || t.text, fontSize: 13, fontWeight: '600', marginLeft: 6 }}>
            {label}
          </Text>
        ) : null}
      </View>
    </Tap>
  );
};

export function InventarioScreen({ store, onOpen, onCreate, headerRight, isDesktop, onGoToPOS }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [showCosts, setShowCosts] = useState(false);

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

  const clean = () =>
    confirmAsync('Limpiar inventario', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar agotados', onPress: () => store.clearInventory('out_of_stock') },
      { text: 'Vaciar todo', style: 'destructive', onPress: () => store.clearInventory('all') },
    ]);

  const columns = isDesktop ? (width >= 1200 ? 3 : 2) : 1;

  return (
    <View style={{ flex: 1 }}>
      <SearchHeader
        title="Inventario"
        safeTop={isDesktop ? 12 : insets.top}
        query={query}
        onQuery={setQuery}
        categories={categories}
        category={category}
        onCategory={setCategory}
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActionBtn
              icon={showCosts ? 'eye' : 'eye-off'}
              label={showCosts ? 'Costos activos' : 'Ver costos'}
              onPress={() => setShowCosts((v) => !v)}
              isDesktop={isDesktop}
            />
            <ActionBtn
              icon="trash-outline"
              label="Limpiar"
              color={t.red}
              onPress={clean}
              isDesktop={isDesktop}
            />
            <ActionBtn
              icon="add"
              label="Nuevo producto"
              onPress={onCreate}
              isDesktop={isDesktop}
            />
            {!isDesktop ? headerRight : null}
          </View>
        }
      />
      <FlatList
        key={`inv-grid-${columns}`}
        data={list}
        numColumns={columns}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{
          paddingTop: 12,
          paddingHorizontal: isDesktop ? 10 : 0,
          paddingBottom: isDesktop ? 40 : 85,
        }}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            suppliers={store.suppliers}
            showCost={showCosts}
            onPress={() => onOpen(item.id)}
            cardStyle={isDesktop ? { marginHorizontal: 6, marginBottom: 12 } : null}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Ionicons name="cube-outline" size={44} color={t.text3} />
            <Txt style={{ color: t.text2, marginVertical: 12 }}>Sin productos en el catálogo</Txt>
            <PrimaryButton
              title="Restaurar catálogo base"
              onPress={store.restoreSeedProducts}
              style={{ paddingHorizontal: 24 }}
            />
          </View>
        }
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
