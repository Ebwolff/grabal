'use client';

import React, { useState, useMemo } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { usePrivacy } from '@/context/PrivacyContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import {
  Plus, Trash2, Filter, ChevronDown, X, Warehouse,
  DollarSign, AlertCircle, CheckCircle2, Home, Building2
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Armazenagem {
  id: string;
  cultura: string;
  tipo: 'proprio' | 'terceiro';
  descricao: string;
  capacidade: number;
  custo: number;
  safra: string;
}

const tipoConfig = {
  proprio: { label: 'Próprio', color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-800', icon: Home, pieColor: '#10b981' },
  terceiro: { label: 'Terceiro', color: 'text-orange-400', bg: 'bg-orange-950/40 border-orange-800', icon: Building2, pieColor: '#f59e0b' },
};

const initialData: Armazenagem[] = [
  { id: '1', cultura: 'Soja', tipo: 'proprio', descricao: 'Silo metálico - Fazenda São João', capacidade: 50000, custo: 85000, safra: '2024/25' },
  { id: '2', cultura: 'Soja', tipo: 'terceiro', descricao: 'Armazém geral - Cooperativa Central', capacidade: 30000, custo: 120000, safra: '2024/25' },
  { id: '3', cultura: 'Milho', tipo: 'proprio', descricao: 'Silo graneleiro - Fazenda São João', capacidade: 25000, custo: 42000, safra: '2024/25' },
  { id: '4', cultura: 'Milho', tipo: 'terceiro', descricao: 'Terminal portuário - Paranaguá', capacidade: 40000, custo: 195000, safra: '2024/25' },
  { id: '5', cultura: 'Algodão', tipo: 'terceiro', descricao: 'Armazém algodoeiro - Rondonópolis', capacidade: 80000, custo: 310000, safra: '2024/25' },
  { id: '6', cultura: 'Algodão', tipo: 'proprio', descricao: 'Galpão coberto - Fazenda Rio Doce', capacidade: 20000, custo: 38000, safra: '2024/25' },
  { id: '7', cultura: 'Café', tipo: 'proprio', descricao: 'Tulha seca - Fazenda Boa Vista', capacidade: 5000, custo: 15000, safra: '2024/25' },
  { id: '8', cultura: 'Café', tipo: 'terceiro', descricao: 'Armazém certificado - Exportadora', capacidade: 8000, custo: 48000, safra: '2024/25' },
  { id: '9', cultura: 'Soja', tipo: 'proprio', descricao: 'Silo bag (emergência)', capacidade: 15000, custo: 22000, safra: '2023/24' },
  { id: '10', cultura: 'Trigo', tipo: 'terceiro', descricao: 'Moinho parceiro - armazenagem', capacidade: 10000, custo: 35000, safra: '2024/25' },
];

const culturasDisponiveis = ['Soja', 'Milho', 'Algodão', 'Café', 'Trigo'];

function gerarId() { return Math.random().toString(36).substring(2, 9); }

export default function StoragePage() {
  const { isPrivate } = usePrivacy();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const [data, setData] = useState<Armazenagem[]>(initialData);
  const [filterCultura, setFilterCultura] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  const filtered = useMemo(() => {
    return data.filter(d =>
      (!filterCultura || d.cultura === filterCultura) &&
      (!filterTipo || d.tipo === filterTipo)
    );
  }, [data, filterCultura, filterTipo]);

  const totals = useMemo(() => {
    const custoGeral = filtered.reduce((s, d) => s + d.custo, 0);
    const capacidadeTotal = filtered.reduce((s, d) => s + d.capacidade, 0);
    const porTipo: Record<string, number> = {};
    const porCultura: Record<string, number> = {};
    filtered.forEach(d => {
      porTipo[d.tipo] = (porTipo[d.tipo] || 0) + d.custo;
      porCultura[d.cultura] = (porCultura[d.cultura] || 0) + d.custo;
    });
    return { custoGeral, capacidadeTotal, porTipo, porCultura };
  }, [filtered]);

  const pieData = Object.entries(totals.porTipo).map(([tipo, valor]) => ({
    name: tipoConfig[tipo as keyof typeof tipoConfig]?.label || tipo,
    value: valor,
    color: tipoConfig[tipo as keyof typeof tipoConfig]?.pieColor || '#64748b',
  }));

  const culturaCostData = Object.entries(totals.porCultura)
    .map(([cultura, valor]) => ({ cultura, valor }))
    .sort((a, b) => b.valor - a.valor);

  const removeItem = (id: string) => { setData(prev => prev.filter(d => d.id !== id)); toastWarning('Registro removido'); };

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <MainContent>
        <PageHeader
        title="Armazenagem"
        accent="e Logística"
        description="Custos de armazenagem, transporte e logística."
        badge={
          <Link href="/entries?type=armazenagem"
            className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 flex items-center gap-2 transition-all duration-300 rounded-lg shadow-lg shadow-primary/20">
            <Plus size={18} /> Novo Registro
          </Link>
        }
      />


        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2 card px-4 py-2">
            <Filter size={14} className="text-slate-500" />
            <select value={filterCultura} onChange={(e) => setFilterCultura(e.target.value)} className="bg-transparent text-xs font-bold uppercase tracking-widest text-slate-400 focus:outline-none cursor-pointer">
              <option value="">Todas Culturas</option>
              {culturasDisponiveis.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={12} className="text-slate-600" />
          </div>
          <div className="flex items-center gap-2 card px-4 py-2">
            <Warehouse size={14} className="text-slate-500" />
            <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="bg-transparent text-xs font-bold uppercase tracking-widest text-slate-400 focus:outline-none cursor-pointer">
              <option value="">Todos Tipos</option>
              <option value="proprio">Próprio</option>
              <option value="terceiro">Terceiro</option>
            </select>
            <ChevronDown size={12} className="text-slate-600" />
          </div>
          {(filterCultura || filterTipo) && (
            <button onClick={() => { setFilterCultura(''); setFilterTipo(''); }} className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1">
              <X size={12} /> Limpar
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Custo Total Armazenagem', value: fmt(totals.custoGeral), accent: true },
            { label: 'Armazenagem Própria', value: fmt(totals.porTipo['proprio'] || 0) },
            { label: 'Armazenagem Terceiro', value: fmt(totals.porTipo['terceiro'] || 0) },
            { label: 'Capacidade Total', value: `${totals.capacidadeTotal.toLocaleString('pt-BR')} sc` },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={cn("card p-4", s.accent ? "border-primary/40" : "border-industrial-border")}>
              <p className="text-[9px] uppercase tracking-widest text-slate-600 font-black mb-1">{s.label}</p>
              <p className={cn("text-lg font-bold tracking-tight font-mono privacy-mask", isPrivate && "privacy-hidden", s.accent && "text-primary-light")}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Table */}
          <div className="col-span-2 card overflow-hidden">
            <div className="p-5 border-b border-industrial-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Warehouse size={16} className="text-primary-light" />
                <h4 className="font-bold uppercase tracking-tight text-sm">Registros de Armazenagem</h4>
              </div>
              <span className="text-[10px] text-slate-500 font-bold">{filtered.length} registros</span>
            </div>
            <table className="w-full table-striped">
              <thead>
                <tr className="border-b border-industrial-border bg-slate-900/50">
                  {['Cultura', 'Tipo', 'Descrição', 'Capacidade', 'Safra', 'Custo', ''].map(h => (
                    <th key={h} className="p-3 text-left text-[9px] uppercase tracking-widest text-slate-600 font-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const tc = tipoConfig[item.tipo];
                  const TipoIcon = tc.icon;
                  return (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="border-b border-industrial-border/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 text-sm font-bold">{item.cultura}</td>
                      <td className="p-3">
                        <span className={cn("text-[9px] px-2 py-1 font-bold uppercase border inline-flex items-center gap-1", tc.bg, tc.color)}>
                          <TipoIcon size={10} />{tc.label}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-slate-300 max-w-[220px] truncate">{item.descricao}</td>
                      <td className={cn("p-3 text-sm font-mono privacy-mask", isPrivate && "privacy-hidden")}>{item.capacidade.toLocaleString('pt-BR')} sc</td>
                      <td className="p-3 text-xs text-slate-500">{item.safra}</td>
                      <td className={cn("p-3 text-sm font-bold font-mono text-emerald-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmt(item.custo)}</td>
                      <td className="p-3">
                        <button onClick={() => removeItem(item.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-primary/30 bg-slate-900/30">
                  <td colSpan={3} className="p-3 text-xs font-semibold text-slate-400">Total Armazenagem</td>
                  <td className={cn("p-3 text-sm font-bold font-mono text-slate-300 privacy-mask", isPrivate && "privacy-hidden")}>{totals.capacidadeTotal.toLocaleString('pt-BR')} sc</td>
                  <td />
                  <td className={cn("p-3 text-sm font-black font-mono text-primary-light privacy-mask", isPrivate && "privacy-hidden")}>{fmt(totals.custoGeral)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pie Próprio vs Terceiro */}
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Próprio vs Terceiro</h4>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40} strokeWidth={0}>
                    {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f1724', border: '1px solid #1a2332', borderRadius: 8, fontSize: 11 }} formatter={(value) => [fmt(Number(value)), '']} />
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
                      {totals.custoGeral > 0 ? `${(p.value / totals.custoGeral * 100).toFixed(1)}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost by Culture */}
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Custo por Cultura</h4>
              <div className="space-y-3">
                {culturaCostData.map((c) => (
                  <div key={c.cultura}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold">{c.cultura}</span>
                      <span className={cn("text-[10px] font-mono font-bold text-slate-300 privacy-mask", isPrivate && "privacy-hidden")}>{fmt(c.valor)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${totals.custoGeral > 0 ? (c.valor / totals.custoGeral * 100) : 0}%` }} className="h-full bg-primary" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Integration */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={14} className="text-primary-light" />
                <h4 className="font-bold uppercase tracking-tight text-sm">Integração</h4>
              </div>
              <p className="text-[10px] text-slate-500 mb-3">Custos de armazenagem integram:</p>
              <div className="space-y-2">
                {[
                  'Custos Pós-Colheita — DRE',
                  'CMV — Logística e Armazenagem',
                  'Margem Líquida = Receita − Custos Totais',
                  'Análise Próprio vs Terceiro',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-light" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
    </MainContent>
  );
}
