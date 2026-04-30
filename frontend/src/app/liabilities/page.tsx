'use client';

import React, { useState, useMemo } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { usePrivacy } from '@/context/PrivacyContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import {
  Plus, Trash2, Filter, ChevronDown, X, CreditCard,
  DollarSign, AlertCircle, CheckCircle2, Clock, AlertTriangle,
  Landmark, Banknote, ShoppingCart, Handshake, Receipt, Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface Passivo {
  id: string;
  credor: string;
  tipo: string;
  valor: number;
  vencimento: string;
  status: 'a_vencer' | 'proximo' | 'vencido';
}

const tiposPassivo = [
  { value: 'Financiamento', icon: Landmark, color: '#06b6d4' },
  { value: 'Empréstimo', icon: Banknote, color: '#f59e0b' },
  { value: 'Fornecedores', icon: ShoppingCart, color: '#10b981' },
  { value: 'Arrendamento', icon: Handshake, color: '#a855f7' },
  { value: 'Tributário', icon: Receipt, color: '#ef4444' },
  { value: 'Trabalhista', icon: Scale, color: '#f97316' },
];

const tipoColorMap: Record<string, string> = {};
const tipoIconMap: Record<string, typeof Landmark> = {};
tiposPassivo.forEach(t => { tipoColorMap[t.value] = t.color; tipoIconMap[t.value] = t.icon; });

const statusConfig = {
  a_vencer: { label: 'A Vencer', cls: 'bg-emerald-950/40 border-emerald-800 text-emerald-400' },
  proximo: { label: 'Próximo', cls: 'bg-amber-950/40 border-amber-800 text-amber-400' },
  vencido: { label: 'Vencido', cls: 'bg-red-950/40 border-red-800 text-red-400' },
};

const initialData: Passivo[] = [];

function gerarId() { return Math.random().toString(36).substring(2, 9); }

export default function LiabilitiesPage() {
  const { isPrivate } = usePrivacy();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const [data, setData] = useState<Passivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error'>('idle');

  React.useEffect(() => {
    // TODO: Connect to Supabase Liability table
    setLoading(false);
  }, []);

  const [form, setForm] = useState({ credor: '', tipo: '', valor: '', vencimento: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => data.filter(d => !filterTipo || d.tipo === filterTipo), [data, filterTipo]);

  const totals = useMemo(() => {
    const total = filtered.reduce((s, d) => s + d.valor, 0);
    const porTipo: Record<string, number> = {};
    filtered.forEach(d => { porTipo[d.tipo] = (porTipo[d.tipo] || 0) + d.valor; });
    const vencido = filtered.filter(d => d.status === 'vencido').reduce((s, d) => s + d.valor, 0);
    const proximo = filtered.filter(d => d.status === 'proximo').reduce((s, d) => s + d.valor, 0);
    const curto = filtered.filter(d => {
      const y = parseInt(d.vencimento.split('-')[0]);
      return y <= 2025;
    }).reduce((s, d) => s + d.valor, 0);
    const longo = total - curto;
    return { total, porTipo, vencido, proximo, curto, longo, qtd: filtered.length };
  }, [filtered]);

  const pieData = Object.entries(totals.porTipo)
    .map(([tipo, valor]) => ({ name: tipo, value: valor, color: tipoColorMap[tipo] || '#64748b' }))
    .sort((a, b) => b.value - a.value);

  const removeItem = (id: string) => { setData(prev => prev.filter(d => d.id !== id)); toastWarning('Passivo removido'); };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.credor.trim()) errors.credor = 'Obrigatório';
    if (!form.tipo) errors.tipo = 'Obrigatório';
    const val = parseFloat(form.valor);
    if (!form.valor || isNaN(val) || val <= 0) errors.valor = 'Valor positivo';
    if (!form.vencimento.trim()) errors.vencimento = 'Obrigatório';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = async () => {
    if (!validateForm()) { setFormStatus('error'); toastError('Preencha todos os campos obrigatórios'); setTimeout(() => setFormStatus('idle'), 2000); return; }
    
    // Simulate current month if day is missing, API expects ISO date
    const dDate = new Date(`${form.vencimento}-01T12:00:00Z`);

    // TODO: Connect to Supabase

    const newItem: Passivo = {
      id: gerarId(), credor: form.credor, tipo: form.tipo,
      valor: parseFloat(form.valor), vencimento: form.vencimento, status: 'a_vencer',
    };
    setData(prev => [newItem, ...prev]);
    setForm({ credor: '', tipo: '', valor: '', vencimento: '' });
    setFormErrors({});
    setFormStatus('success');
    toastSuccess('Passivo registrado (Simulado)!');
    setTimeout(() => { setFormStatus('idle'); setShowForm(false); }, 1500);
  };

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const fmtM = (v: number) => `R$ ${(v / 1000000).toFixed(2)}M`;

  return (
    <MainContent>
        <PageHeader
        title="Passivos"
        accent="e Obrigações"
        description="Gestão de passivos: financiamentos, empréstimos e obrigações."
        badge={<button onClick={() => setShowForm(!showForm)}
            className="bg-red-500 hover:bg-red-400 text-white font-semibold px-6 py-3 flex items-center gap-2 transition-all duration-300">
            <Plus size={18} /> Novo Passivo
          </button>}
      />

        {/* Add Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
              <div className="bg-industrial-card border border-red-500/30 p-6">
                <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Registrar Passivo</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500 block mb-1">Credor</label>
                    <input value={form.credor}
                      onChange={(e) => { setForm(p => ({ ...p, credor: e.target.value })); setFormErrors(p => { const n = { ...p }; delete n.credor; return n; }); }}
                      placeholder="Nome do credor"
                      className={cn("w-full bg-slate-900 border px-3 py-2 text-sm focus:outline-none focus:border-red-400 placeholder:text-slate-700", formErrors.credor ? "border-red-500/60" : "border-industrial-border")} />
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500 block mb-1">Tipo</label>
                    <select value={form.tipo}
                      onChange={(e) => { setForm(p => ({ ...p, tipo: e.target.value })); setFormErrors(p => { const n = { ...p }; delete n.tipo; return n; }); }}
                      className={cn("w-full bg-slate-900 border px-3 py-2 text-sm focus:outline-none focus:border-red-400", formErrors.tipo ? "border-red-500/60" : "border-industrial-border")}>
                      <option value="">Selecione</option>
                      {tiposPassivo.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500 block mb-1">Valor (R$)</label>
                    <input type="number" step="0.01" value={form.valor}
                      onChange={(e) => { setForm(p => ({ ...p, valor: e.target.value })); setFormErrors(p => { const n = { ...p }; delete n.valor; return n; }); }}
                      placeholder="0.00"
                      className={cn("w-full bg-slate-900 border px-3 py-2 text-sm font-mono focus:outline-none focus:border-red-400 placeholder:text-slate-700", formErrors.valor ? "border-red-500/60" : "border-industrial-border")} />
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500 block mb-1">Vencimento</label>
                    <input value={form.vencimento}
                      onChange={(e) => { setForm(p => ({ ...p, vencimento: e.target.value })); setFormErrors(p => { const n = { ...p }; delete n.vencimento; return n; }); }}
                      placeholder="2025-12"
                      className={cn("w-full bg-slate-900 border px-3 py-2 text-sm font-mono focus:outline-none focus:border-red-400 placeholder:text-slate-700", formErrors.vencimento ? "border-red-500/60" : "border-industrial-border")} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div>
                    {formStatus === 'success' && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 size={12} /> Registrado!</motion.span>}
                    {formStatus === 'error' && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-400 font-bold flex items-center gap-1"><AlertCircle size={12} /> Preencha os campos</motion.span>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowForm(false)} className="text-xs text-slate-500 hover:text-white transition-colors uppercase tracking-widest font-bold px-4 py-2">Cancelar</button>
                    <button onClick={handleAdd} className="bg-red-500 hover:bg-red-400 text-white font-semibold px-6 py-2 text-xs transition-all">Registrar</button>
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
              {tiposPassivo.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}
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
            { label: 'Passivo Total', value: fmtM(totals.total), accent: true, accentColor: 'text-red-400' },
            { label: 'Curto Prazo (≤ 2025)', value: fmt(totals.curto) },
            { label: 'Longo Prazo', value: fmtM(totals.longo) },
            { label: 'Vencido', value: fmt(totals.vencido), warn: totals.vencido > 0 },
            { label: 'Obrigações', value: totals.qtd.toString() },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={cn("card p-4", s.accent ? "border-red-500/40" : s.warn ? "border-amber-600/40" : "border-industrial-border")}>
              <p className="text-[9px] uppercase tracking-widest text-slate-600 font-black mb-1">{s.label}</p>
              <p className={cn("text-lg font-bold tracking-tight font-mono privacy-mask", isPrivate && "privacy-hidden",
                s.accentColor || (s.warn ? "text-amber-400" : ""))}>
                {s.value}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Table */}
          <div className="col-span-2 card overflow-hidden">
            <div className="p-5 border-b border-industrial-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-red-400" />
                <h4 className="font-bold uppercase tracking-tight text-sm">Obrigações e Dívidas</h4>
              </div>
              <span className="text-[10px] text-slate-500 font-bold">{filtered.length} passivos</span>
            </div>
            {loading ? (
              <div className="p-8 text-center text-slate-500">Carregando passivos...</div>
            ) : (
            <table className="w-full table-striped">
              <thead>
                <tr className="border-b border-industrial-border bg-slate-900/50">
                  {['Credor', 'Tipo', 'Vencimento', 'Status', 'Valor', ''].map(h => (
                    <th key={h} className="p-3 text-left text-[8px] uppercase tracking-widest text-slate-600 font-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const TipoIcon = tipoIconMap[item.tipo] || CreditCard;
                  const color = tipoColorMap[item.tipo] || '#64748b';
                  const st = statusConfig[item.status];
                  return (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="border-b border-industrial-border/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 text-sm font-bold">{item.credor}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <TipoIcon size={12} style={{ color }} />
                          <span className="text-xs text-slate-400">{item.tipo}</span>
                        </div>
                      </td>
                      <td className="p-3 text-xs font-mono text-slate-500">{item.vencimento}</td>
                      <td className="p-3">
                        <span className={cn("text-[9px] px-2 py-1 font-semibold uppercase border rounded", st.cls)}>
                          {st.label}
                        </span>
                      </td>
                      <td className={cn("p-3 text-sm font-bold font-mono text-red-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmt(item.valor)}</td>
                      <td className="p-3">
                        <button onClick={() => removeItem(item.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-red-500/30 bg-slate-900/30">
                  <td colSpan={4} className="p-3 text-xs font-semibold text-slate-400">Passivo Total</td>
                  <td className={cn("p-3 text-sm font-black font-mono text-red-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmt(totals.total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pie by Type */}
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Composição de Passivos</h4>
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

            {/* Curto vs Longo */}
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Curto vs Longo Prazo</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-widest text-slate-600 font-black">Curto Prazo</span>
                    <span className={cn("text-xs font-mono font-bold text-amber-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmt(totals.curto)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full">
                    <div className="h-full bg-amber-500" style={{ width: `${totals.total > 0 ? (totals.curto / totals.total * 100) : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-widest text-slate-600 font-black">Longo Prazo</span>
                    <span className={cn("text-xs font-mono font-bold text-cyan-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmtM(totals.longo)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full">
                    <div className="h-full bg-cyan-500" style={{ width: `${totals.total > 0 ? (totals.longo / totals.total * 100) : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Alert */}
            {totals.vencido > 0 && (
              <div className="bg-red-950/30 border border-red-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} className="text-red-400" />
                  <span className="text-xs font-black uppercase text-red-400">Atenção</span>
                </div>
                <p className="text-[10px] text-red-300/80">
                  Existem obrigações vencidas no valor de <strong className={cn("privacy-mask", isPrivate && "privacy-hidden")}>{fmt(totals.vencido)}</strong>. Regularize para evitar encargos.
                </p>
              </div>
            )}

            {/* Integration */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={14} className="text-primary-light" />
                <h4 className="font-bold uppercase tracking-tight text-sm">Integração</h4>
              </div>
              <div className="space-y-2">
                {[
                  'Balanço Patrimonial — Passivo',
                  'Patrimônio Líquido = Ativos − Passivos',
                  'Índice de Endividamento',
                  'Fluxo de Caixa — Amortizações',
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
