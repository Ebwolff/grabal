'use client';

import React, { createContext, useContext, useState } from 'react';

interface GlobalFilterContextType {
  safra: string;
  setSafra: (v: string) => void;
  fazenda: string;
  setFazenda: (v: string) => void;
  cultura: string;
  setCultura: (v: string) => void;
}

const GlobalFilterContext = createContext<GlobalFilterContextType | undefined>(undefined);

export const safrasOptions = ['2024/25', '2023/24', '2022/23'];
export const fazendasOptions = ['', 'São José', 'Boa Vista', 'Santa Clara'];
export const culturasOptions = ['', 'Soja', 'Milho', 'Algodão', 'Café', 'Trigo'];

export function GlobalFilterProvider({ children }: { children: React.ReactNode }) {
  const [safra, setSafra] = useState('2024/25');
  const [fazenda, setFazenda] = useState('');
  const [cultura, setCultura] = useState('');

  return (
    <GlobalFilterContext.Provider value={{ safra, setSafra, fazenda, setFazenda, cultura, setCultura }}>
      {children}
    </GlobalFilterContext.Provider>
  );
}

export function useGlobalFilter() {
  const context = useContext(GlobalFilterContext);
  if (!context) throw new Error('useGlobalFilter must be used within GlobalFilterProvider');
  return context;
}
