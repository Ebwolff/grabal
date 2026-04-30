'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { usePrivacy } from '@/context/PrivacyContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import {
  Save, AlertCircle, CheckCircle2, Plus, Trash2,
  Wheat, DollarSign, Receipt, Building2, CreditCard, ShieldCheck, FileCheck,
  Calendar, Info, ChevronRight, LayoutList, History, Lock, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getProducers, getFarms, 
  createProduction, createCostWithItems, createAsset, 
  createLiability, createCPR, createGuarantee,
  type Producer, type Farm, type Safra, type Cultura 
} from '@/lib/supabase/database';

// --- Types ---
type EntryCategory = 'OPERACIONAL' | 'BALANCO' | 'FINANCEIRO';

interface EntryType {
  id: string;
  category: EntryCategory;
  label: string;
  icon: any;
  color: string;
}

const entryTypes: EntryType[] = [
  { id: 'producao', category: 'OPERACIONAL', label: 'Produção Agricola', icon: Wheat, color: '#10b981' },
  { id: 'custo', category: 'OPERACIONAL', label: 'Custos e Insumos', icon: Receipt, color: '#06b6d4' },
  { id: 'servico', category: 'OPERACIONAL', label: 'Serviços Terceiros', icon: DollarSign, color: '#f59e0b' },
  { id: 'despesa', category: 'FINANCEIRO', label: 'Despesa Adm', icon: CreditCard, color: '#8b5cf6' },
  { id: 'ativo', category: 'BALANCO', label: 'Ativo/Patrimônio', icon: Building2, color: '#ec4899' },
  { id: 'cpr', category: 'FINANCEIRO', label: 'Emissão de CPR', icon: FileCheck, color: '#14b8a6' },
  { id: 'passivo', category: 'BALANCO', label: 'Dívida/Passivo', icon: ShieldCheck, color: '#ef4444' },
  { id: 'garantia', category: 'BALANCO', label: 'Garantias', icon: Lock, color: '#f59e0b' },
];

export default function EntriesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-slate-500">Carregando...</div>}>
      <EntriesContent />
    </Suspense>
  );
}

function EntriesContent() {
  const { isPrivate } = usePrivacy();
  const { success: toastSuccess, error: toastError } = useToast();
  const searchParams = useSearchParams();
  
  const [selectedType, setSelectedType] = useState<string>('producao');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');

  useEffect(() => {
    const type = searchParams.get('type');
    if (type && entryTypes.find(t => t.id === type)) {
      setSelectedType(type);
    }
  }, [searchParams]);

  const [producers, setProducers] = useState<Producer[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loadingContext, setLoadingContext] = useState(true);

  useEffect(() => {
    Promise.all([getProducers(), getFarms()])
      .then(([pData, fData]) => {
        setProducers(pData);
        setFarms(fData);
      })
      .finally(() => setLoadingContext(false));
  }, []);

  // Unified Form State
  const [form, setForm] = useState({
    producerId: '',
    farmId: '',
    safraId: '',
    culturaId: '',
    description: '',
    value: '',
    date: new Date().toISOString().split('T')[0],
    area: '',
    productivity: '',
    subType: '',
    creditor: '',
    dueDate: '',
    comprador: '',
    volume: '',
    recurrente: false,
    vidaUtil: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableFarms = useMemo(() => farms.filter(f => f.producerId === form.producerId), [farms, form.producerId]);
  const activeFarm = useMemo(() => farms.find(f => f.id === form.farmId), [farms, form.farmId]);
  const activeSafra = useMemo(() => activeFarm?.safras?.find((s: any) => s.id === form.safraId), [activeFarm, form.safraId]);
  const availableCulturas = useMemo(() => activeSafra?.culturas || [], [activeSafra]);

  const activeType = useMemo(() => entryTypes.find(t => t.id === selectedType) || entryTypes[0], [selectedType]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.producerId) newErrors.producerId = 'Obrigatório selecionar Produtor/Cliente';
    if (!form.farmId) newErrors.farmId = 'Obrigatório selecionar Fazenda';
    if (!form.date) newErrors.date = 'Obrigatório';
    
    if (['producao', 'custo', 'servico', 'despesa'].includes(selectedType)) {
      if (!form.culturaId) newErrors.culturaId = 'Obrigatório selecionar Cultura';
    }

    if (selectedType === 'producao') {
      if (!form.area || parseFloat(form.area) <= 0) newErrors.area = 'Inválido';
      if (!form.productivity || parseFloat(form.productivity) <= 0) newErrors.productivity = 'Inválido';
    } else {
      if (!form.description.trim()) newErrors.description = 'Obrigatório';
      if (!form.value || parseFloat(form.value) <= 0) newErrors.value = 'Inválido';
    }

    if (['cpr', 'passivo', 'garantia'].includes(selectedType)) {
      if (!form.dueDate) newErrors.dueDate = 'Obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setSubmitStatus('error');
      toastError('Verifique os campos obrigatórios');
      setTimeout(() => setSubmitStatus('idle'), 2000);
      return;
    }

    setSubmitStatus('loading');

    try {
      let endpoint = '';
      let payload: any = {};

      const basePayload = {
        farmId: form.farmId,
        date: new Date(form.date).toISOString(),
        description: form.description,
        value: parseFloat(form.value) || 0
      };

      switch (selectedType) {
        case 'producao':
          endpoint = 'production';
          payload = { culturaId: form.culturaId, area: parseFloat(form.area), productivity: parseFloat(form.productivity), totalProduction: parseFloat(form.area) * parseFloat(form.productivity), createdAt: basePayload.date };
          break;
        case 'despesa':
        case 'custo':
          endpoint = 'expenses';
          payload = { culturaId: form.culturaId, type: selectedType === 'despesa' ? 'DESPESAS_ADMINISTRATIVAS' : 'INSUMOS', createdAt: basePayload.date };
          break;
        case 'servico':
          endpoint = 'services';
          payload = { culturaId: form.culturaId, type: 'SERVICOS', createdAt: basePayload.date };
          break;
        case 'ativo':
          endpoint = 'assets';
          payload = { farmId: form.farmId, type: form.subType || 'GERAL', description: form.description, value: basePayload.value, createdAt: basePayload.date };
          break;
        case 'passivo':
          endpoint = 'liabilities';
          payload = { farmId: form.farmId, creditor: form.creditor, type: 'FINANCEIRO', description: form.description, value: basePayload.value, dueDate: new Date(form.dueDate).toISOString() };
          break;
        case 'cpr':
          endpoint = 'cprs';
          payload = { farmId: form.farmId, cultura: activeFarm?.safras?.find((s:any) => s.id === form.safraId)?.culturas?.find((c:any) => c.id === form.culturaId)?.name || 'Geral', committedVolume: parseFloat(form.volume) || 0, value: basePayload.value, dueDate: new Date(form.dueDate).toISOString() };
          break;
        case 'garantia':
          endpoint = 'guarantees';
          payload = { farmId: form.farmId, description: form.description, value: basePayload.value, createdAt: basePayload.date };
          break;
      }

      // Connect to Supabase based on endpoint
      switch (selectedType) {
        case 'producao':
          await createProduction(payload);
          break;
        case 'despesa':
        case 'custo':
        case 'servico':
          await createCostWithItems(payload, [{ description: form.description, value: basePayload.value }]);
          break;
        case 'ativo':
          await createAsset(payload);
          break;
        case 'passivo':
          await createLiability(payload);
          break;
        case 'cpr':
          await createCPR(payload);
          break;
        case 'garantia':
          await createGuarantee(payload);
          break;
      }

      setSubmitStatus('success');
      toastSuccess(`${activeType.label} registrado com sucesso!`);
      
      // Reset form
      setTimeout(() => {
        setSubmitStatus('idle');
        setForm(prev => ({
          ...prev,
          description: '',
          value: '',
          area: '',
          productivity: '',
          volume: '',
          comprador: '',
          dueDate: '',
          subType: '',
          vidaUtil: ''
        }));
      }, 1500);

    } catch (err) {
      setSubmitStatus('error');
      toastError('Erro ao conectar com o servidor');
      setTimeout(() => setSubmitStatus('idle'), 2000);
    }
  };

  return (
    <MainContent>
      <PageHeader 
        title="Central de" 
        accent="Lançamentos" 
        description="Hub unificado para entrada de dados operacionais, financeiros e patrimoniais."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Type Selection & Form */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Category Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {entryTypes.map((type) => {
              const Icon = type.icon;
              const isActive = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 gap-2 group",
                    isActive 
                      ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                      : "bg-industrial-card border-industrial-border hover:border-slate-600"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    isActive ? "bg-primary text-white" : "bg-slate-800 text-slate-500 group-hover:text-slate-300"
                  )}>
                    <Icon size={16} />
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-widest text-center leading-tight",
                    isActive ? "text-white" : "text-slate-500 group-hover:text-slate-400"
                  )}>
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Form Card */}
          <form onSubmit={handleSubmit} className="card overflow-hidden">
            <div className="p-5 border-b border-industrial-border flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${activeType.color}15`, color: activeType.color }}>
                  <activeType.icon size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-tight">Novo Lançamento: {activeType.label}</h4>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Categoria: {activeType.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-slate-500" />
                <input 
                  type="date" 
                  value={form.date} 
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  className="bg-transparent text-xs font-mono text-slate-400 focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Context Selection Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 p-4 bg-slate-950/50 rounded-xl border border-industrial-border/50">
                <div className="flex flex-col">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">Cliente / Produtor *</label>
                  <select 
                    value={form.producerId} 
                    onChange={e => setForm(p => ({ ...p, producerId: e.target.value, farmId: '', safraId: '', culturaId: '' }))}
                    className={cn(
                      "w-full bg-slate-900 border text-sm px-4 py-3 focus:outline-none focus:border-primary transition-all text-white",
                      errors.producerId ? "border-red-500/50 animate-pulse" : "border-industrial-border"
                    )}
                  >
                    <option value="">-- Selecione --</option>
                    {producers.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">Fazenda Destino *</label>
                  <select 
                    value={form.farmId} 
                    onChange={e => setForm(p => ({ ...p, farmId: e.target.value, safraId: '', culturaId: '' }))}
                    className={cn(
                      "w-full bg-slate-900 border text-sm px-4 py-3 focus:outline-none focus:border-primary transition-all text-white",
                      !form.producerId && "opacity-50 cursor-not-allowed",
                      errors.farmId ? "border-red-500/50 animate-pulse" : "border-industrial-border"
                    )}
                    disabled={!form.producerId}
                  >
                    <option value="">-- Selecione --</option>
                    {availableFarms.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                {['producao', 'custo', 'servico', 'despesa', 'cpr'].includes(selectedType) && (
                  <>
                    <div className="flex flex-col">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">Safra Operacional *</label>
                      <select 
                        value={form.safraId} 
                        onChange={e => setForm(p => ({ ...p, safraId: e.target.value, culturaId: '' }))}
                        className={cn(
                          "w-full bg-slate-900 border text-sm px-4 py-3 focus:outline-none focus:border-primary transition-all text-white",
                          !form.farmId && "opacity-50 cursor-not-allowed",
                          errors.culturaId ? "border-red-500/50" : "border-industrial-border"
                        )}
                        disabled={!form.farmId}
                      >
                        <option value="">-- Selecione a Safra --</option>
                        {activeFarm?.safras?.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.year} {s.description ? `- ${s.description}` : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">Cultura Vinculada *</label>
                      <select 
                        value={form.culturaId} 
                        onChange={e => setForm(p => ({ ...p, culturaId: e.target.value }))}
                        className={cn(
                          "w-full bg-slate-900 border text-sm px-4 py-3 focus:outline-none focus:border-primary transition-all text-white",
                          !form.safraId && "opacity-50 cursor-not-allowed",
                          errors.culturaId ? "border-red-500/50 animate-pulse" : "border-industrial-border"
                        )}
                        disabled={!form.safraId}
                      >
                        <option value="">-- Selecione a Cultura --</option>
                        {availableCulturas.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name} ({c.plantedArea} ha)</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Common Fields Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {selectedType !== 'producao' && (
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">Descrição / Finalidade</label>
                    <div className="relative">
                      <Info className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                      <input 
                        value={form.description}
                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                        placeholder="Ex: Pagamento fornecedor, Aquisição de implemento..."
                        className={cn(
                          "w-full bg-slate-950 border border-industrial-border pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-all",
                          errors.description && "border-red-500/50 animate-pulse"
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Conditional Fields based on Type */}
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={selectedType}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-5 md:col-span-2"
                  >
                    {selectedType === 'producao' && (
                      <>
                        <InputField label="Área Colhida (ha)" type="number" value={form.area} onChange={(v: string) => setForm(p => ({...p, area: v}))} placeholder="0.00" error={errors.area} />
                        <InputField label="Produtividade (sc/ha)" type="number" value={form.productivity} onChange={(v: string) => setForm(p => ({...p, productivity: v}))} placeholder="0.00" error={errors.productivity} />
                      </>
                    )}

                    {['custo', 'servico', 'despesa'].includes(selectedType) && (
                      <>
                        <InputField label="Valor (R$)" type="number" value={form.value} onChange={(v: string) => setForm(p => ({...p, value: v}))} prefix="R$" error={errors.value} />
                        <div className="flex flex-col">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">Recorrência</label>
                          <button 
                            type="button"
                            onClick={() => setForm(p => ({ ...p, recurrente: !p.recurrente }))}
                            className={cn(
                              "flex-1 py-3 px-4 rounded border text-xs font-bold uppercase tracking-widest transition-all",
                              form.recurrente ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-400" : "bg-slate-950 border-industrial-border text-slate-600"
                            )}
                          >
                            {form.recurrente ? 'Mensal / Recorrente' : 'Pagamento Único'}
                          </button>
                        </div>
                      </>
                    )}

                    {selectedType === 'ativo' && (
                      <>
                        <InputField label="Tipo de Ativo" value={form.subType} onChange={(v: string) => setForm(p => ({...p, subType: v}))} placeholder="Ex: Maquinário, Terra..." />
                        <InputField label="Valor de Aquisição" type="number" value={form.value} onChange={(v: string) => setForm(p => ({...p, value: v}))} prefix="R$" error={errors.value} />
                        <InputField label="Vida Útil (anos)" type="number" value={form.vidaUtil} onChange={(v: string) => setForm(p => ({...p, vidaUtil: v}))} placeholder="10" />
                      </>
                    )}
                    
                    {selectedType === 'cpr' && (
                      <>
                         <InputField label="Volume de Entrega (sc)" type="number" value={form.volume} onChange={(v: string) => setForm(p => ({...p, volume: v}))} placeholder="0.00" />
                         <InputField label="Valor Comprometido Total" type="number" value={form.value} onChange={(v: string) => setForm(p => ({...p, value: v}))} prefix="R$" error={errors.value} />
                         <InputField label="Data de Vencimento" type="date" value={form.dueDate} onChange={(v: string) => setForm(p => ({...p, dueDate: v}))} error={errors.dueDate} />
                         <InputField label="Comprador / Tradind" value={form.comprador} onChange={(v: string) => setForm(p => ({...p, comprador: v}))} placeholder="Cargill, Bunge..." />
                      </>
                    )}

                    {selectedType === 'passivo' && (
                      <>
                        <InputField label="Valor Total" type="number" value={form.value} onChange={(v: string) => setForm(p => ({...p, value: v}))} prefix="R$" error={errors.value} />
                        <InputField label="Data de Vencimento" type="date" value={form.dueDate} onChange={(v: string) => setForm(p => ({...p, dueDate: v}))} error={errors.dueDate} />
                        <InputField label="Credor" value={form.creditor} onChange={(v: string) => setForm(p => ({...p, creditor: v}))} placeholder="Banco, Fornecedor..." />
                      </>
                    )}

                    {selectedType === 'garantia' && (
                      <>
                        <InputField label="Valor da Garantia" type="number" value={form.value} onChange={(v: string) => setForm(p => ({...p, value: v}))} prefix="R$" error={errors.value} />
                        <InputField label="Data de Vencimento" type="date" value={form.dueDate} onChange={(v: string) => setForm(p => ({...p, dueDate: v}))} error={errors.dueDate} />
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Submit Section */}
              <div className="pt-6 border-t border-industrial-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {submitStatus === 'success' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                      <CheckCircle2 size={16} /> Sucesso! Lançamento registrado.
                    </motion.div>
                  )}
                  {submitStatus === 'error' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-red-400 text-xs font-bold">
                      <AlertCircle size={16} /> Corrija os erros destacados.
                    </motion.div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={() => setForm(p => ({ ...p, description: '', value: '', area: '', productivity: '', volume: '' }))} className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors">Limpar</button>
                  <button 
                    type="submit" 
                    className="bg-primary hover:bg-primary-light text-white font-bold px-10 py-4 flex items-center gap-3 transition-all rounded-lg shadow-lg shadow-primary/20"
                  >
                    <Save size={18} />
                    Confirmar Lançamento
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Recent Activity & Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <History size={16} className="text-primary-light" />
                <h4 className="text-sm font-bold text-white uppercase tracking-tight">Atividade Recente</h4>
              </div>
              <button className="text-[9px] font-black uppercase text-slate-500 hover:text-primary-light transition-colors">Ver Tudo</button>
            </div>

            <div className="space-y-4">
              {[
                { type: 'producao', label: 'Colheita Soja', val: '4.200 sc', date: 'Hoje, 09:12' },
                { type: 'despesa', label: 'Energia Elétrica', val: 'R$ 12.400', date: 'Ontem, 16:45' },
                { type: 'servico', label: 'Pulverização', val: 'R$ 8.500', date: '25 Abr, 10:20' },
                { type: 'ativo', label: 'Trator Case IH', val: 'R$ 850.000', date: '24 Abr, 14:00' },
              ].map((item, i) => {
                const typeInfo = entryTypes.find(t => t.id === item.type)!;
                return (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-industrial-border/50 bg-slate-900/30 hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded flex items-center justify-center bg-slate-800 text-slate-400 group-hover:text-primary-light transition-colors">
                        <typeInfo.icon size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">{item.label}</p>
                        <p className="text-[9px] text-slate-600 font-medium">{item.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-xs font-bold font-mono text-emerald-400 privacy-mask", isPrivate && "privacy-hidden")}>{item.val}</p>
                      <ChevronRight size={12} className="text-slate-700 ml-auto mt-0.5" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Quick Tip */}
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-3 text-primary-light">
              <LayoutList size={16} />
              <h5 className="text-[11px] font-black uppercase tracking-widest">Dica de Lançamento</h5>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed italic">
              "Lançamentos unificados alimentam automaticamente o DRE, Balanço Patrimonial e o seu Rating de Crédito em tempo real."
            </p>
          </div>
        </div>
      </div>
    </MainContent>
  );
}

// --- Helper Components ---

function InputField({ label, value, onChange, placeholder, type = 'text', prefix, error }: any) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs font-bold">{prefix}</span>}
        <input 
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full bg-slate-950 border text-sm px-4 py-3 focus:outline-none focus:border-primary transition-all placeholder:text-slate-800",
            prefix && "pl-10",
            error ? "border-red-500/50" : "border-industrial-border"
          )}
        />
      </div>
      {error && <p className="text-[9px] text-red-500 mt-1 font-bold">{error}</p>}
    </div>
  );
}
