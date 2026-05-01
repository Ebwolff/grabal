'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Sprout, BarChart3, Settings, LogOut, Eye, EyeOff,
  Database, ClipboardEdit, Wheat, Package, Tractor, HardHat, Warehouse,
  FileSpreadsheet, GraduationCap, Target, Landmark, Layers, Building2,
  CreditCard, ShieldCheck, FileCheck, Calculator, Star, Gauge,
  ChevronLeft, ChevronRight, type LucideIcon
} from 'lucide-react';
import { usePrivacy } from '@/context/PrivacyContext';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface MenuGroup {
  label: string;
  items: { name: string; href: string; icon: LucideIcon }[];
}

const menuGroups: MenuGroup[] = [
  {
    label: 'Principal',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Dash Executivo', href: '/executive', icon: Gauge },
      { name: 'Lançamentos', href: '/entries', icon: ClipboardEdit },
    ]
  },
  {
    label: 'Operacional',
    items: [
      { name: 'Produção', href: '/production', icon: Wheat },
      { name: 'Custos', href: '/costs', icon: Package },
      { name: 'Serviços', href: '/services', icon: Tractor },
      { name: 'Mão de Obra', href: '/labor', icon: HardHat },
      { name: 'Armazenagem', href: '/storage', icon: Warehouse },
      { name: 'Despesas', href: '/expenses', icon: FileSpreadsheet },
      { name: 'Consultoria', href: '/consulting', icon: GraduationCap },
    ]
  },
  {
    label: 'Financeiro',
    items: [
      { name: 'CMV', href: '/cmv', icon: Target },
      { name: 'Consolidação', href: '/consolidation', icon: Landmark },
      { name: 'DRE', href: '/dre', icon: Layers },
      { name: 'Consolidado', href: '/consolidated', icon: Calculator },
    ]
  },
  {
    label: 'Balanço',
    items: [
      { name: 'Ativos', href: '/assets', icon: Building2 },
      { name: 'Passivos', href: '/liabilities', icon: CreditCard },
      { name: 'Garantias', href: '/guarantees', icon: ShieldCheck },
      { name: 'CPR', href: '/cpr', icon: FileCheck },
      { name: 'Rating', href: '/rating', icon: Star },
    ]
  },
  {
    label: 'Cadastros',
    items: [
      { name: 'Produtores', href: '/producers', icon: Users },
      { name: 'Fazendas & Safras', href: '/farms', icon: Sprout },
      { name: 'Análise Financeira', href: '/finance', icon: BarChart3 },
      { name: 'Base de Dados', href: '/database', icon: Database },
      { name: 'Configurações', href: '/settings', icon: Settings },
    ]
  },
];

export function Sidebar() {
  const { isPrivate, togglePrivacy } = usePrivacy();
  const { collapsed, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="glass border-r border-industrial-border h-screen flex flex-col fixed left-0 top-0 z-50"
    >
      {/* Brand Header */}
      <div className="px-4 h-14 flex items-center justify-between border-b border-industrial-border flex-shrink-0">
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-primary-light/20 flex items-center justify-center flex-shrink-0">
            <span className="text-primary-light font-black text-sm">G</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden whitespace-nowrap">
                <h1 className="text-sm font-bold tracking-tight">
                  <span className="text-primary-light">GRAM</span>
                  <span className="text-white">BAL</span>
                </h1>
                <p className="text-[7px] text-slate-500 uppercase tracking-[0.2em] -mt-0.5">Investimentos</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        <button onClick={toggleSidebar} className="text-slate-500 hover:text-primary-light transition-colors p-1 rounded-md hover:bg-surface-hover flex-shrink-0">
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto sidebar-scroll">
        {menuGroups.map((group) => (
          <div key={group.label} className="mb-1">
            <AnimatePresence>
              {!collapsed && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="px-4 pt-3 pb-1 text-[9px] uppercase tracking-[0.15em] text-slate-600 font-bold"
                >
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link key={item.href} href={item.href}
                  className={cn(
                    "tooltip-trigger flex items-center gap-3 mx-2 px-2.5 py-[7px] transition-all duration-200 rounded-lg relative",
                    collapsed && "justify-center px-0",
                    isActive
                      ? "bg-primary-light/15 text-white"
                      : "text-slate-400 hover:text-white hover:bg-surface-hover"
                  )}
                >
                  {isActive && (
                    <motion.div layoutId="activeIndicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-light rounded-r-full" />
                  )}
                  <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-primary-light" : "group-hover:text-primary-light")} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                        className="text-xs font-medium truncate overflow-hidden whitespace-nowrap"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {collapsed && <span className="tooltip-content">{item.name}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-2 border-t border-industrial-border flex-shrink-0">
        <button onClick={togglePrivacy}
          className={cn("w-full flex items-center gap-3 px-2.5 py-[7px] text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-surface-hover", collapsed && "justify-center px-0")}>
          {isPrivate ? <EyeOff className="w-4 h-4 flex-shrink-0" /> : <Eye className="w-4 h-4 flex-shrink-0" />}
          {!collapsed && <span className="text-xs font-medium">Privado: {isPrivate ? 'ON' : 'OFF'}</span>}
        </button>
        <button onClick={handleLogout} className={cn("w-full flex items-center gap-3 px-2.5 py-[7px] text-red-400 hover:text-red-300 transition-colors rounded-lg hover:bg-surface-hover", collapsed && "justify-center px-0")}>
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-xs font-medium">Sair</span>}
        </button>
      </div>
    </motion.aside>
  );
}
