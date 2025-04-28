// RewindUIProvider.tsx
// 

import { ThemeProvider } from '@rewind-ui/core';
import React, { ReactNode } from 'react';

interface RewindUIProviderProps {
  children: ReactNode;
}

export const RewindUIProvider: React.FC<RewindUIProviderProps> = ({ children }) => {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
};