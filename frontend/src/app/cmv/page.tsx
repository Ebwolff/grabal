'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { usePrivacy } from '@/context/PrivacyContext';
import { useGlobalFilter } from '@/context/GlobalFilterContext';
import { cn } from '@/lib/utils';
import {
  TrendingUp, Package, Tractor, HardHat, Warehouse, FileSpreadsheet,
  GraduationCap, Truck, DollarSign, Target, ArrowRight, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Cell as PieCell
} from 'recharts';
import { getProductions, getAllCosts, ProductionRecord, CostRecord } from '@/lib/supabase/database';

const cultureColors = ['#10b981', '#06b6d4', '#f59e0b', '#a855f7', '#ef4444'];

export default function CMVPage() {
  const { isPrivate } = usePrivacy();
  const { safra: filterSafra, fazenda: filterFazenda, cultura: filterCultura } = useGlobalFilter();

  const [costs, setCosts] = useState<CostRecord[]>([]);
  const [productions, setProductions] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [receitaBrutaGlobal, setReceitaBrutaGlobal] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [allCosts, allProds] = await Promise.all([
          getAllCosts(),
          getProductions()
        ]);
        setCosts(allCosts);
        setProductions(allProds);

        // Calcula Receita Bruta Global mockada com defaultPrices (igual DRE) para usar nos KPIs (CMV/Receita)
        let rb = 0;
        allProds.forEach(p => {
          const cName = (p.Cultura as any)?.name?.toLowerCase() || '';
          let defaultPrice = 100;
          if (cName.includes('soja')) defaultPrice = 120;
          if (cName.includes('milho')) defaultPrice = 60;
          if (cName.includes('algodão')) defaultPrice = 200;
          rb += (p.totalProduction || 0) * defaultPrice;
        });
        setReceitaBrutaGlobal(rb);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const { culturaTotals, costCategories, dreIntegration, cmvTotal, areaTotal } = useMemo(() => {
    const cmvMap: Record<string, any> = {};
    const catMap = {
      insumos: 0,
      servicos: 0,
      maoDeObra: 0,
      armazenagem: 0,
      despesas: 0,
      consultoria: 0,
      frete: 0
    };

    let totalCMV = 0;

    costs.forEach(c => {
      const culturaInfo = c.Cultura as any;
      const safraName = culturaInfo?.Safra?.year || 'Desconhecida';
      const fazendaName = culturaInfo?.Safra?.Farm?.name || 'Desconhecida';
      const culturaName = culturaInfo?.name || 'Geral';

      if (filterSafra && safraName !== filterSafra) return;
      if (filterFazenda && !fazendaName.includes(filterFazenda)) return;
      if (filterCultura && culturaName !== filterCultura) return;

      if (!cmvMap[culturaName]) {
        cmvMap[culturaName] = { cultura: culturaName, insumos: 0, servicos: 0, maoDeObra: 0, armazenagem: 0, despesas: 0, consultoria: 0, frete: 0, total: 0 };
      }

      const costValue = c.items?.reduce((acc, i) => acc + (i.value || 0), 0) || 0;

      // Agrupar
      if (c.type === 'INSUMO') { cmvMap[culturaName].insumos += costValue; catMap.insumos += costValue; totalCMV += costValue; }
      else if (c.type === 'MAO_DE_OBRA') { cmvMap[culturaName].maoDeObra += costValue; catMap.maoDeObra += costValue; totalCMV += costValue; }
      else if (c.type === 'ARMAZENAGEM') { cmvMap[culturaName].armazenagem += costValue; catMap.armazenagem += costValue; totalCMV += costValue; }
      // Outros caem fora do CMV produtivo, mas no mock do CMV page havia frete/despesas
      else if (c.type === 'SERVICO') { cmvMap[culturaName].servicos += costValue; catMap.servicos += costValue; totalCMV += costValue; }
      else if (c.type === 'CONSULTORIA') { cmvMap[culturaName].consultoria += costValue; catMap.consultoria += costValue; totalCMV += costValue; }
      else if (c.type === 'FRETE') { cmvMap[culturaName].frete += costValue; catMap.frete += costValue; totalCMV += costValue; }
      else {
        // Despesas genéricas
        cmvMap[culturaName].despesas += costValue; catMap.despesas += costValue; totalCMV += costValue;
      }

      cmvMap[culturaName].total += costValue;
    });

      const cTotals = Object.values(cmvMap).sort((a: any, b: any) => b.total - a.total);

    let areaTotal = 0;
    // Calculate areaTotal from productions matching filters
    productions.forEach(p => {
      const culturaInfo = p.Cultura as any;
      const safraName = culturaInfo?.Safra?.year || 'Desconhecida';
      const fazendaName = culturaInfo?.Safra?.Farm?.name || 'Desconhecida';
      const culturaName = culturaInfo?.name || 'Geral';
      if (filterSafra && safraName !== filterSafra) return;
      if (filterFazenda && !fazendaName.includes(filterFazenda)) return;
      if (filterCultura && culturaName !== filterCultura) return;
      areaTotal += p.area || 0;
    });

    const cCategories = [
      { key: 'insumos', label: 'Insumos / Químicos', icon: Package, color: '#10b981', value: catMap.insumos },
      { key: 'servicos', label: 'Serv. Mecanizados', icon: Tractor, color: '#f59e0b', value: catMap.servicos },
      { key: 'maoDeObra', label: 'Mão de Obra', icon: HardHat, color: '#3b82f6', value: catMap.maoDeObra },
      { key: 'armazenagem', label: 'Armazenagem', icon: Warehouse, color: '#8b5cf6', value: catMap.armazenagem },
      { key: 'despesas', label: 'Despesas Gerais', icon: FileSpreadsheet, color: '#64748b', value: catMap.despesas },
      { key: 'consultoria', label: 'Consultoria', icon: GraduationCap, color: '#0ea5e9', value: catMap.consultoria },
      { key: 'frete', label: 'Fretes', icon: Truck, color: '#ef4444', value: catMap.frete },
    ].filter(c => c.value > 0);

    const rb = receitaBrutaGlobal > 0 ? receitaBrutaGlobal : totalCMV * 1.5; // fallback
    const lb = rb - totalCMV;
    const dreInt = [
      { label: 'Receita Bruta (Est.)', value: rb, indent: 0, highlight: true },
      { label: '(-) CMV Total', value: -totalCMV, indent: 0, accent: true },
      { label: '  ↳ Insumos', value: -catMap.insumos, indent: 1 },
      { label: '  ↳ Serv. Mecanizados', value: -catMap.servicos, indent: 1 },
      { label: '  ↳ Mão de Obra', value: -catMap.maoDeObra, indent: 1 },
      { label: '  ↳ Outros', value: -(catMap.armazenagem + catMap.despesas + catMap.consultoria + catMap.frete), indent: 1 },
      { label: 'Lucro Bruto', value: lb, indent: 0, highlight: true },
      { label: 'Margem Bruta', value: lb / rb * 100, indent: 1, pct: true },
    ];

    return { culturaTotals: cTotals, costCategories: cCategories, dreIntegration: dreInt, cmvTotal: totalCMV, areaTotal };
  }, [costs, productions, filterSafra, filterFazenda, filterCultura, receitaBrutaGlobal]);

  const pieData = culturaTotals.map((c: any, i) => ({
    name: c.cultura, value: c.total, color: cultureColors[i % cultureColors.length],
  }));

  const barData = costCategories.map(c => ({ name: c.label, value: c.value, color: c.color }));

  const fmt = (v: number) => `R$ ${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const fmtK = (v: number) => `R$ ${(v / 1000).toFixed(0)}k`;

  if (loading) {
    return (
      <MainContent>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4 text-slate-400">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p>Calculando Custo da Mercadoria Vendida...</p>
          </div>
        </div>
      </MainContent>
    );
  }

  return (
    <MainContent>
        <PageHeader
        title="CMV"
        accent="Custo da Mercadoria"
        description="Custo da Mercadoria Vendida — cálculo detalhado por cultura."
      />

        {/* Cost Category Cards */}
        <div className="grid grid-cols-7 gap-3 mb-8">
          {costCategories.map((cat, i) => {
            const Icon = cat.icon;
            const pct = cmvTotal > 0 ? (cat.value / cmvTotal * 100).toFixed(1) : '0';
            return (
              <motion.div key={cat.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="card p-4 hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} style={{ color: cat.color }} />
                  <span className="text-[8px] uppercase tracking-widest text-slate-500 font-black">{cat.label}</span>
                </div>
                <p className={cn("text-sm font-bold font-mono privacy-mask", isPrivate && "privacy-hidden")} style={{ color: cat.color }}>{fmtK(cat.value)}</p>
                <p className="text-[10px] text-slate-600 font-mono mt-1">{pct}%</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* Bar Chart - Cost Breakdown */}
          <div className="col-span-2 card p-6">
            <h4 className="font-bold uppercase tracking-tight text-sm mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-primary-light" />
              Composição do CMV
            </h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} layout="vertical" margin={{ left: 90, right: 30 }}>
                <XAxis type="number" tickFormatter={(v) => fmtK(v)} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} width={85} />
                <Tooltip contentStyle={{ background: '#0f1724', border: '1px solid #1a2332', borderRadius: 8, fontSize: 11 }}
                  formatter={(value) => [fmt(Number(value)), '']} />
                <Bar dataKey="value" radius={[0, 2, 2, 0]}>
                  {barData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* DRE Integration */}
          <div className="card p-6">
            <h4 className="font-bold uppercase tracking-tight text-sm mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-primary-light" />
              Impacto no DRE
            </h4>
            <div className="space-y-3">
              {dreIntegration.map((row) => (
                <div key={row.label} className={cn("flex justify-between items-center py-1", row.highlight && "border-t border-industrial-border pt-2")}>
                  <span className={cn("text-xs", row.accent ? "font-black text-red-400" : row.highlight ? "font-bold text-white" : "text-slate-400")}
                    style={{ paddingLeft: row.indent * 16 }}>
                    {row.label}
                  </span>
                  <span className={cn("text-xs font-mono font-bold privacy-mask", isPrivate && "privacy-hidden",
                    row.accent ? "text-red-400" : row.highlight ? "text-primary-light" : row.pct ? "text-cyan-400" : "text-slate-300"
                  )}>
                    {row.pct ? `${row.value}%` : row.value < 0 ? `(${fmt(row.value)})` : fmt(row.value)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-primary/30">
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <Target size={12} className="text-primary-light" />
                <span>CMV representa <strong className="text-white">{receitaBrutaGlobal > 0 ? (cmvTotal / receitaBrutaGlobal * 100).toFixed(1) : 0}%</strong> da Receita Bruta</span>
              </div>
            </div>
          </div>
        </div>

        {/* CMV por Cultura */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-2 card overflow-hidden">
            <div className="p-5 border-b border-industrial-border flex items-center justify-between">
              <h4 className="font-bold uppercase tracking-tight text-sm flex items-center gap-2">
                <Target size={16} className="text-primary-light" />
                CMV por Cultura
              </h4>
              <span className="text-[10px] text-slate-500 font-bold">{culturaTotals.length} culturas</span>
            </div>
            <table className="w-full table-striped">
              <thead>
                <tr className="border-b border-industrial-border bg-slate-900/50">
                  {['Cultura', 'Insumos', 'Serviços', 'Mão de Obra', 'Armaz.', 'Desp.', 'Consult.', 'Frete', 'CMV Total'].map(h => (
                    <th key={h} className="p-3 text-left text-[8px] uppercase tracking-widest text-slate-600 font-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {culturaTotals.map((row, i) => (
                  <motion.tr key={row.cultura} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-industrial-border/50 hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cultureColors[i] }} />
                        <span className="text-sm font-bold">{row.cultura}</span>
                      </div>
                    </td>
                    {[row.insumos, row.servicos, row.maoDeObra, row.armazenagem, row.despesas, row.consultoria, row.frete].map((val, j) => (
                      <td key={j} className={cn("p-3 text-[11px] font-mono text-slate-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmtK(val)}</td>
                    ))}
                    <td className={cn("p-3 text-sm font-black font-mono text-primary-light privacy-mask", isPrivate && "privacy-hidden")}>{fmt(row.total)}</td>
                  </motion.tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-primary/30 bg-slate-900/30">
                  <td className="p-3 text-xs font-semibold text-slate-400">Total</td>
                  {['insumos', 'servicos', 'maoDeObra', 'armazenagem', 'despesas', 'consultoria', 'frete'].map(key => {
                    const sum = culturaTotals.reduce((s, r) => s + (r as unknown as Record<string, number>)[key], 0);
                    return <td key={key} className={cn("p-3 text-[11px] font-bold font-mono text-slate-300 privacy-mask", isPrivate && "privacy-hidden")}>{fmtK(sum)}</td>;
                  })}
                  <td className={cn("p-3 text-sm font-black font-mono text-primary-light privacy-mask", isPrivate && "privacy-hidden")}>{fmt(cmvTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pie CMV by Culture */}
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4">CMV por Cultura</h4>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40} strokeWidth={0}>
                    {pieData.map((entry) => <PieCell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f1724', border: '1px solid #1a2332', borderRadius: 8, fontSize: 11 }}
                    formatter={(value) => [fmt(Number(value)), '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map(p => (
                  <div key={p.name} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-slate-400">{p.name}</span>
                    </div>
                    <span className={cn("font-bold font-mono text-slate-300 privacy-mask", isPrivate && "privacy-hidden")}>
                      {cmvTotal > 0 ? `${(p.value / cmvTotal * 100).toFixed(1)}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Flow Diagram */}
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Fórmula CMV</h4>
              <div className="space-y-2">
                {costCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <div key={cat.key} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Icon size={10} style={{ color: cat.color }} />
                        <span className="text-slate-400">{cat.label}</span>
                      </div>
                      <span className={cn("font-mono font-bold text-slate-500 privacy-mask", isPrivate && "privacy-hidden")}>{fmtK(cat.value)}</span>
                    </div>
                  );
                })}
                <div className="border-t border-primary/30 pt-2 mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowRight size={10} className="text-primary-light" />
                    <span className="text-xs font-black text-white">CMV Total</span>
                  </div>
                  <span className={cn("font-mono font-black text-primary-light privacy-mask", isPrivate && "privacy-hidden")}>{fmt(cmvTotal)}</span>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Indicadores</h4>
              <div className="space-y-3">
                {[
                  { label: 'CMV / Receita', value: `${receitaBrutaGlobal > 0 ? (cmvTotal / receitaBrutaGlobal * 100).toFixed(1) : 0}%`, desc: 'Eficiência operacional' },
                  { label: 'CMV / Hectare', value: fmt(areaTotal > 0 ? cmvTotal / areaTotal : 0), desc: `${areaTotal.toLocaleString('pt-BR')} ha plantados` },
                  { label: 'Margem Bruta', value: `${receitaBrutaGlobal > 0 ? ((1 - cmvTotal / receitaBrutaGlobal) * 100).toFixed(1) : 0}%`, desc: 'Receita Bruta − CMV' },
                ].map(kpi => (
                  <div key={kpi.label}>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[10px] uppercase tracking-widest text-slate-600 font-black">{kpi.label}</span>
                      <span className={cn("text-xs font-mono font-bold text-primary-light privacy-mask", isPrivate && "privacy-hidden")}>{kpi.value}</span>
                    </div>
                    <p className="text-[9px] text-slate-600">{kpi.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
    </MainContent>
  );
}
