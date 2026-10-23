import React from 'react';
import { View, Text, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTheme } from '../ThemeContext';
import { Tap } from './kit';

const fmt = (d, withTime) =>
  d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) +
  (withTime ? ' ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '');

/** Selector de fecha estilo iOS (rueda en iPhone, diálogo en Android, input date en Web). La hora es opcional. */
export function DateField({ label, value, onChange, withTime = false }) {
  const t = useTheme();

  if (Platform.OS === 'web') {
    const iso = value.toISOString().slice(0, 10);
    return (
      <View style={{ flex: 1, marginBottom: 12 }}>
        <Text style={{ color: t.text2, fontSize: 12, marginBottom: 6, marginLeft: 4 }}>{label}</Text>
        {React.createElement('input', {
          type: withTime ? 'datetime-local' : 'date',
          value: withTime ? value.toISOString().slice(0, 16) : iso,
          onChange: (e) => e.target.value && onChange(new Date(e.target.value)),
          style: {
            background: t.card2,
            color: t.text,
            border: 'none',
            borderRadius: 14,
            padding: 12,
            fontSize: 16,
            colorScheme: t.tint,
          },
        })}
      </View>
    );
  }

  if (Platform.OS === 'android') {
    const open = () =>
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        onChange: (_, d) => d && onChange(d),
      });
    return (
      <View style={{ flex: 1, marginBottom: 12 }}>
        <Text style={{ color: t.text2, fontSize: 12, marginBottom: 6, marginLeft: 4 }}>{label}</Text>
        <Tap onPress={open}>
          <View style={{ backgroundColor: t.card2, borderRadius: 14, minHeight: 48, justifyContent: 'center', paddingHorizontal: 14 }}>
            <Text style={{ color: t.text, fontSize: 16 }}>{fmt(value, false)}</Text>
          </View>
        </Tap>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, marginBottom: 12 }}>
      <Text style={{ color: t.text2, fontSize: 12, marginLeft: 4 }}>{label}</Text>
      <DateTimePicker
        value={value}
        mode={withTime ? 'datetime' : 'date'}
        display="compact"
        themeVariant={t.tint}
        locale="es-CO"
        onChange={(_, d) => d && onChange(d)}
        style={{ alignSelf: 'flex-start', marginTop: 6 }}
      />
    </View>
  );
}

