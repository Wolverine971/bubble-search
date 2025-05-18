// RewindUIProvider.tsx

import { ThemeContextType, ThemeProvider, useTheme } from '@rewind-ui/core';
import React, { ReactNode } from 'react';

interface RewindUIProviderProps {
  children: ReactNode;
}


export const RewindUIProvider: React.FC<RewindUIProviderProps> = ({ children }) => {

  const defaultTheme = useTheme();

const themeContext: ThemeContextType = {
    theme: {
      components: {
        ...defaultTheme.components,
      }
    },
  };

  return (
    <ThemeProvider value={themeContext}>
      {children}
    </ThemeProvider>
  );
};