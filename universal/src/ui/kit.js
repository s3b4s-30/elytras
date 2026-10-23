import React, { useRef, useEffect, useState } from 'react';
import {
  Animated,
  Pressable,
  View,
  Text,
  TextInput,
  Modal,
  PanResponder,
  Platform,
  useWindowDimensions,
  KeyboardAvoidingView,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../ThemeContext';
import { TABULAR, webGlass } from '../theme';
import { formatPriceInput, parsePriceInput } from '../domain/formatters';

export const haptic = (kind = 'light') => {
  if (Platform.OS !== 'ios') return;
  if (kind === 'success') return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  if (kind === 'warn') return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  if (kind === 'select') return Haptics.selectionAsync();
  Haptics.impactAsync(
    kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
  );
};

/** Botón con compresión elástica (scale 0.97) y háptica opcional. */
export function Tap({ onPress, style, children, hapticKind = 'light', disabled, hitSlop = 6 }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v) =>
    Animated.spring(s, { toValue: v, useNativeDriver: true, damping: 14, stiffness: 320, mass: 0.6 }).start();
  return (
    <Pressable
      style={style && style.flex ? { flex: style.flex } : undefined}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => to(0.97)}
      onPressOut={() => to(1)}
      onPress={() => {
        if (hapticKind) haptic(hapticKind);
        onPress && onPress();
      }}
    >
      <Animated.View style={[{ transform: [{ scale: s }], opacity: disabled ? 0.4 : 1 }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

/** Capa Liquid Glass: BlurView nativo en iOS/Android; backdrop-filter en Web. */
export function Glass({ style, children, intensity = 60, radius = 0 }) {
  const t = useTheme();
  return (
    <View
      style={[
        { borderRadius: radius, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
        style,
      ]}
    >
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: t.glass }, webGlass(24)]} />
      ) : (
        <BlurView tint={t.tint} intensity={intensity} style={StyleSheet.absoluteFill} />
      )}
      {children}
    </View>
  );
}

export const Card = ({ style, children }) => {
  const t = useTheme();
  return (
    <View
      style={[
        { backgroundColor: t.card, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export const Txt = ({ style, children, ...p }) => {
  const t = useTheme();
  return (
    <Text style={[{ color: t.text, fontSize: 15 }, TABULAR, style]} {...p}>
      {children}
    </Text>
  );
};

export const Dot = ({ color, size = 8 }) => (
  <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color }} />
);

export function Chip({ label, active, onPress, color }) {
  const t = useTheme();
  const c = color || t.blue;
  return (
    <Tap onPress={onPress} hapticKind="select" style={{ marginRight: 8 }}>
      <View
        style={{
          paddingHorizontal: 14,
          minHeight: 36,
          justifyContent: 'center',
          borderRadius: 18,
          backgroundColor: active ? c : t.card2,
        }}
      >
        <Text numberOfLines={1} style={{ color: active ? '#fff' : t.text, fontWeight: '600', fontSize: 14 }}>
          {label}
        </Text>
      </View>
    </Tap>
  );
}

/** Carrusel horizontal sin cortes: padding vertical y altura intrínseca. */
export function ChipRow({ items, value, onChange }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' }}
      style={{ flexGrow: 0 }}
    >
      {items.map((it) => (
        <Chip key={it} label={it} active={value === it} onPress={() => onChange(it)} />
      ))}
    </ScrollView>
  );
}

export function Field({ label, style, ...props }) {
  const t = useTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={{ color: t.text2, fontSize: 12, marginBottom: 6, marginLeft: 4 }}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={t.text3}
        {...props}
        style={[
          {
            backgroundColor: t.card2,
            color: t.text,
            borderRadius: 14,
            paddingHorizontal: 14,
            minHeight: 48,
            fontSize: 16,
          },
          TABULAR,
          style,
        ]}
      />
    </View>
  );
}

/** Input de precio con formato en vivo ($50,000); onChange recibe el número limpio ('' si vacío). */
export function PriceInput({ label, value, onChange, placeholder = '$0' }) {
  return (
    <Field
      label={label}
      keyboardType="number-pad"
      value={formatPriceInput(value)}
      placeholder={placeholder}
      onChangeText={(txt) => onChange(parsePriceInput(txt))}
    />
  );
}

export function PrimaryButton({ title, onPress, color, disabled, style }) {
  const t = useTheme();
  return (
    <Tap onPress={onPress} disabled={disabled} hapticKind="medium">
      <View
        style={[
          {
            backgroundColor: color || t.blue,
            minHeight: 50,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}
      >
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>{title}</Text>
      </View>
    </Tap>
  );
}

export function BackButton({ onPress, label }) {
  const t = useTheme();
  return (
    <Tap onPress={onPress} hapticKind="light" style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: t.card2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="chevron-back" size={18} color={t.blue} style={{ marginLeft: -1 }} />
      </View>
      {label ? (
        <Text style={{ color: t.blue, fontSize: 15, fontWeight: '600', marginLeft: 4 }}>{label}</Text>
      ) : null}
    </Tap>
  );
}

/**
 * Bottom Sheet nativo: emerge con resorte, Grabber superior, arrastre para cerrar,
 * gesto edge-swipe horizontal natural inmune al scroll vertical y backdrop táctil.
 */
export function Sheet({ visible, onClose, children, height = 0.85, title, left }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const sheetW = Math.min(W, 640); // en escritorio el sheet queda centrado y acotado
  const sheetH = Math.round(H * height);
  const y = useRef(new Animated.Value(sheetH)).current;
  const x = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      x.setValue(0);
      Animated.parallel([
        Animated.spring(y, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220, mass: 0.9 }),
        Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(y, { toValue: sheetH, duration: 220, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  // Gestos: swipe horizontal natural (edge swipe) inmune al scroll vertical + drag vertical desde cabecera
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => {
        // Gesto horizontal: debe ser predominantemente horizontal (dx > dy * 2.2) y hacia la derecha (> 14px)
        if (g.dx > 14 && g.dx > Math.abs(g.dy) * 2.2) return true;
        // Gesto vertical hacia abajo (arrastre de cabecera)
        if (g.dy > 8 && g.dy > Math.abs(g.dx) * 1.8) return true;
        return false;
      },
      onPanResponderMove: (_, g) => {
        if (g.dx > 10 && g.dx > Math.abs(g.dy) * 1.8) {
          x.setValue(Math.max(0, g.dx));
        } else if (g.dy > 0) {
          y.setValue(g.dy);
        }
      },
      onPanResponderRelease: (_, g) => {
        const swipedHorizontal = g.dx > 85 || (g.dx > 35 && g.vx > 0.65);
        const draggedVertical = g.dy > 120 || g.vy > 1;
        if (swipedHorizontal || draggedVertical) {
          onClose();
        } else {
          Animated.parallel([
            Animated.spring(y, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 240 }),
            Animated.spring(x, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 240 }),
          ]).start();
        }
      },
    })
  ).current;

  if (!mounted) return null;
  const backBtn = left === undefined ? <BackButton onPress={onClose} /> : left;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: fade }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: sheetW }}>
          <Animated.View
            {...pan.panHandlers}
            style={{
              height: sheetH,
              transform: [{ translateY: y }, { translateX: x }],
              backgroundColor: t.card,
              borderTopLeftRadius: 34,
              borderTopRightRadius: 34,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: t.border,
              overflow: 'hidden',
            }}
          >
            <View style={{ paddingTop: 8 }}>
              <View
                style={{ alignSelf: 'center', width: 38, height: 5, borderRadius: 3, backgroundColor: t.text3 }}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, minHeight: 48 }}>
                <View style={{ minWidth: 44, alignItems: 'flex-start' }}>{backBtn}</View>
                <Text
                  numberOfLines={1}
                  style={{ flex: 1, textAlign: 'center', color: t.text, fontSize: 17, fontWeight: '700' }}
                >
                  {title}
                </Text>
                <View style={{ minWidth: 44 }} />
              </View>
            </View>
            <View style={{ flex: 1, paddingBottom: insets.bottom }}>{children}</View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/** Aparición suave (fade + leve ascenso) para cambios de pantalla. */
export function FadeIn({ children, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: 1, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
  }, []);
  return (
    <Animated.View
      style={[
        { flex: 1, opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

export const money = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-CO')}`;
