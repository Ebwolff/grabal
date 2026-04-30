'use client';

import React, { useState, useMemo } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { usePrivacy } from '@/context/PrivacyContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import {
  Plus, Trash2, Filter, ChevronDown, X, FileSpreadsheet,
  DollarSign, AlertCircle, CheckCircle2,
  Zap, Fuel, Receipt, Building, Phone, Truck, ShieldCheck, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

interface Despesa {
  id: string;
  tipo: string;
  descricao: string;
  valor: number;
  recorrente: boolean;
  mes: string;
}

const tiposDespesa = [
  { value: 'Energia', icon: Zap, color: '#f59e0b' },
  { value: 'Combustível', icon: Fuel, color: '#ef4444' },
  { value: 'Impostos', icon: Receipt, color: '#8b5cf6' },
  { value: 'Aluguel', icon: Building, color: '#06b6d4' },
  { value: 'Telecomunicações', icon: Phone, color: '#22c55e' },
  { value: 'Frete/Logística', icon: Truck, color: '#f97316' },
  { value: 'Seguros', icon: ShieldCheck, color: '#14b8a6' },
  { value: 'Consultoria', icon: Briefcase, color: '#a855f7' },
];

const tipoColorMap: Record<string, string> = {};
const tipoIconMap: Record<string, typeof Zap> = {};
tiposDespesa.forEach(t => { tipoColorMap[t.value] = t.color; tipoIconMap[t.value] = t.icon; });

const initialData: Despesa[] = [
  { id: '1', tipo: 'Energia', descricao: 'Energia elétrica — sede e irrigação', valor: 28500, recorrente: true, mes: 'Mar/25' },
  { id: '2', tipo: 'Combustível', descricao: 'Diesel — frota agrícola e transporte', valor: 45200, recorrente: true, mes: 'Mar/25' },
  { id: '3', tipo: 'Impostos', descricao: 'ITR — Imposto Territorial Rural', valor: 32000, recorrente: false, mes: 'Mar/25' },
  { id: '4', tipo: 'Impostos', descricao: 'Funrural (2.3% s/ receita bruta)', valor: 103500, recorrente: true, mes: 'Mar/25' },
  { id: '5', tipo: 'Aluguel', descricao: 'Arrendamento de área (400ha)', valor: 180000, recorrente: true, mes: 'Mar/25' },
  { id: '6', tipo: 'Telecomunicações', descricao: 'Internet + telefonia rural', valor: 3800, recorrente: true, mes: 'Mar/25' },
  { id: '7', tipo: 'Frete/Logística', descricao: 'Frete para porto — Soja safra 24/25', valor: 95000, recorrente: false, mes: 'Mar/25' },
  { id: '8', tipo: 'Seguros', descricao: 'Seguro agrícola — Soja e Milho', valor: 42000, recorrente: false, mes: 'Mar/25' },
  { id: '9', tipo: 'Seguros', descricao: 'Seguro de máquinas e equipamentos', valor: 18500, recorrente: true, mes: 'Mar/25' },
  { id: '10', tipo: 'Consultoria', descricao: 'Assessoria contábil e tributária', valor: 8500, recorrente: true, mes: 'Mar/25' },
  { id: '11', tipo: 'Energia', descricao: 'Energia — estação de bombeamento', valor: 12000, recorrente: true, mes: 'Mar/25' },
  { id: '12', tipo: 'Combustível', descricao: 'Gasolina — veículos administrativos', valor: 6800, recorrente: true, mes: 'Mar/25' },
];

function gerarId() { return Math.random().toString(36).substring(2, 9); }

export default function ExpensesPage() {
  const { isPrivate } = usePrivacy();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const [data, setData] = useState<Despesa[]>(initialData);
  const [filterTipo, setFilterTipo] = useState('');

  const filtered = useMemo(() => {
    return data.filter(d => !filterTipo || d.tipo === filterTipo);
  }, [data, filterTipo]);

  const totals = useMemo(() => {
    const total = filtered.reduce((s, d) => s + d.valor, 0);
    const recorrente = filtered.filter(d => d.recorrente).reduce((s, d) => s + d.valor, 0);
    const pontual = filtered.filter(d => !d.recorrente).reduce((s, d) => s + d.valor, 0);
    const porTipo: Record<string, number> = {};
    filtered.forEach(d => { porTipo[d.tipo] = (porTipo[d.tipo] || 0) + d.valor; });
    return { total, recorrente, pontual, porTipo };
  }, [filtered]);

  const pieData = Object.entries(totals.porTipo)
    .map(([tipo, valor]) => ({ name: tipo, value: valor, color: tipoColorMap[tipo] || '#64748b' }))
    .sort((a, b) => b.value - a.value);

  const removeItem = (id: string) => { setData(prev => prev.filter(d => d.id !== id)); toastWarning('Despesa removida'); };

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <MainContent>
        <PageHeader
        title="Despesas"
        accent="Administrativas"
        description="Controle de despesas administrativas e operacionais."
        badge={
          <Link href="/entries?type=despesa"
            className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 flex items-center gap-2 transition-all duration-300 rounded-lg shadow-lg shadow-primary/20">
            <Plus size={18} /> Nova Despesa
          </Link>
        }
      />


        {/* Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2 card px-4 py-2">
            <Filter size={14} className="text-slate-500" />
            <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="bg-transparent text-xs font-bold uppercase tracking-widest text-slate-400 focus:outline-none cursor-pointer">
              <option value="">Todos Tipos</option>
              {tiposDespesa.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}
            </select>
            <ChevronDown size={12} className="text-slate-600" />
          </div>
          {filterTipo && (
            <button onClick={() => setFilterTipo('')} className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1">
              <X size={12} /> Limpar
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Despesas', value: fmt(totals.total), accent: true },
            { label: 'Recorrentes (Mensal)', value: fmt(totals.recorrente) },
            { label: 'Pontuais', value: fmt(totals.pontual) },
            { label: 'Projeção Anual', value: fmt(totals.recorrente * 12 + totals.pontual) },
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
                <FileSpreadsheet size={16} className="text-primary-light" />
                <h4 className="font-bold uppercase tracking-tight text-sm">Lançamentos</h4>
              </div>
              <span className="text-[10px] text-slate-500 font-bold">{filtered.length} despesas</span>
            </div>
            <table className="w-full table-striped">
              <thead>
                <tr className="border-b border-industrial-border bg-slate-900/50">
                  {['Tipo', 'Descrição', 'Recorrência', 'Mês', 'Valor', ''].map(h => (
                    <th key={h} className="p-3 text-left text-[9px] uppercase tracking-widest text-slate-600 font-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const TipoIcon = tipoIconMap[item.tipo] || Receipt;
                  const color = tipoColorMap[item.tipo] || '#64748b';
                  return (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="border-b border-industrial-border/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <TipoIcon size={14} style={{ color }} />
                          <span className="text-sm font-bold">{item.tipo}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-slate-300 max-w-[250px] truncate">{item.descricao}</td>
                      <td className="p-3">
                        <span className={cn("text-[9px] px-2 py-1 font-semibold uppercase border rounded",
                          item.recorrente ? "bg-emerald-950/40 border-emerald-800 text-emerald-400" : "bg-slate-800/50 border-slate-700 text-slate-500"
                        )}>
                          {item.recorrente ? 'Mensal' : 'Pontual'}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-500">{item.mes}</td>
                      <td className={cn("p-3 text-sm font-bold font-mono text-emerald-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmt(item.valor)}</td>
                      <td className="p-3">
                        <button onClick={() => removeItem(item.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-primary/30 bg-slate-900/30">
                  <td colSpan={4} className="p-3 text-xs font-semibold text-slate-400">Total</td>
                  <td className={cn("p-3 text-sm font-black font-mono text-primary-light privacy-mask", isPrivate && "privacy-hidden")}>{fmt(totals.total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pie by Type */}
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Composição de Despesas</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={75} innerRadius={45} strokeWidth={0}>
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
                      {totals.total > 0 ? `${(p.value / totals.total * 100).toFixed(1)}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recorrente vs Pontual */}
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Recorrente vs Pontual</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-widest text-slate-600 font-black">Recorrentes</span>
                    <span className={cn("text-xs font-mono font-bold text-emerald-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmt(totals.recorrente)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full">
                    <div className="h-full bg-emerald-500" style={{ width: `${totals.total > 0 ? (totals.recorrente / totals.total * 100) : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-widest text-slate-600 font-black">Pontuais</span>
                    <span className={cn("text-xs font-mono font-bold text-orange-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmt(totals.pontual)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full">
                    <div className="h-full bg-orange-500" style={{ width: `${totals.total > 0 ? (totals.pontual / totals.total * 100) : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Integration */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={14} className="text-primary-light" />
                <h4 className="font-bold uppercase tracking-tight text-sm">Integração Financeira</h4>
              </div>
              <p className="text-[10px] text-slate-500 mb-3">Despesas administrativas integram:</p>
              <div className="space-y-2">
                {[
                  'DRE — Despesas Administrativas',
                  'EBITDA — Resultado antes de juros',
                  'Overhead — Custos fixos operacionais',
                  'Break-even — Ponto de equilíbrio',
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
