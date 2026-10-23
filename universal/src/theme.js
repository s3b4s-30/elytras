/**
 * Tokens iOS 26 (Liquid Glass) para la app universal.
 * Capas: #000 OLED > #1C1C1E tarjetas > #2C2C2E contenedores secundarios.
 */
import { Platform } from 'react-native';

export const DARK = {
  bg: '#000000',
  card: '#1C1C1E',
  card2: '#2C2C2E',
  glass: 'rgba(28,28,30,0.55)',
  border: 'rgba(255,255,255,0.12)',
  hairline: 'rgba(255,255,255,0.08)',
  text: '#FFFFFF',
  text2: 'rgba(235,235,245,0.62)',
  text3: 'rgba(235,235,245,0.32)',
  blue: '#0A84FF',
  green: '#30D158',
  red: '#FF453A',
  orange: '#FF9F0A',
  tint: 'dark',
};

export const LIGHT = {
  bg: '#F2F2F7',
  card: '#FFFFFF',
  card2: '#E5E5EA',
  glass: 'rgba(255,255,255,0.6)',
  border: 'rgba(0,0,0,0.10)',
  hairline: 'rgba(60,60,67,0.12)',
  text: '#000000',
  text2: 'rgba(60,60,67,0.68)',
  text3: 'rgba(60,60,67,0.3)',
  blue: '#007AFF',
  green: '#34C759',
  red: '#FF3B30',
  orange: '#FF9500',
  tint: 'light',
};

export const TABULAR = { fontVariant: ['tabular-nums'] };

export const SPRING = { damping: 18, stiffness: 260, mass: 0.8 };

export const webGlass = (blur = 24) =>
  Platform.OS === 'web'
    ? { backdropFilter: `blur(${blur}px) saturate(190%)`, WebkitBackdropFilter: `blur(${blur}px) saturate(190%)` }
    : {};

