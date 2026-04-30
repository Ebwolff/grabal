'use client';

import React, { useMemo } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { MetricCard } from '@/components/MetricCard';
import { FinancialChart } from '@/components/FinancialChart';
import { usePrivacy } from '@/context/PrivacyContext';
import { useGlobalFilter } from '@/context/GlobalFilterContext';
import { cn } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, Wheat, DollarSign, BarChart3,
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';

// Simulated monthly data
const monthlyData = [
  { name: 'Jul', receita: 1800000, custos: 850000, lucro: 950000 },
  { name: 'Ago', receita: 2100000, custos: 920000, lucro: 1180000 },
  { name: 'Set', receita: 2400000, custos: 980000, lucro: 1420000 },
  { name: 'Out', receita: 2200000, custos: 1050000, lucro: 1150000 },
  { name: 'Nov', receita: 2650000, custos: 1100000, lucro: 1550000 },
  { name: 'Dez', receita: 2800000, custos: 1150000, lucro: 1650000 },
  { name: 'Jan', receita: 2950000, custos: 1200000, lucro: 1750000 },
  { name: 'Fev', receita: 3100000, custos: 1190000, lucro: 1910000 },
  { name: 'Mar', receita: 3350000, custos: 1250000, lucro: 2100000 },
  { name: 'Abr', receita: 3600000, custos: 1280000, lucro: 2320000 },
  { name: 'Mai', receita: 3800000, custos: 1300000, lucro: 2500000 },
  { name: 'Jun', receita: 4100000, custos: 1350000, lucro: 2750000 },
];

const producaoCultura = [
  { name: 'Soja', sacas: 72100, color: '#10b981' },
  { name: 'Milho', sacas: 97300, color: '#3B82F6' },
  { name: 'Algodão', sacas: 29300, color: '#F59E0B' },
  { name: 'Café', sacas: 14000, color: '#a855f7' },
  { name: 'Trigo', sacas: 12500, color: '#EF4444' },
];

const custosCat = [
  { name: 'Insumos', value: 3480000, color: '#EF4444' },
  { name: 'Serviços', value: 1658000, color: '#F97316' },
  { name: 'Mão de Obra', value: 1420000, color: '#3B82F6' },
  { name: 'Armazenagem', value: 580000, color: '#a855f7' },
  { name: 'Despesas Adm.', value: 490250, color: '#64748b' },
  { name: 'Consultoria', value: 206700, color: '#10b981' },
];

const endividamento = [
  { label: 'Ativos', value: 80920000, color: '#3B82F6' },
  { label: 'Passivos', value: 12710000, color: '#EF4444' },
  { label: 'Financeiro', value: 4500000, color: '#10b981' },
];

function CustomTooltipDonut({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 border border-industrial-border shadow-xl">
      <div className="flex items-center gap-2 text-xs">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
        <span className="text-slate-400">{payload[0].name}:</span>
        <span className="text-white font-bold">R$ {(payload[0].value / 1000000).toFixed(2)}M</span>
      </div>
    </div>
  );
}

export default function ExecutiveDashboard() {
  const { isPrivate } = usePrivacy();
  const { safra } = useGlobalFilter();

  const fmtM = (v: number) => `R$ ${(v / 1000000).toFixed(1)}M`;

  return (
    <MainContent>
      <PageHeader
        title="Dashboard"
        accent="Executivo"
        description="Visão consolidada dos principais indicadores financeiros."
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <MetricCard title="Receita Total" value="R$ 30,8M" change={12.4} icon={TrendingUp} accentColor="#3B82F6" />
        <MetricCard title="Custos Totais" value="R$ 14,7M" change={-3.2} invertChange icon={TrendingDown} accentColor="#EF4444" />
        <MetricCard title="Lucro Operacional" value="R$ 16,1M" change={18.7} icon={DollarSign} accentColor="#10B981" />
        <MetricCard title="EBITDA" value="R$ 24,9M" change={15.3} icon={Activity} accentColor="#3B82F6" />
        <MetricCard title="Produção" value="219,9K" change={11.8} icon={Wheat} accentColor="#F59E0B" changeLabel="sacas total" />
        <MetricCard title="Endividamento" value="15,7%" change={-2.1} icon={BarChart3} accentColor="#10B981" changeLabel="vs safra anterior" />
      </div>

      {/* Charts: Main + Production */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <FinancialChart
            title="Receita, Custos & Lucro"
            data={monthlyData}
            type="line"
            series={[
              { key: 'receita', name: 'Receita', color: '#3B82F6' },
              { key: 'custos', name: 'Custos', color: '#EF4444' },
              { key: 'lucro', name: 'Lucro', color: '#10B981' },
            ]}
          />
        </div>

        {/* Production by Culture */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Produção por Cultura</h3>
          <div className="space-y-3">
            {producaoCultura.map((c, i) => {
              const max = Math.max(...producaoCultura.map(x => x.sacas));
              const pct = (c.sacas / max * 100);
              return (
                <motion.div key={c.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-xs font-medium text-white">{c.name}</span>
                    </div>
                    <span className={cn("text-xs font-bold text-slate-300 privacy-mask", isPrivate && "privacy-hidden")}>
                      {(c.sacas / 1000).toFixed(1)}K <span className="text-[9px] text-slate-600 font-normal">sacas</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                      className="h-full rounded-full" style={{ backgroundColor: c.color }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts: Revenue/Costs+Lucro & Costs Category & Debt */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Combined Revenue/Costs/Lucro Area Chart */}
        <div className="lg:col-span-2">
          <FinancialChart
            title="Receita, Custos & Lucro"
            data={monthlyData}
            type="area"
            series={[
              { key: 'receita', name: 'Receita', color: '#3B82F6' },
              { key: 'custos', name: 'Custos', color: '#EF4444' },
              { key: 'lucro', name: 'Lucro', color: '#10B981' },
            ]}
            height={240}
          />
        </div>

        {/* Right column: Costs + Debt */}
        <div className="space-y-4">
          {/* Costs Donut */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Custos por Categoria</h3>
            <div className="flex items-center gap-4">
              <div className="w-28 h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={custosCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} innerRadius={30} strokeWidth={0}>
                      {custosCat.map(c => <Cell key={c.name} fill={c.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltipDonut />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {custosCat.map(c => (
                  <div key={c.name} className="flex items-center gap-2 text-[10px]">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-slate-400 flex-1">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Endividamento */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Endividamento</h3>
            <div className="space-y-2.5">
              {endividamento.map(d => (
                <div key={d.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-slate-400">{d.label}</span>
                  </div>
                  <span className={cn("text-xs font-bold text-white privacy-mask", isPrivate && "privacy-hidden")}>
                    R$ {(d.value / 1000000).toFixed(1)}M
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainContent>
  );
}
