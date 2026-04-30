'use client';

import React from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { MetricCard } from '@/components/MetricCard';
import { usePrivacy } from '@/context/PrivacyContext';
import { useGlobalFilter } from '@/context/GlobalFilterContext';
import { cn } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, ArrowRight, Activity, DollarSign,
  Percent, BarChart3, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const dreData: Array<{ label: string; value: number; pct: number }> = [];

const monthlyRevenue: Array<{ month: string; receita: number; custo: number }> = [];

const costBreakdown: Array<{ name: string; value: number; color: string }> = [];

const fmt = (v: number) => `R$ ${(v / 1000000).toFixed(1)}M`;

export default function FinancePage() {
  const { isPrivate } = usePrivacy();
  const { safra } = useGlobalFilter();

  return (
    <MainContent>
      <PageHeader
        title="Análise"
        accent="Financeira"
        description={`DRE consolidado, indicadores de performance e composição de custos — Safra ${safra}`}
        badge={
          <button className="bg-primary hover:bg-primary-light text-white font-semibold px-5 py-2 text-xs flex items-center gap-2 transition-all rounded-lg">
            Exportar PDF <ArrowRight size={14} />
          </button>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <MetricCard title="Margem EBITDA" value="0%" change={0} icon={Activity} accentColor="#3B82F6" changeLabel="vs safra anterior" />
        <MetricCard title="Liquidez Corrente" value="0" change={0} icon={RefreshCw} accentColor="#10B981" changeLabel="vs safra anterior" />
        <MetricCard title="Endividamento" value="0%" change={0} icon={TrendingDown} accentColor="#10B981" changeLabel="" />
        <MetricCard title="ROE" value="0%" change={0} invertChange icon={Percent} accentColor="#EF4444" changeLabel="vs safra anterior" />
        <MetricCard title="Margem Líquida" value="0%" change={0} icon={TrendingUp} accentColor="#3B82F6" changeLabel="vs safra anterior" />
        <MetricCard title="Giro do Ativo" value="0" change={0} icon={BarChart3} accentColor="#10B981" changeLabel="vs safra anterior" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* DRE Table */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="p-5 border-b border-industrial-border flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white">Demonstrativo de Resultado (DRE)</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Safra {safra} — Consolidado</p>
            </div>
            <DollarSign size={16} className="text-primary-light" />
          </div>
          <table className="w-full table-striped">
            <thead>
              <tr>
                <th className="text-left">Conta</th>
                <th className="text-right">Valor (R$)</th>
                <th className="text-right">% Receita</th>
              </tr>
            </thead>
            <tbody>
              {dreData.map((row, i) => {
                const isHighlight = ['Receita Líquida', 'Lucro Bruto', 'EBITDA', 'EBIT', 'Lucro Líquido'].includes(row.label);
                return (
                  <motion.tr
                    key={row.label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={isHighlight ? 'bg-primary/5 font-semibold' : ''}
                  >
                    <td className={cn(isHighlight ? 'text-white' : 'text-slate-400')}>{row.label}</td>
                    <td className={cn('text-right font-mono privacy-mask', isPrivate && 'privacy-hidden', row.value < 0 ? 'text-danger/80' : 'text-success/80', isHighlight && (row.value < 0 ? 'text-danger' : 'text-success'))}>
                      {row.value < 0 ? '-' : ''}R$ {Math.abs(row.value).toLocaleString('pt-BR')}
                    </td>
                    <td className={cn('text-right font-mono', row.pct < 0 ? 'text-danger/50' : 'text-slate-500')}>
                      {row.pct > 0 ? '+' : ''}{row.pct}%
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Cost Breakdown Pie */}
        <div className="card p-5">
          <h4 className="text-sm font-semibold text-white mb-1">Composição de Custos</h4>
          <p className="text-[10px] text-slate-500 mb-4">Distribuição percentual do CMV</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={costBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={45} strokeWidth={0}>
                {costBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f1724', border: '1px solid #1a2332', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {costBreakdown.map((c) => (
              <div key={c.name} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-slate-400">{c.name}</span>
                </div>
                <span className="font-bold text-slate-300">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue vs Cost Chart */}
      <div className="card p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="text-sm font-semibold text-white">Receita vs Custo Mensal</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Comparativo mensal em milhares (R$)</p>
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary-light" /> Receita</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-danger" /> Custo</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyRevenue} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#0f1724', border: '1px solid #1a2332', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="receita" fill="#3B82F6" name="Receita" radius={[4, 4, 0, 0]} />
            <Bar dataKey="custo" fill="#EF4444" name="Custo" radius={[4, 4, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </MainContent>
  );
}
