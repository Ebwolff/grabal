'use client';

import React, { useEffect, useState } from 'react';
import { Search, Bell, ChevronDown, Filter, Wheat } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { useGlobalFilter, safrasOptions, fazendasOptions, culturasOptions } from '@/context/GlobalFilterContext';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

export function Topbar() {
  const { collapsed } = useSidebar();
  const { safra, setSafra, fazenda, setFazenda, cultura, setCultura } = useGlobalFilter();
  const [user, setUser] = useState<{ name: string, initials: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const fullName = user.user_metadata?.full_name || user.email || 'Analista';
        const nameParts = fullName.split(' ');
        
        // Determina as iniciais (ex: "Diego Mesquita" -> "DM", "diego@..." -> "DI")
        let initials = '..';
        if (nameParts.length > 1 && nameParts[0].length > 0 && nameParts[1].length > 0) {
          initials = `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
        } else if (fullName.length > 1) {
          initials = fullName.substring(0, 2).toUpperCase();
        }

        setUser({ name: fullName, initials });
      }
    }
    loadUser();
  }, []);

  return (
    <motion.header
      animate={{ marginLeft: collapsed ? 68 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed top-0 right-0 h-14 glass border-b border-industrial-border z-40 flex items-center justify-between px-5"
      style={{ left: collapsed ? 68 : 240 }}
    >
      {/* Left: Search */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-surface-elevated border border-industrial-border rounded-lg px-3 py-1.5 w-64">
          <Search size={14} className="text-slate-500" />
          <input type="text" placeholder="Pesquisar módulos..." className="bg-transparent text-xs text-white placeholder-slate-500 border-none outline-none w-full" />
          <kbd className="text-[9px] text-slate-600 bg-industrial-card px-1.5 py-0.5 rounded border border-industrial-border">⌘K</kbd>
        </div>
      </div>

      {/* Center: Global Filters */}
      <div className="flex items-center gap-2">
        <FilterSelect icon={<Wheat size={12} />} value={safra}
          options={safrasOptions.map(s => ({ value: s, label: s }))} onChange={setSafra} />
        <FilterSelect icon={<Filter size={12} />} value={fazenda}
          options={fazendasOptions.map(f => ({ value: f, label: f || 'Todas Fazendas' }))} onChange={setFazenda} />
        <FilterSelect icon={<Filter size={12} />} value={cultura}
          options={culturasOptions.map(c => ({ value: c, label: c || 'Todas Culturas' }))} onChange={setCultura} />
      </div>

      {/* Right: Notifications + Profile */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-surface-hover">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary-light rounded-full" />
        </button>

        <div className="h-6 w-px bg-industrial-border" />

        <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface-hover transition-colors">
          <div className="w-7 h-7 rounded-full bg-primary/30 flex items-center justify-center border border-primary-light/30">
            <span className="text-[10px] font-bold text-primary-light">{user ? user.initials : '..'}</span>
          </div>
          <div className="text-left hidden lg:block">
            <p className="text-[11px] font-medium text-white leading-tight">
              {user ? user.name : 'Carregando...'}
            </p>
            <p className="text-[9px] text-slate-500">Logado</p>
          </div>
          <ChevronDown size={12} className="text-slate-500 hidden lg:block" />
        </button>
      </div>
    </motion.header>
  );
}

function FilterSelect({ icon, value, options, onChange }: {
  icon: React.ReactNode;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 bg-surface-elevated border border-industrial-border rounded-lg px-2.5 py-1.5">
      <span className="text-primary-light">{icon}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-[11px] font-medium text-slate-300 border-none outline-none cursor-pointer appearance-none pr-3"
        style={{ backgroundImage: 'none' }}
      >
        {options.map(o => <option key={o.value} value={o.value} className="bg-industrial-card">{o.label}</option>)}
      </select>
      <ChevronDown size={10} className="text-slate-500 -ml-2" />
    </div>
  );
}
