'use client';

import React, { useState, useMemo } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { usePrivacy } from '@/context/PrivacyContext';
import { useGlobalFilter } from '@/context/GlobalFilterContext';
import { useToast } from '@/components/ToastProvider';
import { cn } from '@/lib/utils';
import {
  Plus, Trash2, FileCheck,
  AlertCircle, CheckCircle2, AlertTriangle,
  Clock, Shield, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis
} from 'recharts';
import Link from 'next/link';

interface CPR {
  id: string;
  cultura: string;
  volumeComprometido: number;
  unidade: string;
  valor: number;
  vencimento: string;
  comprador: string;
  status: 'vigente' | 'proximo' | 'vencida' | 'liquidada';
}

const culturas = ['Soja', 'Milho', 'Algodão', 'Café', 'Trigo'];
const cultureColors: Record<string, string> = { Soja: '#10b981', Milho: '#06b6d4', Algodão: '#f59e0b', Café: '#a855f7', Trigo: '#ef4444' };

// Production data for risk calc
const producaoTotal: Record<string, number> = { Soja: 74400, Milho: 108000, Algodão: 140000, Café: 10500, Trigo: 10000 };

const statusCfg = {
  vigente: { label: 'Vigente', cls: 'bg-emerald-950/40 border-emerald-800 text-emerald-400' },
  proximo: { label: 'Próx. Venc.', cls: 'bg-amber-950/40 border-amber-800 text-amber-400' },
  vencida: { label: 'Vencida', cls: 'bg-red-950/40 border-red-800 text-red-400' },
  liquidada: { label: 'Liquidada', cls: 'bg-slate-800/40 border-slate-700 text-slate-400' },
};

function riskLevel(pct: number): { label: string; color: string; icon: typeof Shield } {
  if (pct < 30) return { label: 'Baixo', color: '#10b981', icon: Shield };
  if (pct < 50) return { label: 'Moderado', color: '#f59e0b', icon: AlertTriangle };
  if (pct < 70) return { label: 'Alto', color: '#f97316', icon: AlertTriangle };
  return { label: 'Crítico', color: '#ef4444', icon: AlertCircle };
}

const initialData: CPR[] = [
  { id: '1', cultura: 'Soja', volumeComprometido: 40000, unidade: 'sc', valor: 5400000, vencimento: '2025-09', comprador: 'Cargill', status: 'vigente' },
  { id: '2', cultura: 'Soja', volumeComprometido: 15000, unidade: 'sc', valor: 2025000, vencimento: '2025-06', comprador: 'Bunge', status: 'proximo' },
  { id: '3', cultura: 'Milho', volumeComprometido: 60000, unidade: 'sc', valor: 3480000, vencimento: '2025-08', comprador: 'ADM', status: 'vigente' },
  { id: '4', cultura: 'Milho', volumeComprometido: 20000, unidade: 'sc', valor: 1160000, vencimento: '2025-04', comprador: 'Dreyfus', status: 'proximo' },
  { id: '5', cultura: 'Algodão', volumeComprometido: 4000, unidade: 'fardos', valor: 4800000, vencimento: '2026-01', comprador: 'Olam Agri', status: 'vigente' },
  { id: '6', cultura: 'Café', volumeComprometido: 3500, unidade: 'sc', valor: 4200000, vencimento: '2025-11', comprador: 'Nestlé', status: 'vigente' },
  { id: '7', cultura: 'Trigo', volumeComprometido: 5000, unidade: 'sc', valor: 475000, vencimento: '2025-03', comprador: 'Bunge', status: 'vencida' },
  { id: '8', cultura: 'Soja', volumeComprometido: 10000, unidade: 'sc', valor: 1350000, vencimento: '2024-12', comprador: 'Amaggi', status: 'liquidada' },
];

function gerarId() { return Math.random().toString(36).substring(2, 9); }

export default function CPRPage() {
  const { isPrivate } = usePrivacy();
  const { cultura: globalCultura } = useGlobalFilter();
  const { success: toastSuccess, error: toastError } = useToast();
  const [data, setData] = useState<CPR[]>(initialData);
  const filtered = useMemo(() => data.filter(d => !globalCultura || d.cultura === globalCultura), [data, globalCultura]);
  const ativas = useMemo(() => filtered.filter(d => d.status !== 'liquidada'), [filtered]);

  const totals = useMemo(() => {
    const valorTotal = ativas.reduce((s, d) => s + d.valor, 0);
    const volumePorCultura: Record<string, number> = {};
    ativas.forEach(d => { volumePorCultura[d.cultura] = (volumePorCultura[d.cultura] || 0) + d.volumeComprometido; });
    const vencidas = ativas.filter(d => d.status === 'vencida').reduce((s, d) => s + d.valor, 0);
    const proximas = ativas.filter(d => d.status === 'proximo').reduce((s, d) => s + d.valor, 0);

    // Risk per culture
    const riskByCultura = Object.entries(volumePorCultura).map(([cultura, vol]) => {
      const prod = producaoTotal[cultura] || 1;
      const pct = (vol / prod) * 100;
      const risk = riskLevel(pct);
      return { cultura, volumeComprometido: vol, producaoTotal: prod, pctComprometido: pct, ...risk };
    }).sort((a, b) => b.pctComprometido - a.pctComprometido);

    const avgRisk = riskByCultura.length > 0 ? riskByCultura.reduce((s, r) => s + r.pctComprometido, 0) / riskByCultura.length : 0;

    return { valorTotal, volumePorCultura, vencidas, proximas, riskByCultura, avgRisk, qtd: ativas.length };
  }, [ativas]);

  const pieData = Object.entries(totals.volumePorCultura)
    .map(([cultura, vol]) => ({ name: cultura, value: vol, color: cultureColors[cultura] || '#64748b' }))
    .sort((a, b) => b.value - a.value);

  const removeItem = (id: string) => setData(prev => prev.filter(d => d.id !== id));

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const fmtM = (v: number) => `R$ ${(v / 1000000).toFixed(2)}M`;

  return (
    <MainContent>
      <PageHeader
        title="CPR —"
        accent="Cédula de Produto Rural"
        description="Gestão de CPRs emitidas. Controle de volume comprometido, vencimento e análise de risco por cultura."
        badge={
          <Link href="/entries?type=cpr"
            className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 flex items-center gap-2 transition-all duration-300 rounded-lg shadow-lg shadow-primary/20">
            <Plus size={18} /> Nova CPR
          </Link>
        }
      />


        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Valor Total CPRs', value: fmtM(totals.valorTotal), accent: true },
            { label: 'CPRs Ativas', value: totals.qtd.toString() },
            { label: 'Próx. Vencimento', value: fmt(totals.proximas) },
            { label: 'Vencidas', value: fmt(totals.vencidas), warn: totals.vencidas > 0 },
            { label: 'Risco Médio', value: `${totals.avgRisk.toFixed(0)}%`, riskColor: riskLevel(totals.avgRisk).color },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={cn("card p-4", s.accent ? "border-primary/40" : s.warn ? "border-red-600/40" : "border-industrial-border")}>
              <p className="text-[9px] uppercase tracking-widest text-slate-600 font-black mb-1">{s.label}</p>
              <p className={cn("text-lg font-bold tracking-tight font-mono privacy-mask", isPrivate && "privacy-hidden",
                s.accent ? "text-primary-light" : s.warn ? "text-red-400" : ""
              )} style={s.riskColor ? { color: s.riskColor } : undefined}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Table */}
          <div className="col-span-2 card overflow-hidden">
            <div className="p-5 border-b border-industrial-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck size={16} className="text-primary-light" />
                <h4 className="font-bold uppercase tracking-tight text-sm">CPRs Emitidas</h4>
              </div>
              <span className="text-[10px] text-slate-500 font-bold">{filtered.length} cédulas</span>
            </div>
            <table className="w-full table-striped">
              <thead>
                <tr className="border-b border-industrial-border bg-slate-900/50">
                  {['Cultura', 'Comprador', 'Volume', 'Vencimento', 'Status', 'Valor', ''].map(h => (
                    <th key={h} className="p-3 text-left text-[8px] uppercase tracking-widest text-slate-600 font-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const st = statusCfg[item.status];
                  const color = cultureColors[item.cultura] || '#64748b';
                  return (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className={cn("border-b border-industrial-border/50 hover:bg-slate-800/30 transition-colors", item.status === 'liquidada' && "opacity-50")}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-sm font-bold">{item.cultura}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-slate-300">{item.comprador}</td>
                      <td className={cn("p-3 text-sm font-mono privacy-mask", isPrivate && "privacy-hidden")}>{item.volumeComprometido.toLocaleString('pt-BR')} {item.unidade}</td>
                      <td className="p-3 text-xs font-mono text-slate-500">{item.vencimento}</td>
                      <td className="p-3">
                        <span className={cn("text-[9px] px-2 py-1 font-semibold uppercase border rounded", st.cls)}>{st.label}</span>
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
                  <td colSpan={5} className="p-3 text-xs font-semibold text-slate-400">Total CPRs Ativas</td>
                  <td className={cn("p-3 text-sm font-black font-mono text-primary-light privacy-mask", isPrivate && "privacy-hidden")}>{fmt(totals.valorTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Risk Analysis */}
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-400" />
                Análise de Risco
              </h4>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-3">% Produção Comprometida por CPR</p>
              <div className="space-y-3">
                {totals.riskByCultura.map(r => {
                  const RiskIcon = r.icon;
                  return (
                    <div key={r.cultura}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cultureColors[r.cultura] }} />
                          <span className="text-xs text-slate-400">{r.cultura}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <RiskIcon size={10} style={{ color: r.color }} />
                          <span className="text-[10px] font-bold" style={{ color: r.color }}>{r.pctComprometido.toFixed(0)}%</span>
                          <span className="text-[8px] uppercase tracking-widest font-bold" style={{ color: r.color }}>{r.label}</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(r.pctComprometido, 100)}%` }}
                          className="h-full" style={{ backgroundColor: r.color }} />
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span className={cn("text-[8px] font-mono text-slate-600 privacy-mask", isPrivate && "privacy-hidden")}>{r.volumeComprometido.toLocaleString('pt-BR')} sc</span>
                        <span className={cn("text-[8px] font-mono text-slate-600 privacy-mask", isPrivate && "privacy-hidden")}>de {r.producaoTotal.toLocaleString('pt-BR')} sc</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pie by culture */}
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Volume por Cultura</h4>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={65} innerRadius={38} strokeWidth={0}>
                    {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f1724', border: '1px solid #1a2332', borderRadius: 8, fontSize: 11 }}
                    formatter={(value) => [`${Number(value).toLocaleString('pt-BR')} sc`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map(p => {
                  const totalVol = Object.values(totals.volumePorCultura).reduce((s, v) => s + v, 0);
                  return (
                    <div key={p.name} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-slate-400">{p.name}</span>
                      </div>
                      <span className={cn("font-bold font-mono text-slate-300 privacy-mask", isPrivate && "privacy-hidden")}>
                        {totalVol > 0 ? `${(p.value / totalVol * 100).toFixed(1)}%` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Risk Scale */}
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-3">Escala de Risco</h4>
              <div className="space-y-1">
                {[
                  { range: '< 30%', label: 'Baixo', color: '#10b981' },
                  { range: '30–50%', label: 'Moderado', color: '#f59e0b' },
                  { range: '50–70%', label: 'Alto', color: '#f97316' },
                  { range: '> 70%', label: 'Crítico', color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between py-1.5 px-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-2 rounded" style={{ backgroundColor: s.color }} />
                      <span className="font-bold" style={{ color: s.color }}>{s.label}</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[10px]">{s.range}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-slate-600 mt-2">
                Risco = % da produção total comprometida em CPRs. Quanto maior, menor a flexibilidade comercial.
              </p>
            </div>
          </div>
        </div>
    </MainContent>
  );
}
