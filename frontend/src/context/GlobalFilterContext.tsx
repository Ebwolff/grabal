'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFarms, getSafras, getCulturas, Farm, Safra, Cultura } from '@/lib/supabase/database';

interface GlobalFilterContextType {
  safra: string;
  setSafra: (v: string) => void;
  fazenda: string;
  setFazenda: (v: string) => void;
  cultura: string;
  setCultura: (v: string) => void;
  safrasOptions: string[];
  fazendasOptions: string[];
  culturasOptions: string[];
}

const GlobalFilterContext = createContext<GlobalFilterContextType | undefined>(undefined);

export function GlobalFilterProvider({ children }: { children: React.ReactNode }) {
  const [safra, setSafra] = useState('2024/25');
  const [fazenda, setFazenda] = useState('');
  const [cultura, setCultura] = useState('');

  const [safrasOptions, setSafrasOptions] = useState<string[]>(['2024/25']);
  const [fazendasOptions, setFazendasOptions] = useState<string[]>(['']);
  const [culturasOptions, setCulturasOptions] = useState<string[]>(['']);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [f, s, c] = await Promise.all([getFarms(), getSafras(), getCulturas()]);
        
        const fOps = ['', ...Array.from(new Set(f.map(x => x.name)))];
        const sOps = Array.from(new Set(s.map(x => x.year)));
        const cOps = ['', ...Array.from(new Set(c.map(x => x.name)))];

        setFazendasOptions(fOps);
        setSafrasOptions(sOps);
        setCulturasOptions(cOps);
        
        if (sOps.length > 0 && !sOps.includes(safra)) {
          setSafra(sOps[0]);
        }
      } catch (e) {
        console.error('Failed to load filter options', e);
      }
    }
    loadOptions();
  }, []);

  return (
    <GlobalFilterContext.Provider value={{ safra, setSafra, fazenda, setFazenda, cultura, setCultura, safrasOptions, fazendasOptions, culturasOptions }}>
      {children}
    </GlobalFilterContext.Provider>
  );
}

export function useGlobalFilter() {
  const context = useContext(GlobalFilterContext);
  if (!context) throw new Error('useGlobalFilter must be used within GlobalFilterProvider');
  return context;
}
