'use client';

import React, { useMemo } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { usePrivacy } from '@/context/PrivacyContext';
import { cn } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, DollarSign, Target, ArrowRight,
  Landmark, PieChart as PieIcon, BarChart3, Layers, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid, PieChart, Pie, Cell as PieCell
} from 'recharts';

// Simulated consolidated data from all modules
const productionData = [
  { cultura: 'Soja', area: 1200, produtividade: 62, precoVenda: 135 },
  { cultura: 'Milho', area: 600, produtividade: 180, precoVenda: 58 },
  { cultura: 'Algodão', area: 500, produtividade: 280, precoVenda: 48 },
  { cultura: 'Café', area: 300, produtividade: 35, precoVenda: 1200 },
  { cultura: 'Trigo', area: 200, produtividade: 50, precoVenda: 95 },
];

const cmvComponents = {
  insumos: 3093180, servicos: 1543000, maoDeObra: 891480,
  armazenagem: 910000, despesas: 575800, consultoria: 124500, frete: 485000,
};
const cmvTotal = Object.values(cmvComponents).reduce((s, v) => s + v, 0);

const depreciation = 380000;
const financialExpenses = 245000;
const taxes = 520000;

const monthlyData = [
  { mes: 'Out', receita: 850000, custo: 620000 },
  { mes: 'Nov', receita: 920000, custo: 640000 },
  { mes: 'Dez', receita: 1100000, custo: 710000 },
  { mes: 'Jan', receita: 1350000, custo: 780000 },
  { mes: 'Fev', receita: 1580000, custo: 820000 },
  { mes: 'Mar', receita: 1650000, custo: 850000 },
];

const cultureColors = ['#10b981', '#06b6d4', '#f59e0b', '#a855f7', '#ef4444'];

export default function ConsolidationPage() {
  const { isPrivate } = usePrivacy();

  const financials = useMemo(() => {
    const cultureResults = productionData.map((c, i) => {
      const producaoTotal = c.area * c.produtividade;
      const receitaBruta = producaoTotal * c.precoVenda;
      return { ...c, producaoTotal, receitaBruta, color: cultureColors[i] };
    });

    const receitaBruta = cultureResults.reduce((s, c) => s + c.receitaBruta, 0);
    const deducoes = receitaBruta * 0.05;
    const receitaLiquida = receitaBruta - deducoes;
    const lucroBruto = receitaLiquida - cmvTotal;
    const margemBruta = receitaLiquida > 0 ? (lucroBruto / receitaLiquida * 100) : 0;
    const ebitda = lucroBruto - depreciation;
    const margemEbitda = receitaLiquida > 0 ? (ebitda / receitaLiquida * 100) : 0;
    const lucroOperacional = ebitda - financialExpenses;
    const lucroLiquido = lucroOperacional - taxes;
    const margemLiquida = receitaLiquida > 0 ? (lucroLiquido / receitaLiquida * 100) : 0;

    return { cultureResults, receitaBruta, deducoes, receitaLiquida, lucroBruto, margemBruta, cmvTotal, ebitda, margemEbitda, lucroOperacional, lucroLiquido, margemLiquida };
  }, []);

  const dreRows = [
    { label: 'Receita Bruta', value: financials.receitaBruta, level: 0, bold: true },
    { label: '(-) Deduções (5%)', value: -financials.deducoes, level: 1 },
    { label: 'Receita Líquida', value: financials.receitaLiquida, level: 0, highlight: true },
    { label: '(-) CMV', value: -cmvTotal, level: 1, accent: 'red' },
    { label: 'Lucro Bruto', value: financials.lucroBruto, level: 0, highlight: true },
    { label: `Margem Bruta`, value: financials.margemBruta, level: 1, pct: true },
    { label: '(-) Depreciação', value: -depreciation, level: 1 },
    { label: 'EBITDA', value: financials.ebitda, level: 0, highlight: true, accent: 'cyan' },
    { label: 'Margem EBITDA', value: financials.margemEbitda, level: 1, pct: true },
    { label: '(-) Despesas Financeiras', value: -financialExpenses, level: 1 },
    { label: 'Lucro Operacional', value: financials.lucroOperacional, level: 0, highlight: true },
    { label: '(-) Impostos', value: -taxes, level: 1 },
    { label: 'Lucro Líquido', value: financials.lucroLiquido, level: 0, highlight: true, accent: 'green' },
    { label: 'Margem Líquida', value: financials.margemLiquida, level: 1, pct: true },
  ];

  const revenuePieData = financials.cultureResults.map(c => ({
    name: c.cultura, value: c.receitaBruta, color: c.color,
  }));

  const waterfallData = [
    { name: 'Receita Líq.', value: financials.receitaLiquida, color: '#10b981' },
    { name: 'CMV', value: -cmvTotal, color: '#ef4444' },
    { name: 'Lucro Bruto', value: financials.lucroBruto, color: '#10b981' },
    { name: 'Deprec.', value: -depreciation, color: '#f59e0b' },
    { name: 'EBITDA', value: financials.ebitda, color: '#06b6d4' },
    { name: 'Desp. Fin.', value: -financialExpenses, color: '#f97316' },
    { name: 'Impostos', value: -taxes, color: '#8b5cf6' },
    { name: 'Lucro Líq.', value: financials.lucroLiquido, color: '#10b981' },
  ];

  const fmt = (v: number) => `R$ ${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const fmtM = (v: number) => `R$ ${(Math.abs(v) / 1000000).toFixed(2)}M`;

  return (
    <MainContent>
        <PageHeader
        title="Consolidação"
        accent="Financeira"
        description="Consolidação financeira completa por fazenda e cultura."
      />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'Receita Bruta', value: fmtM(financials.receitaBruta), icon: DollarSign, color: '#10b981', trend: '+12.3%' },
            { label: 'CMV', value: fmtM(cmvTotal), icon: Target, color: '#ef4444', trend: '-3.1%' },
            { label: 'Lucro Bruto', value: fmtM(financials.lucroBruto), icon: TrendingUp, color: '#10b981', trend: '+8.7%' },
            { label: 'EBITDA', value: fmtM(financials.ebitda), icon: BarChart3, color: '#06b6d4', trend: '+5.2%' },
            { label: 'Lucro Líquido', value: fmtM(financials.lucroLiquido), icon: Landmark, color: '#22c55e', trend: '+6.8%' },
            { label: 'Margem Líquida', value: `${financials.margemLiquida.toFixed(1)}%`, icon: PieIcon, color: '#a855f7', trend: '+1.2pp' },
          ].map((kpi, i) => {
            const Icon = kpi.icon;
            const isUp = kpi.trend.startsWith('+');
            return (
              <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="card p-4 hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Icon size={14} style={{ color: kpi.color }} />
                  <span className={cn("text-[9px] font-bold flex items-center gap-0.5", isUp ? "text-emerald-500" : "text-red-400")}>
                    {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {kpi.trend}
                  </span>
                </div>
                <p className={cn("text-lg font-black font-mono tracking-tight privacy-mask", isPrivate && "privacy-hidden")} style={{ color: kpi.color }}>{kpi.value}</p>
                <p className="text-[8px] uppercase tracking-widest text-slate-600 font-black mt-1">{kpi.label}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* DRE Table */}
          <div className="col-span-2 card p-6">
            <h4 className="font-bold uppercase tracking-tight text-sm mb-5 flex items-center gap-2">
              <Layers size={16} className="text-primary-light" />
              Demonstração do Resultado (DRE)
            </h4>
            <div className="space-y-1">
              {dreRows.map((row) => (
                <div key={row.label} className={cn("flex justify-between items-center py-2 px-3 transition-colors",
                  row.highlight && "bg-slate-800/30 border-l-2",
                  row.highlight && (row.accent === 'red' ? 'border-red-500' : row.accent === 'cyan' ? 'border-cyan-500' : row.accent === 'green' ? 'border-emerald-500' : 'border-primary')
                )}>
                  <span className={cn("text-sm",
                    row.bold ? "font-bold text-white" : row.highlight ? "font-black text-white" : "text-slate-400"
                  )} style={{ paddingLeft: row.level * 20 }}>
                    {row.label}
                  </span>
                  <span className={cn("text-sm font-mono font-bold privacy-mask", isPrivate && "privacy-hidden",
                    row.pct ? "text-cyan-400" :
                    row.accent === 'red' ? "text-red-400" :
                    row.accent === 'cyan' ? "text-cyan-400" :
                    row.accent === 'green' ? "text-emerald-400" :
                    row.highlight ? "text-primary-light" :
                    row.value < 0 ? "text-red-400/70" : "text-slate-300"
                  )}>
                    {row.pct ? `${row.value.toFixed(1)}%` : row.value < 0 ? `(${fmt(row.value)})` : fmt(row.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue by Culture Pie */}
          <div className="space-y-6">
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Receita por Cultura</h4>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={revenuePieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40} strokeWidth={0}>
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
                      {financials.receitaBruta > 0 ? `${(p.value / financials.receitaBruta * 100).toFixed(1)}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Margins */}
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4 flex items-center gap-2">
                <Shield size={14} className="text-primary-light" />
                Margens
              </h4>
              <div className="space-y-3">
                {[
                  { label: 'Margem Bruta', value: financials.margemBruta, color: '#10b981' },
                  { label: 'Margem EBITDA', value: financials.margemEbitda, color: '#06b6d4' },
                  { label: 'Margem Líquida', value: financials.margemLiquida, color: '#a855f7' },
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] uppercase tracking-widest text-slate-600 font-black">{m.label}</span>
                      <span className={cn("text-xs font-mono font-bold privacy-mask", isPrivate && "privacy-hidden")} style={{ color: m.color }}>{m.value.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(m.value, 100)}%` }}
                        className="h-full" style={{ backgroundColor: m.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Monthly Revenue vs Cost */}
          <div className="card p-6">
            <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Receita vs Custo (Mensal)</h4>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
                <Tooltip contentStyle={{ background: '#0f1724', border: '1px solid #1a2332', borderRadius: 8, fontSize: 11 }}
                  formatter={(value) => [fmt(Number(value)), '']} />
                <Area type="monotone" dataKey="receita" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} name="Receita" />
                <Area type="monotone" dataKey="custo" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} name="Custo" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Waterfall */}
          <div className="card p-6">
            <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Cascata Financeira</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={waterfallData} margin={{ left: 10, right: 10 }}>
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
        </div>

        {/* Culture Breakdown Table */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-industrial-border flex items-center justify-between">
            <h4 className="font-bold uppercase tracking-tight text-sm flex items-center gap-2">
              <DollarSign size={16} className="text-primary-light" />
              Resultado por Cultura
            </h4>
            <span className="text-[10px] text-slate-500 font-bold">receita_bruta = produção_total × preço_venda</span>
          </div>
          <table className="w-full table-striped">
            <thead>
              <tr className="border-b border-industrial-border bg-slate-900/50">
                {['Cultura', 'Área (ha)', 'Produtiv.', 'Produção (sc)', 'Preço/sc', 'Receita Bruta', '% Receita'].map(h => (
                  <th key={h} className="p-3 text-left text-[9px] uppercase tracking-widest text-slate-600 font-black">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {financials.cultureResults.map((c, i) => (
                <motion.tr key={c.cultura} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-industrial-border/50 hover:bg-slate-800/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-sm font-bold">{c.cultura}</span>
                    </div>
                  </td>
                  <td className={cn("p-3 text-sm font-mono privacy-mask", isPrivate && "privacy-hidden")}>{c.area.toLocaleString('pt-BR')}</td>
                  <td className={cn("p-3 text-sm font-mono privacy-mask", isPrivate && "privacy-hidden")}>{c.produtividade} sc/ha</td>
                  <td className={cn("p-3 text-sm font-mono font-bold privacy-mask", isPrivate && "privacy-hidden")}>{c.producaoTotal.toLocaleString('pt-BR')}</td>
                  <td className={cn("p-3 text-sm font-mono privacy-mask", isPrivate && "privacy-hidden")}>R$ {c.precoVenda.toFixed(2)}</td>
                  <td className={cn("p-3 text-sm font-bold font-mono text-emerald-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmt(c.receitaBruta)}</td>
                  <td className="p-3 text-sm font-mono text-cyan-400">{(c.receitaBruta / financials.receitaBruta * 100).toFixed(1)}%</td>
                </motion.tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-primary/30 bg-slate-900/30">
                <td className="p-3 text-xs font-semibold text-slate-400">Total</td>
                <td className={cn("p-3 text-sm font-bold font-mono text-slate-300 privacy-mask", isPrivate && "privacy-hidden")}>
                  {financials.cultureResults.reduce((s, c) => s + c.area, 0).toLocaleString('pt-BR')}
                </td>
                <td className="p-3 text-sm text-slate-500">—</td>
                <td className={cn("p-3 text-sm font-bold font-mono text-slate-300 privacy-mask", isPrivate && "privacy-hidden")}>
                  {financials.cultureResults.reduce((s, c) => s + c.producaoTotal, 0).toLocaleString('pt-BR')}
                </td>
                <td className="p-3 text-sm text-slate-500">—</td>
                <td className={cn("p-3 text-sm font-black font-mono text-primary-light privacy-mask", isPrivate && "privacy-hidden")}>{fmt(financials.receitaBruta)}</td>
                <td className="p-3 text-sm font-mono text-cyan-400">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Integration Footer */}
        <div className="mt-6 bg-industrial-card border border-primary/30 p-5">
          <div className="flex items-center gap-3 mb-3">
            <ArrowRight size={14} className="text-primary-light" />
            <h4 className="font-bold uppercase tracking-tight text-sm">Fluxo de Integração</h4>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            {['Produção', 'Receita Bruta', 'CMV', 'Lucro Bruto', 'EBITDA', 'Lucro Líquido', 'DRE', 'Balanço'].map((step, i, arr) => (
              <React.Fragment key={step}>
                <span className={cn("px-3 py-1 border font-bold uppercase tracking-widest",
                  i === arr.length - 1 || i === arr.length - 2 ? "border-primary text-primary-light bg-primary/10" : "border-slate-700"
                )}>{step}</span>
                {i < arr.length - 1 && <ArrowRight size={12} className="text-slate-600 flex-shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>
    </MainContent>
  );
}
