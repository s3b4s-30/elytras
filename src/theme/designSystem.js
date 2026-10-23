/**
 * src/theme/designSystem.js
 * Fuente única de verdad para tokens visuales Apple HIG, LiquidGlass, Modo Oscuro OLED,
 * Modo Claro Titanio y claves de persistencia local de sebas-pos.
 */

export const COLORS = {
  // Modo Oscuro OLED Puro & Superficies Elevadas
  oledBlack: '#000000',
  surfacePrimary: '#1C1C1E',
  surfaceSecondary: '#2C2C2E',
  surfaceTertiary: '#3A3A3C',

  // Modo Claro Titanio
  lightBackground: '#F2F2F7',
  lightSurface: '#FFFFFF',
  lightSecondary: '#E5E5EA',
  lightTertiary: '#D1D1D6',

  // Acento Principal Azul Eléctrico iOS (System Blue)
  electricBlue: '#0A84FF',
  electricBlueHover: '#409CFF',
  electricBlueSoft: 'rgba(10, 132, 255, 0.16)',

  // Estados Semánticos Apple HIG (System Green / Orange / Red)
  successGreen: '#30D158',
  successGreenSoft: 'rgba(48, 209, 88, 0.16)',
  warningAmber: '#FF9F0A',
  warningAmberSoft: 'rgba(255, 159, 10, 0.16)',
  dangerRed: '#FF453A',
  dangerRedSoft: 'rgba(255, 69, 58, 0.16)',

  // Escala Metálica Titanio
  titaniumPrimary: '#FFFFFF',
  titaniumSecondary: '#98989D',
  titaniumMuted: '#8E8E93',
  titaniumDark: '#636366',

  // Bordes Dinámicos por Tema (Nunca negros sólidos en Modo Claro)
  borderDarkSpecular: 'rgba(255, 255, 255, 0.10)', // border-white/10 en Modo OLED
  borderDarkStrong: 'rgba(255, 255, 255, 0.14)',
  borderLightSubtle: 'rgba(0, 0, 0, 0.08)', // border-black/10 suave / border-gray-200 en Modo Claro
  borderLightHairline: 'rgba(0, 0, 0, 0.06)',
  borderLightSolid: '#E5E7EB',

  // Tokens reactivos vinculados a CSS Variables según data-theme
  borderWhite10: 'var(--border-card)',
  borderWhite14: 'var(--border-specular)',
  borderLight: 'var(--border-hairline)',
};

export const LIQUID_GLASS = {
  backdropFilter: 'blur(24px) saturate(190%)',
  WebkitBackdropFilter: 'blur(24px) saturate(190%)',
  headerDarkBg: 'rgba(12, 12, 14, 0.90)',
  headerLightBg: 'rgba(242, 242, 247, 0.92)',
  cardDarkBg: 'rgba(28, 28, 30, 0.78)',
  cardLightBg: 'rgba(255, 255, 255, 0.92)',
  heavyDarkBg: 'rgba(18, 18, 20, 0.92)',
  heavyLightBg: 'rgba(245, 245, 250, 0.94)',
  borderSpecular: 'var(--border-card)',
  shadowOledCard:
    '0 18px 40px -8px rgba(0, 0, 0, 0.85), 0 4px 12px rgba(0, 0, 0, 0.60), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
  shadowLightCard:
    '0 8px 24px -6px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
  shadowOledFloating:
    '0 24px 52px -8px rgba(0, 0, 0, 0.92), 0 0 0 1px rgba(255, 255, 255, 0.10)',
  shadowLightFloating:
    '0 16px 36px -8px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.06)',
  style: {
    backdropFilter: 'blur(24px) saturate(190%)',
    WebkitBackdropFilter: 'blur(24px) saturate(190%)',
  },
};

export const SQUIRCLES = {
  sm: '12px',
  md: '16px', // rounded-2xl
  lg: '20px',
  xl: '24px', // rounded-3xl
  tabbar: '28px',
  pill: '9999px',
  classes: {
    card: 'rounded-3xl',
    control: 'rounded-2xl',
    badge: 'rounded-full',
    tabbar: 'rounded-[28px]',
  },
};

export const TYPOGRAPHY = {
  fontSans:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro Rounded", "Inter", system-ui, sans-serif',
  fontMonoCOP:
    '"SF Pro Rounded", -apple-system, BlinkMacSystemFont, ui-monospace, monospace',
  largeTitleClass: 'ios-large-title',
  copClass: 'cop-mono',
};

export const SAFE_AREAS = {
  top: 'env(safe-area-inset-top)',
  bottom: 'env(safe-area-inset-bottom)',
  left: 'env(safe-area-inset-left)',
  right: 'env(safe-area-inset-right)',
  rootStyle: {
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  tabbarFloatingStyle: {
    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
    paddingLeft: 'max(16px, calc(env(safe-area-inset-left, 0px) + 16px))',
    paddingRight: 'max(16px, calc(env(safe-area-inset-right, 0px) + 16px))',
  },
};

export const STORAGE_KEYS = {
  THEME: 'sebas_pos_theme',
  LAST_SUPPLIER: 'sebas_pos_last_supplier',
  SUPPLIERS: 'sebas_pos_suppliers_v1',
  PRODUCTS: 'sebas_pos_products_v1',
  SALES: 'sebas_pos_sales_v1',
  CLOSURES: 'sebas_pos_closures_v1',
  CART: 'sebas_pos_cart_v1',
};

/**
 * Clases de interfaz estandarizadas con bordes dinámicos por tema (.hig-border)
 * En Modo Claro usa border-black/10 / border-gray-200; en Modo Oscuro OLED usa border-white/10.
 */
export const UI_CLASSES = {
  stickyHeader:
    'unified-sticky-header fixed top-0 left-0 right-0 z-40 backdrop-blur-[28px] saturate-[195%] bg-[var(--bg-glass-heavy)] border-b border-[var(--border-hairline)]',
  card: 'hig-card hig-border rounded-3xl p-5',
  cardInteractive:
    'hig-card hig-card-interactive hig-border rounded-3xl p-5 cursor-pointer',
  cardCompact: 'hig-card hig-border rounded-2xl p-4',
  divider: 'hig-divider',
  glassFloating: 'liquid-glass-heavy hig-border',
  headerIconBtn:
    'liquid-glass hig-border flex items-center justify-center w-11 h-11 rounded-full transition-transform active:scale-[0.97] cursor-pointer',
  fabIconOnly:
    'fab-icon-only rounded-full flex items-center justify-center cursor-pointer',
  input: 'hig-input rounded-2xl w-full',
  primaryButton: 'btn-electric rounded-2xl font-bold cursor-pointer',
  copAmount: 'cop-mono',
  largeTitle: 'ios-large-title',
  viewStack: 'view-body-container pt-36 space-y-6 pb-28',
  catalogGrid: 'grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1',
};

export const DESIGN_SYSTEM = {
  COLORS,
  LIQUID_GLASS,
  SQUIRCLES,
  TYPOGRAPHY,
  SAFE_AREAS,
  STORAGE_KEYS,
  UI_CLASSES,
};

export default DESIGN_SYSTEM;
