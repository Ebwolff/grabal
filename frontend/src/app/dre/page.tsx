'use client';

import React, { useState, useMemo } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { usePrivacy } from '@/context/PrivacyContext';
import { useGlobalFilter } from '@/context/GlobalFilterContext';
import { cn } from '@/lib/utils';
import {
  Layers, TrendingUp, TrendingDown,
  ArrowRight, DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Cell as PieCell
} from 'recharts';

interface DREData {
  safra: string;
  fazenda: string;
  cultura: string;
  receitaBruta: number;
  deducoes: number;
  cmv: number;
  custosOperacionais: number;
  despesasAdmin: number;
  depreciacaoAmort: number;
  despesasFinanceiras: number;
  impostos: number;
}

const dreRawData: DREData[] = [];

const safras = [...new Set(dreRawData.map(d => d.safra))];
const fazendas = [...new Set(dreRawData.map(d => d.fazenda))];
const culturas = [...new Set(dreRawData.map(d => d.cultura))];
const cultureColors: Record<string, string> = { Soja: '#10b981', Milho: '#06b6d4', Algodão: '#f59e0b', Café: '#a855f7', Trigo: '#ef4444' };

export default function DREPage() {
  const { isPrivate } = usePrivacy();
  const { safra: filterSafra, fazenda: filterFazenda, cultura: filterCultura } = useGlobalFilter();

  const filtered = useMemo(() => {
    return dreRawData.filter(d =>
      (!filterSafra || d.safra === filterSafra) &&
      (!filterFazenda || d.fazenda.includes(filterFazenda)) &&
      (!filterCultura || d.cultura === filterCultura)
    );
  }, [filterSafra, filterFazenda, filterCultura]);

  const consolidated = useMemo(() => {
    const sum = (key: keyof DREData) => filtered.reduce((s, d) => s + (d[key] as number), 0);
    const receitaBruta = sum('receitaBruta');
    const deducoes = sum('deducoes');
    const receitaLiquida = receitaBruta - deducoes;
    const cmv = sum('cmv');
    const lucroBruto = receitaLiquida - cmv;
    const custosOp = sum('custosOperacionais');
    const despAdmin = sum('despesasAdmin');
    const depAmort = sum('depreciacaoAmort');
    const ebitda = lucroBruto - custosOp - despAdmin;
    const lucroOp = ebitda - depAmort;
    const despFin = sum('despesasFinanceiras');
    const lucroAntesIR = lucroOp - despFin;
    const impostos = sum('impostos');
    const lucroLiquido = lucroAntesIR - impostos;
    const margemBruta = receitaLiquida > 0 ? (lucroBruto / receitaLiquida * 100) : 0;
    const margemEbitda = receitaLiquida > 0 ? (ebitda / receitaLiquida * 100) : 0;
    const margemLiquida = receitaLiquida > 0 ? (lucroLiquido / receitaLiquida * 100) : 0;
    return { receitaBruta, deducoes, receitaLiquida, cmv, lucroBruto, custosOp, despAdmin, depAmort, ebitda, lucroOp, despFin, lucroAntesIR, impostos, lucroLiquido, margemBruta, margemEbitda, margemLiquida };
  }, [filtered]);

  const dreRows = [
    { label: 'RECEITA BRUTA', value: consolidated.receitaBruta, level: 0, section: true },
    { label: '(-) Deduções sobre Receita', value: -consolidated.deducoes, level: 1 },
    { label: 'RECEITA LÍQUIDA', value: consolidated.receitaLiquida, level: 0, total: true },
    { label: '(-) CMV — Custo Mercadoria Vendida', value: -consolidated.cmv, level: 1, red: true },
    { label: 'LUCRO BRUTO', value: consolidated.lucroBruto, level: 0, total: true, accent: 'green' },
    { label: `Margem Bruta`, value: consolidated.margemBruta, level: 1, pct: true },
    { label: '', value: 0, level: 0, divider: true },
    { label: '(-) Custos Operacionais', value: -consolidated.custosOp, level: 1 },
    { label: '(-) Despesas Administrativas', value: -consolidated.despAdmin, level: 1 },
    { label: 'EBITDA', value: consolidated.ebitda, level: 0, total: true, accent: 'cyan' },
    { label: `Margem EBITDA`, value: consolidated.margemEbitda, level: 1, pct: true },
    { label: '', value: 0, level: 0, divider: true },
    { label: '(-) Depreciação e Amortização', value: -consolidated.depAmort, level: 1 },
    { label: 'LUCRO OPERACIONAL', value: consolidated.lucroOp, level: 0, total: true },
    { label: '(-) Despesas Financeiras', value: -consolidated.despFin, level: 1 },
    { label: 'LUCRO ANTES DO IR', value: consolidated.lucroAntesIR, level: 0, total: true },
    { label: '(-) Impostos', value: -consolidated.impostos, level: 1 },
    { label: 'LUCRO LÍQUIDO', value: consolidated.lucroLiquido, level: 0, total: true, accent: 'emerald', final: true },
    { label: `Margem Líquida`, value: consolidated.margemLiquida, level: 1, pct: true },
  ];

  // Per-culture DRE comparison
  const cultureDRE = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(d => { if (!groups[d.cultura]) groups[d.cultura] = []; groups[d.cultura].push(d); });
    return Object.entries(groups).map(([cultura, items]) => {
      const rb = items.reduce((s, d) => s + d.receitaBruta, 0);
      const ded = items.reduce((s, d) => s + d.deducoes, 0);
      const cmv = items.reduce((s, d) => s + d.cmv, 0);
      const cop = items.reduce((s, d) => s + d.custosOperacionais, 0);
      const da = items.reduce((s, d) => s + d.despesasAdmin, 0);
      const rl = rb - ded;
      const lb = rl - cmv;
      const ebitda = lb - cop - da;
      const ll = ebitda - items.reduce((s, d) => s + d.depreciacaoAmort, 0) - items.reduce((s, d) => s + d.despesasFinanceiras, 0) - items.reduce((s, d) => s + d.impostos, 0);
      const ml = rl > 0 ? (ll / rl * 100) : 0;
      return { cultura, receitaBruta: rb, lucroBruto: lb, ebitda, lucroLiquido: ll, margemLiquida: ml, color: cultureColors[cultura] || '#64748b' };
    }).sort((a, b) => b.receitaBruta - a.receitaBruta);
  }, [filtered]);

  const waterfallData = [
    { name: 'Receita Líq.', value: consolidated.receitaLiquida, color: '#10b981' },
    { name: 'CMV', value: -consolidated.cmv, color: '#ef4444' },
    { name: 'Custos Op.', value: -consolidated.custosOp, color: '#f97316' },
    { name: 'Desp. Admin.', value: -consolidated.despAdmin, color: '#f59e0b' },
    { name: 'EBITDA', value: consolidated.ebitda, color: '#06b6d4' },
    { name: 'Deprec.', value: -consolidated.depAmort, color: '#64748b' },
    { name: 'Desp. Fin.', value: -consolidated.despFin, color: '#8b5cf6' },
    { name: 'Impostos', value: -consolidated.impostos, color: '#a855f7' },
    { name: 'Lucro Líq.', value: consolidated.lucroLiquido, color: '#22c55e' },
  ];

  const revenuePieData = cultureDRE.map(c => ({ name: c.cultura, value: c.receitaBruta, color: c.color }));

  const fmt = (v: number) => `R$ ${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const fmtK = (v: number) => `R$ ${(Math.abs(v) / 1000).toFixed(0)}k`;

  return (
    <MainContent>
      <PageHeader
        title="DRE —"
        accent="Demonstrativo de Resultado"
        description={`Demonstração do Resultado do Exercício consolidada — Safra ${filterSafra}`}
        badge={
          <button className="bg-primary hover:bg-primary-light text-white font-semibold px-5 py-2 text-xs flex items-center gap-2 transition-all rounded-lg">
            Exportar <ArrowRight size={14} />
          </button>
        }
      />

        {/* Top KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Receita Líquida', value: consolidated.receitaLiquida, color: '#10b981' },
            { label: 'Lucro Bruto', value: consolidated.lucroBruto, color: '#22c55e' },
            { label: 'EBITDA', value: consolidated.ebitda, color: '#06b6d4' },
            { label: 'Lucro Líquido', value: consolidated.lucroLiquido, color: '#a855f7' },
            { label: 'Margem Líquida', value: consolidated.margemLiquida, color: '#f59e0b', pct: true },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="card p-4">
              <p className="text-[8px] uppercase tracking-widest text-slate-600 font-black mb-1">{kpi.label}</p>
              <p className={cn("text-lg font-black font-mono tracking-tight privacy-mask", isPrivate && "privacy-hidden")} style={{ color: kpi.color }}>
                {kpi.pct ? `${kpi.value.toFixed(1)}%` : fmtK(kpi.value)}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* DRE Statement */}
          <div className="col-span-2 card p-6">
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-bold uppercase tracking-tight text-sm flex items-center gap-2">
                <Layers size={16} className="text-primary-light" />
                Demonstração do Resultado
              </h4>
              <span className="text-[10px] text-slate-500 font-bold">{filterSafra || 'Consolidado'} {filterFazenda && `· ${filterFazenda}`} {filterCultura && `· ${filterCultura}`}</span>
            </div>
            <div className="space-y-0.5">
              {dreRows.map((row, i) => {
                if (row.divider) return <div key={i} className="h-3" />;
                const accentColor = row.accent === 'green' ? 'text-emerald-400' : row.accent === 'cyan' ? 'text-cyan-400' : row.accent === 'emerald' ? 'text-emerald-300' : '';
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                    className={cn("flex justify-between items-center py-2 px-4 transition-colors",
                      row.total && "bg-slate-800/30",
                      row.final && "border-t-2 border-primary/40 bg-slate-800/50 mt-1",
                      row.section && "border-b border-industrial-border",
                    )}>
                    <span className={cn("text-sm",
                      row.total || row.section ? "font-black text-white" : "text-slate-400",
                      row.pct && "italic text-slate-500 text-xs"
                    )} style={{ paddingLeft: row.level * 24 }}>
                      {row.label}
                    </span>
                    <span className={cn("text-sm font-mono font-bold privacy-mask", isPrivate && "privacy-hidden",
                      row.pct ? "text-cyan-400/70 text-xs" :
                      accentColor ? accentColor :
                      row.total ? "text-primary-light" :
                      row.red ? "text-red-400" :
                      row.value < 0 ? "text-red-400/60" : "text-slate-300"
                    )}>
                      {row.pct ? `${row.value.toFixed(1)}%` : row.value < 0 ? `(${fmt(row.value)})` : fmt(row.value)}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Revenue Pie */}
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Receita por Cultura</h4>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={revenuePieData} dataKey="value" cx="50%" cy="50%" outerRadius={65} innerRadius={38} strokeWidth={0}>
                    {revenuePieData.map((entry) => <PieCell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f1724', border: '1px solid #1a2332', borderRadius: 8, fontSize: 11 }}
                    formatter={(value) => [fmt(Number(value)), '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {revenuePieData.map(p => (
                  <div key={p.name} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-slate-400">{p.name}</span>
                    </div>
                    <span className={cn("font-bold font-mono text-slate-300 privacy-mask", isPrivate && "privacy-hidden")}>
                      {consolidated.receitaBruta > 0 ? `${(p.value / consolidated.receitaBruta * 100).toFixed(1)}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Margins */}
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Margens</h4>
              <div className="space-y-3">
                {[
                  { label: 'Margem Bruta', value: consolidated.margemBruta, color: '#10b981' },
                  { label: 'Margem EBITDA', value: consolidated.margemEbitda, color: '#06b6d4' },
                  { label: 'Margem Líquida', value: consolidated.margemLiquida, color: '#a855f7' },
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] uppercase tracking-widest text-slate-600 font-black">{m.label}</span>
                      <span className={cn("text-xs font-mono font-bold privacy-mask", isPrivate && "privacy-hidden")} style={{ color: m.color }}>{m.value.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(Math.max(m.value, 0), 100)}%` }}
                        className="h-full" style={{ backgroundColor: m.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flow */}
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-3">Estrutura DRE</h4>
              <div className="space-y-1 text-[10px]">
                {['Receita Bruta', '(-) Deduções', '= Receita Líquida', '(-) CMV', '= Lucro Bruto', '(-) Custos Operacionais', '= EBITDA', '(-) Depreciação', '= Lucro Operacional', '(-) Desp. Financeiras', '(-) Impostos', '= Lucro Líquido'].map((step, i) => (
                  <div key={i} className={cn("py-1 px-2 font-mono",
                    step.startsWith('=') ? "text-primary-light font-black bg-slate-800/30" : step.startsWith('(') ? "text-red-400/60 pl-4" : "text-slate-500"
                  )}>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Waterfall + Culture Comparison */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="card p-6">
            <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Cascata DRE</h4>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={waterfallData} margin={{ left: 10 }}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f1724', border: '1px solid #1a2332', borderRadius: 8, fontSize: 11 }}
                  formatter={(value) => [fmt(Number(value)), '']} />
                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                  {waterfallData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Culture Comparison Table */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-industrial-border">
              <h4 className="font-bold uppercase tracking-tight text-sm flex items-center gap-2">
                <DollarSign size={16} className="text-primary-light" />
                DRE por Cultura
              </h4>
            </div>
            <table className="w-full table-striped">
              <thead>
                <tr className="border-b border-industrial-border bg-slate-900/50">
                  {['Cultura', 'Receita', 'Lucro Bruto', 'EBITDA', 'Lucro Líq.', 'Margem'].map(h => (
                    <th key={h} className="p-3 text-left text-[8px] uppercase tracking-widest text-slate-600 font-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cultureDRE.map((c, i) => (
                  <motion.tr key={c.cultura} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-industrial-border/50 hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-sm font-bold">{c.cultura}</span>
                      </div>
                    </td>
                    <td className={cn("p-3 text-[11px] font-mono privacy-mask", isPrivate && "privacy-hidden")}>{fmtK(c.receitaBruta)}</td>
                    <td className={cn("p-3 text-[11px] font-mono privacy-mask", isPrivate && "privacy-hidden")}>{fmtK(c.lucroBruto)}</td>
                    <td className={cn("p-3 text-[11px] font-mono privacy-mask", isPrivate && "privacy-hidden")}>{fmtK(c.ebitda)}</td>
                    <td className={cn("p-3 text-[11px] font-mono font-bold privacy-mask", isPrivate && "privacy-hidden", c.lucroLiquido >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {fmtK(c.lucroLiquido)}
                    </td>
                    <td className={cn("p-3 text-[11px] font-mono font-bold privacy-mask", isPrivate && "privacy-hidden", c.margemLiquida >= 0 ? "text-cyan-400" : "text-red-400")}>
                      {c.margemLiquida.toFixed(1)}%
                    </td>
                  </motion.tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-primary/30 bg-slate-900/30">
                  <td className="p-3 text-xs font-semibold text-slate-400">Total</td>
                  <td className={cn("p-3 text-[11px] font-bold font-mono text-slate-300 privacy-mask", isPrivate && "privacy-hidden")}>{fmtK(consolidated.receitaBruta)}</td>
                  <td className={cn("p-3 text-[11px] font-bold font-mono text-slate-300 privacy-mask", isPrivate && "privacy-hidden")}>{fmtK(consolidated.lucroBruto)}</td>
                  <td className={cn("p-3 text-[11px] font-bold font-mono text-slate-300 privacy-mask", isPrivate && "privacy-hidden")}>{fmtK(consolidated.ebitda)}</td>
                  <td className={cn("p-3 text-[11px] font-black font-mono text-primary-light privacy-mask", isPrivate && "privacy-hidden")}>{fmtK(consolidated.lucroLiquido)}</td>
                  <td className={cn("p-3 text-[11px] font-bold font-mono text-cyan-400 privacy-mask", isPrivate && "privacy-hidden")}>{consolidated.margemLiquida.toFixed(1)}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
    </MainContent>
  );
}
