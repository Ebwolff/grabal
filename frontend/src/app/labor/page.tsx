'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { usePrivacy } from '@/context/PrivacyContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import {
  Plus, Trash2, Pencil, Check, X, HardHat,
  DollarSign, AlertCircle, CheckCircle2, Users, UserCog, Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getCostsByType, deleteCost, createCostWithItems, getCulturas } from '@/lib/supabase/database';

interface Funcionario {
  id: string;
  tipoFuncionario: string;
  nome: string;
  salario: number;
  encargos: number;
  custoTotal: number;
  setor: string;
  culturaId?: string;
  culturaName?: string;
}

const tiposFuncionario = [
  'Operador de Máquinas', 'Tratorista', 'Encarregado de Campo',
  'Agrônomo', 'Técnico Agrícola', 'Auxiliar de Campo',
  'Mecânico Agrícola', 'Motorista', 'Administrador Rural', 'Temporário (Safra)',
];

const setores = ['Campo', 'Máquinas', 'Administrativo', 'Técnico'];

const setorIcons: Record<string, typeof Users> = {
  'Campo': Users, 'Máquinas': Wrench, 'Administrativo': UserCog, 'Técnico': HardHat,
};
const setorColors: Record<string, string> = {
  'Campo': '#10b981', 'Máquinas': '#f59e0b', 'Administrativo': '#8b5cf6', 'Técnico': '#06b6d4',
};

export default function LaborPage() {
  const { isPrivate } = usePrivacy();
  const { success, error: toastError, warning } = useToast();
  
  const [data, setData] = useState<Funcionario[]>([]);
  const [culturas, setCulturas] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [costs, cults] = await Promise.all([
        getCostsByType('MAO_DE_OBRA'),
        getCulturas()
      ]);
      setCulturas(cults);
      
      const mapped = costs.map(c => {
        const salItem = c.items?.find((i: any) => !i.description.startsWith('Encargos')) || { value: 0, description: 'Desconhecido' };
        const encItem = c.items?.find((i: any) => i.description.startsWith('Encargos')) || { value: 0 };
        
        // Parse "Setor | Nome | Tipo" from description
        const parts = salItem.description.split(' | ');
        const setor = parts[0] || 'Campo';
        const nome = parts[1] || 'Desconhecido';
        const tipoFuncionario = parts[2] || 'Tratorista';

        return {
          id: c.id,
          tipoFuncionario,
          nome,
          setor,
          salario: salItem.value,
          encargos: encItem.value,
          custoTotal: salItem.value + encItem.value,
          culturaName: c.Cultura?.name,
          culturaId: c.culturaId
        };
      });
      setData(mapped);
    } catch (err: any) {
      toastError('Erro ao buscar mão de obra: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [form, setForm] = useState({ tipoFuncionario: '', nome: '', salario: '', encargos: '', setor: '', culturaId: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const totals = useMemo(() => {
    const salarioTotal = data.reduce((s, d) => s + d.salario, 0);
    const encargosTotal = data.reduce((s, d) => s + d.encargos, 0);
    const custoTotal = data.reduce((s, d) => s + d.custoTotal, 0);
    const porSetor: Record<string, number> = {};
    data.forEach(d => { porSetor[d.setor] = (porSetor[d.setor] || 0) + d.custoTotal; });
    return { salarioTotal, encargosTotal, custoTotal, porSetor, qtd: data.length };
  }, [data]);

  const pieData = Object.entries(totals.porSetor).map(([setor, valor]) => ({
    name: setor, value: valor, color: setorColors[setor] || '#64748b',
  }));

  const encargoPct = totals.salarioTotal > 0 ? (totals.encargosTotal / totals.salarioTotal * 100).toFixed(1) : '0';

  const removeItem = async (id: string) => {
    if (!confirm('Excluir este funcionário?')) return;
    try {
      await deleteCost(id);
      success('Funcionário excluído!');
      fetchData();
    } catch (err: any) {
      toastError('Erro ao excluir: ' + err.message);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.tipoFuncionario) errors.tipoFuncionario = 'Obrigatório';
    if (!form.nome.trim()) errors.nome = 'Obrigatório';
    if (!form.setor) errors.setor = 'Obrigatório';
    if (!form.culturaId) errors.culturaId = 'Obrigatório';
    const sal = parseFloat(form.salario);
    if (!form.salario || isNaN(sal) || sal <= 0) errors.salario = 'Valor positivo';
    const enc = parseFloat(form.encargos);
    if (!form.encargos || isNaN(enc) || enc < 0) errors.encargos = 'Valor inválido';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = async () => {
    if (!validateForm()) { 
      setFormStatus('error'); 
      toastError('Preencha todos os campos obrigatórios'); 
      setTimeout(() => setFormStatus('idle'), 2000); 
      return; 
    }
    const sal = parseFloat(form.salario);
    const enc = parseFloat(form.encargos);
    
    try {
      await createCostWithItems(
        { culturaId: form.culturaId, type: 'MAO_DE_OBRA' },
        [
          { description: `${form.setor} | ${form.nome} | ${form.tipoFuncionario}`, value: sal },
          { description: `Encargos - ${form.nome}`, value: enc }
        ]
      );
      
      setForm({ tipoFuncionario: '', nome: '', salario: '', encargos: '', setor: '', culturaId: '' });
      setFormErrors({});
      setFormStatus('success');
      success('Funcionário cadastrado!');
      setTimeout(() => { setFormStatus('idle'); setShowForm(false); fetchData(); }, 1500);
    } catch (err: any) {
      toastError('Erro ao cadastrar: ' + err.message);
    }
  };

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <MainContent>
      <PageHeader
        title="Mão de"
        accent="Obra"
        description="Gestão de custos de mão de obra e encargos trabalhistas."
        badge={<button onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 flex items-center gap-2 transition-all duration-300">
            <Plus size={18} /> Novo Funcionário
          </button>}
      />

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            <div className="bg-industrial-card border border-primary/30 p-6">
              <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Cadastrar Funcionário</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end">
                <div className="lg:col-span-2">
                  <label className="text-[9px] font-semibold text-slate-500 block mb-1">Cultura Vinculada *</label>
                  <select value={form.culturaId}
                    onChange={(e) => { setForm(p => ({ ...p, culturaId: e.target.value })); setFormErrors(p => { const n = { ...p }; delete n.culturaId; return n; }); }}
                    className={cn("w-full bg-slate-900 border px-3 py-2 text-sm focus:outline-none focus:border-primary", formErrors.culturaId ? "border-red-500/60" : "border-industrial-border")}>
                    <option value="">Selecione Cultura</option>
                    {culturas.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-500 block mb-1">Tipo / Cargo *</label>
                  <select value={form.tipoFuncionario}
                    onChange={(e) => { setForm(p => ({ ...p, tipoFuncionario: e.target.value })); setFormErrors(p => { const n = { ...p }; delete n.tipoFuncionario; return n; }); }}
                    className={cn("w-full bg-slate-900 border px-3 py-2 text-sm focus:outline-none focus:border-primary", formErrors.tipoFuncionario ? "border-red-500/60" : "border-industrial-border")}>
                    <option value="">Selecione</option>
                    {tiposFuncionario.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <label className="text-[9px] font-semibold text-slate-500 block mb-1">Nome *</label>
                  <input value={form.nome}
                    onChange={(e) => { setForm(p => ({ ...p, nome: e.target.value })); setFormErrors(p => { const n = { ...p }; delete n.nome; return n; }); }}
                    placeholder="Nome completo"
                    className={cn("w-full bg-slate-900 border px-3 py-2 text-sm focus:outline-none focus:border-primary placeholder:text-slate-700", formErrors.nome ? "border-red-500/60" : "border-industrial-border")} />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-500 block mb-1">Setor *</label>
                  <select value={form.setor}
                    onChange={(e) => { setForm(p => ({ ...p, setor: e.target.value })); setFormErrors(p => { const n = { ...p }; delete n.setor; return n; }); }}
                    className={cn("w-full bg-slate-900 border px-3 py-2 text-sm focus:outline-none focus:border-primary", formErrors.setor ? "border-red-500/60" : "border-industrial-border")}>
                    <option value="">Setor</option>
                    {setores.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-500 block mb-1">Salário Mensal *</label>
                  <input type="number" step="0.01" value={form.salario}
                    onChange={(e) => { setForm(p => ({ ...p, salario: e.target.value })); setFormErrors(p => { const n = { ...p }; delete n.salario; return n; }); }}
                    placeholder="0.00"
                    className={cn("w-full bg-slate-900 border px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary placeholder:text-slate-700", formErrors.salario ? "border-red-500/60" : "border-industrial-border")} />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-500 block mb-1">Encargos Totais *</label>
                  <input type="number" step="0.01" value={form.encargos}
                    onChange={(e) => { setForm(p => ({ ...p, encargos: e.target.value })); setFormErrors(p => { const n = { ...p }; delete n.encargos; return n; }); }}
                    placeholder="0.00"
                    className={cn("w-full bg-slate-900 border px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary placeholder:text-slate-700", formErrors.encargos ? "border-red-500/60" : "border-industrial-border")} />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-500 block mb-1">Custo Total</label>
                  <div className="w-full bg-slate-900/50 border border-industrial-border px-3 py-2 text-sm font-mono text-primary-light font-bold">
                    {fmt((parseFloat(form.salario) || 0) + (parseFloat(form.encargos) || 0))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div>
                  {formStatus === 'success' && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 size={12} /> Cadastrado com sucesso!</motion.span>}
                  {formStatus === 'error' && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-400 font-bold flex items-center gap-1"><AlertCircle size={12} /> Preencha todos os campos</motion.span>}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowForm(false)} className="text-xs text-slate-500 hover:text-white transition-colors uppercase tracking-widest font-bold px-4 py-2">Cancelar</button>
                  <button onClick={handleAdd} className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-2 text-xs transition-all">Registrar Mão de Obra</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Custo Total Mensal', value: fmt(totals.custoTotal), accent: true },
          { label: 'Salários', value: fmt(totals.salarioTotal) },
          { label: 'Encargos', value: fmt(totals.encargosTotal) },
          { label: '% Encargos', value: `${encargoPct}%` },
          { label: 'Funcionários', value: totals.qtd.toString() },
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
              <HardHat size={16} className="text-primary-light" />
              <h4 className="font-bold uppercase tracking-tight text-sm">Quadro de Pessoal</h4>
            </div>
            <span className="text-[10px] text-slate-500 font-bold">{data.length} funcionários</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-500">Carregando mão de obra...</div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Nenhum registro encontrado.</div>
          ) : (
            <table className="w-full table-striped">
              <thead>
                <tr className="border-b border-industrial-border bg-slate-900/50">
                  {['Nome / Cultura', 'Cargo', 'Setor', 'Salário', 'Encargos', 'Custo Total', ''].map(h => (
                    <th key={h} className="p-3 text-left text-[9px] uppercase tracking-widest text-slate-600 font-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((item, i) => {
                  const SetorIcon = setorIcons[item.setor] || Users;
                  return (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="border-b border-industrial-border/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-sm text-white">{item.nome}</div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest">{item.culturaName}</div>
                      </td>
                      <td className="p-3 text-xs text-slate-400">{item.tipoFuncionario}</td>
                      <td className="p-3">
                        <span className="text-[9px] px-2 py-1 font-bold uppercase border border-slate-700 bg-slate-800/50 text-slate-400 inline-flex items-center gap-1">
                          <SetorIcon size={10} />{item.setor}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={cn("text-sm font-mono privacy-mask", isPrivate && "privacy-hidden")}>{fmt(item.salario)}</span>
                      </td>
                      <td className="p-3">
                        <span className={cn("text-sm font-mono text-slate-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmt(item.encargos)}</span>
                      </td>
                      <td className="p-3">
                        <span className={cn("text-sm font-bold font-mono text-emerald-400 privacy-mask", isPrivate && "privacy-hidden")}>
                          {fmt(item.custoTotal)}
                        </span>
                      </td>
                      <td className="p-3">
                        <button onClick={() => removeItem(item.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-primary/30 bg-slate-900/30">
                  <td colSpan={3} className="p-3 text-xs font-semibold text-slate-400">Total Mensal</td>
                  <td className={cn("p-3 text-sm font-bold font-mono text-slate-300 privacy-mask", isPrivate && "privacy-hidden")}>{fmt(totals.salarioTotal)}</td>
                  <td className={cn("p-3 text-sm font-bold font-mono text-slate-400 privacy-mask", isPrivate && "privacy-hidden")}>{fmt(totals.encargosTotal)}</td>
                  <td className={cn("p-3 text-sm font-black font-mono text-primary-light privacy-mask", isPrivate && "privacy-hidden")}>{fmt(totals.custoTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pie by Sector */}
          <div className="card p-6">
            <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Custo por Setor</h4>
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
                    {totals.custoTotal > 0 ? `${(p.value / totals.custoTotal * 100).toFixed(1)}%` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="card p-6">
            <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Composição Salarial</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-widest text-slate-600 font-black">Salários Base</span>
                  <span className={cn("text-xs font-mono font-bold text-slate-300 privacy-mask", isPrivate && "privacy-hidden")}>{fmt(totals.salarioTotal)}</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full">
                  <div className="h-full bg-emerald-500" style={{ width: `${totals.custoTotal > 0 ? (totals.salarioTotal / totals.custoTotal * 100) : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-widest text-slate-600 font-black">Encargos ({encargoPct}%)</span>
                  <span className={cn("text-xs font-mono font-bold text-slate-300 privacy-mask", isPrivate && "privacy-hidden")}>{fmt(totals.encargosTotal)}</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full">
                  <div className="h-full bg-orange-500" style={{ width: `${totals.custoTotal > 0 ? (totals.encargosTotal / totals.custoTotal * 100) : 0}%` }} />
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-industrial-border flex justify-between">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Custo Anual Est.</span>
              <span className={cn("text-sm font-bold font-mono text-primary-light privacy-mask", isPrivate && "privacy-hidden")}>{fmt(totals.custoTotal * 13.33)}</span>
            </div>
          </div>

          {/* Integration */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={14} className="text-primary-light" />
              <h4 className="font-bold uppercase tracking-tight text-sm">Integração</h4>
            </div>
            <p className="text-[10px] text-slate-500 mb-3">Custos de mão de obra alimentam:</p>
            <div className="space-y-2">
              {[
                'Custos Operacionais — DRE',
                'CMV — Mão de Obra Direta',
                'Overhead — Custos Indiretos',
                'EBITDA — Resultado Operacional',
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
