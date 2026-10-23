import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { Tap, Txt } from '../ui/kit';
import { THEMES } from '../sheets/TopMenu';

const NAV_ITEMS = [
  ['resumen', 'Resumen', 'pie-chart'],
  ['vender', 'Vender', 'cart'],
  ['inventario', 'Inventario', 'cube'],
  ['historial', 'Historial', 'time'],
];

export function DesktopSidebar({ tab, onChange, badge, store, onSignOut, onOpenSuppliers }) {
  const t = useTheme();

  return (
    <View
      style={{
        width: 250,
        backgroundColor: t.card,
        borderRightWidth: 1,
        borderColor: t.border,
        flexDirection: 'column',
        justifyContent: 'space-between',
        paddingVertical: 20,
        paddingHorizontal: 14,
      }}
    >
      {/* Cabecera / Identidad de la App */}
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, marginBottom: 26 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: t.blue,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <Ionicons name="storefront" size={20} color="#fff" />
          </View>
          <View>
            <Text style={{ color: t.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 }}>
              Sebas POS
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <View
                style={{
                  backgroundColor: t.card2,
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: 6,
                }}
              >
                <Txt style={{ color: t.blue, fontSize: 10, fontWeight: '800' }}>PWA • POS</Txt>
              </View>
            </View>
          </View>
        </View>

        {/* Lista de Navegación Vertical */}
        <View style={{ gap: 6 }}>
          {NAV_ITEMS.map(([id, label, icon]) => {
            const active = tab === id;
            return (
              <Tap key={id} onPress={() => onChange(id)} hapticKind="select">
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 11,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                    backgroundColor: active ? t.card2 : 'transparent',
                  }}
                >
                  <Ionicons
                    name={active ? icon : `${icon}-outline`}
                    size={20}
                    color={active ? t.blue : t.text2}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      color: active ? t.text : t.text2,
                      fontWeight: active ? '700' : '500',
                      fontSize: 15,
                    }}
                  >
                    {label}
                  </Text>
                  {id === 'vender' && badge > 0 && (
                    <View
                      style={{
                        backgroundColor: t.red,
                        borderRadius: 10,
                        minWidth: 20,
                        height: 20,
                        paddingHorizontal: 6,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Txt style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{badge}</Txt>
                    </View>
                  )}
                </View>
              </Tap>
            );
          })}
        </View>
      </View>

      {/* Pie de Barra Lateral: Proveedores, Tema y Cerrar Sesión */}
      <View style={{ borderTopWidth: 1, borderColor: t.border, paddingTop: 16 }}>
        {/* Botón de Proveedores */}
        <Tap onPress={onOpenSuppliers} hapticKind="select">
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              marginBottom: 8,
              backgroundColor: t.card2,
            }}
          >
            <Ionicons name="people-outline" size={18} color={t.blue} style={{ marginRight: 10 }} />
            <Text style={{ color: t.text, fontSize: 14, fontWeight: '600', flex: 1 }}>Proveedores</Text>
            <Txt style={{ color: t.text2, fontSize: 12 }}>{store.suppliers.length}</Txt>
          </View>
        </Tap>

        {/* Selector de Tema Visual */}
        <View style={{ marginBottom: 10 }}>
          <Txt style={{ color: t.text3, fontSize: 11, fontWeight: '700', marginBottom: 6, marginLeft: 4 }}>
            TEMA
          </Txt>
          <View style={{ flexDirection: 'row', gap: 4, backgroundColor: t.card2, padding: 3, borderRadius: 12 }}>
            {THEMES.map(([id, label, icon]) => (
              <Tap key={id} onPress={() => store.setThemeMode(id)} hapticKind="select" style={{ flex: 1 }}>
                <View
                  style={{
                    paddingVertical: 6,
                    borderRadius: 9,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: store.themeMode === id ? t.blue : 'transparent',
                  }}
                >
                  <Ionicons name={icon} size={12} color={store.themeMode === id ? '#fff' : t.text2} style={{ marginRight: 3 }} />
                  <Text
                    style={{
                      color: store.themeMode === id ? '#fff' : t.text2,
                      fontWeight: '600',
                      fontSize: 12,
                    }}
                  >
                    {label}
                  </Text>
                </View>
              </Tap>
            ))}
          </View>
        </View>

        {/* Cerrar Sesión */}
        {onSignOut ? (
          <Tap onPress={onSignOut} hapticKind="medium">
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 12,
              }}
            >
              <Ionicons name="log-out-outline" size={18} color={t.red} style={{ marginRight: 10 }} />
              <Text style={{ color: t.red, fontSize: 14, fontWeight: '600' }}>Cerrar sesión</Text>
            </View>
          </Tap>
        ) : null}
      </View>
    </View>
  );
}

