'use client';

import React from 'react';
import { MainContent } from '@/components/MainContent';
import { MetricCard } from '@/components/MetricCard';
import { FinancialChart } from '@/components/FinancialChart';
import { cn } from '@/lib/utils';
import { ShieldCheck, TrendingUp, DollarSign, LandPlot, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const cashFlowData = [
  { name: 'Jan', receita: 4000000, custos: 2400000 },
  { name: 'Fev', receita: 3000000, custos: 1398000 },
  { name: 'Mar', receita: 2000000, custos: 2800000 },
  { name: 'Abr', receita: 2780000, custos: 3908000 },
  { name: 'Mai', receita: 1890000, custos: 1800000 },
  { name: 'Jun', receita: 2390000, custos: 1800000 },
  { name: 'Jul', receita: 3490000, custos: 2300000 },
];

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
        <MetricCard title="Rating Consolidado" value="A+" icon={<ShieldCheck size={16} />} subtitle="Baseado na Safra 2023/24" change={12} />
        <MetricCard title="EBITDA Projetado" value="R$ 4.2M" icon={<TrendingUp size={16} />} subtitle="Margem de 32.4%" change={5} />
        <MetricCard title="Receita Bruta" value="R$ 12.8M" icon={<DollarSign size={16} />} subtitle="Total acumulado no período" />
        <MetricCard title="Área em Produção" value="1.240 ha" icon={<LandPlot size={16} />} subtitle="Soja e Milho (Consolidado)" />
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
          <div className="space-y-4">
            {[
              { label: 'Exposição Cambial', status: 'CUIDADO', color: 'text-warning', bar: 'bg-warning', w: '45%' },
              { label: 'Limites de Crédito', status: 'OK', color: 'text-success', bar: 'bg-success', w: '80%' },
              { label: 'Custos de Insumos', status: 'CRÍTICO', color: 'text-danger', bar: 'bg-danger', w: '92%' },
            ].map((risk) => (
              <div key={risk.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-slate-300">{risk.label}</span>
                  <span className={cn("text-[9px] font-bold uppercase", risk.color)}>{risk.status}</span>
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: risk.w }} className={cn("h-full rounded-full", risk.bar)} />
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-6 py-2.5 bg-primary text-white text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-primary-light transition-colors">
            Gerar Rating Completo
          </button>
        </div>
      </div>
    </MainContent>
  );
}
