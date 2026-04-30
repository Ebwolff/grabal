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

// TODO: Populate from Supabase
const monthlyData: Array<{ name: string; receita: number; custos: number; lucro: number }> = [];

const producaoCultura: Array<{ name: string; sacas: number; color: string }> = [];

const custosCat: Array<{ name: string; value: number; color: string }> = [];

const endividamento: Array<{ label: string; value: number; color: string }> = [];

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
        <MetricCard title="Receita Total" value="R$ 0" change={0} icon={TrendingUp} accentColor="#3B82F6" />
        <MetricCard title="Custos Totais" value="R$ 0" change={0} invertChange icon={TrendingDown} accentColor="#EF4444" />
        <MetricCard title="Lucro Operacional" value="R$ 0" change={0} icon={DollarSign} accentColor="#10B981" />
        <MetricCard title="EBITDA" value="R$ 0" change={0} icon={Activity} accentColor="#3B82F6" />
        <MetricCard title="Produção" value="0" change={0} icon={Wheat} accentColor="#F59E0B" changeLabel="sacas total" />
        <MetricCard title="Endividamento" value="0%" change={0} icon={BarChart3} accentColor="#10B981" changeLabel="vs safra anterior" />
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
