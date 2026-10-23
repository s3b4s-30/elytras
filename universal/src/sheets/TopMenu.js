import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../ThemeContext';
import { Tap, Glass, Txt, Sheet, Field, PrimaryButton, Dot, haptic } from '../ui/kit';
import { SUPPLIER_COLORS } from '../domain/formatters';
import { confirmAsync } from '../screens/InventarioScreen';

export const THEMES = [
  ['system', 'Auto', 'contrast-outline'],
  ['light', 'Claro', 'sunny-outline'],
  ['dark', 'Oscuro', 'moon-outline'],
];

export function SuppliersSheet({ visible, onClose, store }) {
  const t = useTheme();
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [color, setColor] = useState(SUPPLIER_COLORS[0].hex);

  const resetForm = () => {
    setEditingSupplier(null);
    setName('');
    setContact('');
    setColor(SUPPLIER_COLORS[0].hex);
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  const startEdit = (s) => {
    setEditingSupplier(s);
    setName(s.name);
    setContact(s.contact || '');
    setColor(s.color || SUPPLIER_COLORS[0].hex);
    haptic('select');
  };

  const save = () => {
    if (!name.trim()) return;
    if (editingSupplier) {
      store.saveSupplier({
        ...editingSupplier,
        name: name.trim(),
        contact: contact.trim(),
        color,
      });
      haptic('success');
      resetForm();
    } else {
      store.saveSupplier({
        id: `sup-${Date.now()}`,
        name: name.trim(),
        contact: contact.trim(),
        location: '',
        notes: '',
        color,
      });
      haptic('success');
      resetForm();
    }
  };

  return (
    <Sheet visible={visible} onClose={handleClose} title="Gestión de Proveedores" height={0.9}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ color: t.text2, fontSize: 13, fontWeight: '700' }}>
            PROVEEDORES REGISTRADOS ({store.suppliers.length})
          </Text>
          {editingSupplier ? (
            <Tap onPress={resetForm} hapticKind="light">
              <View style={{ backgroundColor: t.card2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                <Txt style={{ color: t.blue, fontSize: 11, fontWeight: '700' }}>+ Nuevo proveedor</Txt>
              </View>
            </Tap>
          ) : null}
        </View>

        {store.suppliers.map((s) => {
          const isSelectedForEdit = editingSupplier?.id === s.id;
          return (
            <View
              key={s.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 14,
                marginBottom: 8,
                backgroundColor: isSelectedForEdit ? t.card2 : 'transparent',
                borderWidth: isSelectedForEdit ? 1.5 : 0.5,
                borderColor: isSelectedForEdit ? t.blue : t.hairline,
              }}
            >
              <Dot color={s.color} size={14} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>{s.name}</Text>
                  {isSelectedForEdit && (
                    <View style={{ backgroundColor: t.blue, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                      <Txt style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>Editando</Txt>
                    </View>
                  )}
                </View>
                {s.contact ? <Txt style={{ color: t.text2, fontSize: 13, marginTop: 2 }}>{s.contact}</Txt> : null}
              </View>

              {/* Botón Editar Proveedor */}
              <Tap onPress={() => startEdit(s)} hapticKind="select">
                <View
                  style={{
                    padding: 8,
                    borderRadius: 10,
                    backgroundColor: isSelectedForEdit ? t.blue : t.card2,
                    marginRight: 6,
                  }}
                >
                  <Ionicons
                    name="pencil-outline"
                    size={17}
                    color={isSelectedForEdit ? '#fff' : t.blue}
                  />
                </View>
              </Tap>

              {/* Botón Eliminar Proveedor */}
              <Tap
                onPress={() =>
                  confirmAsync(`¿Eliminar proveedor ${s.name}?`, [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Eliminar',
                      style: 'destructive',
                      onPress: () => {
                        haptic('warn');
                        if (editingSupplier?.id === s.id) resetForm();
                        store.deleteSupplier(s.id);
                      },
                    },
                  ])
                }
              >
                <View style={{ padding: 8, borderRadius: 10, backgroundColor: t.card2 }}>
                  <Ionicons name="trash-outline" size={17} color={t.red} />
                </View>
              </Tap>
            </View>
          );
        })}

        <View style={{ height: 20 }} />

        {/* Formulario Dinámico: Agregar o Editar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ color: t.text2, fontSize: 13, fontWeight: '700' }}>
            {editingSupplier ? `EDITAR PROVEEDOR: ${editingSupplier.name.toUpperCase()}` : 'AGREGAR NUEVO PROVEEDOR'}
          </Text>
          {editingSupplier && (
            <Tap onPress={resetForm} hapticKind="light">
              <Txt style={{ color: t.orange, fontSize: 12, fontWeight: '600' }}>Cancelar edición</Txt>
            </Tap>
          )}
        </View>

        <Field
          label="Nombre del proveedor"
          value={name}
          onChangeText={setName}
          placeholder="Ej. Mayorista Monterrey"
        />
        <Field
          label="Contacto / Teléfono"
          value={contact}
          onChangeText={setContact}
          placeholder="+57 300 000 0000"
          keyboardType="phone-pad"
        />

        {/* Paleta de 14 colores Apple HIG para proveedores */}
        <Text style={{ color: t.text2, fontSize: 12, marginBottom: 8, marginLeft: 4 }}>
          Color de identificación
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          {SUPPLIER_COLORS.map((c) => (
            <Tap key={c.id} onPress={() => setColor(c.hex)} hapticKind="select">
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: c.hex,
                  borderWidth: color === c.hex ? 3 : 0,
                  borderColor: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {color === c.hex && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
            </Tap>
          ))}
        </View>

        {editingSupplier ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Tap onPress={resetForm} style={{ flex: 1 }}>
              <View
                style={{
                  minHeight: 50,
                  borderRadius: 16,
                  backgroundColor: t.card2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: t.border,
                }}
              >
                <Text style={{ color: t.text2, fontSize: 16, fontWeight: '600' }}>Cancelar</Text>
              </View>
            </Tap>
            <View style={{ flex: 1.6 }}>
              <PrimaryButton
                title="Guardar Cambios"
                onPress={save}
                disabled={!name.trim()}
              />
            </View>
          </View>
        ) : (
          <PrimaryButton title="Guardar Proveedor" onPress={save} disabled={!name.trim()} />
        )}
      </ScrollView>
    </Sheet>
  );
}

/**
 * Menú de tres puntos (⋯): Abre una ventana flotante (popover / modal)
 * con opciones de Sesión / Cerrar sesión, selector de Tema y gestión de proveedores.
 */
export function TopMenu({ store, onSignOut }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [sup, setSup] = useState(false);

  const handleSignOut = () => {
    setOpen(false);
    confirmAsync('¿Deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: () => onSignOut?.(),
      },
    ]);
  };

  return (
    <>
      <Tap onPress={() => setOpen(true)} style={{ marginLeft: 8 }} hapticKind="select">
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: t.card2,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.border,
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={t.blue} />
        </View>
      </Tap>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={() => setOpen(false)}>
          <View
            style={{
              position: 'absolute',
              top: insets.top + 54,
              right: 16,
              width: 270,
              borderRadius: 22,
              overflow: 'hidden',
              backgroundColor: t.card,
              borderWidth: 1,
              borderColor: t.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              padding: 10,
            }}
          >
            {/* Cabecera del Popover */}
            <View style={{ paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: t.hairline }}>
              <Text style={{ color: t.text, fontWeight: '800', fontSize: 16 }}>Configuración</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Dot color={t.green} size={8} />
                <Txt style={{ color: t.text2, fontSize: 12, marginLeft: 6 }}>Sesión activa en tienda</Txt>
              </View>
            </View>

            {/* Selector de Tema */}
            <View style={{ paddingVertical: 10, paddingHorizontal: 6 }}>
              <Txt style={{ color: t.text2, fontSize: 12, fontWeight: '700', marginBottom: 8, marginLeft: 4 }}>
                APARIENCIA
              </Txt>
              <View style={{ flexDirection: 'row', gap: 6, backgroundColor: t.card2, padding: 4, borderRadius: 12 }}>
                {THEMES.map(([id, label, icon]) => {
                  const active = store.themeMode === id;
                  return (
                    <Tap key={id} onPress={() => store.setThemeMode(id)} hapticKind="select" style={{ flex: 1 }}>
                      <View
                        style={{
                          minHeight: 34,
                          borderRadius: 9,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: active ? t.blue : 'transparent',
                        }}
                      >
                        <Ionicons name={icon} size={14} color={active ? '#fff' : t.text2} style={{ marginRight: 4 }} />
                        <Text style={{ color: active ? '#fff' : t.text, fontWeight: '600', fontSize: 12 }}>
                          {label}
                        </Text>
                      </View>
                    </Tap>
                  );
                })}
              </View>
            </View>

            {/* Administrar Proveedores */}
            <Tap
              onPress={() => {
                setOpen(false);
                setTimeout(() => setSup(true), 200);
              }}
              hapticKind="select"
            >
              <View
                style={{
                  minHeight: 46,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: t.card2,
                  marginBottom: 6,
                }}
              >
                <Ionicons name="people-outline" size={19} color={t.blue} />
                <Text style={{ flex: 1, marginLeft: 10, fontWeight: '600', color: t.text, fontSize: 14 }}>
                  Proveedores
                </Text>
                <View style={{ backgroundColor: t.card, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Txt style={{ color: t.text2, fontSize: 12, fontWeight: '700' }}>{store.suppliers.length}</Txt>
                </View>
              </View>
            </Tap>

            {/* Cerrar sesión / Cambiar de cuenta */}
            {onSignOut ? (
              <Tap onPress={handleSignOut} hapticKind="medium">
                <View
                  style={{
                    minHeight: 46,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255,59,48,0.12)',
                  }}
                >
                  <Ionicons name="log-out-outline" size={19} color={t.red} />
                  <Text style={{ flex: 1, marginLeft: 10, fontWeight: '700', color: t.red, fontSize: 14 }}>
                    Cerrar sesión
                  </Text>
                </View>
              </Tap>
            ) : null}
          </View>
        </Pressable>
      </Modal>

      <SuppliersSheet visible={sup} onClose={() => setSup(false)} store={store} />
    </>
  );
}
