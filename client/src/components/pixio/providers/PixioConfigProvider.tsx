import { createContext, useContext, useEffect, ReactNode } from 'react';
import { usePixioConfig } from '@/lib/pixio/hooks/usePixioConfig';
import type { PixioConfig } from '@/lib/pixio/config';

interface PixioConfigContextValue {
  config: PixioConfig | undefined;
  isLoading: boolean;
}

const PixioConfigContext = createContext<PixioConfigContextValue | null>(null);

export function usePixioConfigContext() {
  const context = useContext(PixioConfigContext);
  if (!context) {
    throw new Error('usePixioConfigContext must be used within PixioConfigProvider');
  }
  return context;
}

interface PixioConfigProviderProps {
  children: ReactNode;
}

export function PixioConfigProvider({ children }: PixioConfigProviderProps) {
  const { data: config, isLoading } = usePixioConfig();

  // Apply CSS variables when config loads
  useEffect(() => {
    if (config) {
      const root = document.documentElement;
      root.style.setProperty('--pixio-primary', config.branding.colors.primary);
      root.style.setProperty('--pixio-secondary', config.branding.colors.secondary);
      root.style.setProperty('--pixio-accent', config.branding.colors.accent);
    }
  }, [config]);

  return (
    <PixioConfigContext.Provider value={{ config, isLoading }}>
      {children}
    </PixioConfigContext.Provider>
  );
}
