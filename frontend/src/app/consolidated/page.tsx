'use client';

import React, { useMemo } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { usePrivacy } from '@/context/PrivacyContext';
import { cn } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, Wheat, DollarSign, BarChart3,
  Factory, MapPin, Layers, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, AreaChart, Area
} from 'recharts';

// Aggregated data from all farms and cultures
const fazendas = [
  { nome: 'São José', area: 1200, culturas: ['Soja', 'Milho'] },
  { nome: 'Boa Vista', area: 800, culturas: ['Soja', 'Algodão', 'Café'] },
  { nome: 'Santa Clara', area: 200, culturas: ['Milho', 'Trigo'] },
];

const culturasData = [
  { cultura: 'Soja', area: 620, produtividade: 60, producao: 37200, precoVenda: 135, receitaBruta: 5022000, custos: 1280000, fazenda: 'São José' },
  { cultura: 'Milho', area: 380, produtividade: 180, producao: 68400, precoVenda: 58, receitaBruta: 3967200, custos: 890000, fazenda: 'São José' },
  { cultura: 'Soja', area: 500, produtividade: 62, producao: 31000, precoVenda: 135, receitaBruta: 4185000, custos: 1050000, fazenda: 'Boa Vista' },
  { cultura: 'Algodão', area: 200, produtividade: 280, producao: 56000, precoVenda: 214, receitaBruta: 11984000, custos: 2200000, fazenda: 'Boa Vista' },
  { cultura: 'Café', area: 100, produtividade: 35, producao: 3500, precoVenda: 1200, receitaBruta: 4200000, custos: 980000, fazenda: 'Boa Vista' },
  { cultura: 'Milho', area: 120, produtividade: 165, producao: 19800, precoVenda: 58, receitaBruta: 1148400, custos: 320000, fazenda: 'Santa Clara' },
  { cultura: 'Trigo', area: 80, produtividade: 50, producao: 4000, precoVenda: 95, receitaBruta: 380000, custos: 160000, fazenda: 'Santa Clara' },
];

const custosOperacionais = {
  insumos: 3480000, servicos: 1658000, maoDeObra: 1420000,
  armazenagem: 580000, despesas: 490250, consultoria: 206700,
};

const cultureColors: Record<string, string> = { Soja: '#10b981', Milho: '#06b6d4', Algodão: '#f59e0b', Café: '#a855f7', Trigo: '#ef4444' };

const safras = ['2022/23', '2023/24', '2024/25'];
const historicoSafras = [
  { safra: '2022/23', receita: 24500000, custos: 7200000, lucro: 17300000 },
  { safra: '2023/24', receita: 28100000, custos: 7600000, lucro: 20500000 },
  { safra: '2024/25', receita: 30886600, custos: 8880000, lucro: 22006600 },
];

export default function ConsolidatedPage() {
  const { isPrivate } = usePrivacy();

  const consolidated = useMemo(() => {
    const producaoTotal = culturasData.reduce((s, d) => s + d.producao, 0);
    const receitaTotal = culturasData.reduce((s, d) => s + d.receitaBruta, 0);
    const custosProducao = culturasData.reduce((s, d) => s + d.custos, 0);
    const totalCustosOp = Object.values(custosOperacionais).reduce((s, v) => s + v, 0);
    const custosTotal = custosProducao + totalCustosOp;
    const lucroTotal = receitaTotal - custosTotal;
    const margemLucro = receitaTotal > 0 ? (lucroTotal / receitaTotal * 100) : 0;
    const areaTotal = culturasData.reduce((s, d) => s + d.area, 0);

    // By culture
    const porCultura: Record<string, { producao: number; receita: number; custos: number; lucro: number; area: number }> = {};
    culturasData.forEach(d => {
      if (!porCultura[d.cultura]) porCultura[d.cultura] = { producao: 0, receita: 0, custos: 0, lucro: 0, area: 0 };
      porCultura[d.cultura].producao += d.producao;
      porCultura[d.cultura].receita += d.receitaBruta;
      porCultura[d.cultura].custos += d.custos;
      porCultura[d.cultura].lucro += d.receitaBruta - d.custos;
      porCultura[d.cultura].area += d.area;
    });

    // By fazenda
    const porFazenda: Record<string, { producao: number; receita: number; custos: number; lucro: number; area: number; culturas: string[] }> = {};
    culturasData.forEach(d => {
      if (!porFazenda[d.fazenda]) porFazenda[d.fazenda] = { producao: 0, receita: 0, custos: 0, lucro: 0, area: 0, culturas: [] };
      porFazenda[d.fazenda].producao += d.producao;
      porFazenda[d.fazenda].receita += d.receitaBruta;
      porFazenda[d.fazenda].custos += d.custos;
      porFazenda[d.fazenda].lucro += d.receitaBruta - d.custos;
      porFazenda[d.fazenda].area += d.area;
      if (!porFazenda[d.fazenda].culturas.includes(d.cultura)) porFazenda[d.fazenda].culturas.push(d.cultura);
    });

    return { producaoTotal, receitaTotal, custosTotal, lucroTotal, margemLucro, areaTotal, porCultura, porFazenda, custosProducao, totalCustosOp };
  }, []);

  const cultureChart = Object.entries(consolidated.porCultura)
    .map(([cultura, d]) => ({ name: cultura, receita: d.receita, custos: d.custos, lucro: d.lucro, color: cultureColors[cultura] }))
    .sort((a, b) => b.receita - a.receita);

  const receitaPie = Object.entries(consolidated.porCultura)
    .map(([cultura, d]) => ({ name: cultura, value: d.receita, color: cultureColors[cultura] }))
    .sort((a, b) => b.value - a.value);

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const fmtM = (v: number) => `R$ ${(v / 1000000).toFixed(2)}M`;
  const fmtK = (v: number) => `${(v / 1000).toFixed(0)}k`;

  return (
    <MainContent>
        <PageHeader
        title="Consolidado"
        accent="Todas as Fazendas"
        description="Visão consolidada de todas as fazendas, culturas e indicadores financeiros."
      />

        {/* Big KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Produção Total', value: `${(consolidated.producaoTotal / 1000).toFixed(1)}k`, sub: 'sacas / fardos', icon: Wheat, color: 'text-emerald-400', borderColor: 'border-emerald-500/30' },
            { label: 'Receita Total', value: fmtM(consolidated.receitaTotal), sub: 'receita bruta consolidada', icon: TrendingUp, color: 'text-primary-light', borderColor: 'border-primary/30' },
            { label: 'Custos Totais', value: fmtM(consolidated.custosTotal), sub: 'produção + operacionais', icon: TrendingDown, color: 'text-red-400', borderColor: 'border-red-500/30' },
            { label: 'Lucro Total', value: fmtM(consolidated.lucroTotal), sub: `margem ${consolidated.margemLucro.toFixed(1)}%`, icon: DollarSign, color: 'text-primary-light', borderColor: 'border-primary/30' },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={cn("card p-6", kpi.borderColor)}>
              <div className="flex items-center gap-2 mb-3">
                <kpi.icon size={18} className={kpi.color} />
                <p className="text-[9px] uppercase tracking-widest text-slate-500 font-black">{kpi.label}</p>
              </div>
              <p className={cn("text-3xl font-bold tracking-tight font-mono privacy-mask", kpi.color, isPrivate && "privacy-hidden")}>{kpi.value}</p>
              <p className="text-[10px] text-slate-600 mt-1">{kpi.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Info strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Fazendas', value: fazendas.length.toString() },
            { label: 'Culturas', value: Object.keys(consolidated.porCultura).length.toString() },
            { label: 'Área Total', value: `${consolidated.areaTotal.toLocaleString('pt-BR')} ha` },
            { label: 'Safra', value: '2024/25' },
          ].map((s, i) => (
            <div key={s.label} className="card p-3 flex justify-between items-center">
              <span className="text-[9px] uppercase tracking-widest text-slate-600 font-black">{s.label}</span>
              <span className="text-sm font-bold font-mono text-slate-300">{s.value}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* Bar chart */}
          <div className="col-span-2 card p-6">
            <h4 className="font-bold uppercase tracking-tight text-sm mb-4 flex items-center gap-2">
              <BarChart3 size={14} className="text-primary-light" />
              Receita vs Custos por Cultura
            </h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={cultureChart} barGap={4}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#475569' }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip contentStyle={{ background: '#0f1724', border: '1px solid #1a2332', borderRadius: 8, fontSize: 11 }}
                  formatter={(value) => [fmt(Number(value)), '']} />
                <Bar dataKey="receita" name="Receita" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="custos" name="Custos" fill="#ef4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue pie */}
          <div className="card p-6">
            <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Receita por Cultura</h4>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={receitaPie} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40} strokeWidth={0}>
                  {receitaPie.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f1724', border: '1px solid #1a2332', borderRadius: 8, fontSize: 11 }}
                  formatter={(value) => [fmtM(Number(value)), '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {receitaPie.map(p => (
                <div key={p.name} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-slate-400">{p.name}</span>
                  </div>
                  <span className={cn("font-bold font-mono text-slate-300 privacy-mask", isPrivate && "privacy-hidden")}>
                    {consolidated.receitaTotal > 0 ? `${(p.value / consolidated.receitaTotal * 100).toFixed(1)}%` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tables row */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* By Culture Table */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-industrial-border flex items-center gap-2">
              <Layers size={14} className="text-primary-light" />
              <h4 className="font-bold uppercase tracking-tight text-sm">Por Cultura</h4>
            </div>
            <table className="w-full table-striped">
              <thead>
                <tr className="border-b border-industrial-border bg-slate-900/50">
                  {['Cultura', 'Produção', 'Receita', 'Custos', 'Lucro'].map(h => (
                    <th key={h} className="p-3 text-left text-[8px] uppercase tracking-widest text-slate-600 font-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(consolidated.porCultura).sort(([, a], [, b]) => b.receita - a.receita).map(([cultura, d], i) => (
                  <motion.tr key={cultura} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-industrial-border/50 hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cultureColors[cultura] }} />
                        <span className="text-sm font-bold">{cultura}</span>
                      </div>
                    </td>
                    <td className={cn("p-3 text-xs font-mono privacy-mask", isPrivate && "privacy-hidden")}>{d.producao.toLocaleString('pt-BR')}</td>
                    <td className={cn("p-3 text-xs font-mono text-emerald-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmtM(d.receita)}</td>
                    <td className={cn("p-3 text-xs font-mono text-red-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmtM(d.custos)}</td>
                    <td className={cn("p-3 text-xs font-bold font-mono text-primary-light privacy-mask", isPrivate && "privacy-hidden")}>{fmtM(d.lucro)}</td>
                  </motion.tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-primary/30 bg-slate-900/30">
                  <td className="p-3 text-xs font-semibold text-slate-400">Total</td>
                  <td className={cn("p-3 text-xs font-bold font-mono privacy-mask", isPrivate && "privacy-hidden")}>{fmtK(consolidated.producaoTotal)}</td>
                  <td className={cn("p-3 text-xs font-bold font-mono text-emerald-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmtM(consolidated.receitaTotal)}</td>
                  <td className={cn("p-3 text-xs font-bold font-mono text-red-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmtM(consolidated.custosProducao)}</td>
                  <td className={cn("p-3 text-xs font-black font-mono text-primary-light privacy-mask", isPrivate && "privacy-hidden")}>{fmtM(consolidated.receitaTotal - consolidated.custosProducao)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* By Fazenda Table */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-industrial-border flex items-center gap-2">
              <MapPin size={14} className="text-primary-light" />
              <h4 className="font-bold uppercase tracking-tight text-sm">Por Fazenda</h4>
            </div>
            <table className="w-full table-striped">
              <thead>
                <tr className="border-b border-industrial-border bg-slate-900/50">
                  {['Fazenda', 'Área', 'Receita', 'Custos', 'Lucro'].map(h => (
                    <th key={h} className="p-3 text-left text-[8px] uppercase tracking-widest text-slate-600 font-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(consolidated.porFazenda).sort(([, a], [, b]) => b.receita - a.receita).map(([fazenda, d], i) => (
                  <motion.tr key={fazenda} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-industrial-border/50 hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div>
                        <span className="text-sm font-bold">{fazenda}</span>
                        <div className="flex gap-1 mt-1">
                          {d.culturas.map(c => (
                            <span key={c} className="text-[7px] px-1.5 py-0.5 bg-slate-800 text-slate-500 uppercase tracking-widest">{c}</span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-xs text-slate-500">{d.area.toLocaleString('pt-BR')} ha</td>
                    <td className={cn("p-3 text-xs font-mono text-emerald-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmtM(d.receita)}</td>
                    <td className={cn("p-3 text-xs font-mono text-red-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmtM(d.custos)}</td>
                    <td className={cn("p-3 text-xs font-bold font-mono text-primary-light privacy-mask", isPrivate && "privacy-hidden")}>{fmtM(d.lucro)}</td>
                  </motion.tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-primary/30 bg-slate-900/30">
                  <td className="p-3 text-xs font-semibold text-slate-400">Total</td>
                  <td className="p-3 text-xs font-bold text-slate-500">{consolidated.areaTotal.toLocaleString('pt-BR')} ha</td>
                  <td className={cn("p-3 text-xs font-bold font-mono text-emerald-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmtM(consolidated.receitaTotal)}</td>
                  <td className={cn("p-3 text-xs font-bold font-mono text-red-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmtM(consolidated.custosProducao)}</td>
                  <td className={cn("p-3 text-xs font-black font-mono text-primary-light privacy-mask", isPrivate && "privacy-hidden")}>{fmtM(consolidated.receitaTotal - consolidated.custosProducao)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Evolution + Cost breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Evolution */}
          <div className="col-span-2 card p-6">
            <h4 className="font-bold uppercase tracking-tight text-sm mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-primary-light" />
              Evolução por Safra
            </h4>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={historicoSafras}>
                <XAxis dataKey="safra" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#475569' }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip contentStyle={{ background: '#0f1724', border: '1px solid #1a2332', borderRadius: 8, fontSize: 11 }}
                  formatter={(value) => [fmtM(Number(value)), '']} />
                <Area type="monotone" dataKey="receita" stroke="#10b981" fill="#10b98120" name="Receita" strokeWidth={2} />
                <Area type="monotone" dataKey="lucro" stroke="#06b6d4" fill="#06b6d420" name="Lucro" strokeWidth={2} />
                <Area type="monotone" dataKey="custos" stroke="#ef4444" fill="#ef444420" name="Custos" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Cost breakdown */}
          <div className="card p-6">
            <h4 className="font-bold uppercase tracking-tight text-sm mb-4 flex items-center gap-2">
              <Factory size={14} className="text-red-400" />
              Composição de Custos
            </h4>
            <div className="space-y-3">
              {[
                { label: 'Custos de Produção', value: consolidated.custosProducao, color: '#ef4444' },
                { label: 'Insumos', value: custosOperacionais.insumos, color: '#f97316' },
                { label: 'Serviços', value: custosOperacionais.servicos, color: '#f59e0b' },
                { label: 'Mão de Obra', value: custosOperacionais.maoDeObra, color: '#06b6d4' },
                { label: 'Armazenagem', value: custosOperacionais.armazenagem, color: '#a855f7' },
                { label: 'Despesas Adm.', value: custosOperacionais.despesas, color: '#64748b' },
                { label: 'Consultoria', value: custosOperacionais.consultoria, color: '#22c55e' },
              ].map(c => (
                <div key={c.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-slate-500">{c.label}</span>
                    <span className={cn("text-[10px] font-mono font-bold privacy-mask", isPrivate && "privacy-hidden")} style={{ color: c.color }}>{fmt(c.value)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full">
                    <div className="h-full" style={{ backgroundColor: c.color, width: `${(c.value / consolidated.custosTotal * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-industrial-border mt-4 pt-3 flex justify-between">
              <span className="text-xs font-black uppercase text-slate-400">Custo Total</span>
              <span className={cn("text-xs font-black font-mono text-red-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmtM(consolidated.custosTotal)}</span>
            </div>
          </div>
        </div>
    </MainContent>
  );
}
