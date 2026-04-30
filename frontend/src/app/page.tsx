'use client';

import React from 'react';
import { MainContent } from '@/components/MainContent';
import { MetricCard } from '@/components/MetricCard';
import { FinancialChart } from '@/components/FinancialChart';
import { cn } from '@/lib/utils';
import { ShieldCheck, TrendingUp, DollarSign, LandPlot, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const cashFlowData: Array<{ name: string; receita: number; custos: number }> = [];

export default function Dashboard() {
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
        <MetricCard title="Rating Consolidado" value="-" icon={<ShieldCheck size={16} />} subtitle="Aguardando dados" />
        <MetricCard title="EBITDA Projetado" value="R$ 0,00" icon={<TrendingUp size={16} />} subtitle="Margem de 0.0%" />
        <MetricCard title="Receita Bruta" value="R$ 0,00" icon={<DollarSign size={16} />} subtitle="Total acumulado no período" />
        <MetricCard title="Área em Produção" value="0 ha" icon={<LandPlot size={16} />} subtitle="Aguardando cadastro" />
      </div>

      {/* Secondary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <FinancialChart
            title="Fluxo de Caixa vs Custos"
            data={cashFlowData}
            type="area"
            series={[
              { key: 'receita', name: 'Receita', color: '#3B82F6' },
              { key: 'custos', name: 'Custos', color: '#EF4444' },
            ]}
          />
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
