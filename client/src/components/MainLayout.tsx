// src/components/MainLayout.tsx
import React, { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  maxWidth = 'md' 
}) => {
  const maxWidthClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    'full': 'max-w-full'
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-4">
      <div className={`w-full ${maxWidthClasses[maxWidth]} mx-auto`}>
        {children}
      </div>
    </div>
  );
};

export default MainLayout;