'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { usePrivacy } from '@/context/PrivacyContext';
import { useToast } from '@/components/ToastProvider';
import { cn } from '@/lib/utils';
import { Plus, MapPin, Sprout, ChevronRight, X, Save, Loader2, Trash2, Building2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getFarms, createFarm, deleteFarm,
  getProducers, createProducer,
  getEconomicGroups, createSafra, deleteSafra,
  type Farm, type Producer, type EconomicGroup, type Safra
} from '@/lib/supabase/database';

export default function FarmsPage() {
  const { isPrivate } = usePrivacy();
  const { success: toastSuccess, error: toastError } = useToast();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [economicGroup, setEconomicGroup] = useState<EconomicGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState<'farm' | 'producer' | 'safra' | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);

  // Form states
  const [farmForm, setFarmForm] = useState({ name: '', location: '', totalArea: '', agriculturalArea: '', producerId: '' });
  const [producerForm, setProducerForm] = useState({ name: '', cpfCnpj: '', email: '', phone: '' });
  const [safraForm, setSafraForm] = useState({ year: '2024/25', description: '' });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [farmsData, producersData, groupsData] = await Promise.all([
        getFarms(),
        getProducers(),
        getEconomicGroups()
      ]);
      setFarms(farmsData);
      setProducers(producersData);
      if (groupsData.length > 0) setEconomicGroup(groupsData[0]);
    } catch (err: any) {
      toastError(`Erro ao carregar dados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateProducer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!producerForm.name.trim() || !producerForm.cpfCnpj.trim()) {
      toastError('Nome e CPF/CNPJ são obrigatórios');
      return;
    }
    if (!economicGroup) {
      toastError('Nenhum grupo econômico encontrado');
      return;
    }
    setSaving(true);
    try {
      await createProducer({
        name: producerForm.name,
        cpfCnpj: producerForm.cpfCnpj,
        email: producerForm.email || null,
        phone: producerForm.phone || null,
        economicGroupId: economicGroup.id
      });
      toastSuccess('Produtor cadastrado!');
      setShowModal(null);
      setProducerForm({ name: '', cpfCnpj: '', email: '', phone: '' });
      loadData();
    } catch (err: any) {
      toastError(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmForm.name.trim() || !farmForm.producerId) {
      toastError('Nome e Produtor são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      await createFarm({
        name: farmForm.name,
        location: farmForm.location || null,
        totalArea: parseFloat(farmForm.totalArea) || 0,
        agriculturalArea: parseFloat(farmForm.agriculturalArea) || 0,
        producerId: farmForm.producerId
      });
      toastSuccess('Fazenda cadastrada!');
      setShowModal(null);
      setFarmForm({ name: '', location: '', totalArea: '', agriculturalArea: '', producerId: '' });
      loadData();
    } catch (err: any) {
      toastError(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSafra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId || !safraForm.year.trim()) {
      toastError('Safra e Fazenda são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      await createSafra({
        farmId: selectedFarmId,
        year: safraForm.year,
        description: safraForm.description || null
      });
      toastSuccess('Safra criada!');
      setShowModal(null);
      setSafraForm({ year: '2024/25', description: '' });
      setSelectedFarmId(null);
      loadData();
    } catch (err: any) {
      toastError(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFarm = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta fazenda?')) return;
    try {
      await deleteFarm(id);
      toastSuccess('Fazenda excluída');
      loadData();
    } catch (err: any) {
      if (err.message?.includes('Safra_farmId_fkey')) {
        toastError('Erro: Esta fazenda possui safras cadastradas. Exclua os dados vinculados a ela primeiro.');
      } else {
        toastError(`Erro: ${err.message}`);
      }
    }
  };

  const handleDeleteSafra = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta safra?')) return;
    try {
      await deleteSafra(id);
      toastSuccess('Safra excluída');
      loadData();
    } catch (err: any) {
      if (err.message?.includes('ProductionRecord_safraId_fkey') || err.message?.includes('CostRecord_safraId_fkey') || err.message?.includes('Cultura_safraId_fkey')) {
        toastError('Erro: Esta safra possui culturas ou lançamentos cadastrados. Exclua os dados vinculados a ela primeiro.');
      } else {
        toastError(`Erro ao excluir safra: ${err.message}`);
      }
    }
  };

  // Get safras for a farm from the nested data
  const getFarmSafras = (farm: Farm): Safra[] => {
    return (farm as any).Safra || [];
  };

  const getProducerName = (producerId: string) => {
    return (producers.find(p => p.id === producerId))?.name || '—';
  };

  return (
    <MainContent>
      <PageHeader
        title="Fazendas"
        accent="e Safras"
        description="Gestão de fazendas, áreas cultiváveis e safras."
        badge={
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal('producer')}
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-3 flex items-center gap-2 transition-all duration-300 text-xs"
            >
              <User size={14} />
              Novo Produtor
            </button>
            <button
              onClick={() => {
                if (producers.length === 0) {
                  toastError('Cadastre um Produtor primeiro');
                  setShowModal('producer');
                  return;
                }
                setShowModal('farm');
              }}
              className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 flex items-center gap-2 transition-all duration-300"
            >
              <Plus size={18} />
              Nova Fazenda
            </button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total Fazendas', value: farms.length.toString() },
          { label: 'Área Total', value: `${farms.reduce((s, f) => s + (f.totalArea || 0), 0).toLocaleString()} ha` },
          { label: 'Área Agrícola', value: `${farms.reduce((s, f) => s + (f.agriculturalArea || 0), 0).toLocaleString()} ha` },
          { label: 'Produtores', value: producers.length.toString() },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black mb-2">{s.label}</p>
            <p className={cn("text-2xl font-bold tracking-tight privacy-mask", isPrivate && "privacy-hidden")}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 size={24} className="animate-spin mr-3" />
          Carregando fazendas...
        </div>
      )}

      {/* Empty State */}
      {!loading && farms.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-12 text-center">
          <Building2 size={48} className="mx-auto text-slate-700 mb-4" />
          <h3 className="text-lg font-bold text-slate-400 mb-2">Nenhuma fazenda cadastrada</h3>
          <p className="text-sm text-slate-600 mb-6">
            {producers.length === 0
              ? 'Comece cadastrando um Produtor, depois adicione suas Fazendas.'
              : 'Clique em "Nova Fazenda" para começar.'}
          </p>
          <button
            onClick={() => setShowModal(producers.length === 0 ? 'producer' : 'farm')}
            className="bg-primary hover:bg-primary-light text-white font-bold px-8 py-3 inline-flex items-center gap-2 transition-all rounded-lg"
          >
            <Plus size={18} />
            {producers.length === 0 ? 'Cadastrar Produtor' : 'Nova Fazenda'}
          </button>
        </motion.div>
      )}

      {/* Farm Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {farms.map((farm, index) => {
          const safras = getFarmSafras(farm);
          return (
            <motion.div
              key={farm.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="card p-6 hover:border-primary/40 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg tracking-tight group-hover:text-primary-light transition-colors">{farm.name}</h3>
                  <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                    <MapPin size={12} />
                    {farm.location || 'Sem localização'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setSelectedFarmId(farm.id); setShowModal('safra'); }}
                    className="text-[9px] px-2 py-1 bg-emerald-950/30 border border-emerald-800 text-emerald-400 font-bold hover:bg-emerald-900/50 transition-colors"
                    title="Adicionar Safra"
                  >
                    <Plus size={10} className="inline mr-1" />Safra
                  </button>
                  <button
                    onClick={() => handleDeleteFarm(farm.id)}
                    className="text-slate-700 hover:text-red-400 transition-colors p-1"
                    title="Excluir Fazenda"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-600 font-black">Área Total</p>
                  <p className={cn("text-sm font-bold mt-1 privacy-mask", isPrivate && "privacy-hidden")}>{(farm.totalArea || 0).toLocaleString()} ha</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-600 font-black">Área Agrícola</p>
                  <p className={cn("text-sm font-bold mt-1 privacy-mask", isPrivate && "privacy-hidden")}>{(farm.agriculturalArea || 0).toLocaleString()} ha</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-600 font-black">Produtor</p>
                  <p className="text-sm font-bold mt-1 text-slate-300 truncate">{getProducerName(farm.producerId)}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-industrial-border">
                <div className="flex gap-2 flex-wrap">
                  {safras.length === 0 && (
                    <span className="text-[10px] text-slate-600 italic">Nenhuma safra cadastrada</span>
                  )}
                  {safras.map((s: Safra) => (
                    <span key={s.id} className="group/safra relative text-[10px] px-2 py-1 bg-emerald-950/50 border border-emerald-800 text-emerald-400 font-bold pr-5">
                      <Sprout size={10} className="inline mr-1" />{s.year}
                      <button 
                        onClick={() => handleDeleteSafra(s.id)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-emerald-600 hover:text-red-400 opacity-0 group-hover/safra:opacity-100 transition-all"
                        title="Excluir Safra"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ─── Modals ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="card p-8 w-full max-w-lg mx-4 relative"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShowModal(null)} className="absolute top-4 right-4 text-slate-600 hover:text-white transition-colors">
                <X size={20} />
              </button>

              {/* Producer Modal */}
              {showModal === 'producer' && (
                <form onSubmit={handleCreateProducer} className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Novo Produtor</h3>
                    <p className="text-xs text-slate-500">Cadastre o produtor responsável pelas fazendas.</p>
                  </div>
                  <ModalInput label="Nome *" value={producerForm.name} onChange={v => setProducerForm(p => ({ ...p, name: v }))} placeholder="Nome do produtor" />
                  <ModalInput label="CPF / CNPJ *" value={producerForm.cpfCnpj} onChange={v => setProducerForm(p => ({ ...p, cpfCnpj: v }))} placeholder="000.000.000-00" />
                  <ModalInput label="E-mail" value={producerForm.email} onChange={v => setProducerForm(p => ({ ...p, email: v }))} placeholder="email@exemplo.com" />
                  <ModalInput label="Telefone" value={producerForm.phone} onChange={v => setProducerForm(p => ({ ...p, phone: v }))} placeholder="(00) 00000-0000" />
                  <SubmitButton saving={saving} label="Cadastrar Produtor" />
                </form>
              )}

              {/* Farm Modal */}
              {showModal === 'farm' && (
                <form onSubmit={handleCreateFarm} className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Nova Fazenda</h3>
                    <p className="text-xs text-slate-500">Vincule a fazenda a um produtor existente.</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">Produtor *</label>
                    <select
                      value={farmForm.producerId}
                      onChange={e => setFarmForm(p => ({ ...p, producerId: e.target.value }))}
                      className="w-full bg-slate-950 border border-industrial-border px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all text-white"
                    >
                      <option value="">Selecione um produtor</option>
                      {producers.map(p => (
                        <option key={p.id} value={p.id}>{p.name} — {p.cpfCnpj}</option>
                      ))}
                    </select>
                  </div>
                  <ModalInput label="Nome da Fazenda *" value={farmForm.name} onChange={v => setFarmForm(p => ({ ...p, name: v }))} placeholder="Ex: Fazenda São José" />
                  <ModalInput label="Localização" value={farmForm.location} onChange={v => setFarmForm(p => ({ ...p, location: v }))} placeholder="Cidade/Estado" />
                  <div className="grid grid-cols-2 gap-4">
                    <ModalInput label="Área Total (ha)" type="number" value={farmForm.totalArea} onChange={v => setFarmForm(p => ({ ...p, totalArea: v }))} placeholder="0" />
                    <ModalInput label="Área Agrícola (ha)" type="number" value={farmForm.agriculturalArea} onChange={v => setFarmForm(p => ({ ...p, agriculturalArea: v }))} placeholder="0" />
                  </div>
                  <SubmitButton saving={saving} label="Cadastrar Fazenda" />
                </form>
              )}

              {/* Safra Modal */}
              {showModal === 'safra' && (
                <form onSubmit={handleCreateSafra} className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Nova Safra</h3>
                    <p className="text-xs text-slate-500">Adicione uma safra para a fazenda selecionada.</p>
                  </div>
                  <ModalInput label="Ano/Período *" value={safraForm.year} onChange={v => setSafraForm(p => ({ ...p, year: v }))} placeholder="2024/25" />
                  <ModalInput label="Descrição" value={safraForm.description} onChange={v => setSafraForm(p => ({ ...p, description: v }))} placeholder="Detalhes opcionais" />
                  <SubmitButton saving={saving} label="Criar Safra" />
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainContent>
  );
}

// ─── Helper Components ─────────────────────────────────────

function ModalInput({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-950 border border-industrial-border px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all text-white placeholder:text-slate-700"
      />
    </div>
  );
}

function SubmitButton({ saving, label }: { saving: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="w-full bg-primary hover:bg-primary-light disabled:opacity-50 text-white font-bold py-4 flex items-center justify-center gap-3 transition-all rounded-lg shadow-lg shadow-primary/20"
    >
      {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
      {saving ? 'Salvando...' : label}
    </button>
  );
}
