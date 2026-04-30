'use client';

import React, { useState, useMemo } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { usePrivacy } from '@/context/PrivacyContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import {
  Plus, Trash2, Filter, ChevronDown, X, GraduationCap,
  DollarSign, AlertCircle, CheckCircle2,
  Leaf, Calculator, Scale, Microscope, ShieldCheck, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface Consultoria {
  id: string;
  tipoConsultoria: string;
  consultor: string;
  descricao: string;
  valor: number;
  periodo: string;
  contrato: 'mensal' | 'projeto' | 'anual';
}

const tiposConsultoria = [
  { value: 'Agronômica', icon: Leaf, color: '#10b981' },
  { value: 'Financeira', icon: BarChart3, color: '#06b6d4' },
  { value: 'Contábil', icon: Calculator, color: '#f59e0b' },
  { value: 'Jurídica', icon: Scale, color: '#8b5cf6' },
  { value: 'Ambiental', icon: Microscope, color: '#22c55e' },
  { value: 'Seguros', icon: ShieldCheck, color: '#ef4444' },
];

const tipoColorMap: Record<string, string> = {};
const tipoIconMap: Record<string, typeof Leaf> = {};
tiposConsultoria.forEach(t => { tipoColorMap[t.value] = t.color; tipoIconMap[t.value] = t.icon; });

const contratoConfig = {
  mensal: { label: 'Mensal', bg: 'bg-emerald-950/40 border-emerald-800 text-emerald-400' },
  projeto: { label: 'Projeto', bg: 'bg-orange-950/40 border-orange-800 text-orange-400' },
  anual: { label: 'Anual', bg: 'bg-cyan-950/40 border-cyan-800 text-cyan-400' },
};

const initialData: Consultoria[] = [
  { id: '1', tipoConsultoria: 'Agronômica', consultor: 'AgroPlan Consultoria', descricao: 'Manejo integrado de pragas e doenças', valor: 12000, periodo: '2024/25', contrato: 'mensal' },
  { id: '2', tipoConsultoria: 'Agronômica', consultor: 'Dr. Marcelo Rodrigues', descricao: 'Análise de solo e recomendação de calagem', valor: 8500, periodo: '2024/25', contrato: 'projeto' },
  { id: '3', tipoConsultoria: 'Financeira', consultor: 'GrainFinance Assessoria', descricao: 'Gestão de hedge e derivativos agrícolas', valor: 15000, periodo: '2024/25', contrato: 'mensal' },
  { id: '4', tipoConsultoria: 'Financeira', consultor: 'Capital Rural Partners', descricao: 'Estruturação de crédito rural (Plano Safra)', valor: 25000, periodo: '2024/25', contrato: 'projeto' },
  { id: '5', tipoConsultoria: 'Contábil', consultor: 'Escritório Fonseca & Associados', descricao: 'Contabilidade rural e apuração fiscal', valor: 6500, periodo: '2024/25', contrato: 'mensal' },
  { id: '6', tipoConsultoria: 'Contábil', consultor: 'Escritório Fonseca & Associados', descricao: 'Declaração ITR e IR pessoa jurídica', valor: 4200, periodo: '2024/25', contrato: 'anual' },
  { id: '7', tipoConsultoria: 'Jurídica', consultor: 'Advocacia Agrária Silva', descricao: 'Regularização fundiária e contratos', valor: 9800, periodo: '2024/25', contrato: 'projeto' },
  { id: '8', tipoConsultoria: 'Ambiental', consultor: 'EcoAgro Consultoria', descricao: 'Licenciamento ambiental e CAR', valor: 18000, periodo: '2024/25', contrato: 'projeto' },
  { id: '9', tipoConsultoria: 'Seguros', consultor: 'AgroSeg Corretora', descricao: 'Gestão de apólices e sinistros', valor: 3500, periodo: '2024/25', contrato: 'anual' },
  { id: '10', tipoConsultoria: 'Agronômica', consultor: 'AgTech Solutions', descricao: 'Agricultura de precisão e NDVI', valor: 22000, periodo: '2024/25', contrato: 'anual' },
];

function gerarId() { return Math.random().toString(36).substring(2, 9); }

export default function ConsultingPage() {
  const { isPrivate } = usePrivacy();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const [data, setData] = useState<Consultoria[]>(initialData);
  const [filterTipo, setFilterTipo] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [form, setForm] = useState({ tipoConsultoria: '', consultor: '', descricao: '', valor: '', contrato: 'mensal' as Consultoria['contrato'] });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => data.filter(d => !filterTipo || d.tipoConsultoria === filterTipo), [data, filterTipo]);

  const totals = useMemo(() => {
    const total = filtered.reduce((s, d) => s + d.valor, 0);
    const porTipo: Record<string, number> = {};
    const mensal = filtered.filter(d => d.contrato === 'mensal').reduce((s, d) => s + d.valor, 0);
    filtered.forEach(d => { porTipo[d.tipoConsultoria] = (porTipo[d.tipoConsultoria] || 0) + d.valor; });
    return { total, porTipo, mensal, contratos: filtered.length };
  }, [filtered]);

  const pieData = Object.entries(totals.porTipo)
    .map(([tipo, valor]) => ({ name: tipo, value: valor, color: tipoColorMap[tipo] || '#64748b' }))
    .sort((a, b) => b.value - a.value);

  const removeItem = (id: string) => { setData(prev => prev.filter(d => d.id !== id)); toastWarning('Registro removido'); };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.tipoConsultoria) errors.tipoConsultoria = 'Obrigatório';
    if (!form.consultor.trim()) errors.consultor = 'Obrigatório';
    if (!form.descricao.trim()) errors.descricao = 'Obrigatório';
    const val = parseFloat(form.valor);
    if (!form.valor || isNaN(val) || val <= 0) errors.valor = 'Valor positivo';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = () => {
    if (!validateForm()) { setFormStatus('error'); toastError('Preencha todos os campos obrigatórios'); setTimeout(() => setFormStatus('idle'), 2000); return; }
    const newItem: Consultoria = {
      id: gerarId(), tipoConsultoria: form.tipoConsultoria, consultor: form.consultor,
      descricao: form.descricao, valor: parseFloat(form.valor), periodo: '2024/25', contrato: form.contrato,
    };
    setData(prev => [newItem, ...prev]);
    setForm({ tipoConsultoria: '', consultor: '', descricao: '', valor: '', contrato: 'mensal' });
    setFormErrors({});
    setFormStatus('success');
    toastSuccess('Consultoria registrada com sucesso!');
    setTimeout(() => { setFormStatus('idle'); setShowForm(false); }, 1500);
  };

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <MainContent>
        <PageHeader
        title="Consultoria"
        accent="Agrícola"
        description="Gestão de custos de consultoria técnica e assessoria."
        badge={<button onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 flex items-center gap-2 transition-all duration-300">
            <Plus size={18} /> Nova Consultoria
          </button>}
      />

        {/* Add Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
              <div className="bg-industrial-card border border-primary/30 p-6">
                <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Registrar Consultoria</h4>
                <div className="grid grid-cols-6 gap-4 items-end">
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500 block mb-1">Tipo</label>
                    <select value={form.tipoConsultoria}
                      onChange={(e) => { setForm(p => ({ ...p, tipoConsultoria: e.target.value })); setFormErrors(p => { const n = { ...p }; delete n.tipoConsultoria; return n; }); }}
                      className={cn("w-full bg-slate-900 border px-3 py-2 text-sm focus:outline-none focus:border-primary", formErrors.tipoConsultoria ? "border-red-500/60" : "border-industrial-border")}>
                      <option value="">Selecione</option>
                      {tiposConsultoria.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500 block mb-1">Consultor</label>
                    <input value={form.consultor}
                      onChange={(e) => { setForm(p => ({ ...p, consultor: e.target.value })); setFormErrors(p => { const n = { ...p }; delete n.consultor; return n; }); }}
                      placeholder="Nome ou empresa"
                      className={cn("w-full bg-slate-900 border px-3 py-2 text-sm focus:outline-none focus:border-primary placeholder:text-slate-700", formErrors.consultor ? "border-red-500/60" : "border-industrial-border")} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] font-semibold text-slate-500 block mb-1">Descrição</label>
                    <input value={form.descricao}
                      onChange={(e) => { setForm(p => ({ ...p, descricao: e.target.value })); setFormErrors(p => { const n = { ...p }; delete n.descricao; return n; }); }}
                      placeholder="Escopo do serviço..."
                      className={cn("w-full bg-slate-900 border px-3 py-2 text-sm focus:outline-none focus:border-primary placeholder:text-slate-700", formErrors.descricao ? "border-red-500/60" : "border-industrial-border")} />
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500 block mb-1">Valor (R$)</label>
                    <input type="number" step="0.01" value={form.valor}
                      onChange={(e) => { setForm(p => ({ ...p, valor: e.target.value })); setFormErrors(p => { const n = { ...p }; delete n.valor; return n; }); }}
                      placeholder="0.00"
                      className={cn("w-full bg-slate-900 border px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary placeholder:text-slate-700", formErrors.valor ? "border-red-500/60" : "border-industrial-border")} />
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500 block mb-1">Contrato</label>
                    <select value={form.contrato}
                      onChange={(e) => setForm(p => ({ ...p, contrato: e.target.value as Consultoria['contrato'] }))}
                      className="w-full bg-slate-900 border border-industrial-border px-3 py-2 text-sm focus:outline-none focus:border-primary">
                      <option value="mensal">Mensal</option>
                      <option value="projeto">Projeto</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div>
                    {formStatus === 'success' && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 size={12} /> Registrado!</motion.span>}
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
              <option value="">Todas Consultorias</option>
              {tiposConsultoria.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}
            </select>
            <ChevronDown size={12} className="text-slate-600" />
          </div>
          {filterTipo && (
            <button onClick={() => setFilterTipo('')} className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"><X size={12} /> Limpar</button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Custo Total Consultoria', value: fmt(totals.total), accent: true },
            { label: 'Recorrente (Mensal)', value: fmt(totals.mensal) },
            { label: 'Projeção Anual', value: fmt(totals.mensal * 12 + (totals.total - totals.mensal)) },
            { label: 'Contratos Ativos', value: totals.contratos.toString() },
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
                <GraduationCap size={16} className="text-primary-light" />
                <h4 className="font-bold uppercase tracking-tight text-sm">Contratos de Consultoria</h4>
              </div>
              <span className="text-[10px] text-slate-500 font-bold">{filtered.length} contratos</span>
            </div>
            <table className="w-full table-striped">
              <thead>
                <tr className="border-b border-industrial-border bg-slate-900/50">
                  {['Tipo', 'Consultor', 'Descrição', 'Contrato', 'Valor', ''].map(h => (
                    <th key={h} className="p-3 text-left text-[9px] uppercase tracking-widest text-slate-600 font-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const TipoIcon = tipoIconMap[item.tipoConsultoria] || GraduationCap;
                  const color = tipoColorMap[item.tipoConsultoria] || '#64748b';
                  const ct = contratoConfig[item.contrato];
                  return (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="border-b border-industrial-border/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <TipoIcon size={14} style={{ color }} />
                          <span className="text-sm font-bold">{item.tipoConsultoria}</span>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-slate-400">{item.consultor}</td>
                      <td className="p-3 text-sm text-slate-300 max-w-[200px] truncate">{item.descricao}</td>
                      <td className="p-3">
                        <span className={cn("text-[9px] px-2 py-1 font-semibold uppercase border rounded", ct.bg)}>{ct.label}</span>
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
                  <td colSpan={4} className="p-3 text-xs font-semibold text-slate-400">Total Consultoria</td>
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
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Distribuição por Tipo</h4>
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
                      {totals.total > 0 ? `${(p.value / totals.total * 100).toFixed(1)}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Consultors */}
            <div className="card p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Maiores Contratos</h4>
              <div className="space-y-3">
                {[...filtered].sort((a, b) => b.valor - a.valor).slice(0, 5).map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-600 w-4">{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-xs text-slate-400 truncate max-w-[120px]">{c.consultor}</span>
                    </div>
                    <span className={cn("text-[10px] font-mono font-bold text-slate-300 privacy-mask", isPrivate && "privacy-hidden")}>{fmt(c.valor)}</span>
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
              <p className="text-[10px] text-slate-500 mb-3">Custos de consultoria integram:</p>
              <div className="space-y-2">
                {[
                  'Custos Totais — Overhead',
                  'DRE — Despesas com Serviços',
                  'EBITDA — Resultado Operacional',
                  'Custo por Hectare — Benchmark',
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
