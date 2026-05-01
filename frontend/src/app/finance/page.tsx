'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { MetricCard } from '@/components/MetricCard';
import { usePrivacy } from '@/context/PrivacyContext';
import { useGlobalFilter } from '@/context/GlobalFilterContext';
import { cn } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, ArrowRight, Activity, DollarSign,
  Percent, BarChart3, RefreshCw, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getProductions, getAllCosts, getLiabilities, ProductionRecord, CostRecord, Liability, getAssets, Asset } from '@/lib/supabase/database';

export default function FinancePage() {
  const { isPrivate } = usePrivacy();
  const { safra: filterSafra, fazenda: filterFazenda, cultura: filterCultura } = useGlobalFilter();

  const [productions, setProductions] = useState<ProductionRecord[]>([]);
  const [costs, setCosts] = useState<CostRecord[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [p, c, l, a] = await Promise.all([
          getProductions(),
          getAllCosts(),
          getLiabilities(),
          getAssets()
        ]);
        setProductions(p);
        setCosts(c);
        setLiabilities(l);
        setAssets(a);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const data = useMemo(() => {
    let receitaBruta = 0;
    let cmvTotal = 0;
    let despAdmin = 0;
    let despFinan = 0;
    let totalAssets = 0;
    let totalLiabilities = 0;

    const catMap: Record<string, number> = { Insumos: 0, Servicos: 0, MaoDeObra: 0, Armazenagem: 0, Despesas: 0 };
    const monthMap: Record<string, { receita: number, custos: number }> = {};
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    months.forEach(m => monthMap[m] = { receita: 0, custos: 0 });

    productions.forEach(p => {
      const culturaInfo = p.Cultura as any;
      const safraName = culturaInfo?.Safra?.year || 'Desconhecida';
      const fazendaName = culturaInfo?.Safra?.Farm?.name || 'Desconhecida';
      const culturaName = culturaInfo?.name || 'Outros';

      if (filterSafra && safraName !== filterSafra) return;
      if (filterFazenda && !fazendaName.includes(filterFazenda)) return;
      if (filterCultura && culturaName !== filterCultura) return;

      let defaultPrice = 100;
      if (culturaName.toLowerCase().includes('soja')) defaultPrice = 120;
      if (culturaName.toLowerCase().includes('milho')) defaultPrice = 60;
      if (culturaName.toLowerCase().includes('algodão')) defaultPrice = 200;

      const rec = (p.totalProduction || 0) * defaultPrice;
      receitaBruta += rec;

      const distMonths = ['Jul', 'Ago', 'Set', 'Out', 'Nov'];
      const slice = rec / distMonths.length;
      distMonths.forEach(m => monthMap[m].receita += slice);
    });

    costs.forEach(c => {
      const culturaInfo = c.Cultura as any;
      const safraName = culturaInfo?.Safra?.year || 'Desconhecida';
      const fazendaName = culturaInfo?.Safra?.Farm?.name || 'Desconhecida';
      const culturaName = culturaInfo?.name || 'Outros';

      if (filterSafra && safraName !== filterSafra) return;
      if (filterFazenda && !fazendaName.includes(filterFazenda)) return;
      if (filterCultura && culturaName !== filterCultura) return;

      const cTotal = c.items?.reduce((acc, i) => acc + (i.value || 0), 0) || 0;

      if (c.type === 'INSUMO' || c.type === 'SERVICO' || c.type === 'MAO_DE_OBRA' || c.type === 'ARMAZENAGEM' || c.type === 'FRETE') {
        cmvTotal += cTotal;
        if (c.type === 'INSUMO') catMap['Insumos'] += cTotal;
        else if (c.type === 'SERVICO') catMap['Servicos'] += cTotal;
        else if (c.type === 'MAO_DE_OBRA') catMap['MaoDeObra'] += cTotal;
        else if (c.type === 'ARMAZENAGEM') catMap['Armazenagem'] += cTotal;
        else catMap['Despesas'] += cTotal;
      } else if (c.type === 'ADMINISTRATIVO' || c.type === 'CONSULTORIA') {
        despAdmin += cTotal;
        catMap['Despesas'] += cTotal;
      } else if (c.type === 'FINANCEIRO') {
        despFinan += cTotal;
        catMap['Despesas'] += cTotal;
      } else {
        despAdmin += cTotal;
        catMap['Despesas'] += cTotal;
      }

      const date = new Date(c.createdAt || Date.now());
      const mIdx = date.getMonth();
      if (months[mIdx]) {
        monthMap[months[mIdx]].custos += cTotal;
      }
    });

    liabilities.forEach(l => {
      if (filterFazenda && l.farmId !== filterFazenda) return;
      totalLiabilities += l.value;
    });

    assets.forEach(a => {
      if (filterFazenda && a.farmId !== filterFazenda) return;
      totalAssets += a.value;
    });

    const lucroBruto = receitaBruta - cmvTotal;
    const ebitda = lucroBruto - despAdmin;
    const lucroLiquido = ebitda - despFinan;

    const dreData = [
      { label: 'Receita Bruta', value: receitaBruta, pct: 100 },
      { label: '(-) Impostos s/ Vendas', value: -(receitaBruta * 0.05), pct: -5 },
      { label: 'Receita Líquida', value: receitaBruta * 0.95, pct: 95 },
      { label: '(-) CMV', value: -cmvTotal, pct: receitaBruta > 0 ? -Math.round((cmvTotal / receitaBruta) * 100) : 0 },
      { label: 'Lucro Bruto', value: lucroBruto, pct: receitaBruta > 0 ? Math.round((lucroBruto / receitaBruta) * 100) : 0 },
      { label: '(-) Desp. Operacionais', value: -despAdmin, pct: receitaBruta > 0 ? -Math.round((despAdmin / receitaBruta) * 100) : 0 },
      { label: 'EBITDA', value: ebitda, pct: receitaBruta > 0 ? Math.round((ebitda / receitaBruta) * 100) : 0 },
      { label: '(-) Depreciação / Juros', value: -despFinan, pct: receitaBruta > 0 ? -Math.round((despFinan / receitaBruta) * 100) : 0 },
      { label: 'Lucro Líquido', value: lucroLiquido, pct: receitaBruta > 0 ? Math.round((lucroLiquido / receitaBruta) * 100) : 0 },
    ];

    const catColors = { Insumos: '#10b981', Servicos: '#f59e0b', MaoDeObra: '#3b82f6', Armazenagem: '#8b5cf6', Despesas: '#64748b' };
    const costBreakdown = Object.entries(catMap).filter(([_, v]) => v > 0).map(([name, value]) => ({
      name, value, color: catColors[name as keyof typeof catColors] || '#000'
    })).sort((a, b) => b.value - a.value);

    // Normalize percentage to 100 for pie chart tooltip if needed, or we just pass real value and recharts handles % display implicitly.

    const monthlyRevenue = months.map(m => ({
      month: m,
      receita: monthMap[m].receita,
      custo: monthMap[m].custos
    }));

    const kpis = {
      margemEbitda: receitaBruta > 0 ? (ebitda / receitaBruta * 100).toFixed(1) : '0.0',
      liquidez: totalLiabilities > 0 ? (totalAssets / totalLiabilities).toFixed(2) : 'N/A',
      endividamento: totalAssets > 0 ? (totalLiabilities / totalAssets * 100).toFixed(1) : '0.0',
      roe: (totalAssets - totalLiabilities) > 0 ? (lucroLiquido / (totalAssets - totalLiabilities) * 100).toFixed(1) : '0.0',
      margemLiquida: receitaBruta > 0 ? (lucroLiquido / receitaBruta * 100).toFixed(1) : '0.0',
      giroAtivo: totalAssets > 0 ? (receitaBruta / totalAssets).toFixed(2) : '0.00'
    };

    return { dreData, costBreakdown, monthlyRevenue, kpis };
  }, [productions, costs, liabilities, assets, filterSafra, filterFazenda, filterCultura]);

  if (loading) {
    return (
      <MainContent>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4 text-slate-400">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p>Calculando Análise Financeira...</p>
          </div>
        </div>
      </MainContent>
    );
  }

  return (
    <MainContent>
      <PageHeader
        title="Análise"
        accent="Financeira"
        description={`DRE consolidado, indicadores de performance e composição de custos — Safra ${filterSafra || 'Todas'}`}
        badge={
          <button className="bg-primary hover:bg-primary-light text-white font-semibold px-5 py-2 text-xs flex items-center gap-2 transition-all rounded-lg">
            Exportar PDF <ArrowRight size={14} />
          </button>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <MetricCard title="Margem EBITDA" value={`${data.kpis.margemEbitda}%`} change={0} icon={Activity} accentColor="#3B82F6" changeLabel="vs safra anterior" />
        <MetricCard title="Liquidez Corrente" value={data.kpis.liquidez} change={0} icon={RefreshCw} accentColor="#10B981" changeLabel="vs safra anterior" />
        <MetricCard title="Endividamento" value={`${data.kpis.endividamento}%`} change={0} icon={TrendingDown} accentColor="#10B981" changeLabel="" />
        <MetricCard title="ROE" value={`${data.kpis.roe}%`} change={0} invertChange icon={Percent} accentColor="#EF4444" changeLabel="vs safra anterior" />
        <MetricCard title="Margem Líquida" value={`${data.kpis.margemLiquida}%`} change={0} icon={TrendingUp} accentColor="#3B82F6" changeLabel="vs safra anterior" />
        <MetricCard title="Giro do Ativo" value={data.kpis.giroAtivo} change={0} icon={BarChart3} accentColor="#10B981" changeLabel="vs safra anterior" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* DRE Table */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="p-5 border-b border-industrial-border flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white">Demonstrativo de Resultado (DRE)</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Safra {filterSafra || 'Todas'} — Consolidado</p>
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
              {data.dreData.map((row, i) => {
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
              <Pie data={data.costBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={45} strokeWidth={0}>
                {data.costBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f1724', border: '1px solid #1a2332', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {data.costBreakdown.map((c) => {
              const totalBreakdown = data.costBreakdown.reduce((sum, item) => sum + item.value, 0);
              const pct = totalBreakdown > 0 ? (c.value / totalBreakdown * 100).toFixed(1) : '0.0';
              return (
                <div key={c.name} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-slate-400">{c.name}</span>
                  </div>
                  <span className="font-bold text-slate-300">{pct}%</span>
                </div>
              );
            })}
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
          <BarChart data={data.monthlyRevenue} barGap={2}>
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
