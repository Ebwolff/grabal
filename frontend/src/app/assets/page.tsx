'use client';

import React, { useState, useMemo } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { usePrivacy } from '@/context/PrivacyContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import {
  Plus, Trash2, Filter, ChevronDown, X, Building2,
  DollarSign, AlertCircle, CheckCircle2,
  MapPin, Tractor, Wrench, Droplets, Fence, Warehouse, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

interface Ativo {
  id: string;
  tipo: string;
  descricao: string;
  valor: number;
  aquisicao: string;
  vidaUtil: number;
  depreciacaoAnual: number;
}

const tiposAtivo = [
  { value: 'Terra', icon: MapPin, color: '#10b981' },
  { value: 'Máquinas', icon: Tractor, color: '#06b6d4' },
  { value: 'Equipamentos', icon: Wrench, color: '#f59e0b' },
  { value: 'Irrigação', icon: Droplets, color: '#22c55e' },
  { value: 'Benfeitorias', icon: Fence, color: '#a855f7' },
  { value: 'Armazéns', icon: Warehouse, color: '#ef4444' },
  { value: 'Tecnologia', icon: Cpu, color: '#f97316' },
];

const tipoColorMap: Record<string, string> = {};
const tipoIconMap: Record<string, typeof MapPin> = {};
tiposAtivo.forEach(t => { tipoColorMap[t.value] = t.color; tipoIconMap[t.value] = t.icon; });

const initialData: Ativo[] = [];

function gerarId() { return Math.random().toString(36).substring(2, 9); }

export default function AssetsPage() {
  const { isPrivate } = usePrivacy();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const [data, setData] = useState<Ativo[]>(initialData);
  const [filterTipo, setFilterTipo] = useState('');

  const filtered = useMemo(() => data.filter(d => !filterTipo || d.tipo === filterTipo), [data, filterTipo]);

  const totals = useMemo(() => {
    const total = filtered.reduce((s, d) => s + d.valor, 0);
    const depreciacao = filtered.reduce((s, d) => s + d.depreciacaoAnual, 0);
    const porTipo: Record<string, number> = {};
    filtered.forEach(d => { porTipo[d.tipo] = (porTipo[d.tipo] || 0) + d.valor; });
    const imobilizado = filtered.filter(d => d.tipo !== 'Terra').reduce((s, d) => s + d.valor, 0);
    const terras = filtered.filter(d => d.tipo === 'Terra').reduce((s, d) => s + d.valor, 0);
    return { total, depreciacao, porTipo, imobilizado, terras, qtd: filtered.length };
  }, [filtered]);

  const pieData = Object.entries(totals.porTipo)
    .map(([tipo, valor]) => ({ name: tipo, value: valor, color: tipoColorMap[tipo] || '#64748b' }))
    .sort((a, b) => b.value - a.value);

  const removeItem = (id: string) => { setData(prev => prev.filter(d => d.id !== id)); toastWarning('Ativo removido'); };

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const fmtM = (v: number) => `R$ ${(v / 1000000).toFixed(2)}M`;

  return (
    <MainContent>
        <PageHeader
        title="Ativos"
        accent="Patrimoniais"
        description="Gestão do ativo imobilizado: terras, máquinas, instalações."
        badge={
          <Link href="/entries?type=ativo"
            className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 flex items-center gap-2 transition-all duration-300 rounded-lg shadow-lg shadow-primary/20">
            <Plus size={18} /> Novo Ativo
          </Link>
        }
      />


        {/* Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2 card px-4 py-2">
            <Filter size={14} className="text-slate-500" />
            <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="bg-transparent text-xs font-bold uppercase tracking-widest text-slate-400 focus:outline-none cursor-pointer">
              <option value="">Todos Tipos</option>
              {tiposAtivo.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}
            </select>
            <ChevronDown size={12} className="text-slate-600" />
          </div>
          {filterTipo && (
            <button onClick={() => setFilterTipo('')} className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"><X size={12} /> Limpar</button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Ativo Total', value: fmtM(totals.total), accent: true },
            { label: 'Terras', value: fmtM(totals.terras) },
            { label: 'Imobilizado', value: fmtM(totals.imobilizado) },
            { label: 'Depreciação Anual', value: fmt(totals.depreciacao) },
            { label: 'Itens', value: totals.qtd.toString() },
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
                <Building2 size={16} className="text-primary-light" />
                <h4 className="font-bold uppercase tracking-tight text-sm">Patrimônio Ativo</h4>
              </div>
              <span className="text-[10px] text-slate-500 font-bold">{filtered.length} ativos</span>
            </div>
            <table className="w-full table-striped">
              <thead>
                <tr className="border-b border-industrial-border bg-slate-900/50">
                  {['Tipo', 'Descrição', 'Aquisição', 'Vida Útil', 'Deprec./Ano', 'Valor', ''].map(h => (
                    <th key={h} className="p-3 text-left text-[8px] uppercase tracking-widest text-slate-600 font-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const TipoIcon = tipoIconMap[item.tipo] || Building2;
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
                      <td className="p-3 text-sm text-slate-300 max-w-[220px] truncate">{item.descricao}</td>
                      <td className="p-3 text-xs text-slate-500">{item.aquisicao}</td>
                      <td className="p-3 text-xs text-slate-500">{item.vidaUtil > 0 ? `${item.vidaUtil} anos` : '—'}</td>
                      <td className={cn("p-3 text-[11px] font-mono text-slate-500 privacy-mask", isPrivate && "privacy-hidden")}>
                        {item.depreciacaoAnual > 0 ? fmt(item.depreciacaoAnual) : '—'}
                      </td>
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
                  <td colSpan={4} className="p-3 text-xs font-semibold text-slate-400">Ativo Total</td>
                  <td className={cn("p-3 text-[11px] font-bold font-mono text-orange-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmt(totals.depreciacao)}</td>
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
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Composição do Patrimônio</h4>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={72} innerRadius={42} strokeWidth={0}>
                    {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
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
                      {totals.total > 0 ? `${(p.value / totals.total * 100).toFixed(1)}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Terra vs Imobilizado */}
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Terra vs Imobilizado</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-widest text-slate-600 font-black">Terras</span>
                    <span className={cn("text-xs font-mono font-bold text-emerald-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmtM(totals.terras)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full">
                    <div className="h-full bg-emerald-500" style={{ width: `${totals.total > 0 ? (totals.terras / totals.total * 100) : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-widest text-slate-600 font-black">Imobilizado</span>
                    <span className={cn("text-xs font-mono font-bold text-cyan-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmtM(totals.imobilizado)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full">
                    <div className="h-full bg-cyan-500" style={{ width: `${totals.total > 0 ? (totals.imobilizado / totals.total * 100) : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Integration */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={14} className="text-primary-light" />
                <h4 className="font-bold uppercase tracking-tight text-sm">Integração</h4>
              </div>
              <p className="text-[10px] text-slate-500 mb-3">Ativos integram:</p>
              <div className="space-y-2">
                {[
                  'Balanço Patrimonial — Ativo Não Circulante',
                  'DRE — Depreciação e Amortização',
                  'ROA — Retorno sobre Ativos',
                  'Valor Patrimonial da Empresa',
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
