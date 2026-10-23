import React, { createContext, useContext } from 'react';
import { DARK, LIGHT } from './theme';

const Ctx = createContext(DARK);

export function ThemeProvider({ mode, systemScheme, children }) {
  const effective = mode === 'system' ? systemScheme || 'dark' : mode;
  return <Ctx.Provider value={effective === 'light' ? LIGHT : DARK}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);

