import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { Glass, ChipRow, Tap, Dot, Card, Txt, money } from './kit';

/** Cabecera Liquid Glass fija (fuera del scroll => nunca se corta ni se despega). */
export function SearchHeader({ title, query, onQuery, categories, category, onCategory, right, safeTop }) {
  const t = useTheme();
  return (
    <Glass style={{ paddingTop: safeTop, borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, minHeight: 48 }}>
        <Text style={{ flex: 1, color: t.text, fontSize: 28, fontWeight: '800' }}>{title}</Text>
        {right}
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 16,
          paddingHorizontal: 12,
          backgroundColor: t.card2,
          borderRadius: 14,
          minHeight: 44,
        }}
      >
        <Ionicons name="search" size={18} color={t.text2} />
        <TextInput
          value={query}
          onChangeText={onQuery}
          placeholder="Buscar"
          placeholderTextColor={t.text3}
          style={{ flex: 1, color: t.text, fontSize: 16, marginLeft: 8, paddingVertical: 10 }}
        />
        {query ? (
          <Tap onPress={() => onQuery('')} hapticKind={null}>
            <Ionicons name="close-circle" size={18} color={t.text3} />
          </Tap>
        ) : null}
      </View>
      <ChipRow items={categories} value={category} onChange={onCategory} />
    </Glass>
  );
}

const stockColor = (t, n) => (n <= 0 ? t.red : n <= 5 ? t.orange : t.green);

export function ProductCard({ product, suppliers, onPress, showCost, right, style, cardStyle }) {
  const t = useTheme();
  const dots = [
    ...new Set((product.batches || []).filter((b) => b.qty > 0).map((b) => b.supplierId)),
  ]
    .map((id) => suppliers.find((s) => s.id === id))
    .filter(Boolean);
  return (
    <Tap onPress={onPress} hapticKind="light" style={[{ flex: 1 }, style]}>
      <Card style={[{ padding: 14, marginHorizontal: 16, marginBottom: 10 }, cardStyle]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text numberOfLines={2} style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>
              {product.name}
            </Text>
            {product.specs && product.specs.length > 0 ? (
              <Text numberOfLines={1} style={{ color: t.text3, fontSize: 12, marginTop: 2 }}>
                {product.specs.slice(0, 2).join(' • ')}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
              <Txt style={{ color: stockColor(t, product.stock), fontWeight: '700', fontSize: 13 }}>
                {product.stock <= 0 ? 'Agotado' : `${product.stock} uds`}
              </Txt>
              <View style={{ flexDirection: 'row', marginLeft: 10, gap: 4, alignItems: 'center' }}>
                {dots.map((s) => (
                  <Dot key={s.id} color={s.color} />
                ))}
              </View>
              {showCost ? (
                <Txt style={{ color: t.text2, fontSize: 13, marginLeft: 10 }}>Costo {money(product.unitCost)}</Txt>
              ) : null}
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Txt style={{ fontWeight: '800', fontSize: 18 }}>{money(product.salePrice)}</Txt>
            {right}
          </View>
        </View>
      </Card>
    </Tap>
  );
}

