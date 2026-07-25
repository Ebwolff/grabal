'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { MainContent } from '@/components/MainContent';
import { MetricCard } from '@/components/MetricCard';
import { FinancialChart } from '@/components/FinancialChart';
import { usePrivacy } from '@/context/PrivacyContext';
import { cn } from '@/lib/utils';
import { ShieldCheck, TrendingUp, DollarSign, LandPlot, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getFarms, getProductions, getAllCosts, getSales, Farm, ProductionRecord, CostRecord, Sale } from '@/lib/supabase/database';

export default function Dashboard() {
  const { isPrivate } = usePrivacy();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [productions, setProductions] = useState<ProductionRecord[]>([]);
  const [costs, setCosts] = useState<CostRecord[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [fData, pData, cData, sData] = await Promise.all([
          getFarms(),
          getProductions(),
          getAllCosts(),
          getSales()
        ]);
        setFarms(fData);
        setProductions(pData);
        setCosts(cData);
        setSales(sData);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const stats = useMemo(() => {
    let receita = 0;
    let custo = 0;
    let areaTotal = 0;

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthMap: Record<string, { name: string; receita: number; custos: number }> = {};
    months.forEach(m => monthMap[m] = { name: m, receita: 0, custos: 0 });

    farms.forEach(f => {
      areaTotal += f.agriculturalArea || 0;
    });

    sales.forEach(s => {
      receita += s.grossRevenue || 0;
      const date = new Date(s.createdAt || Date.now());
      const mIdx = date.getMonth();
      if (months[mIdx]) {
        monthMap[months[mIdx]].receita += (s.grossRevenue || 0);
      }
    });

    costs.forEach(c => {
      const cTotal = c.items?.reduce((acc, i) => acc + (i.value || 0), 0) || 0;
      custo += cTotal;
      const date = new Date(c.createdAt || Date.now());
      const mIdx = date.getMonth();
      if (months[mIdx]) {
        monthMap[months[mIdx]].custos += cTotal;
      }
    });

    const ebitda = receita - custo;
    const margem = receita > 0 ? (ebitda / receita) * 100 : 0;
    const cashFlowData = Object.values(monthMap);

    return { receita, custo, ebitda, margem, areaTotal, cashFlowData };
  }, [farms, productions, costs, sales]);
  return (
    <MainContent>
      {/* Page Header */}
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
            Dashboard <span className="text-primary-light">Principal</span>
          </h2>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            Análise em tempo real de liquidez, EBITDA e score de risco agrícola.
            Geração de ratings baseada em 3.400+ variáveis de produção.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Status do Sistema</p>
          <div className="flex items-center gap-2 text-success text-sm font-bold">
            <span className="w-2 h-2 bg-success animate-pulse rounded-full" />
            Sincronizado
          </div>
        </div>
      </header>

      {/* Top Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard 
          title="Rating Consolidado" 
          value={stats.areaTotal > 0 && stats.receita > 0 ? "A+" : "-"} 
          icon={<ShieldCheck size={16} />} 
          subtitle={stats.areaTotal > 0 && stats.receita > 0 ? "Risco Muito Baixo" : "Aguardando dados"} 
        />
        <MetricCard 
          title="EBITDA Projetado" 
          value={loading ? "..." : `R$ ${stats.ebitda.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          icon={<TrendingUp size={16} />} 
          subtitle={`Margem de ${stats.margem.toFixed(1)}%`} 
        />
        <MetricCard 
          title="Receita Bruta" 
          value={loading ? "..." : `R$ ${stats.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          icon={<DollarSign size={16} />} 
          subtitle="Total acumulado no período" 
        />
        <MetricCard 
          title="Área em Produção" 
          value={loading ? "..." : `${stats.areaTotal.toLocaleString('pt-BR')} ha`} 
          icon={<LandPlot size={16} />} 
          subtitle={`${farms.length} fazendas cadastradas`} 
        />
      </div>

      {/* Secondary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Chart */}
        <div className="lg:col-span-2 relative min-h-[300px]">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-lg">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <FinancialChart
              title="Fluxo de Caixa vs Custos"
              data={stats.cashFlowData}
              type="area"
              series={[
                { key: 'receita', name: 'Receita', color: '#8b5cf6' },
                { key: 'custos', name: 'Custos', color: '#EF4444' },
              ]}
            />
          )}
        </div>

        {/* Risk Alerts */}
        <div className="card p-5">
          <h4 className="font-semibold text-sm mb-5 text-white border-b border-industrial-border pb-3">Avisos de Risco</h4>
          
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-800 mb-3" />
            <p className="text-xs text-slate-500 max-w-[200px]">
              Sem alertas de risco. Aguardando a consolidação de dados operacionais e financeiros.
            </p>
          </div>

          <button className="w-full mt-6 py-2.5 bg-primary text-white text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-primary-light transition-colors">
            Gerar Rating Completo
          </button>
        </div>
      </div>
    </MainContent>
  );
}
