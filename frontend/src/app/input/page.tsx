'use client';

import React, { useState } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import { 
  Save, AlertCircle, CheckCircle2, Plus, Trash2,
  User, MapPin, Sprout, Wheat, Ruler, TrendingUp, DollarSign, Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustoInicial {
  id: string;
  tipo: string;
  descricao: string;
  valor: string;
}

interface FormData {
  produtor: string;
  fazenda: string;
  safra: string;
  cultura: string;
  areaPlantada: string;
  produtividade: string;
  precoVenda: string;
  custos: CustoInicial[];
}

interface FormErrors {
  [key: string]: string;
}

const tiposCusto = [
  'Insumos', 'Sementes', 'Defensivos', 'Fertilizantes',
  'Mão de Obra', 'Frete', 'Armazenagem', 'Manutenção',
  'Consultorias', 'Outros',
];

const safrasDisponiveis = ['2023/24', '2024/25', '2025/26'];
const culturasDisponiveis = ['Soja', 'Milho', 'Algodão', 'Café', 'Trigo', 'Cana-de-Açúcar', 'Arroz', 'Feijão'];

function gerarId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function InputPage() {
  const [formData, setFormData] = useState<FormData>({
    produtor: '',
    fazenda: '',
    safra: '',
    cultura: '',
    areaPlantada: '',
    produtividade: '',
    precoVenda: '',
    custos: [{ id: gerarId(), tipo: '', descricao: '', valor: '' }],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const addCusto = () => {
    setFormData(prev => ({
      ...prev,
      custos: [...prev.custos, { id: gerarId(), tipo: '', descricao: '', valor: '' }],
    }));
  };

  const removeCusto = (id: string) => {
    if (formData.custos.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      custos: prev.custos.filter(c => c.id !== id),
    }));
  };

  const updateCusto = (id: string, field: keyof CustoInicial, value: string) => {
    setFormData(prev => ({
      ...prev,
      custos: prev.custos.map(c => c.id === id ? { ...c, [field]: value } : c),
    }));
    if (errors[`custo_${id}_${field}`]) {
      setErrors(prev => { const next = { ...prev }; delete next[`custo_${id}_${field}`]; return next; });
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.produtor.trim()) newErrors.produtor = 'Produtor é obrigatório';
    if (!formData.fazenda.trim()) newErrors.fazenda = 'Fazenda é obrigatória';
    if (!formData.safra) newErrors.safra = 'Selecione uma safra';
    if (!formData.cultura) newErrors.cultura = 'Selecione uma cultura';

    const area = parseFloat(formData.areaPlantada);
    if (!formData.areaPlantada || isNaN(area) || area <= 0) {
      newErrors.areaPlantada = 'Área deve ser um número positivo';
    }

    const prod = parseFloat(formData.produtividade);
    if (!formData.produtividade || isNaN(prod) || prod <= 0) {
      newErrors.produtividade = 'Produtividade deve ser um número positivo';
    }

    const preco = parseFloat(formData.precoVenda);
    if (!formData.precoVenda || isNaN(preco) || preco <= 0) {
      newErrors.precoVenda = 'Preço deve ser um número positivo';
    }

    formData.custos.forEach(c => {
      if (!c.tipo) newErrors[`custo_${c.id}_tipo`] = 'Tipo é obrigatório';
      if (!c.descricao.trim()) newErrors[`custo_${c.id}_descricao`] = 'Descrição é obrigatória';
      const val = parseFloat(c.valor);
      if (!c.valor || isNaN(val) || val <= 0) {
        newErrors[`custo_${c.id}_valor`] = 'Valor deve ser positivo';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
      return;
    }

    // Mock: no futuro isso envia para o backend
    console.log('Dados para envio:', {
      ...formData,
      areaPlantada: parseFloat(formData.areaPlantada),
      produtividade: parseFloat(formData.produtividade),
      precoVenda: parseFloat(formData.precoVenda),
      custos: formData.custos.map(c => ({ ...c, valor: parseFloat(c.valor) })),
      receitaBrutaEstimada: parseFloat(formData.areaPlantada) * parseFloat(formData.produtividade) * parseFloat(formData.precoVenda),
    });

    setSubmitStatus('success');
    setTimeout(() => {
      setSubmitStatus('idle');
      setFormData({
        produtor: '', fazenda: '', safra: '', cultura: '',
        areaPlantada: '', produtividade: '', precoVenda: '',
        custos: [{ id: gerarId(), tipo: '', descricao: '', valor: '' }],
      });
    }, 3000);
  };

  const area = parseFloat(formData.areaPlantada) || 0;
  const prod = parseFloat(formData.produtividade) || 0;
  const preco = parseFloat(formData.precoVenda) || 0;
  const totalCustos = formData.custos.reduce((sum, c) => sum + (parseFloat(c.valor) || 0), 0);
  const producaoTotal = area * prod;
  const receitaBruta = producaoTotal * preco;
  const margemBruta = receitaBruta > 0 ? ((receitaBruta - totalCustos) / receitaBruta * 100) : 0;

  return (
    <MainContent>
        <PageHeader
        title="Entrada de"
        accent="Dados"
        description="Módulo centralizado de entrada de dados de produção e custos."
      />

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="col-span-2 space-y-6">
              {/* Produtor & Fazenda */}
              <div className="card">
                <div className="p-5 border-b border-industrial-border flex items-center gap-2">
                  <User size={16} className="text-primary-light" />
                  <h4 className="font-bold uppercase tracking-tight text-sm">Identificação</h4>
                </div>
                <div className="p-6 grid grid-cols-2 gap-5">
                  <InputField
                    label="Produtor"
                    icon={<User size={14} />}
                    placeholder="Nome do produtor ou empresa"
                    value={formData.produtor}
                    onChange={(v) => updateField('produtor', v)}
                    error={errors.produtor}
                  />
                  <InputField
                    label="Fazenda"
                    icon={<MapPin size={14} />}
                    placeholder="Nome da fazenda"
                    value={formData.fazenda}
                    onChange={(v) => updateField('fazenda', v)}
                    error={errors.fazenda}
                  />
                </div>
              </div>

              {/* Safra & Cultura */}
              <div className="card">
                <div className="p-5 border-b border-industrial-border flex items-center gap-2">
                  <Sprout size={16} className="text-primary-light" />
                  <h4 className="font-bold uppercase tracking-tight text-sm">Safra & Cultura</h4>
                </div>
                <div className="p-6 grid grid-cols-2 gap-5">
                  <SelectField
                    label="Safra"
                    options={safrasDisponiveis}
                    value={formData.safra}
                    onChange={(v) => updateField('safra', v)}
                    error={errors.safra}
                    placeholder="Selecione a safra"
                  />
                  <SelectField
                    label="Cultura"
                    options={culturasDisponiveis}
                    value={formData.cultura}
                    onChange={(v) => updateField('cultura', v)}
                    error={errors.cultura}
                    placeholder="Selecione a cultura"
                  />
                </div>
              </div>

              {/* Produção */}
              <div className="card">
                <div className="p-5 border-b border-industrial-border flex items-center gap-2">
                  <Wheat size={16} className="text-primary-light" />
                  <h4 className="font-bold uppercase tracking-tight text-sm">Dados de Produção</h4>
                </div>
                <div className="p-6 grid grid-cols-3 gap-5">
                  <InputField
                    label="Área Plantada"
                    icon={<Ruler size={14} />}
                    placeholder="0.00"
                    suffix="ha"
                    value={formData.areaPlantada}
                    onChange={(v) => updateField('areaPlantada', v)}
                    error={errors.areaPlantada}
                    type="number"
                  />
                  <InputField
                    label="Produtividade"
                    icon={<TrendingUp size={14} />}
                    placeholder="0.00"
                    suffix="sc/ha"
                    value={formData.produtividade}
                    onChange={(v) => updateField('produtividade', v)}
                    error={errors.produtividade}
                    type="number"
                  />
                  <InputField
                    label="Preço de Venda"
                    icon={<DollarSign size={14} />}
                    placeholder="0.00"
                    prefix="R$"
                    suffix="/sc"
                    value={formData.precoVenda}
                    onChange={(v) => updateField('precoVenda', v)}
                    error={errors.precoVenda}
                    type="number"
                  />
                </div>
              </div>

              {/* Custos Iniciais */}
              <div className="card">
                <div className="p-5 border-b border-industrial-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt size={16} className="text-primary-light" />
                    <h4 className="font-bold uppercase tracking-tight text-sm">Custos Iniciais</h4>
                  </div>
                  <button
                    type="button"
                    onClick={addCusto}
                    className="flex items-center gap-1 text-xs font-bold text-primary-light hover:text-emerald-300 transition-colors"
                  >
                    <Plus size={14} /> Adicionar Custo
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <AnimatePresence>
                    {formData.custos.map((custo, i) => (
                      <motion.div
                        key={custo.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-12 gap-3 items-start"
                      >
                        <div className="col-span-3">
                          <SelectField
                            label={i === 0 ? 'Tipo' : ''}
                            options={tiposCusto}
                            value={custo.tipo}
                            onChange={(v) => updateCusto(custo.id, 'tipo', v)}
                            error={errors[`custo_${custo.id}_tipo`]}
                            placeholder="Tipo"
                            compact
                          />
                        </div>
                        <div className="col-span-5">
                          <InputField
                            label={i === 0 ? 'Descrição' : ''}
                            placeholder="Ex: Glifosato, Adubo NPK..."
                            value={custo.descricao}
                            onChange={(v) => updateCusto(custo.id, 'descricao', v)}
                            error={errors[`custo_${custo.id}_descricao`]}
                            compact
                          />
                        </div>
                        <div className="col-span-3">
                          <InputField
                            label={i === 0 ? 'Valor (R$)' : ''}
                            placeholder="0.00"
                            prefix="R$"
                            value={custo.valor}
                            onChange={(v) => updateCusto(custo.id, 'valor', v)}
                            error={errors[`custo_${custo.id}_valor`]}
                            type="number"
                            compact
                          />
                        </div>
                        <div className={cn("col-span-1 flex justify-center", i === 0 ? "pt-7" : "pt-1")}>
                          <button
                            type="button"
                            onClick={() => removeCusto(custo.id)}
                            disabled={formData.custos.length <= 1}
                            className="p-2 text-slate-600 hover:text-red-400 disabled:opacity-20 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between">
                <AnimatePresence>
                  {submitStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-emerald-400 text-sm font-bold"
                    >
                      <CheckCircle2 size={16} /> Dados registrados com sucesso!
                    </motion.div>
                  )}
                  {submitStatus === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-red-400 text-sm font-bold"
                    >
                      <AlertCircle size={16} /> Corrija os campos destacados.
                    </motion.div>
                  )}
                </AnimatePresence>
                {submitStatus === 'idle' && <div />}

                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-light text-white font-semibold px-8 py-4 flex items-center gap-2 transition-all duration-300"
                >
                  <Save size={18} />
                  Registrar Dados
                </button>
              </div>
            </div>

            {/* Preview Sidebar */}
            <div className="space-y-6">
              {/* Live Calculator */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6 sticky top-8"
              >
                <h4 className="font-bold uppercase tracking-tight text-sm mb-6 pb-4 border-b border-industrial-border">
                  Projeção em Tempo Real
                </h4>
                <div className="space-y-5">
                  <PreviewRow label="Produção Total" value={producaoTotal > 0 ? `${producaoTotal.toLocaleString('pt-BR')} sc` : '—'} />
                  <PreviewRow label="Receita Bruta Est." value={receitaBruta > 0 ? `R$ ${receitaBruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'} highlight />
                  <PreviewRow label="Total Custos" value={totalCustos > 0 ? `R$ ${totalCustos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'} negative />
                  <div className="border-t border-industrial-border pt-4">
                    <PreviewRow 
                      label="Margem Bruta" 
                      value={receitaBruta > 0 ? `${margemBruta.toFixed(1)}%` : '—'} 
                      highlight={margemBruta > 20} 
                      negative={margemBruta <= 20 && margemBruta > 0} 
                    />
                  </div>
                </div>

                {/* Visual Indicator */}
                {receitaBruta > 0 && (
                  <div className="mt-6 pt-4 border-t border-industrial-border">
                    <p className="text-[9px] uppercase tracking-widest text-slate-600 font-black mb-2">Margem Visual</p>
                    <div className="h-2 w-full bg-slate-800 rounded-full">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(Math.max(margemBruta, 0), 100)}%` }}
                        className={cn("h-full", margemBruta > 30 ? "bg-emerald-500" : margemBruta > 15 ? "bg-orange-500" : "bg-red-500")}
                      />
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Data Flow Info */}
              <div className="card p-6">
                <h4 className="font-bold uppercase tracking-tight text-sm mb-4">Fluxo de Dados</h4>
                <div className="space-y-3">
                  {[
                    { step: '01', label: 'Input → Produção', desc: 'Área × Produtividade' },
                    { step: '02', label: 'Input → Receita', desc: 'Produção × Preço' },
                    { step: '03', label: 'Input → Custos', desc: 'Composição CMV' },
                    { step: '04', label: 'Input → DRE', desc: 'Receita − Custos' },
                    { step: '05', label: 'Input → Rating', desc: 'Score de risco' },
                  ].map((flow) => (
                    <div key={flow.step} className="flex items-start gap-3">
                      <span className="text-[10px] font-black text-primary-light bg-emerald-950/50 px-2 py-0.5 border border-emerald-800">{flow.step}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-300">{flow.label}</p>
                        <p className="text-[10px] text-slate-600">{flow.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>
    </MainContent>
  );
}

/* ============ Sub-components ============ */

function InputField({ label, icon, placeholder, value, onChange, error, type = 'text', prefix, suffix, compact }: {
  label?: string; icon?: React.ReactNode; placeholder?: string; value: string;
  onChange: (v: string) => void; error?: string; type?: string; prefix?: string; suffix?: string; compact?: boolean;
}) {
  return (
    <div>
      {label && <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1.5">{label}</label>}
      <div className={cn("relative group", error && "animate-pulse")}>
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary-light transition-colors">{icon}</span>}
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs font-bold">{prefix}</span>}
        <input
          type={type}
          step={type === 'number' ? '0.01' : undefined}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full bg-slate-900 border text-sm focus:outline-none focus:border-primary transition-all placeholder:text-slate-700",
            compact ? "px-3 py-2" : "px-4 py-3",
            icon ? "pl-9" : prefix ? "pl-10" : "",
            suffix ? "pr-14" : "",
            error ? "border-red-500/60" : "border-industrial-border"
          )}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-[10px] font-bold uppercase">{suffix}</span>}
      </div>
      {error && <p className="text-[10px] text-red-400 mt-1 font-bold">{error}</p>}
    </div>
  );
}

function SelectField({ label, options, value, onChange, error, placeholder, compact }: {
  label?: string; options: string[]; value: string;
  onChange: (v: string) => void; error?: string; placeholder?: string; compact?: boolean;
}) {
  return (
    <div>
      {label && <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1.5">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full bg-slate-900 border text-sm focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer",
          compact ? "px-3 py-2" : "px-4 py-3",
          !value ? "text-slate-700" : "text-white",
          error ? "border-red-500/60" : "border-industrial-border"
        )}
      >
        <option value="" className="text-slate-700">{placeholder || 'Selecione...'}</option>
        {options.map(opt => <option key={opt} value={opt} className="text-white">{opt}</option>)}
      </select>
      {error && <p className="text-[10px] text-red-400 mt-1 font-bold">{error}</p>}
    </div>
  );
}

function PreviewRow({ label, value, highlight, negative }: {
  label: string; value: string; highlight?: boolean; negative?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] uppercase tracking-widest text-slate-600 font-black">{label}</span>
      <span className={cn(
        "text-sm font-bold font-mono",
        highlight ? "text-emerald-400" : negative ? "text-red-400" : "text-slate-300"
      )}>{value}</span>
    </div>
  );
}
