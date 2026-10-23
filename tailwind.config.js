import { COLORS, LIQUID_GLASS, SQUIRCLES, SAFE_AREAS } from './src/theme/designSystem.js';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        oled: COLORS.oledBlack,
        surface: {
          primary: COLORS.surfacePrimary,
          secondary: COLORS.surfaceSecondary,
          tertiary: COLORS.surfaceTertiary,
          light: COLORS.lightSurface,
        },
        titanium: {
          primary: COLORS.titaniumPrimary,
          secondary: COLORS.titaniumSecondary,
          muted: COLORS.titaniumMuted,
          dark: COLORS.titaniumDark,
        },
        electric: {
          DEFAULT: COLORS.electricBlue,
          hover: COLORS.electricBlueHover,
          soft: COLORS.electricBlueSoft,
        },
        hig: {
          success: COLORS.successGreen,
          warning: COLORS.warningAmber,
          danger: COLORS.dangerRed,
          borderLight: COLORS.borderLightSubtle,
          borderDark: COLORS.borderDarkSpecular,
        },
      },
      borderRadius: {
        squircle: SQUIRCLES.xl,
        'squircle-lg': SQUIRCLES.tabbar,
        '2xl': SQUIRCLES.md,
        '3xl': SQUIRCLES.xl,
      },
      boxShadow: {
        'oled-card': LIQUID_GLASS.shadowOledCard,
        'light-card': LIQUID_GLASS.shadowLightCard,
        'oled-floating': LIQUID_GLASS.shadowOledFloating,
        'light-floating': LIQUID_GLASS.shadowLightFloating,
      },
      spacing: {
        'safe-top': SAFE_AREAS.top,
        'safe-bottom': SAFE_AREAS.bottom,
        'safe-left': SAFE_AREAS.left,
        'safe-right': SAFE_AREAS.right,
      },
    },
  },
  plugins: [],
};
