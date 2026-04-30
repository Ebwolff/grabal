'use client';

import React, { useState, useMemo } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { MetricCard } from '@/components/MetricCard';
import { usePrivacy } from '@/context/PrivacyContext';
import { useGlobalFilter } from '@/context/GlobalFilterContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import {
  Plus, Trash2, X, Package, DollarSign,
  FlaskConical, Leaf, Wheat, AlertCircle, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface Insumo {
  id: string;
  cultura: string;
  produto: string;
  tipo: 'fertilizante' | 'defensivo' | 'semente';
  quantidade: number;
  precoUnitario: number;
  custoTotal: number;
}

const tipoConfig = {
  fertilizante: { label: 'Fertilizante', color: 'text-success', bg: 'bg-success/10 border-success/30', icon: FlaskConical },
  defensivo: { label: 'Defensivo', color: 'text-warning', bg: 'bg-warning/10 border-warning/30', icon: Leaf },
  semente: { label: 'Semente', color: 'text-primary-light', bg: 'bg-primary/10 border-primary-light/30', icon: Wheat },
};

const pieColors = { fertilizante: '#10b981', defensivo: '#F59E0B', semente: '#3B82F6' };

const initialData: Insumo[] = [
  { id: '1', cultura: 'Soja', produto: 'MAP (Monoamônio Fosfato)', tipo: 'fertilizante', quantidade: 200, precoUnitario: 3200, custoTotal: 640000 },
  { id: '2', cultura: 'Soja', produto: 'KCl (Cloreto de Potássio)', tipo: 'fertilizante', quantidade: 180, precoUnitario: 2800, custoTotal: 504000 },
  { id: '3', cultura: 'Soja', produto: 'Glifosato', tipo: 'defensivo', quantidade: 120, precoUnitario: 42, custoTotal: 5040 },
  { id: '4', cultura: 'Soja', produto: 'Intacta RR2 PRO', tipo: 'semente', quantidade: 800, precoUnitario: 520, custoTotal: 416000 },
  { id: '5', cultura: 'Milho', produto: 'Ureia', tipo: 'fertilizante', quantidade: 150, precoUnitario: 2400, custoTotal: 360000 },
  { id: '6', cultura: 'Milho', produto: 'Atrazina', tipo: 'defensivo', quantidade: 80, precoUnitario: 38, custoTotal: 3040 },
  { id: '7', cultura: 'Milho', produto: 'DKB 390 PRO3', tipo: 'semente', quantidade: 400, precoUnitario: 680, custoTotal: 272000 },
  { id: '8', cultura: 'Algodão', produto: 'NPK 20-10-10', tipo: 'fertilizante', quantidade: 300, precoUnitario: 2900, custoTotal: 870000 },
  { id: '9', cultura: 'Algodão', produto: 'Mancozeb', tipo: 'defensivo', quantidade: 60, precoUnitario: 85, custoTotal: 5100 },
  { id: '10', cultura: 'Café', produto: 'Calcário Dolomítico', tipo: 'fertilizante', quantidade: 100, precoUnitario: 180, custoTotal: 18000 },
];

const culturasDisponiveis = ['Soja', 'Milho', 'Algodão', 'Café', 'Trigo'];
const tiposDisponiveis: Array<{ value: Insumo['tipo']; label: string }> = [
  { value: 'fertilizante', label: 'Fertilizante' },
  { value: 'defensivo', label: 'Defensivo' },
  { value: 'semente', label: 'Semente' },
];

function gerarId() { return Math.random().toString(36).substring(2, 9); }

export default function CostsPage() {
  const { isPrivate } = usePrivacy();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const { cultura: globalCultura } = useGlobalFilter();
  const [data, setData] = useState<Insumo[]>(initialData);
  const [showForm, setShowForm] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [form, setForm] = useState({ cultura: '', produto: '', tipo: '' as Insumo['tipo'] | '', quantidade: '', precoUnitario: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    return data.filter(d => (!globalCultura || d.cultura === globalCultura));
  }, [data, globalCultura]);

  const totals = useMemo(() => {
    const custoGeral = filtered.reduce((s, d) => s + d.custoTotal, 0);
    const porTipo: Record<string, number> = {};
    const porCultura: Record<string, number> = {};
    filtered.forEach(d => {
      porTipo[d.tipo] = (porTipo[d.tipo] || 0) + d.custoTotal;
      porCultura[d.cultura] = (porCultura[d.cultura] || 0) + d.custoTotal;
    });
    return { custoGeral, porTipo, porCultura };
  }, [filtered]);

  const pieData = Object.entries(totals.porTipo).map(([tipo, valor]) => ({
    name: tipoConfig[tipo as keyof typeof tipoConfig]?.label || tipo,
    value: valor,
    color: pieColors[tipo as keyof typeof pieColors] || '#64748b',
  }));

  const culturaCostData = Object.entries(totals.porCultura)
    .map(([cult, valor]) => ({ cultura: cult, valor }))
    .sort((a, b) => b.valor - a.valor);

  const removeItem = (id: string) => { setData(prev => prev.filter(d => d.id !== id)); toastWarning('Insumo removido'); };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.cultura) errors.cultura = 'Obrigatório';
    if (!form.produto.trim()) errors.produto = 'Obrigatório';
    if (!form.tipo) errors.tipo = 'Obrigatório';
    const qty = parseFloat(form.quantidade);
    if (!form.quantidade || isNaN(qty) || qty <= 0) errors.quantidade = 'Valor positivo';
    const price = parseFloat(form.precoUnitario);
    if (!form.precoUnitario || isNaN(price) || price <= 0) errors.precoUnitario = 'Valor positivo';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = () => {
    if (!validateForm()) { setFormStatus('error'); toastError('Preencha todos os campos obrigatórios'); setTimeout(() => setFormStatus('idle'), 2000); return; }
    const qty = parseFloat(form.quantidade);
    const price = parseFloat(form.precoUnitario);
    setData(prev => [{ id: gerarId(), cultura: form.cultura, produto: form.produto, tipo: form.tipo as Insumo['tipo'], quantidade: qty, precoUnitario: price, custoTotal: qty * price }, ...prev]);
    setForm({ cultura: '', produto: '', tipo: '', quantidade: '', precoUnitario: '' });
    setFormErrors({});
    setFormStatus('success');
    toastSuccess('Insumo adicionado com sucesso!');
    setTimeout(() => { setFormStatus('idle'); setShowForm(false); }, 1500);
  };

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <MainContent>
      <PageHeader
        title="Custos de"
        accent="Insumos"
        description="Gestão de custos por insumo agrícola. Este módulo alimenta o CMV e o cálculo de margem."
        badge={
          <button onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary-light text-white font-semibold px-5 py-2 text-xs flex items-center gap-2 transition-all rounded-lg">
            <Plus size={16} /> Novo Insumo
          </button>
        }
      />

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            <div className="card p-5 border-primary/30">
              <h4 className="text-sm font-semibold text-white mb-4">Cadastrar Insumo</h4>
              <div className="grid grid-cols-6 gap-3 items-end">
                <div>
                  <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 block mb-1">Cultura</label>
                  <select value={form.cultura} onChange={(e) => { setForm(p => ({ ...p, cultura: e.target.value })); setFormErrors(p => { const n = { ...p }; delete n.cultura; return n; }); }}
                    className={cn('w-full bg-industrial-bg border px-3 py-2 text-sm rounded focus:outline-none focus-ring', formErrors.cultura ? 'border-danger/60' : 'border-industrial-border')}>
                    <option value="">Selecione</option>
                    {culturasDisponiveis.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 block mb-1">Produto</label>
                  <input value={form.produto} onChange={(e) => { setForm(p => ({ ...p, produto: e.target.value })); setFormErrors(p => { const n = { ...p }; delete n.produto; return n; }); }}
                    placeholder="Ex: MAP, Glifosato, Intacta..."
                    className={cn('w-full bg-industrial-bg border px-3 py-2 text-sm rounded focus:outline-none focus-ring placeholder:text-slate-700', formErrors.produto ? 'border-danger/60' : 'border-industrial-border')} />
                </div>
                <div>
                  <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 block mb-1">Tipo</label>
                  <select value={form.tipo} onChange={(e) => { setForm(p => ({ ...p, tipo: e.target.value as Insumo['tipo'] })); setFormErrors(p => { const n = { ...p }; delete n.tipo; return n; }); }}
                    className={cn('w-full bg-industrial-bg border px-3 py-2 text-sm rounded focus:outline-none focus-ring', formErrors.tipo ? 'border-danger/60' : 'border-industrial-border')}>
                    <option value="">Tipo</option>
                    {tiposDisponiveis.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 block mb-1">Qtd</label>
                  <input type="number" step="0.01" value={form.quantidade}
                    onChange={(e) => { setForm(p => ({ ...p, quantidade: e.target.value })); setFormErrors(p => { const n = { ...p }; delete n.quantidade; return n; }); }}
                    placeholder="0" className={cn('w-full bg-industrial-bg border px-3 py-2 text-sm rounded focus:outline-none focus-ring font-mono placeholder:text-slate-700', formErrors.quantidade ? 'border-danger/60' : 'border-industrial-border')} />
                </div>
                <div>
                  <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 block mb-1">Preço Unit. (R$)</label>
                  <input type="number" step="0.01" value={form.precoUnitario}
                    onChange={(e) => { setForm(p => ({ ...p, precoUnitario: e.target.value })); setFormErrors(p => { const n = { ...p }; delete n.precoUnitario; return n; }); }}
                    placeholder="0.00" className={cn('w-full bg-industrial-bg border px-3 py-2 text-sm rounded focus:outline-none focus-ring font-mono placeholder:text-slate-700', formErrors.precoUnitario ? 'border-danger/60' : 'border-industrial-border')} />
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  {form.quantidade && form.precoUnitario && (
                    <span className="text-xs text-slate-500">Custo Total: <span className="text-success font-semibold font-mono">{fmt((parseFloat(form.quantidade) || 0) * (parseFloat(form.precoUnitario) || 0))}</span></span>
                  )}
                  {formStatus === 'success' && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-success font-semibold flex items-center gap-1"><CheckCircle2 size={12} /> Adicionado!</motion.span>}
                  {formStatus === 'error' && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-danger font-semibold flex items-center gap-1"><AlertCircle size={12} /> Preencha os campos</motion.span>}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowForm(false)} className="text-xs text-slate-500 hover:text-white transition-colors px-4 py-2 rounded-lg">Cancelar</button>
                  <button onClick={handleAdd} className="bg-primary hover:bg-primary-light text-white font-semibold px-5 py-2 text-xs transition-all rounded-lg">Registrar</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard title="Custo Total" value={fmt(totals.custoGeral)} icon={DollarSign} accentColor="#3B82F6" />
        <MetricCard title="Fertilizantes" value={fmt(totals.porTipo['fertilizante'] || 0)} icon={FlaskConical} accentColor="#10B981" />
        <MetricCard title="Defensivos" value={fmt(totals.porTipo['defensivo'] || 0)} icon={Leaf} accentColor="#F59E0B" />
        <MetricCard title="Sementes" value={fmt(totals.porTipo['semente'] || 0)} icon={Wheat} accentColor="#3B82F6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Table */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="p-4 border-b border-industrial-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-primary-light" />
              <h4 className="text-sm font-semibold text-white">Registro de Insumos</h4>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">{filtered.length} itens</span>
          </div>
          <table className="w-full table-striped">
            <thead>
              <tr>
                {['Cultura', 'Produto', 'Tipo', 'Qtd', 'Preço Unit.', 'Custo Total', ''].map(h => (
                  <th key={h} className="text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const tc = tipoConfig[item.tipo];
                const TipoIcon = tc.icon;
                return (
                  <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                    <td className="font-semibold text-white">{item.cultura}</td>
                    <td className="text-slate-300">{item.produto}</td>
                    <td>
                      <span className={cn('text-[9px] px-2 py-1 font-semibold uppercase border rounded inline-flex items-center gap-1', tc.bg, tc.color)}>
                        <TipoIcon size={10} />{tc.label}
                      </span>
                    </td>
                    <td className={cn('font-mono privacy-mask', isPrivate && 'privacy-hidden')}>{item.quantidade.toLocaleString('pt-BR')}</td>
                    <td className={cn('font-mono privacy-mask', isPrivate && 'privacy-hidden')}>{fmt(item.precoUnitario)}</td>
                    <td className={cn('font-semibold font-mono text-success privacy-mask', isPrivate && 'privacy-hidden')}>{fmt(item.custoTotal)}</td>
                    <td>
                      <button onClick={() => removeItem(item.id)} className="p-1 text-slate-600 hover:text-danger transition-colors"><Trash2 size={14} /></button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-primary/30 bg-primary/5">
                <td colSpan={5} className="p-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Total</td>
                <td className={cn('p-3 text-sm font-bold font-mono text-primary-light privacy-mask', isPrivate && 'privacy-hidden')}>{fmt(totals.custoGeral)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Charts */}
        <div className="space-y-4">
          <div className="card p-5">
            <h4 className="text-sm font-semibold text-white mb-4">Distribuição por Tipo</h4>
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
                  <span className={cn('font-semibold font-mono text-slate-300 privacy-mask', isPrivate && 'privacy-hidden')}>
                    {totals.custoGeral > 0 ? `${(p.value / totals.custoGeral * 100).toFixed(1)}%` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h4 className="text-sm font-semibold text-white mb-4">Custo por Cultura</h4>
            <div className="space-y-3">
              {culturaCostData.map((c) => (
                <div key={c.cultura}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-white">{c.cultura}</span>
                    <span className={cn('text-[10px] font-mono font-semibold text-slate-300 privacy-mask', isPrivate && 'privacy-hidden')}>{fmt(c.valor)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${totals.custoGeral > 0 ? (c.valor / totals.custoGeral * 100) : 0}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full rounded-full bg-primary-light" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={14} className="text-primary-light" />
              <h4 className="text-sm font-semibold text-white">Integração</h4>
            </div>
            <p className="text-[10px] text-slate-500 mb-3">Os custos de insumos alimentam automaticamente:</p>
            <div className="space-y-2">
              {['CMV — Custo da Mercadoria Vendida', 'DRE — Linha de Custos Operacionais', 'Margem Bruta = Receita − Custos', 'Rating — Score de Eficiência'].map(item => (
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
