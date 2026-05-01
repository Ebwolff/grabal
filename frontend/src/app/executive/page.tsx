'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { MetricCard } from '@/components/MetricCard';
import { FinancialChart } from '@/components/FinancialChart';
import { usePrivacy } from '@/context/PrivacyContext';
import { useGlobalFilter } from '@/context/GlobalFilterContext';
import { cn } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, Wheat, DollarSign, BarChart3,
  ArrowUpRight, ArrowDownRight, Activity, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import { getProductions, getAllCosts, getLiabilities, ProductionRecord, CostRecord, Liability } from '@/lib/supabase/database';

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
  const { safra: filterSafra, fazenda: filterFazenda, cultura: filterCultura } = useGlobalFilter();

  const [productions, setProductions] = useState<ProductionRecord[]>([]);
  const [costs, setCosts] = useState<CostRecord[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [p, c, l] = await Promise.all([
          getProductions(),
          getAllCosts(),
          getLiabilities()
        ]);
        setProductions(p);
        setCosts(c);
        setLiabilities(l);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const data = useMemo(() => {
    let receita = 0;
    let custo = 0;
    let producaoTotal = 0;
    const prodCultMap: Record<string, number> = {};
    const costCatMap: Record<string, number> = { Insumos: 0, Servicos: 0, MaoDeObra: 0, Armazenagem: 0, Outros: 0 };
    const monthMap: Record<string, { receita: number, custos: number }> = {};
    
    // Distribuição de receita ao longo de 12 meses (apenas ilustrativo/mock da divisão, mas com valor total real)
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

      producaoTotal += p.totalProduction || 0;
      prodCultMap[culturaName] = (prodCultMap[culturaName] || 0) + (p.totalProduction || 0);

      let defaultPrice = 100;
      if (culturaName.toLowerCase().includes('soja')) defaultPrice = 120;
      if (culturaName.toLowerCase().includes('milho')) defaultPrice = 60;
      if (culturaName.toLowerCase().includes('algodão')) defaultPrice = 200;

      const receitaDaCultura = (p.totalProduction || 0) * defaultPrice;
      receita += receitaDaCultura;

      // Distribuindo a receita na janela de Julho-Novembro (venda) aleatoriamente/fictício
      const distMonths = ['Jul', 'Ago', 'Set', 'Out', 'Nov'];
      const slice = receitaDaCultura / distMonths.length;
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
      custo += cTotal;

      // Map Categories
      if (c.type === 'INSUMO') costCatMap['Insumos'] += cTotal;
      else if (c.type === 'SERVICO') costCatMap['Servicos'] += cTotal;
      else if (c.type === 'MAO_DE_OBRA') costCatMap['MaoDeObra'] += cTotal;
      else if (c.type === 'ARMAZENAGEM') costCatMap['Armazenagem'] += cTotal;
      else costCatMap['Outros'] += cTotal;

      // Map Months (baseado em createdAt se possível, ou espalhado)
      // Como não criamos um form real e as datas são todas 'agora', vamos extrair o mês da data real
      const date = new Date(c.createdAt || Date.now());
      const mIdx = date.getMonth(); // 0-11
      if (months[mIdx]) {
        monthMap[months[mIdx]].custos += cTotal;
      }
    });

    let ebitda = receita - custo; // Mock simplification
    let endividamento = 0;
    
    liabilities.forEach(l => {
      // Ignoramos filtros de cultura/safra aqui pois endividamento é a nível Farm/Global
      if (filterFazenda && l.farmId !== filterFazenda) return;
      endividamento += l.value;
    });

    const monthlyData = months.map(m => ({
      name: m,
      receita: monthMap[m].receita,
      custos: monthMap[m].custos,
      lucro: monthMap[m].receita - monthMap[m].custos
    }));

    const cultureColorsList = ['#10b981', '#06b6d4', '#f59e0b', '#a855f7', '#ef4444'];
    const producaoCultura = Object.entries(prodCultMap).map(([name, sacas], i) => ({
      name, sacas, color: cultureColorsList[i % cultureColorsList.length]
    })).sort((a,b) => b.sacas - a.sacas);

    const catColors = { Insumos: '#10b981', Servicos: '#f59e0b', MaoDeObra: '#3b82f6', Armazenagem: '#8b5cf6', Outros: '#64748b' };
    const custosCat = Object.entries(costCatMap).filter(([_, v]) => v > 0).map(([name, value]) => ({
      name, value, color: catColors[name as keyof typeof catColors] || '#000'
    })).sort((a,b) => b.value - a.value);

    const endividamentoArr = [
      { label: 'Bancário', value: endividamento * 0.7, color: '#f59e0b' },
      { label: 'Fornecedores', value: endividamento * 0.3, color: '#ef4444' }
    ];

    return { receita, custo, lucro: receita - custo, producaoTotal, ebitda, endividamentoArr, monthlyData, producaoCultura, custosCat, totalEndividamento: endividamento };
  }, [productions, costs, liabilities, filterSafra, filterFazenda, filterCultura]);

  const fmtM = (v: number) => `R$ ${(Math.abs(v) / 1000000).toFixed(1)}M`;
  const fmt = (v: number) => `R$ ${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <MainContent>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4 text-slate-400">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p>Calculando visão executiva...</p>
          </div>
        </div>
      </MainContent>
    );
  }

  return (
    <MainContent>
      <PageHeader
        title="Dashboard"
        accent="Executivo"
        description={`Visão consolidada dos principais indicadores financeiros — Safra ${filterSafra || 'Todas'}`}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <MetricCard title="Receita Total" value={fmtM(data.receita)} change={12.5} icon={TrendingUp} accentColor="#3B82F6" changeLabel="vs projetado" />
        <MetricCard title="Custos Totais" value={fmtM(data.custo)} change={-2.3} invertChange icon={TrendingDown} accentColor="#EF4444" changeLabel="vs orçado" />
        <MetricCard title="Lucro Operacional" value={fmtM(data.lucro)} change={8.4} icon={DollarSign} accentColor="#10B981" />
        <MetricCard title="EBITDA" value={fmtM(data.ebitda)} change={5.2} icon={Activity} accentColor="#3B82F6" />
        <MetricCard title="Produção" value={(data.producaoTotal / 1000).toFixed(1) + 'K'} change={11.2} icon={Wheat} accentColor="#F59E0B" changeLabel="sacas total" />
        <MetricCard title="Endividamento" value={fmtM(data.totalEndividamento)} change={-5.0} invertChange icon={BarChart3} accentColor="#10B981" changeLabel="redução" />
      </div>

      {/* Charts: Main + Production */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <FinancialChart
            title="Receita, Custos & Lucro"
            data={data.monthlyData}
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
            {data.producaoCultura.map((c, i) => {
              const max = Math.max(...data.producaoCultura.map(x => x.sacas));
              const pct = max > 0 ? (c.sacas / max * 100) : 0;
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
            data={data.monthlyData}
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
                    <Pie data={data.custosCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} innerRadius={30} strokeWidth={0}>
                      {data.custosCat.map(c => <Cell key={c.name} fill={c.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltipDonut />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {data.custosCat.map(c => (
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
              {data.endividamentoArr.map(d => (
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
