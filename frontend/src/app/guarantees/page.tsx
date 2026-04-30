'use client';

import React, { useState, useMemo } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { usePrivacy } from '@/context/PrivacyContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import {
  Plus, Trash2, Filter, ChevronDown, X, ShieldCheck,
  AlertCircle, CheckCircle2, Star, TrendingUp, TrendingDown,
  MapPin, Tractor, Wheat, Home, FileCheck, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface Garantia {
  id: string;
  tipo: string;
  descricao: string;
  valor: number;
  status: 'aceita' | 'pendente' | 'em_analise';
}

const tiposGarantia = [
  { value: 'Terra', icon: MapPin, color: '#10b981' },
  { value: 'Máquinas', icon: Tractor, color: '#06b6d4' },
  { value: 'Produção Futura', icon: Wheat, color: '#f59e0b' },
  { value: 'Imóvel Rural', icon: Home, color: '#a855f7' },
  { value: 'Título / Penhor', icon: FileCheck, color: '#ef4444' },
];

const tipoColorMap: Record<string, string> = {};
const tipoIconMap: Record<string, typeof MapPin> = {};
tiposGarantia.forEach(t => { tipoColorMap[t.value] = t.color; tipoIconMap[t.value] = t.icon; });

const statusCfg = {
  aceita: { label: 'Aceita', cls: 'bg-emerald-950/40 border-emerald-800 text-emerald-400' },
  pendente: { label: 'Pendente', cls: 'bg-amber-950/40 border-amber-800 text-amber-400' },
  em_analise: { label: 'Em Análise', cls: 'bg-cyan-950/40 border-cyan-800 text-cyan-400' },
};

const initialData: Garantia[] = [];

// Rating calculation based on guarantees vs liabilities
const passivoTotal = 12710000; // From liabilities module

function calcRating(ratio: number): { grade: string; color: string; stars: number; label: string } {
  if (ratio >= 3.0) return { grade: 'AAA', color: '#10b981', stars: 5, label: 'Excepcional' };
  if (ratio >= 2.5) return { grade: 'AA', color: '#22c55e', stars: 5, label: 'Excelente' };
  if (ratio >= 2.0) return { grade: 'A', color: '#34d399', stars: 4, label: 'Muito Bom' };
  if (ratio >= 1.5) return { grade: 'BBB', color: '#f59e0b', stars: 3, label: 'Bom' };
  if (ratio >= 1.0) return { grade: 'BB', color: '#f97316', stars: 3, label: 'Adequado' };
  if (ratio >= 0.7) return { grade: 'B', color: '#ef4444', stars: 2, label: 'Insuficiente' };
  return { grade: 'C', color: '#dc2626', stars: 1, label: 'Crítico' };
}

function gerarId() { return Math.random().toString(36).substring(2, 9); }

export default function GuaranteesPage() {
  const { isPrivate } = usePrivacy();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const [data, setData] = useState<Garantia[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error'>('idle');

  React.useEffect(() => {
    const fetchGuarantees = async () => {
      try {
        const response = await fetch('http://localhost:3001/data/guarantees');
        if (!response.ok) throw new Error('Failed to fetch');
        const json = await response.json();
        
        const guarantees = json.map((item: any) => {
          const desc = item.description.toLowerCase();
          let tipo = 'Terra';
          if (desc.includes('penhor') || desc.includes('cda') || desc.includes('wa')) tipo = 'Título / Penhor';
          else if (desc.includes('cpr') || desc.includes('futura')) tipo = 'Produção Futura';
          else if (desc.includes('trator') || desc.includes('colheit') || desc.includes('pulveriz') || desc.includes('máquina')) tipo = 'Máquinas';
          else if (desc.includes('barracão') || desc.includes('silo') || desc.includes('armaz')) tipo = 'Imóvel Rural';

          return {
            id: item.id,
            descricao: item.description,
            valor: item.value,
            tipo,
            status: 'aceita', // Backend does not track status yet
          };
        });
        setData(guarantees);
      } catch (err) {
        toastError('Erro ao carregar garantias da API');
      } finally {
        setLoading(false);
      }
    };
    fetchGuarantees();
  }, [toastError]);

  const [form, setForm] = useState({ tipo: '', descricao: '', valor: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => data.filter(d => !filterTipo || d.tipo === filterTipo), [data, filterTipo]);

  const totals = useMemo(() => {
    const total = filtered.reduce((s, d) => s + d.valor, 0);
    const aceitas = filtered.filter(d => d.status === 'aceita').reduce((s, d) => s + d.valor, 0);
    const pendentes = filtered.filter(d => d.status !== 'aceita').reduce((s, d) => s + d.valor, 0);
    const porTipo: Record<string, number> = {};
    filtered.forEach(d => { porTipo[d.tipo] = (porTipo[d.tipo] || 0) + d.valor; });
    const ratio = passivoTotal > 0 ? aceitas / passivoTotal : 0;
    const rating = calcRating(ratio);
    return { total, aceitas, pendentes, porTipo, ratio, rating, qtd: filtered.length };
  }, [filtered]);

  const pieData = Object.entries(totals.porTipo)
    .map(([tipo, valor]) => ({ name: tipo, value: valor, color: tipoColorMap[tipo] || '#64748b' }))
    .sort((a, b) => b.value - a.value);

  const removeItem = (id: string) => { setData(prev => prev.filter(d => d.id !== id)); toastWarning('Garantia removida'); };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.tipo) errors.tipo = 'Obrigatório';
    if (!form.descricao.trim()) errors.descricao = 'Obrigatório';
    const val = parseFloat(form.valor);
    if (!form.valor || isNaN(val) || val <= 0) errors.valor = 'Valor positivo';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = async () => {
    if (!validateForm()) { setFormStatus('error'); toastError('Preencha todos os campos obrigatórios'); setTimeout(() => setFormStatus('idle'), 2000); return; }
    
    try {
      await fetch('http://localhost:3001/data/guarantees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-token' },
        body: JSON.stringify({
          farmId: 'some-farm-id',
          description: form.descricao,
          value: parseFloat(form.valor)
        })
      });
    } catch(e) {}

    const newItem: Garantia = {
      id: gerarId(), tipo: form.tipo, descricao: form.descricao,
      valor: parseFloat(form.valor), status: 'pendente',
    };
    setData(prev => [newItem, ...prev]);
    setForm({ tipo: '', descricao: '', valor: '' });
    setFormErrors({});
    setFormStatus('success');
    toastSuccess('Garantia registrada (Simulada)!');
    setTimeout(() => { setFormStatus('idle'); setShowForm(false); }, 1500);
  };

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const fmtM = (v: number) => `R$ ${(v / 1000000).toFixed(2)}M`;

  return (
    <MainContent>
        <PageHeader
        title="Garantias"
        accent="e Colaterais"
        description="Gestão de garantias oferecidas em operações de crédito."
        badge={<button onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 flex items-center gap-2 transition-all duration-300">
            <Plus size={18} /> Nova Garantia
          </button>}
      />

        {/* Add Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
              <div className="bg-industrial-card border border-primary/30 p-6">
                <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Registrar Garantia</h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500 block mb-1">Tipo</label>
                    <select value={form.tipo}
                      onChange={(e) => { setForm(p => ({ ...p, tipo: e.target.value })); setFormErrors(p => { const n = { ...p }; delete n.tipo; return n; }); }}
                      className={cn("w-full bg-slate-900 border px-3 py-2 text-sm focus:outline-none focus:border-primary", formErrors.tipo ? "border-red-500/60" : "border-industrial-border")}>
                      <option value="">Selecione</option>
                      {tiposGarantia.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500 block mb-1">Descrição</label>
                    <input value={form.descricao}
                      onChange={(e) => { setForm(p => ({ ...p, descricao: e.target.value })); setFormErrors(p => { const n = { ...p }; delete n.descricao; return n; }); }}
                      placeholder="Ex: Fazenda 500ha, CPR safra..."
                      className={cn("w-full bg-slate-900 border px-3 py-2 text-sm focus:outline-none focus:border-primary placeholder:text-slate-700", formErrors.descricao ? "border-red-500/60" : "border-industrial-border")} />
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500 block mb-1">Valor (R$)</label>
                    <input type="number" step="0.01" value={form.valor}
                      onChange={(e) => { setForm(p => ({ ...p, valor: e.target.value })); setFormErrors(p => { const n = { ...p }; delete n.valor; return n; }); }}
                      placeholder="0.00"
                      className={cn("w-full bg-slate-900 border px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary placeholder:text-slate-700", formErrors.valor ? "border-red-500/60" : "border-industrial-border")} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div>
                    {formStatus === 'success' && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 size={12} /> Registrada!</motion.span>}
                    {formStatus === 'error' && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-400 font-bold flex items-center gap-1"><AlertCircle size={12} /> Preencha os campos</motion.span>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowForm(false)} className="text-xs text-slate-500 hover:text-white transition-colors uppercase tracking-widest font-bold px-4 py-2">Cancelar</button>
                    <button onClick={handleAdd} className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-2 text-xs transition-all">Registrar</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2 card px-4 py-2">
            <Filter size={14} className="text-slate-500" />
            <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="bg-transparent text-xs font-bold uppercase tracking-widest text-slate-400 focus:outline-none cursor-pointer">
              <option value="">Todos Tipos</option>
              {tiposGarantia.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}
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
            { label: 'Total Garantias', value: fmtM(totals.total), accent: true },
            { label: 'Aceitas', value: fmtM(totals.aceitas) },
            { label: 'Pendentes / Análise', value: fmtM(totals.pendentes) },
            { label: 'Cobertura (vs Passivo)', value: `${(totals.ratio * 100).toFixed(0)}%` },
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
                <ShieldCheck size={16} className="text-primary-light" />
                <h4 className="font-bold uppercase tracking-tight text-sm">Garantias Registradas</h4>
              </div>
              <span className="text-[10px] text-slate-500 font-bold">{filtered.length} garantias</span>
            </div>
            {loading ? (
              <div className="p-8 text-center text-slate-500">Carregando garantias...</div>
            ) : (
            <table className="w-full table-striped">
              <thead>
                <tr className="border-b border-industrial-border bg-slate-900/50">
                  {['Tipo', 'Descrição', 'Status', 'Valor', ''].map(h => (
                    <th key={h} className="p-3 text-left text-[8px] uppercase tracking-widest text-slate-600 font-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const TipoIcon = tipoIconMap[item.tipo] || ShieldCheck;
                  const color = tipoColorMap[item.tipo] || '#64748b';
                  const st = statusCfg[item.status];
                  return (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="border-b border-industrial-border/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <TipoIcon size={14} style={{ color }} />
                          <span className="text-sm font-bold">{item.tipo}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-slate-300 max-w-[280px] truncate">{item.descricao}</td>
                      <td className="p-3">
                        <span className={cn("text-[9px] px-2 py-1 font-semibold uppercase border rounded", st.cls)}>
                          {st.label}
                        </span>
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
                  <td colSpan={3} className="p-3 text-xs font-semibold text-slate-400">Total Garantias</td>
                  <td className={cn("p-3 text-sm font-black font-mono text-primary-light privacy-mask", isPrivate && "privacy-hidden")}>{fmt(totals.total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Credit Rating */}
            <div className="bg-industrial-card border-2 p-6" style={{ borderColor: totals.rating.color }}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold uppercase tracking-tight text-sm flex items-center gap-2">
                  <Star size={14} style={{ color: totals.rating.color }} />
                  Rating de Crédito
                </h4>
                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-black">Garantias / Passivos</span>
              </div>
              <div className="text-center mb-4">
                <motion.p initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl font-bold tracking-tight" style={{ color: totals.rating.color }}>
                  {totals.rating.grade}
                </motion.p>
                <p className="text-sm font-bold mt-1" style={{ color: totals.rating.color }}>{totals.rating.label}</p>
              </div>
              <div className="flex justify-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} className={i < totals.rating.stars ? '' : 'opacity-20'}
                    style={{ color: totals.rating.color }} fill={i < totals.rating.stars ? totals.rating.color : 'transparent'} />
                ))}
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Garantias Aceitas</span>
                  <span className={cn("font-mono font-bold text-emerald-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmtM(totals.aceitas)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Passivo Total</span>
                  <span className={cn("font-mono font-bold text-red-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmtM(passivoTotal)}</span>
                </div>
                <div className="border-t border-industrial-border pt-2 flex justify-between">
                  <span className="text-slate-400 font-bold">Índice de Cobertura</span>
                  <span className={cn("font-mono font-black privacy-mask", isPrivate && "privacy-hidden")} style={{ color: totals.rating.color }}>
                    {totals.ratio.toFixed(2)}x
                  </span>
                </div>
              </div>
              <div className="mt-3 h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(totals.ratio / 3 * 100, 100)}%` }}
                  className="h-full" style={{ backgroundColor: totals.rating.color }} />
              </div>
              <div className="flex justify-between mt-1 text-[8px] text-slate-600 font-mono">
                <span>0x</span><span>1x</span><span>2x</span><span>3x+</span>
              </div>
            </div>

            {/* Pie */}
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Composição</h4>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={65} innerRadius={38} strokeWidth={0}>
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

            {/* Rating Scale */}
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-3">Escala de Rating</h4>
              <div className="space-y-1">
                {[
                  { grade: 'AAA', ratio: '≥ 3.0x', color: '#10b981' },
                  { grade: 'AA', ratio: '≥ 2.5x', color: '#22c55e' },
                  { grade: 'A', ratio: '≥ 2.0x', color: '#34d399' },
                  { grade: 'BBB', ratio: '≥ 1.5x', color: '#f59e0b' },
                  { grade: 'BB', ratio: '≥ 1.0x', color: '#f97316' },
                  { grade: 'B', ratio: '≥ 0.7x', color: '#ef4444' },
                  { grade: 'C', ratio: '< 0.7x', color: '#dc2626' },
                ].map(s => (
                  <div key={s.grade} className={cn("flex items-center justify-between py-1.5 px-2 text-xs",
                    s.grade === totals.rating.grade && "bg-slate-800/50 border-l-2"
                  )} style={s.grade === totals.rating.grade ? { borderColor: s.color } : {}}>
                    <div className="flex items-center gap-2">
                      <span className="font-black font-mono w-8" style={{ color: s.color }}>{s.grade}</span>
                      {s.grade === totals.rating.grade && <span className="text-[8px] uppercase tracking-widest font-bold text-slate-400">← Atual</span>}
                    </div>
                    <span className="text-slate-500 font-mono text-[10px]">{s.ratio}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
    </MainContent>
  );
}
